import { YoutubeTranscript } from 'youtube-transcript'
import mammoth from 'mammoth'
import { extname } from 'path'
import { PDFParse } from 'pdf-parse'
import { query } from '../../lib/db.js'

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between',
  'could', 'during', 'every', 'from', 'have', 'into', 'more', 'most', 'other',
  'should', 'their', 'there', 'these', 'they', 'this', 'through', 'under',
  'where', 'which', 'while', 'with', 'would', 'your',
])

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 24)
}

function extractKeywords(text, limit = 8) {
  const counts = new Map()
  const words = String(text || '').toLowerCase().match(/[a-z][a-z-]{3,}/g) || []
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue
    counts.set(word, (counts.get(word) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word)
}

function normalizeExtractedText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.text === 'string') return value.text
  if (typeof value.value === 'string') return value.value
  if (Array.isArray(value.pages)) {
    return value.pages
      .map(page => typeof page?.text === 'string' ? page.text : '')
      .filter(Boolean)
      .join('\n\n')
  }
  return String(value)
}

async function getYouTubeTranscript(url) {
  try {
    const videoId = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^&?#]+)/)?.[1]
    if (!videoId) return null
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map(t => t.text).join(' ')
  } catch (err) {
    console.error('YouTube transcript error:', err.message)
    return null
  }
}

async function extractTextFromDoc(buffer, originalName) {
  try {
    const ext = extname(originalName).toLowerCase()
    if (ext === '.pdf') {
      const parser = new PDFParse(buffer, { verbosity: 0 })
      try {
        const result = await parser.getText()
        return normalizeExtractedText(result)
      } finally {
        await parser.destroy?.()
      }
    } else if (ext === '.docx' || ext === '.doc') {
      const data = await mammoth.extractRawText({ buffer })
      return normalizeExtractedText(data)
    } else if (['.txt', '.csv', '.rtf'].includes(ext)) {
      return normalizeExtractedText(buffer.toString())
    }
  } catch (err) {
    console.error('Text extraction error:', err.message)
  }
  return null
}

function classifySentences(sentences) {
  const defPattern = /\b(is|are|refers?\s+to|means?|defined?\s+as|known\s+as|called\s+|comprises?|consists?\s+of|involves?|represents?|describes?)\b/i
  const procPattern = /\b(first|then|next|finally|step|process|procedure|method|technique|how\s+to|steps?\s+to|follow|sequence)\b/i
  const compPattern = /\b(unlike|compared\s+to|whereas|while|however|but|on\s+the\s+other\s+hand|in\s+contrast|difference|similar|both|versus|vs)\b/i
  const exPattern = /\b(for\s+example|for\s+instance|such\s+as|like|e\.g\.|specifically|particularly|notably)\b/i
  const impPattern = /\b(important|key|crucial|essential|significant|notably|critical|vital|fundamental|primary|main)\b/i
  const result = { definitions: [], processes: [], comparisons: [], examples: [], important: [], other: [] }
  for (const s of sentences) {
    if (defPattern.test(s)) result.definitions.push(s)
    else if (procPattern.test(s)) result.processes.push(s)
    else if (compPattern.test(s)) result.comparisons.push(s)
    else if (exPattern.test(s)) result.examples.push(s)
    else if (impPattern.test(s)) result.important.push(s)
    else result.other.push(s)
  }
  return result
}

function buildQuiz(sourceSentences, keywords, qCount, sourceText) {
  const classified = classifySentences(sourceSentences)
  const definitionSentences = classified.definitions
  const processSentences = classified.processes
  const allContent = [...definitionSentences, ...classified.important, ...processSentences, ...classified.comparisons, ...classified.examples, ...classified.other]
  const quiz = []
  const usedSentences = new Set()
  const usedKeywords = new Set()

  for (let i = 0; i < qCount && i < 30; i++) {
    let question = null
    let options = []
    let answerIndex = 0
    let explanation = ''

    // Try definitions first
    if (i < definitionSentences.length && definitionSentences[i]) {
      const sent = definitionSentences[i]
      const words = sent.match(/[A-Z]\w+/g) || []
      const term = words.find(w => w.length > 3 && !usedKeywords.has(w)) || keywords[i % keywords.length] || 'this concept'
      const distractor = sourceSentences.find(s => s !== sent && s.length > 30 && s.length < 200) || 'None of the above is correct'
      usedKeywords.add(term)
      question = `Which of the following best defines ${term}?`
      options = [sent, distractor, `It is the opposite of ${term}`, `There is no standard definition for ${term}`]
      answerIndex = 0
      explanation = `The correct definition of ${term} matches the first option. The other options either describe something else or are incorrect.`
    }
    // Then processes
    else if (i - definitionSentences.length < processSentences.length) {
      const idx = i - definitionSentences.length
      const sent = processSentences[idx]
      const words = sent.match(/[A-Z]\w+/g) || []
      const term = words.find(w => w.length > 3) || 'this process'
      const wrong = sourceSentences.find(s => s !== sent && s.length > 30) || 'The steps should be followed in reverse order'
      question = `What is the correct approach for ${term}?`
      options = [sent, wrong, `There is only one step involved in ${term}`, `${term} does not require any specific process`]
      answerIndex = 0
      explanation = `The correct description of the process is the first option. It accurately describes the steps or method involved.`
    }
    // Then keyword-based
    else {
      const keyword = keywords[i % keywords.length]
      const answer = sourceSentences.find(s => s.toLowerCase().includes(keyword)) || allContent[i % allContent.length] || sourceText.slice(0, 200)
      const distractors = sourceSentences.filter(s => s !== answer && !s.toLowerCase().includes(keyword) && s.length > 30)
      const d1 = distractors[0] || `This is not related to ${keyword}`
      const d2 = distractors[1] || `Only advanced students need to understand ${keyword}`
      const d3 = distractors[2] || `${keyword} is not a core concept in this material`
      question = `Which statement best explains ${keyword}?`
      options = [answer, d1, d2, d3]
      answerIndex = 0
      explanation = `The first option correctly explains ${keyword} as presented in the material. The other options are either unrelated or incorrect.`
    }

    if (question) {
      quiz.push({ id: quiz.length + 1, question, options: shuffleArray(options.slice(0, 4)), answerIndex: 0, explanation })
    }
  }
  return quiz
}

function buildFlashcards(sourceSentences, classified, keywords, fCount) {
  const { definitions, processes, comparisons, examples, important, other } = classified
  const flashcards = []
  const usedKeywords = new Set()

  // Definition cards
  for (const sent of definitions.slice(0, Math.ceil(fCount * 0.35))) {
    const words = sent.match(/[A-Z]\w+/g) || []
    const term = words.find(w => w.length > 3 && !usedKeywords.has(w)) || 'this concept'
    usedKeywords.add(term)
    flashcards.push({ id: flashcards.length + 1, front: `Define ${term}. What does it mean?`, back: sent })
  }

  // How/Process cards
  for (const sent of processes.slice(0, Math.ceil(fCount * 0.2))) {
    const topic = sent.split(/[,;]/)[0].slice(0, 60)
    flashcards.push({ id: flashcards.length + 1, front: `How does the process described in "${topic}..." work?`, back: sent })
  }

  // Comparison cards
  for (const sent of comparisons.slice(0, Math.ceil(fCount * 0.15))) {
    const parts = sent.split(/\b(?:unlike|whereas|while|however|but|compared to|in contrast|versus|vs)\b/i)
    if (parts.length >= 2) {
      const a = parts[0].trim().slice(0, 40)
      const b = parts[1].trim().slice(0, 40)
      flashcards.push({ id: flashcards.length + 1, front: `Compare and contrast: what is the difference between "${a}" and "${b}"?`, back: sent })
    } else {
      flashcards.push({ id: flashcards.length + 1, front: `What comparison is being made in this statement? "${sent.slice(0, 60)}..."`, back: sent })
    }
  }

  // Important concept cards
  for (const sent of important.slice(0, Math.ceil(fCount * 0.2))) {
    const words = sent.match(/[A-Z]\w+/g) || []
    const term = words.find(w => w.length > 3) || 'this concept'
    flashcards.push({ id: flashcards.length + 1, front: `Why is ${term} important? Explain its significance.`, back: sent })
  }

  // Fill remaining with keyword-based cards
  let ki = 0
  while (flashcards.length < fCount && ki < keywords.length) {
    const keyword = keywords[ki]
    if (!usedKeywords.has(keyword)) {
      const match = sourceSentences.find(s => s.toLowerCase().includes(keyword))
      if (match) {
        flashcards.push({ id: flashcards.length + 1, front: `Explain the significance of ${keyword} in this context.`, back: match })
      }
    }
    ki++
  }

  // If still not enough, add from remaining sentences
  let si = 0
  const remaining = [...examples, ...other]
  while (flashcards.length < fCount && si < remaining.length) {
    const sent = remaining[si]
    flashcards.push({ id: flashcards.length + 1, front: `What can you learn from this statement? "${sent.slice(0, 60)}..."`, back: sent })
    si++
  }

  return flashcards
}

function buildStudyPack(sourceText, fc, qc, kpc) {
  sourceText = String(sourceText || '')
  const fCount = Math.min(Math.max(parseInt(fc) || 10, 1), 50)
  const qCount = Math.min(Math.max(parseInt(qc) || 8, 1), 30)
  const kCount = Math.min(Math.max(parseInt(kpc) || 6, 1), 30)
  const sentences = splitSentences(sourceText)
  const keywords = extractKeywords(sourceText, Math.max(fCount + 5, qCount + 5, kCount, 12))
  const classified = classifySentences(sentences)
  const fallbackText = sourceText.slice(0, 500)

  // Summary — pick the most informative sentences
  const summaryPool = [...classified.important, ...classified.definitions, ...sentences]
  const summaryParts = summaryPool.slice(0, 5).map(s => s.replace(/^[A-Z][a-z]+:\s*/, ''))
  const summary = summaryParts.length > 0
    ? summaryParts.join(' ') + (sourceText.length > 600 ? '\n\nThis material covers additional details that can be explored through the flashcards and quiz below.' : '')
    : fallbackText

  // Key Points — pick diverse, content-rich sentences
  const keyPointPool = [
    ...classified.important.slice(0, 2),
    ...classified.definitions.slice(0, 2),
    ...classified.processes.slice(0, 1),
    ...classified.comparisons.slice(0, 1),
    ...sentences.filter(s => s.length > 80).slice(0, kCount)
  ]
  const keyPoints = [...new Set(keyPointPool)].slice(0, kCount).map((text, index) => ({
    id: index + 1,
    text: text.length > 200 ? text.slice(0, 197) + '...' : text,
  }))

  // Flashcards
  const flashcards = buildFlashcards(sentences, classified, keywords, fCount)

  // Quiz
  const quiz = buildQuiz(sentences, keywords, qCount, sourceText)

  // Improved Note — organized markdown
  const defSection = classified.definitions.length
    ? ['### Definitions', ...classified.definitions.slice(0, 6).map(s => `- **${s.match(/[A-Z]\w+/g)?.[0] || 'Term'}:** ${s}`)]
    : []
  const procSection = classified.processes.length
    ? ['### Processes & Methods', ...classified.processes.slice(0, 4).map(s => `- ${s}`)]
    : []
  const compSection = classified.comparisons.length
    ? ['### Comparisons', ...classified.comparisons.slice(0, 3).map(s => `- ${s}`)]
    : []
  const impSection = classified.important.length
    ? ['### Key Takeaways', ...classified.important.slice(0, 5).map(s => `- ${s}`)]
    : []
  const exSection = classified.examples.length
    ? ['### Examples', ...classified.examples.slice(0, 3).map(s => `- ${s}`)]
    : []
  const detailLines = sentences.slice(0, 15).map(s => `- ${s}`)

  const improvedNote = [
    '# Study Notes',
    '',
    '## Overview',
    summary,
    '',
    ...defSection,
    ...procSection,
    ...compSection,
    ...impSection,
    ...exSection,
    '',
    (defSection.length || procSection.length || compSection.length) ? '' : '## Key Concepts',
    (defSection.length || procSection.length || compSection.length) ? '' : `- ${keywords.slice(0, 5).map(k => `**${k}**`).join(', ')} — review these terms in context`,
    '',
    '## Detailed Notes',
    ...detailLines,
    '',
    '## Quick Review',
    '- Review the flashcards for active recall',
    '- Take the quiz to test your understanding',
    '- Focus on definitions and key concepts',
    ...keywords.slice(0, 3).map(k => `- Remember: **${k}** is a significant term in this material`),
  ].join('\n')

  return {
    summary,
    keyPoints,
    flashcards,
    quiz,
    diagrams: [],
    improvedNote,
  }
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export { STOP_WORDS, splitSentences, extractKeywords, getYouTubeTranscript, extractTextFromDoc, buildStudyPack }
