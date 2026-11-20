import { getAiResponse, getAvailableProviders, specialistRoles, getAI } from '../config/ai.js'
import { webSearch, fetchPage, looksTimeSensitive, searchImages, searchForVerification } from '../../lib/webSearch.js'
import { generateImage } from './imageService.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { transcribeWithParakeet } from './parakeetService.js'

// Verification system: extracts claims, searches web, revises with citations
const CLAIM_CACHE = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Full-answer cache: keyed on normalized question. Skips the full council pipeline
// (25+ provider calls, 3 rounds) when the same question is asked again — common
// across students in the same course.
const ANSWER_CACHE = new Map()
const ANSWER_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours
const ANSWER_CACHE_MAX_SIZE = 500

function normalizeForCache(text) {
  return (text || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '')
}

function buildCacheKey(messages, { turboMode, jsonMode }) {
  const userTurns = messages.filter(m => m.role === 'user')
  if (userTurns.length !== 1) return null
  const normalized = normalizeForCache(userTurns[0].content)
  if (!normalized || normalized.length < 3) return null
  return `${turboMode ? 'turbo' : 'council'}:${jsonMode ? 'json' : 'text'}:${normalized}`
}

function getCachedAnswer(key) {
  if (!key) return null
  const entry = ANSWER_CACHE.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ANSWER_CACHE_TTL) {
    ANSWER_CACHE.delete(key)
    return null
  }
  return entry.data
}

function setCachedAnswer(key, data) {
  if (!key) return
  if (ANSWER_CACHE.size >= ANSWER_CACHE_MAX_SIZE) {
    const oldestKey = ANSWER_CACHE.keys().next().value
    ANSWER_CACHE.delete(oldestKey)
  }
  ANSWER_CACHE.set(key, { data, ts: Date.now() })
}

function formatForCitation(rawResult, index) {
  let domain = 'unknown'
  try {
    if (rawResult.url && rawResult.url.startsWith('http')) {
      domain = new URL(rawResult.url).hostname.replace('www.', '')
    }
  } catch {}
  return {
    citationId: index + 1,
    title: rawResult.title || 'Untitled',
    snippet: rawResult.snippet || '',
    url: rawResult.url || '',
    domain,
    authoritative: isAuthoritativeDomain(rawResult.url || '')
  }
}

async function extractClaims(draftAnswer) {
  const prompt = `Extract 3-5 specific, verifiable claims from this answer.
Return ONLY a JSON array of strings. Each claim must be a complete, fact-checkable sentence.
Focus on: numbers, dates, names, "latest/current/best", comparisons, statistics, "first/most", proper nouns.

Answer: ${draftAnswer}`
  
  const providers = getWorkingProviders()
  const fast = providers.find(p => ['groq', 'openrouter'].includes(p)) || providers[0]
  const resp = await getAiResponseWithTimeout(fast, [{role: 'user', content: prompt}], {temperature: 0.1, json: true}, 5000)
  if (resp) {
    try { return JSON.parse(resp) } catch {}
  }
  return []
}

async function reviseWithCitations(draftAnswer, verifiedClaims, messages) {
  const sysContent = messages.find(m => m.role === 'system')?.content || ''
  const allSources = []
  for (const vc of verifiedClaims) {
    for (const s of (vc.sources || [])) {
      if (!allSources.find(x => x.url === s.url)) allSources.push(s)
    }
  }
  const sourcesBlock = allSources.length > 0
    ? allSources.map((s, i) => `[${i + 1}] ${s.title} — ${s.snippet || ''}\nURL: ${s.url}\nDomain: ${s.domain}${s.authoritative ? ' (Authoritative)' : ''}`).join('\n\n')
    : 'No verified sources found.'
  const prompt = `Revise your answer using the verified sources below.
- Cite inline with [1], [2] matching the SOURCE list numbers
- If a claim is unsupported by sources, weaken or remove it
- If sources contradict, note the discrepancy
- Preserve your original structure and tone
- Return ONLY the revised answer (no <thinking> tags)

VERIFIED SOURCES:
${sourcesBlock}

ORIGINAL ANSWER:
${draftAnswer}`

  const councilProviders = getWorkingProviders().filter(p => !['groq', 'openrouter'].includes(p)).slice(0, 2)
  
  const results = await Promise.allSettled(councilProviders.map(p => 
    getAiResponseWithTimeout(p, [
      {role: 'system', content: sysContent},
      {role: 'user', content: prompt}
    ], {temperature: 0.3}, 15000)
  ))
  
  const best = results.find(r => r.status === 'fulfilled' && r.value)?.value
  return best || draftAnswer
}

const VERIFICATION_CONFIG = {
  maxClaimsPerAnswer: 5,
  maxSourcesPerClaim: 3,
  minConfidenceForClaim: 0.7,
  enableVerification: true,
}

async function extractClaimsFromAnswer(answer) {
  if (!answer || typeof answer !== 'string') return []
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const claims = []
  for (const sentence of sentences) {
    if (/^(I think|I believe|In my opinion|It seems|Perhaps|Maybe)/i.test(sentence.trim())) continue
    if (/^(Note|Remember|However|Therefore|Thus|In conclusion|Summary)/i.test(sentence.trim())) continue
    if (/^(The|This|That|These|Those|It|He|She|They|We|You|A|An|One|Two|Three|Four|Five|According to|Studies show|Research shows|Data shows|Reports indicate)/i.test(sentence.trim())) {
      claims.push(sentence.trim())
    }
  }
  return [...new Set(claims)].slice(0, VERIFICATION_CONFIG.maxClaimsPerAnswer)
}

async function verifyClaims(claims) {
  if (!claims.length || !VERIFICATION_CONFIG.enableVerification) {
    return claims.map(c => ({ claim: c, verified: null, sources: [], confidence: 0 }))
  }
  try {
    const searchResults = await searchForVerification(claims, VERIFICATION_CONFIG.maxSourcesPerClaim)
    const verifiedClaims = []
    for (const claim of claims) {
      const sources = searchResults[claim] || []
      const authoritativeCount = sources.filter(s => s.authoritative).length
      const totalSources = sources.length
      const confidence = totalSources > 0 
        ? Math.min(0.9, (authoritativeCount / Math.max(1, totalSources)) * 0.7 + (totalSources / VERIFICATION_CONFIG.maxSourcesPerClaim) * 0.3)
        : 0
      const verified = confidence >= VERIFICATION_CONFIG.minConfidenceForClaim && authoritativeCount > 0
      verifiedClaims.push({
        claim,
        verified,
        sources: sources.map(s => ({
          citationId: s.citationId,
          title: s.title,
          snippet: s.snippet,
          url: s.url,
          domain: s.domain,
          authoritative: s.authoritative
        })),
        confidence: Math.round(confidence * 100) / 100
      })
    }
    return verifiedClaims
  } catch (err) {
    console.error('Verification error:', err.message)
    return claims.map(c => ({ claim: c, verified: null, sources: [], confidence: 0 }))
  }
}

function formatVerificationBlock(verifiedClaims) {
  if (!verifiedClaims.length) return ''
  const verified = verifiedClaims.filter(v => v.verified).length
  const total = verifiedClaims.length
  const lines = [
    '\n\n---\n',
    `## ✅ Verification Summary`,
    `**${verified}/${total} claims verified** against authoritative sources.\n`
  ]
  for (const vc of verifiedClaims) {
    const status = vc.verified ? '✅ Verified' : vc.confidence > 0 ? '⚠️ Partial' : '❌ Unverified'
    lines.push(`- ${status}: "${vc.claim.slice(0, 100)}${vc.claim.length > 100 ? '...' : ''}"`)
    if (vc.sources.length > 0) {
      lines.push(`  Sources: ${vc.sources.map(s => `[${s.citationId}] ${s.domain}${s.authoritative ? ' ★' : ''}`).join(', ')}`)
    }
  }
  lines.push('\n*Sources cited inline as [n] refer to the verification summary above.*\n')
  return lines.join('\n')
}

function needsVerification(query) {
  const triggers = /\b(latest|current|recent|202\d|best|top|how many|what is|who is|compare|vs\.?|statistics|data|report|price|stock|weather|score|result)\b/i
  return triggers.test(query) || query.length > 150
}

const PREMIUM_SYSTEM_INSTRUCTION = 'You are a thoughtful, capable assistant for McPherson University students. ' +
  'Answer the question directly, with a natural and respectful tone. Match the level of detail to the request: be brief for simple questions and explain complex topics clearly with useful examples. ' +
  'Use headings and lists only when they make the answer easier to follow. Format mathematics with LaTeX and code in fenced blocks. ' +
  'Be honest about uncertainty, ask a focused follow-up only when needed, and do not reveal private step-by-step reasoning.'

const PREMIUM_TURBO_INSTRUCTION = PREMIUM_SYSTEM_INSTRUCTION + '\n\n## TURBO MODE\nOptimize for speed without sacrificing quality. Be concise but complete.'

const PREMIUM_COUNCIL_INSTRUCTION = `You are a helpful academic assistant for McPherson University students. Give a direct, clear answer in a natural voice. Explain unfamiliar ideas with a useful example, use formatting only where it improves clarity, and acknowledge uncertainty. Do not reveal private step-by-step reasoning.`

// nvidia is first: the master NVIDIA key is the only key currently confirmed
// to return real completions. OpenCode/GLM-flash/Kimi remain available as
// fallbacks but are deprioritized because live probes showed 402/429/timeouts.
const FASTEST_PROVIDERS = ['anthropic', 'nvidia', 'nvidia-backup', 'nvidia-extra-1', 'nvidia-extra-2', 'nvidia-extra-3', 'nvidia-extra-4', 'nvidia-extra-5', 'nvidia-extra-6', 'nvidia-cosmos', 'openai', 'groq', 'openrouter', 'mistral-large', 'llama', 'llama-3.3', 'phi4', 'deepseek', 'deepseek-v4-flash', 'deepseek-v4-pro', 'mistral-nemotron', 'mistral-nemotron-2', 'nemotron-nano', 'nemotron-nano-8b', 'gemma-4', 'diffusiongemma', 'nemotron-ultra', 'nemotron-super-120b', 'nemotron-super-49b-v15', 'nemotron-super-49b-v1', 'z-ai', 'gpt-oss-20b', 'gpt-oss-120b', 'minimax', 'stepfun', 'poolside', 'inkling', 'kimi', 'opencode', 'glm-flash']

const providerHealth = new Map()

function getWorkingProviders(excluded = []) {
  const avail = getAvailableProviders()
  const prioritized = [...FASTEST_PROVIDERS.filter(p => avail.includes(p)), ...avail.filter(p => !FASTEST_PROVIDERS.includes(p))]
  const excludedProviders = new Set(excluded)
  return prioritized.filter(p => providerHealth.get(p) !== false && !excludedProviders.has(p))
}

function markProvider(provider, success) {
  if (success) {
    providerHealth.set(provider, true)
  } else {
    const current = providerHealth.get(provider)
    if (current === undefined) providerHealth.set(provider, false)
    else if (current === false) {}
    else providerHealth.set(provider, false)
  }
}

async function getAiResponseWithTimeout(provider, messages, options = {}, timeoutMs = 15000, signal = null) {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) return null
    try {
      const result = await Promise.race([
        getAiResponse(provider, messages, { ...options, signal }),
        new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
      ])
      if (result) {
        markProvider(provider, true)
        return result
      }
    } catch (err) {
      if (err?.authError) {
        markProvider(provider, false)
        return null
      }
    }
    if (signal?.aborted) return null
    if (attempt < 1) await new Promise(r => setTimeout(r, 300))
  }
  markProvider(provider, false)
  return null
}

function isProviderOffline(provider) {
  return providerHealth.get(provider) === false
}

async function executeSearchTools(text, maxRounds = 2) {
  let current = text
  for (let round = 0; round < maxRounds; round++) {
    const searchMatch = current.match(/<web_search>([\s\S]*?)<\/web_search>/i)
    const imgGenMatch = current.match(/<generate_image>([\s\S]*?)<\/generate_image>/i)
    const imgSearchMatch = current.match(/<search_images>([\s\S]*?)<\/search_images>/i)
    
    if (!searchMatch && !imgGenMatch && !imgSearchMatch) break

    if (searchMatch) {
      const q = searchMatch[1].trim()
      const results = await webSearch(q, 5)
      let contextBlock
      if (results.length > 0) {
        contextBlock = `\n\n--- WEB SEARCH RESULTS for "${q}" ---\n${results.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`).join('\n\n')}\n--- END WEB SEARCH RESULTS ---`
      } else {
        contextBlock = `\n\n--- WEB SEARCH for "${q}" returned no results. ---`
      }
      current = current.replace(searchMatch[0], `[Web search performed for: "${q}"]${contextBlock}`)
    }

    if (imgGenMatch) {
      const prompt = imgGenMatch[1].trim()
      const result = await generateImage(prompt)
      let replacement
      if (result.url) {
        replacement = `\n\n![Generated Image: ${prompt}](${result.url})\n*Image generated by ${result.provider}*\n`
      } else {
        const imgResults = await searchImages(prompt, 3)
        if (imgResults.length > 0) {
          replacement = `\n\n--- IMAGES FOUND for "${prompt}" ---\n${imgResults.map((r, i) => `[${i + 1}] ${r.title || 'Image'} ${r.url || r.src}`).join('\n')}\n--- END IMAGES ---\n`
        } else {
          replacement = `\n\n[Could not generate or find image for: "${prompt}"]\n`
        }
      }
      current = current.replace(imgGenMatch[0], replacement)
    }

    if (imgSearchMatch) {
      const q = imgSearchMatch[1].trim()
      const results = await searchImages(q, 5)
      let contextBlock
      if (results.length > 0) {
        contextBlock = `\n\n--- IMAGE SEARCH RESULTS for "${q}" ---\n${results.map((r, i) => `[${i + 1}] ${r.title || 'Image'} ${r.url || r.src}`).join('\n')}\n--- END IMAGE SEARCH RESULTS ---`
      } else {
        contextBlock = `\n\n--- IMAGE SEARCH for "${q}" returned no results. ---`
      }
      current = current.replace(imgSearchMatch[0], `[Image search performed for: "${q}"]${contextBlock}`)
    }
  }
  return current
}

// ── Query router: heuristic, not an LLM call. Errs toward "simple" only when confident.
const SIMPLE_QUERY_PATTERNS = /^(what is|what are|who is|who was|when (is|was|did)|where is|define|definition of|give (me )?(the )?formula|list|name|how many|how much|state|which of)\b/i
const COMPLEX_SIGNAL_WORDS = /\b(explain in detail|compare|contrast|analyze|analyse|discuss|derive|prove|evaluate|critique|essay|why does|why is|how does .* work|pros and cons|advantages and disadvantages|step[- ]by[- ]step|walk me through)\b/i

function isSimpleQuery(text) {
  if (!text || typeof text !== 'string') return false
  const trimmed = text.trim()
  if (trimmed.length > 180) return false
  if (COMPLEX_SIGNAL_WORDS.test(trimmed)) return false
  if (SIMPLE_QUERY_PATTERNS.test(trimmed)) return true
  const sentenceCount = (trimmed.match(/[.!?]+/g) || []).length
  return trimmed.length < 90 && sentenceCount <= 1
}

function escapeHtml(text) {
  return String(text).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  })[c])
}

function fallbackResponse() {
  // No provider means no answer. Callers surface a real error instead of
  // persisting a made-up "AI" response as if a model had replied.
  return null
}

const REASONING_ONLY_PATTERN = /^(?:<think\b|reasoning|analysis|thought process|thinking|let me think|i need to (?:think|reason))\b/i

function usableAnswer(raw) {
  if (typeof raw !== 'string') return null
  const parsed = extractThinkingAndAnswer(raw)
  const answer = parsed.answer
    .replace(/^<think\b[^>]*>[\s\S]*?<\/think>\s*/i, '')
    .trim()
  if (!answer || REASONING_ONLY_PATTERN.test(answer)) return null
  return answer
}

async function openAiBackup(messages, options = {}) {
  // Used only after a reasoning model returns empty or reasoning-only text.
  if (!getAvailableProviders().includes('openai')) return null
  const system = options.jsonMode
    ? 'You are a helpful assistant. Return ONLY valid JSON matching the requested schema. No explanatory text, no markdown, no code fences.'
    : PREMIUM_SYSTEM_INSTRUCTION
  const response = await getAiResponseWithTimeout('openai', [
    { role: 'system', content: system },
    ...messages.slice(-2),
  ], { temperature: options.temperature ?? 0.3, json: options.jsonMode }, 20000)
  return response ? String(response).trim() : null
}

async function aiChat(messages, options = {}) {
  let { fastMode, turboMode, gemPrompt, memoryContext, jsonMode } = options

  // Router: auto-route simple lookups to fast single-provider path instead of full council
  if (!turboMode && !fastMode && !options.forceCouncil) {
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''
    if (isSimpleQuery(lastUserMsg)) {
      turboMode = true
    }
  }

  // Cache lookup
  const cacheKey = (!gemPrompt && !memoryContext) ? buildCacheKey(messages, { turboMode, jsonMode }) : null
  if (cacheKey) {
    const cached = getCachedAnswer(cacheKey)
    if (cached) return { ...cached, cached: true }
  }

  // Inject gem and memory context
  if (gemPrompt || memoryContext) {
    const systemIdx = messages.findLastIndex(m => m.role === 'system')
    if (systemIdx !== -1) {
      let extra = ''
      if (gemPrompt) extra += `\n\n${gemPrompt}`
      if (memoryContext) extra += memoryContext
      messages[systemIdx] = { ...messages[systemIdx], content: messages[systemIdx].content + extra }
    }
  }

  // ── TURBO MODE: fastest single response, no council ──
  if (turboMode) {
    const providers = getWorkingProviders(options.excludeProviders || [])
    if (providers.length === 0) return fallbackResponse(messages)
    const top = providers.slice(0, 1)
    const sysContent = jsonMode
      ? 'You are a helpful assistant. Return ONLY valid JSON matching the requested schema. No explanatory text, no markdown, no code fences.'
      : PREMIUM_SYSTEM_INSTRUCTION
    const responses = await Promise.allSettled(top.map(p =>
      getAiResponseWithTimeout(p, [
        { role: 'system', content: sysContent },
        ...messages.slice(-2),
      ], { temperature: jsonMode ? 0.1 : 0.3, json: jsonMode, ...(options.model ? { model: options.model } : {}) }, 6000)
    ))
    for (const r of responses) {
      if (r.status === 'fulfilled' && r.value) {
        const parsed = extractThinkingAndAnswer(r.value)
        const finalAnswer = usableAnswer(r.value)
        if (!finalAnswer) continue
        const result = {
          final: finalAnswer,
          council: [{ provider: 'turbo', thinking: parsed.thinking || 'Fast response', answer: finalAnswer }],
          finalThinking: parsed.thinking || '',
          followUps: [],
        }
        setCachedAnswer(cacheKey, result)
        return result
      }
    }
    // The selected reasoning model may return only reasoning or an empty body.
    // Retry with a real OpenAI response instead of saving a fabricated answer.
    const backup = await openAiBackup(messages, { jsonMode, temperature: jsonMode ? 0.1 : 0.3 })
    if (backup) {
      const result = {
        final: backup,
        council: [{ provider: 'openai', thinking: 'Backup provider', answer: backup }],
        finalThinking: '',
        followUps: [],
      }
      setCachedAnswer(cacheKey, result)
      return result
    }
    return fallbackResponse(messages)
  }

  const providers = getWorkingProviders(options.excludeProviders || [])
  if (providers.length === 0) return fallbackResponse(messages)

  // ── Fast provider: always included as a council member ──
  const fastProvider = providers.find(p => FASTEST_PROVIDERS.includes(p)) || providers[0]
  const councilProviders = providers.filter(p => p !== fastProvider)

  const round1Timeout = fastMode ? 12000 : 20000
  const targetResponses = fastMode ? 2 : Math.min(3, councilProviders.length + 1)

  let preSearchContext = ''

  const searchCapablePrompt = `\n\nYou have live web search access. When current information is needed, request it with <web_search>query</web_search> and use the returned sources in your answer.`

  const answers = []
  const round1Controller = new AbortController()

  // Kick off fast provider in parallel
  const fastPromise = (async () => {
    const fastMessages = [
      { role: 'system', content: PREMIUM_SYSTEM_INSTRUCTION },
      ...messages.slice(-2),
    ]
    const resp = await getAiResponseWithTimeout(fastProvider, fastMessages, { temperature: 0.3, ...(options.model ? { model: options.model } : {}) }, 8000, round1Controller.signal)
    if (resp) {
      const parsed = extractThinkingAndAnswer(resp)
      answers.push({ provider: fastProvider, thinking: parsed.thinking || 'Fast response', answer: parsed.answer || resp })
    }
  })()

  // Council providers (all except the fast one)
  const promises = councilProviders.map(async (p) => {
    const roleInstruction = specialistRoles[p] || 'You are a PRO-LEVEL academic consultant.'
    const cotMessages = [
      { role: 'system', content: `${roleInstruction}\n${PREMIUM_COUNCIL_INSTRUCTION}${searchCapablePrompt}` },
      ...messages,
      ...(preSearchContext ? [{ role: 'system', content: preSearchContext }] : []),
    ]

    const resp = await getAiResponseWithTimeout(p, cotMessages, { temperature: 0.35, ...(options.model ? { model: options.model } : {}) }, round1Timeout, round1Controller.signal)
    if (resp) {
      const withSearch = await executeSearchTools(resp)
      const parsed = extractThinkingAndAnswer(withSearch)
      answers.push({ provider: p, thinking: parsed.thinking, answer: parsed.answer })
      if (answers.length >= targetResponses) return true
    }
    return false
  })

  await Promise.race([
    Promise.allSettled([fastPromise, ...promises]),
    new Promise(resolve => {
      const checker = setInterval(() => {
        if (answers.length >= targetResponses) {
          clearInterval(checker)
          resolve()
        }
      }, 100)
      setTimeout(() => { clearInterval(checker); resolve() }, round1Timeout)
    })
  ])

  // Cancel all still-running provider calls now that quorum is reached
  round1Controller.abort()

  // Drop empty / reasoning-only outputs before judging or saving.
  for (const answer of answers) {
    const cleaned = usableAnswer(answer.answer)
    if (cleaned) answer.answer = cleaned
  }
  const usableAnswers = answers.filter(answer => answer.answer)
  answers.splice(0, answers.length, ...usableAnswers)

  if (answers.length === 0) {
    const backup = await openAiBackup(messages, { temperature: 0.3 })
    if (backup) answers.push({ provider: 'openai', thinking: 'Backup provider', answer: backup })
  }
  if (answers.length === 0) return fallbackResponse(messages)
  if (answers.length === 1) {
    const final = await executeSearchTools(answers[0].answer)
    const followUps = await generateFollowUps(messages, final)
    const result = { final: final || answers[0].answer || 'I was unable to generate a response.', council: [{ ...answers[0], answer: final }], finalThinking: answers[0].thinking, followUps }
    setCachedAnswer(cacheKey, result)
    return result
  }

  // ── Cross-judge: each expert critiques another expert's answer ──
  const crossJudgments = []
  const crossJudgmentPromises = answers.map((_, i) => {
    const targetIdx = (i + 1) % answers.length
    const judgeProvider = answers[i].provider
    const targetProvider = answers[targetIdx].provider
    const critiquePrompt = [
      { role: 'system', content: `Review the answer from ${targetProvider}. Check for errors, missing context, and unclear wording. Return an improved answer, with a short explanation only if useful. Do not reveal private step-by-step reasoning. Use LaTeX for math ($...$ inline, $$...$$ display).` },
      { role: 'user', content: `Answer to review:\n\n${answers[targetIdx].answer}` }
    ]
    return getAiResponseWithTimeout(judgeProvider, critiquePrompt, { temperature: 0.3 }, 15000).then(critique => {
      if (critique) {
        const parsed = extractThinkingAndAnswer(critique)
        crossJudgments.push({ judge: judgeProvider, target: targetProvider, critique: parsed.thinking, revisedAnswer: parsed.answer })
      }
    })
  })
  await Promise.allSettled(crossJudgmentPromises)

  const councilPrompt = [
    ...messages,
    {
      role: 'system',
      content: `### SUPREME COUNCIL VERDICT ###
You are the CHIEF JUSTICE of the McPherson AI Council — a distinguished scholar synthesizing expert opinions.
Synthesize the ${answers.length} expert testimonies and their peer reviews below into a SINGLE comprehensive, scholarly verdict.
Use LaTeX for all math: $...$ inline, $$...$$ display.

ALL EXPERT TESTIMONIES:
${answers.map((a, i) => `\n[EXPERT ${i + 1} - ${a.provider}]:\n${a.answer}`).join('\n')}

PEER REVIEWS:
${crossJudgments.map(c => `\n[${c.judge} reviews ${c.target}]:\n<critique>${c.critique || 'No critique'}</critique>\n<revised>${c.revisedAnswer || 'No revision'}</revised>`).join('\n') || 'No peer reviews available.'}

Synthesize the strongest supported points into a clear answer. State the conclusion first, explain the most relevant evidence, and note disagreement or uncertainty briefly. Do not reveal private step-by-step reasoning.`
    }
  ]

  const deepseekAvail = providers.includes('deepseek')
  const nemotronUltraAvail = providers.includes('nemotron-ultra')
  const kimiAvail = providers.includes('kimi')
  const judgeProviders = []
  if (nemotronUltraAvail) judgeProviders.push('nemotron-ultra')
  if (kimiAvail) judgeProviders.push('kimi')
  if (deepseekAvail) judgeProviders.push('deepseek')
  judgeProviders.push('mistral-large')

  const judgePromises = judgeProviders.map(p =>
    getAiResponseWithTimeout(p, councilPrompt, { temperature: 0.2 }, fastMode ? 15000 : 25000)
  )

  const judgeResults = await Promise.allSettled(judgePromises)
  const verdicts = judgeResults.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value)

  let finalThinking = null
  let finalAnswer = answers[0].answer
  let secondaryVerdict = null

  if (verdicts.length > 0) {
    const bestVerdict = verdicts[0]
    const parsed = extractThinkingAndAnswer(await executeSearchTools(bestVerdict))
    finalThinking = parsed.thinking
    finalAnswer = parsed.answer

    if (verdicts.length > 1) {
      const dParsed = extractThinkingAndAnswer(verdicts[1])
      secondaryVerdict = { judge: judgeProviders[1] || 'secondary', answer: dParsed.answer }
    }
  }

  const followUps = await generateFollowUps(messages, finalAnswer)

  // 🔍 VERIFICATION
  const userQuery = messages.find(m => m.role === 'user')?.content || ''
  const verificationMode = (options.verifyWithSearch !== false && needsVerification(userQuery)) ? 'council' : false
  
  let verificationData = null
  if (verificationMode && finalAnswer) {
    try {
      const claims = await extractClaims(finalAnswer)
      if (claims.length > 0) {
        const vData = await verifyClaims(claims)
        const revised = await reviseWithCitations(finalAnswer, vData, messages)
        finalAnswer = revised
        finalThinking = (finalThinking || '') + '\n\n✅ Verified against web sources.'
        verificationData = vData
      }
    } catch (e) {
      console.warn('Verification failed:', e.message)
    }
  }

  const finalContent = finalAnswer || answers[0]?.answer || 'I was unable to generate a complete response. Please try rephrasing your question.'
  const result = { final: finalContent, council: answers, finalThinking, followUps, verificationData, secondaryVerdict }
  setCachedAnswer(cacheKey, result)
  return result
}

async function generateFollowUps(messages, response) {
  try {
    const providers = getAvailableProviders()
    const fp = ['groq', 'openrouter', 'mistral-large'].find(p => providers.includes(p))
    if (!fp) return []

    const prompt = [
      { role: 'system', content: 'Based on the conversation, generate 3 follow-up questions the user might ask next. Return ONLY a JSON array of 3 strings, each 5-12 words. Example: ["What is the derivative of x²?", "Can you show more examples?"]' },
      { role: 'user', content: `Conversation:\n${messages.slice(-2).map(m => `${m.role}: ${m.content.slice(0, 200)}`).join('\n')}\n\nAI Response: ${response.slice(0, 500)}\n\nGenerate 3 follow-up questions. Return ONLY the JSON array.` }
    ]

    const resp = await Promise.race([
      getAiResponse(fp, prompt, { temperature: 0.4, json: true }),
      new Promise(resolve => setTimeout(() => resolve(null), 4000))
    ])

    if (!resp) return []
    const parsed = typeof resp === 'string' ? JSON.parse(resp) : resp
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, 3).map(q => typeof q === 'string' ? q : String(q))
  } catch {
    return []
  }
}

function extractThinkingAndAnswer(text) {
  let thinking = null
  let answer = text
  const thinkMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/i)
  if (thinkMatch) {
    thinking = thinkMatch[1].trim()
    answer = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()
  }
  answer = answer.replace(/<\/?answer>/gi, '').trim()
  return { thinking, answer }
}

async function generateChatTitle(convId, userId, userQuestion, aiResponse) {
  try {
    const providers = getAvailableProviders()
    if (!providers.length) return
    const titlePrompt = [
      { role: 'system', content: 'Generate a very short title (3-6 words max) for a chat conversation. Return ONLY the title, no quotes, no punctuation.' },
      { role: 'user', content: `Question: ${userQuestion.slice(0, 300)}\n\nResponse: ${aiResponse.slice(0, 500)}` },
    ]
    const p = providers.includes('groq') ? 'groq' : providers[0]
    const title = await getAiResponseWithTimeout(p, titlePrompt, { temperature: 0.3 }, 5000)
    if (title && title.trim().length > 0 && title.trim().length < 80) {
      await query(
        `UPDATE public.chat_conversations SET title = $1 WHERE id = $2 AND user_id = $3`,
        [title.trim(), convId, userId]
      )
    }
  } catch { }
}

async function transcribeAudio(buffer, fileName, mimeType) {
  if (!buffer) return null

  // Parakeet is the primary lecture notetaker. It only accepts 16 kHz mono
  // PCM/FLAC/OGG, so the service normalizes what it can and returns null for
  // formats it cannot handle (mp3/m4a fall through to the hosted fallbacks).
  if (process.env.NVIDIA_PARAKEET_KEY) {
    try {
      const transcript = await transcribeWithParakeet(buffer, mimeType)
      if (transcript) return transcript
    } catch (err) {
      console.error('Parakeet error:', err?.message || err)
    }
  }

  const whisperClient = getAI('openai')
  if (whisperClient) {
    try {
      const transcription = await whisperClient.audio.transcriptions.create({
        file: await whisperClient.toFile(buffer, fileName),
        model: 'whisper-1',
      })
      return transcription.text
    } catch (err) {
      console.error('OpenAI Whisper error:', err.message)
    }
  }

  const keys = [
    { key: process.env.NVIDIA_WHISPER_KEY, model: 'nvidia/whisper-large-v3' },
    { key: process.env.NVIDIA_NEMOTRON_KEY, model: 'nvidia/nemotron-asr-streaming' },
  ]

  for (const { key, model } of keys) {
    if (!key) continue
    try {
      const blob = new Blob([buffer], { type: mimeType })
      const form = new FormData()
      form.append('audio', blob, fileName)
      form.append('model', model)
      const res = await fetch('https://integrate.api.nvidia.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}` },
        body: form,
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data.text) return data.text
    } catch { }
  }
  return null
}

export { executeSearchTools, aiChat, extractThinkingAndAnswer, generateChatTitle, transcribeAudio, generateFollowUps }
