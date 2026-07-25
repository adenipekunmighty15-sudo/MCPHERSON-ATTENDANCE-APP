import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { aiChat, transcribeAudio } from '../services/aiService.js'
import { getAiResponse, getAvailableProviders } from '../config/ai.js'
import { getYouTubeTranscript, extractTextFromDoc, buildStudyPack } from '../services/studyPack.js'
import multer from 'multer'
import { uploadFile } from '../services/storage.js'
import { 
  generatePodcast, 
  transcribeAudio as tlTranscribeAudio,
  generateEnhancedFlashcards, 
  getSpacedRepetitionPlan,
  createStudyGroup,
  shareWithGroup,
  getGroupMaterials
} from '../services/turboLearnService.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const router = Router()

function asText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.text === 'string') return value.text
  if (typeof value.value === 'string') return value.value
  return String(value)
}

function appendText(base, next) {
  const text = asText(next).trim()
  if (!text) return asText(base).trim()
  const current = asText(base).trim()
  return current ? `${current}\n\n${text}` : text
}

router.get('/api/study/diagnostic', async (req, res) => {
  const results = { timestamp: new Date().toISOString(), checks: {} }
  
  // DB check
  try {
    const start = Date.now()
    await query('SELECT 1')
    results.checks.database = { ok: true, latency: Date.now() - start + 'ms' }
  } catch (e) {
    results.checks.database = { ok: false, error: e.message }
  }

  // study_materials table check
  try {
    const { rows } = await query('SELECT COUNT(*)::int as count FROM public.study_materials')
    results.checks.studyMaterials = { ok: true, count: rows[0].count }
  } catch (e) {
    results.checks.studyMaterials = { ok: false, error: e.message }
  }

  // flashcards table check
  try {
    const { rows } = await query('SELECT COUNT(*)::int as count FROM public.flashcards')
    results.checks.flashcards = { ok: true, count: rows[0].count }
  } catch (e) {
    results.checks.flashcards = { ok: false, error: e.message }
  }

  // AI providers check
  try {
    const providers = getAvailableProviders()
    results.checks.ai = { ok: providers.length > 0, providers }
  } catch (e) {
    results.checks.ai = { ok: false, error: e.message }
  }

  results.allOk = Object.values(results.checks).every(c => c.ok)
  res.json(results)
})

router.get('/api/study-materials/stats', authenticate, async (req, res) => {
  try {
    const { rows: cards } = await query(
      'SELECT COUNT(*) as count FROM public.flashcard_reviews WHERE user_id = $1 AND repetitions >= 3',
      [req.user.id]
    )
    const { rows: quizzes } = await query(
      'SELECT COUNT(*) as count FROM public.study_sessions WHERE user_id = $1',
      [req.user.id]
    )
    const { rows: weakAreas } = await query(
      `SELECT s.title as name, (1 - COALESCE(AVG(fr.ease_factor - 1.3) / 1.2, 0)) * 100 as score
       FROM public.flashcard_reviews fr
       JOIN public.study_materials s ON fr.material_id = s.id
       WHERE fr.user_id = $1 AND fr.repetitions < 3
       GROUP BY s.title ORDER BY score DESC LIMIT 5`,
      [req.user.id]
    )
    res.json({
      cardsMastered: parseInt(cards[0]?.count) || 0,
      quizzesTaken: parseInt(quizzes[0]?.count) || 0,
      studyTime: '0',
      weakAreas: weakAreas.map(w => ({ name: w.name, score: Math.round(w.score) })),
    })
  } catch {
    res.json({ cardsMastered: 0, quizzesTaken: 0, studyTime: '0', weakAreas: [] })
  }
})

router.get('/api/study-materials', authenticate, async (req, res) => {
  try {
  const { courseId } = req.query
  const params = []
  let sql = `SELECT sm.id, sm.course_id AS "courseId", sm.title, sm.source_text AS "sourceText",
    sm.summary, sm.key_points AS "keyPoints", sm.quiz,
    sm.diagrams, sm.improved_note AS "improvedNote", sm.chat_history AS "chatHistory", sm.podcast_url AS "podcastUrl",
    sm.created_by AS "createdBy", sm.created_at AS "createdAt", sm.folder_id AS "folderId",
    c.code AS "courseCode", c.title AS "courseTitle",
    (SELECT COUNT(*)::int FROM public.flashcards WHERE material_id = sm.id) AS "flashcardCount"
    FROM public.study_materials sm
    LEFT JOIN public.courses c ON sm.course_id = c.id
    WHERE 1=1`
  if (courseId) { params.push(courseId); sql += ` AND sm.course_id = $${params.length}` }
  sql += ' ORDER BY sm.created_at DESC'
  const { rows } = await query(sql, params)
  res.status(200).json(rows)
  } catch (err) {
    console.error('Get study materials failed:', err.message)
    res.status(500).json({ error: 'Failed to load study materials' })
  }
})

router.get('/api/study-materials/:id', authenticate, async (req, res) => {
  try {
  const { rows } = await query(
    `SELECT sm.id, sm.course_id AS "courseId", sm.title, sm.source_text AS "sourceText",
      sm.summary, sm.key_points AS "keyPoints", sm.quiz,
      sm.diagrams, sm.improved_note AS "improvedNote", sm.chat_history AS "chatHistory", sm.podcast_url AS "podcastUrl",
      sm.created_by AS "createdBy", sm.created_at AS "createdAt", sm.folder_id AS "folderId",
      c.code AS "courseCode", c.title AS "courseTitle"
     FROM public.study_materials sm
     LEFT JOIN public.courses c ON sm.course_id = c.id
     WHERE sm.id = $1`,
    [req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Study pack not found' })
  const { rows: flashcards } = await query(
    'SELECT id, front, back FROM public.flashcards WHERE material_id = $1 ORDER BY order_index',
    [req.params.id]
  )
  res.status(200).json({ ...rows[0], flashcards })
  } catch (err) {
    console.error('Get study material failed:', err.message)
    res.status(500).json({ error: 'Failed to load study material' })
  }
})

router.post('/api/study-materials/search-web', authenticate, async (req, res) => {
  try {
    const { query } = req.body
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' })
    }
    const { webSearch } = await import('../../lib/webSearch.js')
    const results = await webSearch(query + ' lecture notes OR tutorial OR course material', 5)
    res.json({ results, query })
  } catch (err) {
    console.error('Study web search error:', err.message)
    res.status(500).json({ error: 'Search failed' })
  }
})

router.post('/api/study-materials', authenticate, async (req, res) => {
  const startTime = Date.now()
  const DEADLINE_MS = 40000
  const log = (step, msg) => console.log(`[StudyPack:${step}] ${msg}`)

  log('INPUT', 'Parsing request body')
  const { courseId, title, sourceText, youtubeUrl, flashcardCount: fc, quizCount: qc, keyPointCount: kpc } = req.body
  const flashcardCount = Math.min(Math.max(parseInt(fc) || 10, 1), 50)
  const quizCount = Math.min(Math.max(parseInt(qc) || 8, 1), 30)
  const keyPointCount = Math.min(Math.max(parseInt(kpc) || 6, 1), 30)
  log('INPUT', `fc=${flashcardCount} qc=${quizCount} kpc=${keyPointCount}`)

  let combinedText = asText(sourceText).trim()
  if (youtubeUrl) {
    try {
      log('YOUTUBE', 'Fetching transcript')
      const transcript = await getYouTubeTranscript(youtubeUrl)
      combinedText = appendText(combinedText, transcript)
      log('YOUTUBE', `Got ${asText(transcript).length || 0} chars`)
    } catch (e) { log('YOUTUBE', `Failed: ${e.message}`) }
  }

  if (combinedText.length < 50) {
    log('VALIDATE', `Text too short: ${combinedText.length} chars`)
    return res.status(400).json({ error: 'Provide at least 50 characters of content' })
  }

  const finalTitle = (title || '').trim() || combinedText.trim().split(/\s+/).slice(0, 8).join(' ') + '...'

  // --- JSON repair helpers ---
  function stripCodeFences(text) {
    return String(text || '').replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim()
  }

  function repairJSON(text) {
    let t = stripCodeFences(text)
    // If no braces found at all, wrap the entire text as a summary
    if (t.indexOf('{') === -1 || t.lastIndexOf('}') === -1) return null
    t = t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)
    // Fix trailing commas before closing braces/brackets
    t = t.replace(/,\s*([}\]])/g, '$1')
    // Fix single quotes used as JSON strings (but not inside already-double-quoted strings)
    t = t.replace(/(?<=:\s*)'(.*?)'(?=\s*[,}\]])/g, '"$1"')
    // Fix unquoted keys (words followed by colon)
    t = t.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    // Remove control characters
    t = t.replace(/[\x00-\x1f]/g, '')
    try { return JSON.parse(t) } catch { return null }
  }

  async function tryParseResponse(text) {
    if (!text) return null
    // Try direct parse first
    try { return JSON.parse(text) } catch {}
    // Try repair
    const repaired = repairJSON(text)
    if (repaired) return repaired
    // If the text contains a JSON-like object, try harder
    const jsonMatch = text.match(/\{[\s\S]*"summary"[\s\S]*"flashcards"[\s\S]*"quiz"[\s\S]*\}/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) } catch {}
      const repaired2 = repairJSON(jsonMatch[0])
      if (repaired2) return repaired2
    }
    return null
  }

  const deadline = Date.now() + DEADLINE_MS
  const hasTimeForAI = () => Date.now() < deadline

  let pack = null
  let councilInfo = null
  let aiUsed = false

  const systemInstruction = `You are an expert study assistant. Your job is to deeply analyze the given material and produce a high-quality study pack.
First, thoroughly read and understand the material. Identify:
1. The main topic(s) and purpose
2. Key concepts, definitions, and terminology
3. Principles, rules, or formulas mentioned
4. Examples or case studies
5. Any actionable steps or procedures

Then generate a JSON study pack with this EXACT structure:
{
  "summary": "A clear, well-written markdown summary (minimum 500 words). Explain the material in simple terms as if teaching a beginner. Include all major topics.",
  "improvedNote": "A comprehensive markdown study guide with sections: # Overview (big picture), ## Key Concepts (definitions and explanations), ## Detailed Notes (organized breakdown with subsections), ## Examples (if any), ## Quick Review (bullet-point summary for last-minute revision). Use headings, bold for key terms, and bullet lists.",
  "keyPoints": [ { "id": 1, "text": "A single, specific takeaway sentence" } ],
  "flashcards": [
    {
      "id": 1,
      "front": "A meaningful question (Define/Explain/Compare/What/How/Why) about a specific concept",
      "back": "A complete, accurate answer that teaches the concept"
    }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "A substantive multiple-choice question that tests understanding, not recall",
      "options": [
        "The correct answer",
        "A plausible wrong answer (common misconception or near miss)",
        "A clearly incorrect answer",
        "A distractor that sounds plausible but is wrong"
      ],
      "answerIndex": 0,
      "explanation": "Explain WHY the correct answer is right and WHY the others are wrong. Use details from the material."
    }
  ],
  "diagrams": []
}
CRITICAL RULES:
- Every flashcard must teach something specific; never use generic questions like 'What is X?' — use 'Define', 'Explain', 'Compare', 'What is the difference between', 'How does', 'Why does'
- Every quiz must have 4 options where at least 2 are plausible; never reuse the same distractor pattern
- summary and improvedNote must be complete, self-contained study resources
- If the material contains code, formulas, or data, include them properly
- Use LaTeX for math: $...$ inline, $$...$$ display
- Return ONLY valid JSON — no markdown, no code fences, no commentary`

  const userPrompt = `Generate a study pack for the following material:\n\n${combinedText.slice(0, 30000)}`

  // Phase 1: UNBREAKABLE AI — try every available path until we get valid JSON
  try {
    // --- Path A: AI Council (multi-provider) ---
    if (!pack && hasTimeForAI()) {
      try {
        if (process.env.HERMES_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) {
          log('AI', 'Path A: AI council')
          const truncated = combinedText.length > 28000 ? combinedText.slice(0, 28000) + '\n\n[CONTENT TRUNCATED - Text exceeds maximum length]' : combinedText
          const prompt = `${systemInstruction}\n\nMaterial:\n${truncated}`
          const aiDeadline = Math.min(40000, deadline - Date.now())
          const result = await Promise.race([
            aiChat([{ role: 'user', content: prompt }], { verifyWithSearch: false, turboMode: false }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI council timeout')), aiDeadline))
          ])
          if (result && result.final) {
            pack = await tryParseResponse(result.final)
            if (pack) {
              aiUsed = true
              log('AI', 'Path A: council produced valid pack')
            } else {
              log('AI', 'Path A: council output unparseable, raw length=' + result.final.length)
            }
            if (result.council) councilInfo = result.council.map(c => ({
              provider: c.provider,
              name: ({
                openai: 'GPT-4o', gemini: 'Gemini Flash', llama: 'Llama 3.1',
                groq: 'Groq Mixtral', phi4: 'Phi-4', minimax: 'MiniMax M3',
                diffusiongemma: 'DiffusionGemma', stepfun: 'Step 3.7 Flash',
                openrouter: 'OpenRouter GPT-4o', deepseek: 'DeepSeek V4',
                'nvidia-ultra': 'Nemotron 550B',
                'ollama-llama': 'Llama 3.2 (Local)', 'ollama-qwen': 'Qwen 2.5 (Local)',
              })[c.provider] || c.provider
            }))
          }
        } else {
          log('AI', 'Path A: no council keys configured')
        }
      } catch (e) { log('AI', `Path A: ${e.message}`) }
    }

    // --- Path B: Iterate through ALL available providers ---
    if (!pack && hasTimeForAI()) {
      const providers = getAvailableProviders()
      log('AI', `Path B: ${providers.length} providers available`)
      for (const fp of providers) {
        if (!hasTimeForAI()) { log('AI', `Path B: deadline reached, stopping`); break }
        try {
          log('AI', `Path B: trying ${fp}`)
          const providerDeadline = Math.min(20000, deadline - Date.now())
          const result = await Promise.race([
            getAiResponse(fp, [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt }
            ], { temperature: 0.3 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Provider timeout')), providerDeadline))
          ])
          if (result) {
            pack = await tryParseResponse(result)
            if (pack) {
              aiUsed = true
              log('AI', `Path B: ${fp} produced valid pack`)
              break
            } else {
              log('AI', `Path B: ${fp} unparseable (${result.length} chars)`)
            }
          }
        } catch (e) { log('AI', `Path B: ${fp} failed: ${e.message}`) }
      }
    }
  } catch (e) { log('AI', `Phase 1: ${e.message}`) }

  // Phase 2: Smart fallback (only if ALL AI failed)
  if (!pack) {
    log('FALLBACK', 'All AI paths exhausted — using smart keyword extraction')
    if (combinedText.length > 100) {
      // Attempt one more time with a simpler prompt on ANY remaining provider
      const providers = getAvailableProviders()
      for (const fp of providers) {
        try {
          log('FALLBACK', `Last-ditch attempt with ${fp}`)
          const simplePrompt = `Read this material and return ONLY a JSON object with "summary", "improvedNote", "keyPoints", "flashcards", and "quiz". Material: ${combinedText.slice(0, 8000)}`
          const result = await Promise.race([
            getAiResponse(fp, [{ role: 'user', content: simplePrompt }], { temperature: 0.5 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
          ])
          if (result) {
            pack = await tryParseResponse(result)
            if (pack) { aiUsed = true; log('FALLBACK', `Last-ditch ${fp} succeeded`); break }
          }
        } catch {}
      }
    }
    // Ultimate fallback
    if (!pack) {
      pack = buildStudyPack(combinedText, flashcardCount, quizCount, keyPointCount)
      log('FALLBACK', 'Keyword extraction used')
    }
  }

  const aiTime = Date.now() - startTime
  log('PACK', `Ready in ${aiTime}ms, AI: ${aiUsed ? 'OK' : 'fallback'}`)

  // Phase 3: DB persist (best-effort, does not block response)
  let savedId = null
  try {
    // Ensure user exists in public.users (FK constraint)
    await query('INSERT INTO public.users (id, email, name) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING', [req.user.id, req.user.email, req.user.email.split('@')[0] || 'User'])
    savedId = randomUUID()
    log('DB', `Inserting material id=${savedId}`)
    await query(
      `INSERT INTO public.study_materials
        (id, course_id, title, source_text, summary, key_points, quiz, diagrams, improved_note, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [
        savedId,
        courseId || null,
        finalTitle,
        combinedText,
        typeof pack.summary === 'string' ? pack.summary : JSON.stringify(pack.summary || ''),
        JSON.stringify(Array.isArray(pack.keyPoints) ? pack.keyPoints : []),
        JSON.stringify(Array.isArray(pack.quiz) ? pack.quiz : []),
        JSON.stringify(Array.isArray(pack.diagrams) ? pack.diagrams : []),
        typeof pack.improvedNote === 'string' ? pack.improvedNote : JSON.stringify(pack.improvedNote || ''),
        req.user.id,
      ]
    )
    log('DB', 'Material inserted')

    const cards = Array.isArray(pack.flashcards) ? pack.flashcards : []
    let inserted = 0
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] || {}
      const front = typeof card.front === 'string' ? card.front : typeof card.question === 'string' ? card.question : ''
      const back = typeof card.back === 'string' ? card.back : typeof card.answer === 'string' ? card.answer : ''
      if (!front && !back) continue
      try {
        await query(
          'INSERT INTO public.flashcards (id, material_id, front, back, order_index) VALUES ($1,$2,$3,$4,$5)',
          [randomUUID(), savedId, front, back, i]
        )
        inserted++
      } catch (fcErr) { log('DB', `Flashcard ${i} failed: ${fcErr.message}`) }
    }
    log('DB', `Inserted ${inserted}/${cards.length} flashcards`)
  } catch (dbErr) {
    log('DB', `INSERT FAILED: ${dbErr.message}`)
    savedId = null
  }

  if (!savedId) {
    return res.status(503).json({ error: 'Study pack was generated but could not be saved. Please try again.' })
  }

  // Phase 4: Build response (always succeeds)
  const finalFlashcards = Array.isArray(pack.flashcards) ? pack.flashcards : []
  const finalQuiz = Array.isArray(pack.quiz) ? pack.quiz : []
  const responseData = {
    id: savedId,
    courseId: courseId || null,
    title: finalTitle,
    sourceText: combinedText,
    summary: typeof pack.summary === 'string' ? pack.summary : JSON.stringify(pack.summary || ''),
    keyPoints: Array.isArray(pack.keyPoints) ? pack.keyPoints : [],
    quiz: finalQuiz,
    diagrams: Array.isArray(pack.diagrams) ? pack.diagrams : [],
    improvedNote: typeof pack.improvedNote === 'string' ? pack.improvedNote : JSON.stringify(pack.improvedNote || ''),
    flashcards: finalFlashcards,
    flashcardCount: finalFlashcards.length,
    quizCount: finalQuiz.length,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  }
  if (councilInfo) responseData.council = councilInfo

  log('DONE', `Responding with pack (${responseData.flashcards.length} cards, ${responseData.quiz.length} quiz)`)
  res.status(201).json(responseData)
})

router.post('/api/study-materials/upload', authenticate, upload.fields([
  { name: 'audio', maxCount: 5 },
  { name: 'document', maxCount: 10 },
  { name: 'pdf', maxCount: 10 },
]), async (req, res) => {
  const startTime = Date.now()
  const DEADLINE_MS = 40000
  const log = (step, msg) => console.log(`[Upload:${step}] ${msg}`)

  try {
  log('INPUT', 'Parsing upload request')
  const { courseId, title, sourceText, youtubeUrl, flashcardCount: fc, quizCount: qc, keyPointCount: kpc } = req.body
  const flashcardCount = Math.min(Math.max(parseInt(fc) || 10, 1), 50)
  const quizCount = Math.min(Math.max(parseInt(qc) || 8, 1), 30)
  const keyPointCount = Math.min(Math.max(parseInt(kpc) || 6, 1), 30)
  const audioFiles = req.files?.audio || []
  const docFiles = [...(req.files?.document || []), ...(req.files?.pdf || [])]

  let combinedText = asText(sourceText).trim()

  if (youtubeUrl) {
    try {
      log('YOUTUBE', 'Fetching transcript')
      const transcript = await getYouTubeTranscript(youtubeUrl)
      combinedText = appendText(combinedText, transcript)
      log('YOUTUBE', `Got ${asText(transcript).length || 0} chars`)
    } catch (e) { log('YOUTUBE', `Failed: ${e.message}`) }
  }

  for (const audioFile of audioFiles) {
    if (!audioFile) continue
    try {
      log('AUDIO', `Transcribing ${audioFile.originalname}`)
      const transcript = await transcribeAudio(audioFile.buffer, audioFile.originalname, audioFile.mimetype)
      combinedText = appendText(combinedText, transcript)
      log('AUDIO', `Got ${asText(transcript).length || 0} chars`)
    } catch (e) { log('AUDIO', `Failed: ${e.message}`) }
  }

  for (const docFile of docFiles) {
    if (!docFile) continue
    try {
      log('DOC', `Extracting text from ${docFile.originalname}`)
      const text = await extractTextFromDoc(docFile.buffer, docFile.originalname)
      combinedText = appendText(combinedText, text)
      log('DOC', `Got ${asText(text).length || 0} chars`)
    } catch (e) { log('DOC', `Failed: ${e.message}`) }
  }

  if (combinedText.length < 50) {
    log('VALIDATE', `Text too short: ${combinedText.length} chars`)
    const uploadName = docFiles[0]?.originalname || audioFiles[0]?.originalname || 'the upload'
    return res.status(400).json({ error: `I could not extract enough text from ${uploadName}. If it is a scanned PDF or image-only file, paste the text manually or upload a text-based PDF/DOCX.` })
  }
  const uploadTitle = (title || '').trim() || combinedText.trim().split(/\s+/).slice(0, 8).join(' ') + '...'

  const deadline = Date.now() + DEADLINE_MS
  let pack = null
  let councilInfo = null
  let aiUsed = false

  const uploadSystemInstruction = `You are an expert study assistant. Your job is to deeply analyze the given material and produce a high-quality study pack.
First, thoroughly read and understand the material. Identify:
1. The main topic(s) and purpose
2. Key concepts, definitions, and terminology
3. Principles, rules, or formulas mentioned
4. Examples or case studies
5. Any actionable steps or procedures

Then generate a JSON study pack with this EXACT structure:
{
  "summary": "A clear, well-written markdown summary (minimum 500 words). Explain the material in simple terms as if teaching a beginner. Include all major topics.",
  "improvedNote": "A comprehensive markdown study guide with sections: # Overview (big picture), ## Key Concepts (definitions and explanations), ## Detailed Notes (organized breakdown with subsections), ## Examples (if any), ## Quick Review (bullet-point summary for last-minute revision). Use headings, bold for key terms, and bullet lists.",
  "keyPoints": [ { "id": 1, "text": "A single, specific takeaway sentence" } ],
  "flashcards": [
    {
      "id": 1,
      "front": "A meaningful question (Define/Explain/Compare/What/How/Why) about a specific concept",
      "back": "A complete, accurate answer that teaches the concept"
    }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "A substantive multiple-choice question that tests understanding, not recall",
      "options": [
        "The correct answer",
        "A plausible wrong answer (common misconception or near miss)",
        "A clearly incorrect answer",
        "A distractor that sounds plausible but is wrong"
      ],
      "answerIndex": 0,
      "explanation": "Explain WHY the correct answer is right and WHY the others are wrong. Use details from the material."
    }
  ],
  "diagrams": []
}
CRITICAL RULES:
- Every flashcard must teach something specific; never use generic questions like 'What is X?' — use 'Define', 'Explain', 'Compare', 'What is the difference between', 'How does', 'Why does'
- Every quiz must have 4 options where at least 2 are plausible; never reuse the same distractor pattern
- summary and improvedNote must be complete, self-contained study resources
- If the material contains code, formulas, or data, include them properly
- Use LaTeX for math: $...$ inline, $$...$$ display
- Return ONLY valid JSON — no markdown, no code fences, no commentary`

  const uploadUserPrompt = `Generate a study pack for the following material:\n\n${combinedText.slice(0, 30000)}`

  // UNBREAKABLE AI — try every available path
  try {
    // --- Path A: AI Council ---
    if (!pack && Date.now() < deadline && (process.env.HERMES_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY)) {
      try {
        log('AI', 'Path A: AI council (' + combinedText.length + ' chars)')
        const aiContent = combinedText.length > 28000 ? combinedText.slice(0, 28000) + '\n\n[CONTENT TRUNCATED - Text exceeds maximum length]' : combinedText
        const prompt = `${uploadSystemInstruction}\n\nMaterial:\n${aiContent}`
        const aiDeadline = Math.min(40000, deadline - Date.now())
        const result = await Promise.race([
          aiChat([{ role: 'user', content: prompt }], { verifyWithSearch: false, turboMode: false }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI council timeout')), aiDeadline))
        ])
        if (result && result.final) {
          pack = await tryParseResponse(result.final)
          if (pack) { aiUsed = true; log('AI', 'Path A: council produced valid pack') }
          else log('AI', 'Path A: council unparseable')
          if (result.council) councilInfo = result.council.map(c => ({
            provider: c.provider,
            name: ({
              openai: 'GPT-4o', gemini: 'Gemini Flash', llama: 'Llama 3.1',
              groq: 'Groq Mixtral', phi4: 'Phi-4', minimax: 'MiniMax M3',
              diffusiongemma: 'DiffusionGemma', stepfun: 'Step 3.7 Flash',
              openrouter: 'OpenRouter GPT-4o', deepseek: 'DeepSeek V4',
              'nvidia-ultra': 'Nemotron 550B',
              'ollama-llama': 'Llama 3.2 (Local)', 'ollama-qwen': 'Qwen 2.5 (Local)',
            })[c.provider] || c.provider
          }))
        }
      } catch (e) { log('AI', `Path A: ${e.message}`) }
    }

    // --- Path B: Iterate ALL providers ---
    if (!pack && Date.now() < deadline) {
      const providers = getAvailableProviders()
      log('AI', `Path B: ${providers.length} providers`)
      for (const fp of providers) {
        if (Date.now() >= deadline) { log('AI', 'Path B: deadline'); break }
        try {
          log('AI', `Path B: trying ${fp}`)
          const pdl = Math.min(20000, deadline - Date.now())
          const result = await Promise.race([
            getAiResponse(fp, [
              { role: 'system', content: uploadSystemInstruction },
              { role: 'user', content: uploadUserPrompt }
            ], { temperature: 0.3 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), pdl))
          ])
          if (result) {
            pack = await tryParseResponse(result)
            if (pack) { aiUsed = true; log('AI', `Path B: ${fp} OK`); break }
            else log('AI', `Path B: ${fp} unparseable`)
          }
        } catch (e) { log('AI', `Path B: ${fp} error: ${e.message}`) }
      }
    }

    // --- Last ditch ---
    if (!pack && combinedText.length > 100) {
      const providers = getAvailableProviders()
      for (const fp of providers) {
        try {
          log('FALLBACK', `Last-ditch ${fp}`)
          const r = await Promise.race([
            getAiResponse(fp, [{ role: 'user', content: `Return JSON with summary, improvedNote, keyPoints, flashcards, quiz for:\n${combinedText.slice(0, 8000)}` }], { temperature: 0.5 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
          ])
          if (r) {
            pack = await tryParseResponse(r)
            if (pack) { aiUsed = true; log('FALLBACK', `Last-ditch ${fp} OK`); break }
          }
        } catch {}
      }
    }
  } catch (e) { log('AI', `Failed: ${e.message}`) }

  if (!pack) {
    log('FALLBACK', 'All AI exhausted — smart keyword extraction')
    pack = buildStudyPack(combinedText, flashcardCount, quizCount, keyPointCount)
  }

  const aiTime = Date.now() - startTime
  log('PACK', `Ready in ${aiTime}ms, AI: ${aiUsed ? 'OK' : 'fallback'}`)

  // DB persist (best-effort)
  let savedId = null
  try {
    // Ensure user exists in public.users (FK constraint)
    await query('INSERT INTO public.users (id, email, name) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING', [req.user.id, req.user.email, req.user.email.split('@')[0] || 'User'])
    savedId = randomUUID()
    log('DB', `Inserting material id=${savedId}`)
    await query(
      `INSERT INTO public.study_materials
        (id, course_id, title, source_text, summary, key_points, quiz, diagrams, improved_note, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [
        savedId,
        courseId || null,
        uploadTitle,
        combinedText,
        typeof pack.summary === 'string' ? pack.summary : JSON.stringify(pack.summary || ''),
        JSON.stringify(Array.isArray(pack.keyPoints) ? pack.keyPoints : []),
        JSON.stringify(Array.isArray(pack.quiz) ? pack.quiz : []),
        JSON.stringify(Array.isArray(pack.diagrams) ? pack.diagrams : []),
        typeof pack.improvedNote === 'string' ? pack.improvedNote : JSON.stringify(pack.improvedNote || ''),
        req.user.id,
      ]
    )
    log('DB', 'Material inserted')

    const cards = Array.isArray(pack.flashcards) ? pack.flashcards : []
    let inserted = 0
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] || {}
      const front = typeof card.front === 'string' ? card.front : typeof card.question === 'string' ? card.question : ''
      const back = typeof card.back === 'string' ? card.back : typeof card.answer === 'string' ? card.answer : ''
      if (!front && !back) continue
      try {
        await query(
          'INSERT INTO public.flashcards (id, material_id, front, back, order_index) VALUES ($1,$2,$3,$4,$5)',
          [randomUUID(), savedId, front, back, i]
        )
        inserted++
      } catch (fcErr) { log('DB', `Flashcard ${i} failed: ${fcErr.message}`) }
    }
    log('DB', `Inserted ${inserted}/${cards.length} flashcards`)
  } catch (dbErr) {
    log('DB', `INSERT FAILED: ${dbErr.message}`)
    savedId = null
  }

  if (!savedId) {
    return res.status(503).json({ error: 'Study pack was generated but could not be saved. Please try again.' })
  }

  // Build response (always succeeds)
  const finalFlashcards = Array.isArray(pack.flashcards) ? pack.flashcards : []
  const finalQuiz = Array.isArray(pack.quiz) ? pack.quiz : []
  const responseData = {
    id: savedId,
    courseId: courseId || null,
    title: uploadTitle,
    sourceText: combinedText,
    summary: typeof pack.summary === 'string' ? pack.summary : JSON.stringify(pack.summary || ''),
    keyPoints: Array.isArray(pack.keyPoints) ? pack.keyPoints : [],
    quiz: finalQuiz,
    diagrams: Array.isArray(pack.diagrams) ? pack.diagrams : [],
    improvedNote: typeof pack.improvedNote === 'string' ? pack.improvedNote : JSON.stringify(pack.improvedNote || ''),
    flashcards: finalFlashcards,
    flashcardCount: finalFlashcards.length,
    quizCount: finalQuiz.length,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  }
  if (councilInfo) responseData.council = councilInfo

  log('DONE', `Responding with pack (${responseData.flashcards.length} cards, ${responseData.quiz.length} quiz)`)
  res.status(201).json(responseData)
  } catch (err) {
    console.error('[Upload] FATAL:', err.message)
    console.error('[Upload] Stack:', err.stack)
    if (!res.headersSent) res.status(500).json({ error: 'Failed to create study pack from upload' })
  }
})

router.post('/api/study-materials/:id/chat', authenticate, async (req, res) => {
  try {
  const { message, history } = req.body
  const { rows } = await query('SELECT source_text, title FROM public.study_materials WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Study pack not found' })

  const { source_text, title } = rows[0]
  const messages = [
    { role: 'system', content: `You are a versatile AI study assistant for the material titled "${title}". Use the following source text as context when relevant, but you can answer ANY question the user asks — academic, general knowledge, or otherwise. Be helpful, thorough, and clear. Use LaTeX for all math: $...$ inline, $$...$$ display. Use Markdown tables for comparisons. Write key points in **bold** for emphasis.\n\nBEFORE answering, analyze the question: identify what the user truly needs. If the question is vague, ambiguous, or missing details, ASK clarifying questions first — then provide a complete answer once you have enough context.\n\nIMPORTANT CAPABILITY: You have LIVE WEB SEARCH access. If you need current information to answer the user's question, include <web_search>your search query</web_search> inside your <answer> tags and the system will fetch results for you.\n\nMaterial context:\n${source_text.slice(0, 6000)}` },
    ...(history || []).slice(-10),
    { role: 'user', content: message }
  ]

  const result = await aiChat(messages)
  if (!result) return res.status(500).json({ error: 'AI Assistant unavailable' })

  const newHistory = [...(history || []), { role: 'user', content: message }, { role: 'assistant', content: result.final }]
  await query('UPDATE public.study_materials SET chat_history = $1 WHERE id = $2', [JSON.stringify(newHistory), req.params.id])

  res.status(200).json({ response: result.final, council: result.council, history: newHistory })
  } catch (err) {
    console.error('Study pack chat failed:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Failed to process chat' })
  }
})

router.post('/api/study-materials/chat', authenticate, async (req, res) => {
  try {
  const { message, history, context } = req.body
  let contextBlock = ''
  if (context && context.type === 'study-pack') {
    const diagramsText = (context.diagrams || []).map(d => `Title: ${d.title}\nCode: ${d.code}`).join('\n\n')
    contextBlock = `\n\nThe user is analyzing a Study Pack titled "${context.title}". Here is its full content:\n\nSummary: ${context.summary || 'N/A'}\n\nKey Points: ${(context.keyPoints || []).map(p => p.text).join('\n') || 'N/A'}\n\nFlashcards: ${(context.flashcards || []).map(f => `Q: ${f.front}\nA: ${f.back}`).join('\n\n') || 'N/A'}\n\nQuiz: ${(context.quiz || []).map(q => `Q: ${q.question}\nOptions: ${(q.options || []).join(', ')}\nAnswer: ${q.answerIndex !== undefined ? q.options[q.answerIndex] : 'N/A'}`).join('\n\n') || 'N/A'}\n\nDiagrams:\n${diagramsText || 'N/A'}\n\nUse this content to answer the user's questions. Reference specific parts of the pack. If the user asks something not in the pack, use your general knowledge too.`
  }
  const msgs = (history && history.length) ? [
    { role: 'system', content: 'You are the McPherson AI Council — a collective of multiple AI models working together. Answer ANY question the user asks with EXTREMELY LONG, COMPREHENSIVE, AND PRECISE answers. Write detailed, textbook-quality responses with thorough explanations, examples, and deep analysis. Cover every aspect of the question. Never refuse to answer. Use **bold** for key terms and concepts. Structure your answer with clear sections. Use LaTeX for all math: $...$ inline, $$...$$ display. Use Markdown tables for comparisons.\n\nBEFORE answering, analyze the question deeply. Identify what the user truly needs. Then provide an exhaustive, complete response.\n\nIMPORTANT CAPABILITY: You have LIVE WEB SEARCH access. If you need current information, include <web_search>your search query</web_search> inside your <answer> tags and the system will fetch results.' + contextBlock },
    ...history.slice(-10),
  ] : [
    { role: 'system', content: 'You are the McPherson AI Council — a collective of multiple AI models working together. Answer ANY question with EXTREMELY LONG, COMPREHENSIVE, AND PRECISE answers. Write detailed, textbook-quality responses with thorough explanations, examples, and deep analysis. Cover every aspect of the question. Never refuse to answer. Use **bold** for key terms and concepts. Structure your answer with clear sections. Use LaTeX for all math: $...$ inline, $$...$$ display. Use Markdown tables for comparisons.\n\nBEFORE answering, analyze the question deeply. Identify what the user truly needs. Then provide an exhaustive, complete response.\n\nIMPORTANT CAPABILITY: You have LIVE WEB SEARCH access. If you need current information, include <web_search>your search query</web_search> inside your <answer> tags and the system will fetch results.' + contextBlock },
    { role: 'user', content: message },
  ]
  const result = await aiChat(msgs)
  if (!result) return res.status(500).json({ error: 'AI Assistant unavailable' })
  res.status(200).json({ response: result.final, council: result.council, finalThinking: result.finalThinking, history: [...(history || []), { role: 'user', content: message }, { role: 'assistant', content: result.final }] })
  } catch (err) {
    console.error('Study chat failed:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Failed to process chat' })
  }
})

router.get('/api/study-folders', authenticate, async (req, res) => {
  try {
  const { rows } = await query('SELECT * FROM public.study_folders WHERE created_by = $1 ORDER BY name', [req.user.id])
  res.status(200).json(rows)
  } catch (err) {
    console.error('Get folders failed:', err.message)
    res.status(500).json({ error: 'Failed to load folders' })
  }
})

router.post('/api/study-folders', authenticate, async (req, res) => {
  try {
  const { name, color, icon } = req.body
  if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name required' })
  const id = randomUUID()
  await query(
    'INSERT INTO public.study_folders (id, name, color, icon, created_by) VALUES ($1,$2,$3,$4,$5)',
    [id, name.trim(), color || '#6366f1', icon || 'folder', req.user.id]
  )
  res.status(201).json({ id, name: name.trim(), color: color || '#6366f1', icon: icon || 'folder', created_by: req.user.id })
  } catch (err) {
    console.error('Create folder failed:', err.message)
    res.status(500).json({ error: 'Failed to create folder' })
  }
})

router.put('/api/study-folders/:id', authenticate, async (req, res) => {
  try {
  const { name, color, icon } = req.body
  const { rowCount } = await query(
    'UPDATE public.study_folders SET name = COALESCE($1, name), color = COALESCE($2, color), icon = COALESCE($3, icon) WHERE id = $4 AND created_by = $5',
    [name, color, icon, req.params.id, req.user.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Folder not found' })
  res.status(200).json({ success: true })
  } catch (err) {
    console.error('Update folder failed:', err.message)
    res.status(500).json({ error: 'Failed to update folder' })
  }
})

router.delete('/api/study-folders/:id', authenticate, async (req, res) => {
  try {
  const { rowCount } = await query('DELETE FROM public.study_folders WHERE id = $1 AND created_by = $2', [req.params.id, req.user.id])
  if (!rowCount) return res.status(404).json({ error: 'Folder not found' })
  await query('UPDATE public.study_materials SET folder_id = NULL WHERE folder_id = $1', [req.params.id])
  res.status(200).json({ success: true })
  } catch (err) {
    console.error('Delete folder failed:', err.message)
    res.status(500).json({ error: 'Failed to delete folder' })
  }
})

router.put('/api/study-materials/:id/folder', authenticate, async (req, res) => {
  try {
  const { folderId } = req.body
  await query('UPDATE public.study_materials SET folder_id = $1 WHERE id = $2', [folderId || null, req.params.id])
  res.status(200).json({ success: true })
  } catch (err) {
    console.error('Move to folder failed:', err.message)
    res.status(500).json({ error: 'Failed to move material' })
  }
})

router.delete('/api/study-materials/:id', authenticate, async (req, res) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM public.study_materials WHERE id = $1 AND created_by = $2',
      [req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Study material not found' })
    await query('DELETE FROM public.flashcards WHERE material_id = $1', [req.params.id])
    await query('DELETE FROM public.flashcard_reviews WHERE material_id = $1', [req.params.id])
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Delete study material failed:', err.message)
    res.status(500).json({ error: 'Failed to delete study material' })
  }
})

router.get('/api/study-materials/:id/flashcards/due', authenticate, async (req, res) => {
  try {
  const { rows: allCards } = await query(
    'SELECT id, front, back FROM public.flashcards WHERE material_id = $1 ORDER BY order_index',
    [req.params.id]
  )
  if (!allCards.length) {
    const { rows: [pack] } = await query('SELECT id FROM public.study_materials WHERE id = $1', [req.params.id])
    if (!pack) return res.status(404).json({ error: 'Study pack not found' })
  }
  const { rows: reviews } = await query(
    'SELECT * FROM public.flashcard_reviews WHERE material_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  )
  const now = new Date().toISOString().slice(0, 10)
  const due = allCards.filter(c => {
    const r = reviews.find(r => r.flashcard_id === c.id)
    return !r || r.next_review <= now
  })
  res.status(200).json({
    cards: due,
    reviews,
    stats: {
      total: allCards.length,
      due: due.length,
      mastered: reviews.filter(r => r.repetitions >= 3).length,
      learning: reviews.filter(r => r.repetitions > 0 && r.repetitions < 3).length,
      new: allCards.length - reviews.length,
    }
  })
  } catch (err) {
    console.error('Get due flashcards failed:', err.message)
    res.status(500).json({ error: 'Failed to load flashcards' })
  }
})

router.post('/api/study-materials/:id/flashcards/review', authenticate, async (req, res) => {
  try {
  const { flashcardId, quality } = req.body
  if (quality < 0 || quality > 5) return res.status(400).json({ error: 'Quality must be 0-5' })
  const { rows: existing } = await query(
    'SELECT * FROM public.flashcard_reviews WHERE material_id = $1 AND flashcard_id = $2 AND user_id = $3',
    [req.params.id, String(flashcardId), req.user.id]
  )
  let ef = 2.5, interval = 0, reps = 0
  if (existing.length) {
    ef = existing[0].ease_factor
    interval = existing[0].interval_days
    reps = existing[0].repetitions
  }
  if (quality >= 3) {
    reps += 1
    if (reps === 1) interval = 1
    else if (reps === 2) interval = 6
    else interval = Math.round(interval * ef)
    ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  } else {
    reps = 0
    interval = 1
  }
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)
  const nextStr = nextReview.toISOString().slice(0, 10)
  if (existing.length) {
    await query(
      'UPDATE public.flashcard_reviews SET ease_factor = $1, interval_days = $2, repetitions = $3, next_review = $4, last_reviewed = NOW() WHERE id = $5',
      [ef, interval, reps, nextStr, existing[0].id]
    )
  } else {
    await query(
      'INSERT INTO public.flashcard_reviews (id, material_id, flashcard_id, user_id, ease_factor, interval_days, repetitions, next_review) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [randomUUID(), req.params.id, String(flashcardId), req.user.id, ef, interval, reps, nextStr]
    )
  }
  res.status(200).json({ easeFactor: ef, intervalDays: interval, repetitions: reps, nextReview: nextStr, quality })
  } catch (err) {
    console.error('Flashcard review failed:', err.message)
    res.status(500).json({ error: 'Failed to save flashcard review' })
  }
})

router.post('/api/study-sessions', authenticate, async (req, res) => {
  try {
  const { materialId, sessionType, score, totalQuestions, correctAnswers, stats } = req.body
  const id = randomUUID()
  await query(
    'INSERT INTO public.study_sessions (id, material_id, user_id, session_type, score, total_questions, correct_answers, stats, started_at, ended_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [id, materialId, req.user.id, sessionType || 'review', score || 0, totalQuestions || 0, correctAnswers || 0, JSON.stringify(stats || {}), new Date(req.body.startedAt || Date.now()).toISOString(), new Date().toISOString()]
  )
  res.status(201).json({ id, success: true })
  } catch (err) {
    console.error('Create study session failed:', err.message)
    res.status(500).json({ error: 'Failed to save study session' })
  }
})

router.get('/api/study-sessions', authenticate, async (req, res) => {
  try {
  const { rows } = await query(
    'SELECT * FROM public.study_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 50',
    [req.user.id]
  )
  res.status(200).json(rows)
  } catch (err) {
    console.error('Get study sessions failed:', err.message)
    res.status(500).json({ error: 'Failed to load study sessions' })
  }
})

router.get('/api/study-materials/:id/study-stream', authenticate, async (req, res) => {
  try {
  const { rows: [pack] } = await query(
    'SELECT id, title, summary, key_points, quiz FROM public.study_materials WHERE id = $1',
    [req.params.id]
  )
  if (!pack) return res.status(404).json({ error: 'Study pack not found' })
  const { rows: allCards } = await query(
    'SELECT id, front, back FROM public.flashcards WHERE material_id = $1 ORDER BY order_index',
    [req.params.id]
  )
  const { rows: reviews } = await query(
    'SELECT * FROM public.flashcard_reviews WHERE material_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  )
  const { rows: sessions } = await query(
    'SELECT * FROM public.study_sessions WHERE material_id = $1 AND user_id = $2 ORDER BY started_at DESC LIMIT 10',
    [req.params.id, req.user.id]
  )
  const now = new Date().toISOString().slice(0, 10)
  const dueCards = allCards.filter(c => {
    const r = reviews.find(r => r.flashcard_id === c.id)
    return !r || r.next_review <= now
  })
  res.status(200).json({
    pack: { id: pack.id, title: pack.title },
    keyPoints: pack.key_points || [],
    flashcards: { all: allCards, due: dueCards },
    quiz: pack.quiz || [],
    reviews,
    sessions,
    stats: {
      totalCards: allCards.length,
      dueCards: dueCards.length,
      masteredCards: reviews.filter(r => r.repetitions >= 3).length,
      learningCards: reviews.filter(r => r.repetitions > 0 && r.repetitions < 3).length,
      newCards: allCards.length - reviews.length,
      sessionsCompleted: sessions.length,
      bestScore: sessions.reduce((max, s) => Math.max(max, s.score || 0), 0),
    }
  })
  } catch (err) {
    console.error('Get study stream failed:', err.message)
    res.status(500).json({ error: 'Failed to load study stream' })
  }
})

// ===== TURBOLEARN AI INTEGRATION =====
// New endpoints for enhanced study features inspired by TurboLearn AI

/**
 * POST /api/study-materials/:id/podcast
 * Generate podcast from study material
 */
router.post('/api/study-materials/:id/podcast', authenticate, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ 
        success: false,
        error: 'Material ID is required',
        hint: 'Please provide a valid study material ID'
      })
    }

    const podcast = await generatePodcast(req.params.id, req.user.id, req.body)
    res.status(200).json({
      success: true,
      data: podcast,
      message: `✓ Podcast generated successfully for "${podcast.title}"! Listen while you study.`
    })
  } catch (err) {
    console.error('Podcast generation failed:', err.message)
    res.status(500).json({ 
      success: false,
      error: err.message || 'Failed to generate podcast',
      hint: 'Try with a different study material or check your internet connection'
    })
  }
})

/**
 * GET /api/study/spaced-repetition-plan
 * Get personalized spaced repetition recommendations
 */
router.get('/api/study/spaced-repetition-plan', authenticate, async (req, res) => {
  try {
    const plan = await getSpacedRepetitionPlan(req.user.id)
    res.status(200).json({
      success: true,
      data: plan,
      message: plan.message || 'Study plan loaded successfully'
    })
  } catch (err) {
    console.error('Spaced repetition plan failed:', err.message)
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate study plan',
      hint: 'Make sure you have created some study materials first'
    })
  }
})

/**
 * POST /api/study-materials/:id/enhanced-flashcards
 * Generate enhanced flashcards with better pedagogy
 */
router.post('/api/study-materials/:id/enhanced-flashcards', authenticate, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ 
        success: false,
        error: 'Material ID is required'
      })
    }

    const { count } = req.body
    if (count && (count < 1 || count > 50)) {
      return res.status(400).json({ 
        success: false,
        error: 'Card count must be between 1 and 50'
      })
    }

    const flashcards = await generateEnhancedFlashcards(req.params.id, req.user.id, count || 15)
    res.status(200).json({
      success: true,
      data: flashcards,
      message: flashcards.message || `✓ Generated ${flashcards.count} flashcards for learning!`
    })
  } catch (err) {
    console.error('Enhanced flashcard generation failed:', err.message)
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate flashcards',
      hint: 'Make sure the study material has enough content to generate flashcards from'
    })
  }
})

/**
 * POST /api/study-groups
 * Create a study group for collaboration
 */
router.post('/api/study-groups', authenticate, async (req, res) => {
  try {
    const { name, description, courseId } = req.body
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Group name is required',
        hint: 'Please provide a name for your study group'
      })
    }

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({ 
        success: false,
        error: 'Group name must be between 3 and 100 characters'
      })
    }

    const group = await createStudyGroup(name, description || '', courseId || null, req.user.id)
    res.status(201).json({
      success: true,
      data: group,
      message: `✓ Study group "${group.name}" created! You're the creator. Invite your classmates to join.`
    })
  } catch (err) {
    console.error('Study group creation failed:', err.message)
    res.status(500).json({ 
      success: false,
      error: 'Failed to create study group',
      hint: 'Try a different group name or check that the course exists'
    })
  }
})

/**
 * POST /api/study-groups/:groupId/share/:materialId
 * Share study material with a study group
 */
router.post('/api/study-groups/:groupId/share/:materialId', authenticate, async (req, res) => {
  try {
    const { groupId, materialId } = req.params
    
    if (!groupId || !materialId) {
      return res.status(400).json({ 
        success: false,
        error: 'Group ID and Material ID are required'
      })
    }

    const shared = await shareWithGroup(materialId, groupId, req.user.id)
    res.status(201).json({
      success: true,
      data: shared,
      message: '✓ Material shared with your study group! Your classmates can now access it.'
    })
  } catch (err) {
    console.error('Share with group failed:', err.message)
    res.status(500).json({ 
      success: false,
      error: err.message || 'Failed to share material',
      hint: 'Make sure you are a member of this study group'
    })
  }
})

/**
 * GET /api/study-groups/:groupId/materials
 * Get all materials shared in a study group
 */
router.get('/api/study-groups/:groupId/materials', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params
    
    if (!groupId) {
      return res.status(400).json({ 
        success: false,
        error: 'Group ID is required'
      })
    }

    const materials = await getGroupMaterials(groupId, req.user.id)
    res.status(200).json({
      success: true,
      data: materials,
      count: materials.length,
      message: `✓ Found ${materials.length} shared material(s) in your study group`
    })
  } catch (err) {
    console.error('Get group materials failed:', err.message)
    res.status(500).json({ 
      success: false,
      error: err.message || 'Failed to load group materials',
      hint: 'Make sure you are a member of this study group'
    })
  }
})

/**
 * GET /api/study-groups/my-groups
 * Get all study groups the user is a member of
 */
router.get('/api/study-groups/my-groups', authenticate, async (req, res) => {
  try {
    const { rows: groups } = await query(
      `SELECT DISTINCT 
        sg.id, sg.name, sg.description, sg.course_id, sg.creator_id,
        (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id)::int as member_count
       FROM study_groups sg
       JOIN study_group_members sgm ON sg.id = sgm.group_id
       WHERE sgm.user_id = $1
       ORDER BY sg.created_at DESC`,
      [req.user.id]
    )

    res.status(200).json({
      success: true,
      data: groups,
      count: groups.length,
      message: `✓ Loaded ${groups.length} study group(s)`
    })
  } catch (err) {
    console.error('Get user study groups failed:', err.message)
    res.status(500).json({
      success: false,
      error: 'Failed to load study groups'
    })
  }
})

/**
 * DELETE /api/study-groups/:groupId/leave
 * Leave a study group
 */
router.delete('/api/study-groups/:groupId/leave', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      })
    }

    // Check if user is a member
    const { rows: member } = await query(
      'SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    )

    if (!member.length) {
      return res.status(404).json({
        success: false,
        error: 'You are not a member of this study group'
      })
    }

    // Remove user from group
    await query(
      'DELETE FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    )

    res.status(200).json({
      success: true,
      message: '✓ You have left the study group'
    })
  } catch (err) {
    console.error('Leave study group failed:', err.message)
    res.status(500).json({
      success: false,
      error: 'Failed to leave study group'
    })
  }
})

/**
 * POST /api/study-materials/save-deck
 * Save a pre-generated flashcard deck and quiz directly (no AI regeneration)
 */
router.post('/api/study-materials/save-deck', authenticate, async (req, res) => {
  try {
    const { title, sourceText, flashcards, quiz } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const savedId = randomUUID()
    const cardArray = Array.isArray(flashcards) ? flashcards : []
    const quizArray = Array.isArray(quiz) ? quiz : []

    await query(
      `INSERT INTO public.study_materials
        (id, course_id, title, source_text, summary, key_points, quiz, diagrams, improved_note, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [
        savedId,
        null,
        title,
        sourceText || '',
        `Study deck: ${title}`,
        '[]',
        JSON.stringify(quizArray),
        '[]',
        '',
        req.user.id,
      ]
    )

    let inserted = 0
    for (let i = 0; i < cardArray.length; i++) {
      const card = cardArray[i] || {}
      const front = typeof card.front === 'string' ? card.front : typeof card.question === 'string' ? card.question : ''
      const back = typeof card.back === 'string' ? card.back : typeof card.answer === 'string' ? card.answer : ''
      if (!front && !back) continue
      try {
        await query(
          'INSERT INTO public.flashcards (id, material_id, front, back, order_index) VALUES ($1,$2,$3,$4,$5)',
          [randomUUID(), savedId, front, back, i]
        )
        inserted++
      } catch (fcErr) { console.error(`Flashcard ${i} insert failed:`, fcErr.message) }
    }

    res.status(201).json({
      id: savedId,
      title,
      flashcards: cardArray,
      quiz: quizArray,
      flashcardCount: cardArray.length,
      quizCount: quizArray.length,
    })
  } catch (err) {
    console.error('Save deck failed:', err.message)
    res.status(500).json({ error: 'Failed to save deck: ' + err.message })
  }
})

/**
 * GET /api/pomodoro/sessions
 * Get pomodoro sessions for the current user
 */
router.get('/api/pomodoro/sessions', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, duration_minutes AS "durationMinutes", completed_at AS "completedAt" FROM public.pomodoro_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 50',
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error('Get pomodoro sessions failed:', err.message)
    res.json([])
  }
})

/**
 * POST /api/pomodoro/sessions
 * Save a completed pomodoro session
 */
router.post('/api/pomodoro/sessions', authenticate, async (req, res) => {
  try {
    const { durationMinutes } = req.body
    const id = randomUUID()
    await query(
      'INSERT INTO public.pomodoro_sessions (id, user_id, duration_minutes, completed_at) VALUES ($1,$2,$3,NOW())',
      [id, req.user.id, durationMinutes || 25]
    )
    res.status(201).json({ id, durationMinutes, completedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Save pomodoro failed:', err.message)
    res.status(500).json({ error: 'Failed to save session' })
  }
})

/**
 * GET /api/pomodoro/goals
 * Get weekly goals for the current user
 */
router.get('/api/pomodoro/goals', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, text, done FROM public.weekly_goals WHERE user_id = $1 AND week_start = (SELECT date_trunc(\'week\', CURRENT_DATE)::date) ORDER BY created_at',
      [req.user.id]
    )
    if (rows.length === 0) {
      const defaults = [
        { text: 'Review lecture notes', done: false },
        { text: 'Complete assignments', done: false },
        { text: 'Practice problems', done: false },
      ]
      for (const g of defaults) {
        const id = randomUUID()
        await query(
          'INSERT INTO public.weekly_goals (id, user_id, text, done, week_start, created_at) VALUES ($1,$2,$3,$4,date_trunc(\'week\', CURRENT_DATE)::date,NOW())',
          [id, req.user.id, g.text, g.done]
        )
        rows.push({ id, text: g.text, done: g.done })
      }
    }
    res.json(rows)
  } catch (err) {
    console.error('Get goals failed:', err.message)
    res.json([])
  }
})

/**
 * POST /api/pomodoro/goals
 * Save weekly goals for the current user
 */
router.post('/api/pomodoro/goals', authenticate, async (req, res) => {
  try {
    const { goals } = req.body
    if (!Array.isArray(goals)) return res.status(400).json({ error: 'Goals array required' })

    // Delete existing goals for this week and re-insert
    await query(
      'DELETE FROM public.weekly_goals WHERE user_id = $1 AND week_start = date_trunc(\'week\', CURRENT_DATE)::date',
      [req.user.id]
    )

    const saved = []
    for (const g of goals) {
      const id = g.id || randomUUID()
      await query(
        'INSERT INTO public.weekly_goals (id, user_id, text, done, week_start, created_at) VALUES ($1,$2,$3,$4,date_trunc(\'week\', CURRENT_DATE)::date,NOW())',
        [id, req.user.id, g.text || '', !!g.done]
      )
      saved.push({ id, text: g.text, done: !!g.done })
    }
    res.json(saved)
  } catch (err) {
    console.error('Save goals failed:', err.message)
    res.status(500).json({ error: 'Failed to save goals' })
  }
})

export default router
