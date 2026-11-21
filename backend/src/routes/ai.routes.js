import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { webSearch, searchImages } from '../../lib/webSearch.js'
import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { getAvailableProviders, getAI, streamAnthropicResponse, streamOpenAICompatResponse, VERIFIED_MODELS, NVIDIA_CAPABILITIES, resolveModelId, DEFAULT_NVIDIA_MODEL } from '../config/ai.js'
import { aiChat, generateFollowUps, generateChatTitle } from '../services/aiService.js'
import { runCourtCouncil } from '../services/councilService.js'
import { resolve4, resolve6 } from 'node:dns/promises'
import net from 'node:net'
import { URL } from 'node:url'
import http from 'node:http'
import https from 'node:https'
import axios from 'axios'
import * as cheerio from 'cheerio'

const router = Router()

function needsVerification(query) {
  const triggers = /\b(latest|current|recent|202\d|best|top|how many|what is|who is|compare|vs\.?|statistics|data|report|price|stock|weather|score|result)\b/i
  return triggers.test(query) || query.length > 150
}

function isPrivateAddress(address) {
  const version = net.isIP(address)
  if (version === 4) {
    const parts = address.split('.').map(Number)
    const [a, b] = parts
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 0 && parts[2] === 2) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }
  if (version === 6) {
    const normalized = address.toLowerCase().split('%')[0]
    if (normalized === '::' || normalized === '::1') return true
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
    if (/^fe[89ab]/.test(normalized)) return true
    if (normalized.startsWith('fec') || normalized.startsWith('fed') ||
        normalized.startsWith('fee') || normalized.startsWith('fef')) return true
    if (normalized.startsWith('ff')) return true
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice(7)
      if (net.isIP(mapped) === 4) return isPrivateAddress(mapped)
    }
  }
  return false
}

async function validateFetchUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return 'Invalid URL'
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    return 'Only public HTTP(S) URLs are allowed'
  }
  if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.localhost')) {
    return 'Private or local URLs are not allowed'
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) return 'Private or local URLs are not allowed'
  } else {
    let addresses = []
    try {
      addresses = [
        ...await resolve4(hostname),
        ...await resolve6(hostname),
      ]
    } catch {
      return 'URL hostname could not be resolved'
    }
    if (!addresses.length || addresses.some(isPrivateAddress)) {
      return 'Private or local URLs are not allowed'
    }
  }
  return null
}

async function lookupPublicAddress(hostname, options, callback) {
  try {
    let ipv4 = []
    let ipv6 = []
    try { ipv4 = await resolve4(hostname) } catch {}
    try { ipv6 = await resolve6(hostname) } catch {}
    const addresses = [...ipv4, ...ipv6]
    if (!addresses.length || addresses.some(isPrivateAddress)) {
      const error = new Error('Private or local addresses are not allowed')
      error.code = 'ERR_PRIVATE_ADDRESS'
      return callback(error)
    }
    if (options?.all) {
      return callback(null, addresses.map(address => ({
        address,
        family: net.isIP(address),
      })))
    }
    return callback(null, addresses[0], net.isIP(addresses[0]))
  } catch (error) {
    callback(error)
  }
}

const httpAgent = new http.Agent({ lookup: lookupPublicAddress })
const httpsAgent = new https.Agent({ lookup: lookupPublicAddress })

async function fetchPageSafely(rawUrl) {
  const response = await axios.get(rawUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    timeout: 30000,
    maxRedirects: 3,
    maxContentLength: 2 * 1024 * 1024,
    maxBodyLength: 2 * 1024 * 1024,
    httpAgent,
    httpsAgent,
    beforeRedirect: async (options) => {
      const redirectError = await validateFetchUrl(options.href || options.url)
      if (redirectError) throw new Error(redirectError)
    },
  })
  const $ = cheerio.load(response.data)
  $('script, style, nav, footer, header, aside, iframe, noscript').remove()
  const title = $('title').text().trim()
  const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 12000)
  const finalUrl = response.request?.res?.responseUrl ||
    response.request?._redirectable?._currentUrl ||
    rawUrl
  return { title, text, url: finalUrl }
}

function sanitizeHistory(history, limit = 10) {
  if (!Array.isArray(history)) return []
  return history
    .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .slice(-limit)
}

router.post('/api/generate-image', authenticate, async (req, res) => {
  const { prompt } = req.body
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' })
  }
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_2
    if (!apiKey) {
      return res.status(503).json({ error: 'Image generation unavailable (no API key)' })
    }
    const client = new OpenAI({ apiKey })
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    })
    res.json({ url: response.data[0].url, revisedPrompt: response.data[0].revised_prompt })
  } catch (err) {
    console.error('DALL-E error:', err.message)
    res.status(500).json({ error: 'Image generation failed' })
  }
})

router.post('/api/ai/web-search', authenticate, async (req, res) => {
  try {
    const { query: q, maxResults } = req.body
    if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Missing query' })
    const results = await webSearch(q, Math.min(maxResults || 5, 10))
    res.json({ results, query: q })
  } catch (err) {
    console.error('Web search error:', err.message)
    res.status(500).json({ error: 'Search failed' })
  }
})

router.post('/api/ai/image-search', authenticate, async (req, res) => {
  try {
    const { query: q, maxResults } = req.body
    if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Missing query' })
    const results = await searchImages(q, Math.min(maxResults || 5, 10))
    res.json({ results, query: q })
  } catch (err) {
    console.error('Image search error:', err.message)
    res.status(500).json({ error: 'Search failed' })
  }
})

router.get('/api/ai/models', authenticate, async (req, res) => {
  try {
    const providers = getAvailableProviders()
    const models = providers.map(p => {
      const client = getAI(p)
      let status = 'offline'
      let modelName = p
      if (client) {
        status = 'online'
        const names = {
          anthropic: 'Claude Sonnet 5.5',
          'nvidia-ultra': 'Nemotron 3 Ultra', openai: 'GPT-4o Mini', gemini: 'Gemini Flash',
          deepseek: 'DeepSeek V4 Pro', llama: 'Llama 3.1 70B', phi4: 'Phi-4', groq: 'Groq Llama 3.3',
          hermes: 'Hermes 3 405B', minimax: 'MiniMax', 'nemotron-nano': 'Nemotron Nano 8B',
          'mistral-nemotron': 'Mistral Nemotron', 'mistral-large': 'Mistral Large',
          kimi: 'Kimi K2.6 (Supreme Judge)', 'gemma-4': 'Gemma 4', stepfun: 'StepFun',
          diffusiongemma: 'Diffusion Gemma', openrouter: 'OpenRouter GPT-4o',
          inkling: 'Inkling (Thinker)', poolside: 'Poolside Laguna (Coder)',
          opencode: process.env.OPENCODE_MODEL ? `OpenCode (${process.env.OPENCODE_MODEL})` : 'OpenCode Console',
          'glm-flash': 'GLM 5.3 Flash (NVIDIA)',
          'nvidia-backup': 'NVIDIA Backup',
          'nvidia-extra-1': 'NVIDIA Backup 2',
          'nvidia-extra-2': 'NVIDIA Backup 3',
          'nvidia-extra-3': 'NVIDIA Backup 4',
          'nvidia-extra-4': 'NVIDIA Backup 5',
          'nvidia-extra-5': 'NVIDIA Backup 6',
          'nvidia-extra-6': 'NVIDIA Backup 7',
          'nvidia-cosmos': 'NVIDIA Backup 8',
        }
        modelName = names[p] || p
      }
      return { id: p, name: modelName, status, role: p === 'nvidia-ultra' || p === 'deepseek' || p === 'kimi' ? 'Chief Justice' : 'Council Member' }
    })
    // Models that were verified with a real chat completion. They all run on
    // the master NVIDIA key, so they are only "online" when that key exists.
    const nvidiaOnline = Boolean(process.env.NVIDIA_API_KEY)
    const verified = VERIFIED_MODELS.map(m => ({
      id: m.id,
      name: m.name,
      status: nvidiaOnline ? 'online' : 'offline',
      role: m.role,
      provider: m.provider,
      model: m.model,
      verified: true,
    }))
    const allModels = [...verified, ...models.filter(m => !verified.some(v => v.id === m.id))]
    const capabilities = NVIDIA_CAPABILITIES.map(item => ({
      ...item,
      status: item.kind === 'embedding' && !process.env.NVIDIA_API_KEY ? 'offline' : item.status,
    }))
    res.json({ models: allModels, verifiedModels: verified, capabilities, defaultModel: DEFAULT_NVIDIA_MODEL, total: allModels.length, online: allModels.filter(m => m.status === 'online').length })
  } catch (err) {
    console.error('AI models error:', err.message)
    res.status(500).json({ error: 'Failed to fetch models' })
  }
})

router.post('/api/ai/fetch-page', authenticate, async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'Missing url' })
    if (typeof url !== 'string') return res.status(400).json({ error: 'Invalid url' })
    const urlError = await validateFetchUrl(url)
    if (urlError) return res.status(400).json({ error: urlError })
    const result = await fetchPageSafely(url)
    if (!result) return res.status(502).json({ error: 'Failed to fetch page' })
    res.json(result)
  } catch (err) {
    console.error('Fetch page error:', err.message)
    res.status(500).json({ error: 'Fetch failed' })
  }
})

router.post('/api/ai/chat', authenticate, async (req, res) => {
  try {
    const { message, history, conversationId, expert, gemId, images, jsonMode, useMemory, webSearch: doWebSearch } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    if (conversationId) {
      const { rows: owned } = await query(
        'SELECT id FROM public.chat_conversations WHERE id = $1 AND user_id = $2',
        [conversationId, req.user.id]
      )
      if (!owned.length) return res.status(404).json({ error: 'Conversation not found' })
    }

    let webContext = ''
    if (doWebSearch) {
      try {
        const webResults = await webSearch(message.trim(), 5)
        if (webResults.length > 0) {
          webContext = '\n\n--- WEB SEARCH RESULTS ---\n' + webResults.map((r, i) =>
            `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}`
          ).join('\n\n') + '\n--- END WEB SEARCH RESULTS ---\n\nUse the above web search results to provide accurate, up-to-date information. Cite sources using [1], [2] etc.'
        }
      } catch {}
    }

    let gemPrompt = null
    let memoryContext = null

    // Load gem if specified
    if (gemId) {
      try {
        const { getGems } = await import('../services/gemsService.js')
        const gems = await getGems(req.user.id, true)
        const gem = gems.find(item => item.id === gemId)
        if (gem) gemPrompt = `\n\n--- GEM INSTRUCTION: ${gem.name} ---\n${gem.system_prompt}\n--- END GEM INSTRUCTION ---`
      } catch {}
    }

    // Load memory context if requested
    if (useMemory) {
      try {
        const { getMemoryContext } = await import('../services/memoryService.js')
        memoryContext = await getMemoryContext(req.user.id)
      } catch {}
    }

    const useCouncil = req.body.council === true || req.body.council === 'true'

    const expertPrompts = {
      general: 'You are a helpful AI assistant for McPherson University students.',
      math: 'You are a patient mathematics tutor for University A-Level students. Explain concepts step-by-step with examples. Use LaTeX for all math ($...$ inline, $$...$$ display).',
      programming: 'You are an experienced programming mentor. Help students learn coding concepts, debug code, and understand algorithms.',
      medical: 'You are a medical sciences tutor. Explain anatomy, physiology, pharmacology and health concepts with clarity.',
      history: 'You are a history professor. Explain historical events, their contexts and significance in an engaging way.',
      writing: 'You are a writing coach. Help with essay structure, grammar, arguments, and creative writing techniques.',
      physics: 'You are a physics tutor for University A-Level. Explain physical laws and solve problems with real-world examples.',
      chemistry: 'You are a chemistry tutor. Explain reactions, equations, and laboratory techniques clearly.',
      literature: 'You are a literature expert. Analyze texts and explain literary devices.',
      career: 'You are a career advisor. Guide students on university choices and career paths.',
    }
    const systemPrompt = expertPrompts[expert] || expertPrompts.general

    const messages = [
      { role: 'system', content: systemPrompt + (webContext ? ' ' + webContext : '') },
      ...sanitizeHistory(history, 10),
    ]

    // Add image input if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const imageContent = images.map(url => ({ type: 'image_url', image_url: { url } }))
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: message.trim() }, ...imageContent],
      })
    } else {
      messages.push({ role: 'user', content: message.trim() })
    }

    const startTime = Date.now()
    
    // Determine if verification is needed
    const useCouncilMode = req.body.council === true || req.body.council === 'true'
    const verifyWithSearch = useCouncilMode || needsVerification(message.trim())

    const selectedModel = resolveModelId(req.body.modelId)
    const result = await aiChat(messages, {
      turboMode: !useCouncil,
      fastMode: !useCouncil,
      gemPrompt,
      memoryContext,
      jsonMode: jsonMode === true,
      verifyWithSearch,
      ...(selectedModel ? { model: selectedModel.model } : {}),
    })
    const elapsed = Date.now() - startTime

    if (!result) {
      return res.status(503).json({ error: 'AI providers are unavailable. Configure a provider on the backend and try again.' })
    }
    if (!result.final || !String(result.final).trim()) {
      return res.status(502).json({ error: 'The AI provider returned an empty response. Please try again.' })
    }

    // Save to database
    let convId = conversationId
    if (!convId) {
      convId = randomUUID()
      await query(
        `INSERT INTO public.chat_conversations (id, user_id, title, model, context, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5::jsonb,NOW(),NOW())`,
        [convId, req.user.id, message.trim().slice(0, 60) + '...', useCouncil ? 'council' : 'fast', JSON.stringify({})]
      )
    }
    // Save user message
    await query(
      `INSERT INTO public.chat_messages (id, conversation_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [randomUUID(), convId, 'user', message.trim()]
    )
    // Save assistant response
    const msgId = randomUUID()
    await query(
      `INSERT INTO public.chat_messages (id, conversation_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [msgId, convId, 'assistant', result.final]
    )
    await query(
      `UPDATE public.chat_conversations SET updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [convId, req.user.id]
    )
    // Auto-generate title on first exchange
    const { rows: msgCount } = await query(
      `SELECT COUNT(*) as c FROM public.chat_messages WHERE conversation_id = $1 AND role = 'user'`,
      [convId]
    )
    if (parseInt(msgCount[0].c) === 1) {
      generateChatTitle(convId, req.user.id, message.trim(), result.final || '')
    }

    res.json({
      response: result.final || 'I was unable to generate a complete response. Please try rephrasing your question.',
      council: result.council || [],
      thinking: result.finalThinking || '',
      followUps: result.followUps || [],
      elapsed,
      conversationId: convId,
      assistantMessageId: msgId,
    })
  } catch (err) {
    console.error('AI Council chat error:', err.message)
    res.status(500).json({ error: 'AI Council failed to respond' })
  }
})

router.post('/api/chats/cleanup', authenticate, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.body.days) || 50))
    await query(
      `DELETE FROM public.chat_messages
       WHERE conversation_id IN (
         SELECT id FROM public.chat_conversations
         WHERE user_id = $1 AND updated_at < NOW() - ($2 || ' days')::INTERVAL
       )`,
      [req.user.id, String(days)]
    )
    const { rowCount } = await query(
      `DELETE FROM public.chat_conversations
       WHERE user_id = $1 AND updated_at < NOW() - ($2 || ' days')::INTERVAL`,
      [req.user.id, String(days)]
    )
    res.json({ deleted: rowCount, days })
  } catch (err) {
    console.error('Chat cleanup error:', err.message)
    res.status(500).json({ error: 'Cleanup failed' })
  }
})

// Also auto-cleanup old chats on server start (global, all users)
async function cleanupOldChats() {
  try {
    const result = await query(
      `DELETE FROM public.chat_messages
       WHERE conversation_id IN (
         SELECT id FROM public.chat_conversations
         WHERE updated_at < NOW() - INTERVAL '50 days'
       )`
    )
    const convResult = await query(
      `DELETE FROM public.chat_conversations
       WHERE updated_at < NOW() - INTERVAL '50 days'`
    )
    console.log(`🧹 Cleaned up ${convResult.rowCount} old conversations (50d+)`)
  } catch (err) {
    console.error('Auto-cleanup error:', err.message)
  }
}
cleanupOldChats()
// Re-run cleanup every 24 hours
setInterval(cleanupOldChats, 86400000)

const PROV_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'openai/gpt-4o',
  'mistral-large': 'mistralai/mistral-large-3-675b-instruct-2512',
  deepseek: 'deepseek-ai/deepseek-v4-pro',
  llama: 'meta/llama-3.1-70b-instruct',
  phi4: 'microsoft/phi-4-mini-instruct',
  'nvidia-ultra': 'nvidia/nemotron-3-ultra-550b-a55b',
  minimax: 'minimaxai/minimax-m2.7',
  'nemotron-nano': 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
  'mistral-nemotron': 'mistralai/mistral-nemotron',
  'gemma-4': 'google/gemma-4-31b-it',
  stepfun: 'stepfun-ai/step-3.7-flash',
  diffusiongemma: 'google/diffusiongemma-26b-a4b-it',
  'z-ai': 'z-ai/glm-5.2',
  'deepseek-v4-flash': 'deepseek-ai/deepseek-v4-flash',
  'deepseek-v4-pro': 'deepseek-ai/deepseek-v4-pro',
  'nemotron-ultra': 'nvidia/nemotron-3-ultra-550b-a55b',
  'llama-3.3': 'meta/llama-3.3-70b-instruct',
  kimi: process.env.KIMI_MODEL || 'moonshotai/kimi-k3.1-pro',
  inkling: 'thinkingmachines/inkling',
  poolside: 'poolside/laguna-xs-2.1',
}

router.post('/api/ai/chat/stream', authenticate, async (req, res) => {
  try {
    const { message, history, conversationId: bodyConvId, expert, council, webSearch: doWebSearch } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    if (bodyConvId) {
      const { rows: owned } = await query(
        'SELECT id FROM public.chat_conversations WHERE id = $1 AND user_id = $2',
        [bodyConvId, req.user.id]
      )
      if (!owned.length) return res.status(404).json({ error: 'Conversation not found' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const startTime = Date.now()

    const sendEvent = (type, data) => {
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const expertPrompts = {
      general: 'You are a thoughtful, helpful university assistant. Answer naturally and directly, matching the requested level of detail.',
      math: 'You are a patient mathematics tutor. Explain the key idea clearly, show the necessary steps, and check the result. Format math with LaTeX.',
      programming: 'You are a practical programming mentor. Explain the code or concept clearly, give a focused example, and help the student learn.',
      medical: 'You are a clear medical sciences tutor. Explain mechanisms and terminology carefully, and distinguish general education from personal medical advice.',
      history: 'You are a history tutor. Explain events with relevant context, causes, and consequences without adding unnecessary detail.',
      writing: 'You are a supportive writing coach. Give specific, constructive suggestions and preserve the writer’s intent and voice.',
      physics: 'You are a patient physics tutor. Explain the physical idea, show useful equations, and work through the requested calculation. Format math with LaTeX.',
      chemistry: 'You are a clear chemistry tutor. Explain reactions and concepts with accurate notation and an example when useful.',
      literature: 'You are a thoughtful literature guide. Ground interpretations in the text and distinguish evidence from possible readings.',
      career: 'You are a practical career advisor. Give balanced guidance and concrete next steps, noting when advice depends on the student’s circumstances.',
    }
    const systemPrompt = (expertPrompts[expert] || expertPrompts.general) + ' Be conversational and clear. Use headings only when helpful, be concise for simple requests, and do not reveal private step-by-step reasoning.'

    let webContext = ''
    if (doWebSearch) {
      sendEvent('status', { provider: 'web', message: 'Searching the web...' })
      try {
        const webResults = await webSearch(message.trim(), 5)
        if (webResults.length > 0) {
          webContext = '\n\n--- WEB SEARCH RESULTS ---\n' + webResults.map((r, i) =>
            `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}`
          ).join('\n\n') + '\n--- END WEB SEARCH RESULTS ---\n\nUse the above web search results to provide accurate, up-to-date information in your response. Cite sources using [1], [2] etc. If the results don\'t contain relevant information, just answer based on your knowledge.'
        }
      } catch {}
    }

    const messages = [
      { role: 'system', content: systemPrompt + (webContext ? ' ' + webContext : '') + ' Use LaTeX for math when useful: $...$ inline, $$...$$ display.' },
      ...sanitizeHistory(history, 40),
      { role: 'user', content: message.trim() },
    ]

    const useCouncilMode = req.body.council === true

    if (useCouncilMode) {
      // ─── FULL COURT: distinct verified models, one presiding judge ───
      const courtController = new AbortController()
      const abortCourt = () => {
        if (!res.writableEnded) courtController.abort()
      }
      res.once('close', abortCourt)
      sendEvent('status', { provider: 'council', message: 'Convening the AI court…' })
      try {
        const court = await runCourtCouncil({ messages, sendEvent, signal: courtController.signal })
        if (!court || !court.answer) {
          sendEvent('error', { message: 'The AI court could not return a verdict. Please try again.' })
        } else {
          sendEvent('answer', { content: court.answer, done: true })
          try {
            await saveAndDone(
              sendEvent,
              bodyConvId,
              req.user.id,
              message,
              court.answer,
              court.rationale ? `Judge ${court.judge.name}: ${court.rationale}` : '',
              startTime,
              'court-council',
              [],
            )
          } catch {}
        }
      } finally {
        res.off('close', abortCourt)
      }
    } else if (getAI('anthropic') || getAI('nvidia') || getAI('openai') || getAI('glm-flash') || getAI('opencode')) {
      const selectedModel = resolveModelId(req.body.modelId)
      const streamProvider = getAI('anthropic') ? 'anthropic'
        : getAI('nvidia') ? 'nvidia'
          : getAI('openai') ? 'openai'
            : getAI('glm-flash') ? 'glm-flash' : 'opencode'
      const streamModel = selectedModel?.model
        || (streamProvider === 'nvidia' ? (process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL)
          : streamProvider === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-4o-mini')
            : streamProvider === 'glm-flash' ? (process.env.NVIDIA_GLM_FLASH_MODEL || 'z-ai/glm-5.3-flash')
              : streamProvider === 'anthropic' ? 'claude-sonnet-5-5'
                : (process.env.OPENCODE_MODEL || 'big-pickle'))
      const controller = new AbortController()
      let answer = ''
      let responseModel = streamModel
      const handleDelta = delta => {
        answer += delta
        if (!res.destroyed) sendEvent('delta', { content: delta })
      }
      const abortIfClientLeaves = () => {
        if (!res.writableEnded) controller.abort()
      }
      res.once('close', abortIfClientLeaves)
      sendEvent('status', {
        provider: streamProvider,
        message: streamProvider === 'anthropic' ? 'Claude is thinking...'
          : streamProvider === 'nvidia' ? `${selectedModel?.name || 'AI'} is thinking...`
            : streamProvider === 'openai' ? 'Backup AI is thinking...'
              : streamProvider === 'glm-flash' ? 'GLM Flash is thinking...' : 'OpenCode is thinking...',
      })
      try {
        const streamer = streamProvider === 'anthropic'
          ? streamAnthropicResponse
          : (msgs, opts) => streamOpenAICompatResponse(streamProvider, msgs, { ...opts, model: streamModel })
        answer = await streamer(messages, {
          signal: controller.signal,
          onText: handleDelta,
          // Reasoning models otherwise return empty content or stream private
          // thinking; disable it for clean, fast answers on NVIDIA models.
          ...(streamProvider === 'nvidia' ? { chat_template_kwargs: { enable_thinking: false } } : {}),
        }) || answer
      } catch (err) {
        if (!controller.signal.aborted) console.warn(`${streamProvider} stream failed; trying fallback:`, err?.message || err)
      } finally {
        res.off('close', abortIfClientLeaves)
      }

      if (controller.signal.aborted || res.destroyed) return
      if (!answer && !res.destroyed && streamProvider !== 'openai' && getAI('openai')) {
        // A reasoning model can return empty content. Use the OpenAI backup
        // before the general council so the user still gets a real answer.
        responseModel = 'openai'
        sendEvent('status', { provider: 'openai', message: 'Using backup AI provider...' })
        try {
          answer = await streamOpenAICompatResponse('openai', messages, {
            signal: controller.signal,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            onText: handleDelta,
          }) || answer
        } catch (err) {
          if (!controller.signal.aborted) console.warn('OpenAI backup stream failed:', err?.message || err)
        }
      }
      if (!answer) {
        responseModel = 'ai-assistant'
        sendEvent('status', { provider: 'fallback', message: 'Primary provider unavailable. Trying another AI provider...' })
        const fallback = await aiChat(messages, {
          turboMode: true,
          fastMode: true,
          verifyWithSearch: false,
          excludeProviders: [streamProvider],
          ...(selectedModel ? { model: selectedModel.model } : {}),
        })
        answer = fallback?.final || ''
      }
      if (answer) {
        sendEvent('answer', { content: answer, done: true })
        try {
          await saveAndDone(sendEvent, bodyConvId, req.user.id, message, answer, '', startTime, responseModel, [])
        } catch {}
      } else {
        sendEvent('error', { message: 'AI providers are unavailable. Configure a provider on the backend and try again.' })
      }
    } else {
      // ─── TURBO MODE: fast single response ───
      const timeout = doWebSearch ? 90000 : 60000
      sendEvent('status', { provider: 'turbo', message: 'Using an available AI provider...' })
      const verifyWithSearch = needsVerification(message.trim())
      const result = await Promise.race([
        aiChat(messages, { turboMode: true, fastMode: true, verifyWithSearch }),
        new Promise(resolve => setTimeout(() => resolve(null), timeout))
      ])
      if (result) {
        // Emit verification events if verification ran
        if (result.verificationData) {
          const claims = Object.keys(result.verificationData).length
          sendEvent('verifying', { count: claims, message: `Verifying ${claims} claims…` })
          // Small delay to show the verifying state
          await new Promise(r => setTimeout(r, 500))
          sendEvent('verified', { totalClaims: claims, message: 'Verification complete' })
        }
        sendEvent('thinking', { content: result.finalThinking || '', done: true })
        sendEvent('answer', { content: result.final, done: true })
        try {
          await saveAndDone(sendEvent, bodyConvId, req.user.id, message,
            result.final || 'I was unable to generate a complete response. Please try rephrasing your question.', result.finalThinking || '', startTime,
            doWebSearch ? 'web-search' : 'turbo', result.followUps)
        } catch {}
      } else {
        sendEvent('error', { message: 'The AI provider did not respond in time. Please try again.' })
      }
    }
    res.end()
  } catch (err) {
    console.error('AI chat stream error:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed' })
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'The AI service could not complete this request. Please try again.' })}\n\n`)
      res.end()
    }
  }
})

async function saveAndDone(sendEvent, bodyConvId, userId, message, finalAnswer, finalThinking, startTime, model, followUps) {
  try {
    let convId = bodyConvId
    if (!convId) {
      convId = randomUUID()
      await query(
        `INSERT INTO public.chat_conversations (id, user_id, title, model, context, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5::jsonb,NOW(),NOW())`,
        [convId, userId, message.trim().slice(0, 60) + '...', model, JSON.stringify({})]
      )
    } else {
      const { rows: owned } = await query(
        'SELECT id FROM public.chat_conversations WHERE id = $1 AND user_id = $2',
        [convId, userId]
      )
      if (!owned.length) throw new Error('Conversation not found')
    }
    await query(
      `INSERT INTO public.chat_messages (id, conversation_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [randomUUID(), convId, 'user', message.trim()]
    )
    const assistantMessageId = randomUUID()
    await query(
      `INSERT INTO public.chat_messages (id, conversation_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [assistantMessageId, convId, 'assistant', finalAnswer]
    )
    await query(
      `UPDATE public.chat_conversations SET updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [convId, userId]
    )
    const { rows: msgCount } = await query(
      `SELECT COUNT(*) as c FROM public.chat_messages WHERE conversation_id = $1 AND role = 'user'`,
      [convId]
    )
    if (parseInt(msgCount[0].c) === 1) {
      generateChatTitle(convId, userId, message.trim(), finalAnswer)
    }
    const doneData = { thinking: finalThinking, answer: finalAnswer, elapsed: Date.now() - startTime, conversationId: convId, model, assistantMessageId }
    if (followUps) doneData.followUps = followUps
    sendEvent('done', doneData)
  } catch (dbErr) {
    console.error('Failed to save chat:', dbErr.message)
    const doneData = { thinking: finalThinking, answer: finalAnswer, elapsed: Date.now() - startTime, model }
    if (followUps) doneData.followUps = followUps
    sendEvent('done', doneData)
  }
}

export default router
