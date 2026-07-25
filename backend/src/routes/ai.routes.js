import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { webSearch, fetchPage, searchImages } from '../../lib/webSearch.js'
import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { getAvailableProviders, getAI } from '../config/ai.js'
import { aiChat, generateFollowUps, generateChatTitle } from '../services/aiService.js'

const router = Router()

function needsVerification(query) {
  const triggers = /\b(latest|current|recent|202\d|best|top|how many|what is|who is|compare|vs\.?|statistics|data|report|price|stock|weather|score|result)\b/i
  return triggers.test(query) || query.length > 150
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
          'nvidia-ultra': 'Nemotron 3 Ultra', openai: 'GPT-4o Mini', gemini: 'Gemini Flash',
          deepseek: 'DeepSeek V4 Pro', llama: 'Llama 3.1 70B', phi4: 'Phi-4', groq: 'Groq Llama 3.3',
          hermes: 'Hermes 3 405B', minimax: 'MiniMax', 'nemotron-nano': 'Nemotron Nano 8B',
          'mistral-nemotron': 'Mistral Nemotron', 'mistral-large': 'Mistral Large',
          kimi: 'Kimi K2.6 (Supreme Judge)', 'gemma-4': 'Gemma 4', stepfun: 'StepFun',
          diffusiongemma: 'Diffusion Gemma', openrouter: 'OpenRouter GPT-4o',
          inkling: 'Inkling (Thinker)', poolside: 'Poolside Laguna (Coder)',
        }
        modelName = names[p] || p
      }
      return { id: p, name: modelName, status, role: p === 'nvidia-ultra' || p === 'deepseek' || p === 'kimi' ? 'Chief Justice' : 'Council Member' }
    })
    res.json({ models, total: models.length, online: models.filter(m => m.status === 'online').length })
  } catch (err) {
    console.error('AI models error:', err.message)
    res.status(500).json({ error: 'Failed to fetch models' })
  }
})

router.post('/api/ai/fetch-page', authenticate, async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'Missing url' })
    const result = await fetchPage(url)
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
        const { default: { getGemById } } = await import('../services/gemsService.js')
        const gem = await getGemById(gemId)
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
      ...(history || []).slice(-10),
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

    const result = await aiChat(messages, {
      turboMode: !useCouncil,
      fastMode: !useCouncil,
      gemPrompt,
      memoryContext,
      jsonMode: jsonMode === true,
      verifyWithSearch,
    })
    const elapsed = Date.now() - startTime

    if (!result) {
      return res.json({
        response: 'The AI Council is currently offline. Please try again later.',
        council: [],
        thinking: '',
        followUps: [],
        elapsed,
      })
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
      [msgId, convId, 'assistant', result.final || 'I was unable to generate a complete response. Please try rephrasing your question.']
    )
    await query(
      `UPDATE public.chat_conversations SET updated_at = NOW() WHERE id = $1`,
      [convId]
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
  kimi: 'moonshotai/kimi-k2.6',
  inkling: 'thinkingmachines/inkling',
  poolside: 'poolside/laguna-xs-2.1',
}

router.post('/api/ai/chat/stream', authenticate, async (req, res) => {
  try {
    const { message, history, conversationId: bodyConvId, expert, council, webSearch: doWebSearch } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
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

    if (process.env.AI_SAFE_MODE === 'true') {
      sendEvent('thinking', { content: 'Simulating response...', done: true })
      await new Promise(r => setTimeout(r, 500))
      sendEvent('answer', { content: 'This is a simulated response from the McPherson AI Council. [AI_SAFE_MODE is enabled]', done: true })
      sendEvent('done', { thinking: 'Bypassed — AI_SAFE_MODE enabled', answer: 'This is a simulated response from the McPherson AI Council. [AI_SAFE_MODE is enabled]', elapsed: 500, conversationId: null, followUps: ['How do I disable AI_SAFE_MODE?', 'What can the AI Council actually do?', 'Tell me about McPherson University'] })
      res.end()
      return
    }

    const expertPrompts = {
      general: 'You are a distinguished university professor at McPherson University. Respond like a scholar — thorough, detailed, well-structured with academic depth, real-world examples, and contextual insights.',
      math: 'You are a distinguished mathematics professor. Explain concepts with scholarly depth — step-by-step derivations, real-world applications, historical context, and multiple example problems. Use LaTeX for all math ($...$ inline, $$...$$ display).',
      programming: 'You are a senior computer science professor. Teach coding concepts with academic rigor — theory, best practices, code examples, design patterns, and real-world architecture considerations.',
      medical: 'You are a professor of medical sciences. Explain anatomy, physiology, pharmacology and health concepts with clinical depth, referencing mechanisms, research, and practical applications.',
      history: 'You are a professor of history. Provide rich, narrative-driven explanations with historical context, cause-effect analysis, scholarly perspectives, and significance of events.',
      writing: 'You are a professor of English and composition. Guide with scholarly depth — essay structure, rhetorical devices, argumentation theory, stylistic analysis, and exemplary models.',
      physics: 'You are a physics professor. Explain physical laws with mathematical rigor — derivations, real-world applications, experimental evidence, and problem-solving strategies. Use LaTeX for all math ($...$ inline, $$...$$ display).',
      chemistry: 'You are a chemistry professor. Explain reactions and theories with academic depth — mechanisms, kinetics, thermodynamics, laboratory techniques, and industrial applications.',
      literature: 'You are a professor of literature. Analyze texts with scholarly depth — themes, symbolism, historical context, critical theory perspectives, and close reading techniques.',
      career: 'You are a senior career counselor and faculty advisor. Provide comprehensive guidance on university choices, career paths, professional development, industry trends, and actionable strategies.',
    }
    const systemPrompt = expertPrompts[expert] || expertPrompts.general

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
      { role: 'system', content: systemPrompt + (webContext ? ' ' + webContext : '') + ' Use LaTeX for math: $...$ inline, $$...$$ display. Structure your response with <thinking>Your thorough step-by-step reasoning</thinking> before your comprehensive, scholarly answer.' },
      ...(history || []).slice(-6),
      { role: 'user', content: message.trim() },
    ]

    const useCouncilMode = req.body.council === true

    if (useCouncilMode) {
      // ─── COUNCIL MODE (disabled by default) ───
      sendEvent('status', { provider: 'council', message: 'Council deliberating...' })
      const result = await aiChat(messages, { turboMode: false, fastMode: false })
      if (result) {
        sendEvent('thinking', { content: result.finalThinking || 'Council deliberation complete', done: true })
        sendEvent('answer', { content: result.final, done: true })
        try {
          await saveAndDone(sendEvent, bodyConvId, req.user.id, message,
            result.final || 'I was unable to generate a complete response.', result.finalThinking || '', startTime, 'council', result.followUps)
        } catch {}
      }
    } else {
      // ─── TURBO MODE: fast single response ───
      const timeout = doWebSearch ? 15000 : 10000
      sendEvent('status', { provider: 'turbo', message: 'Thinking...' })
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
        const fallback = `I was unable to generate a response in time. Please try rephrasing your question.`
        sendEvent('answer', { content: fallback, done: true })
        try {
          await saveAndDone(sendEvent, bodyConvId, req.user.id, message, fallback, 'Timed out', startTime, 'turbo', [])
        } catch {}
      }
    }
    res.end()
  } catch (err) {
    console.error('AI chat stream error:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed' })
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`)
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
    }
    await query(
      `INSERT INTO public.chat_messages (id, conversation_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [randomUUID(), convId, 'user', message.trim()]
    )
    await query(
      `INSERT INTO public.chat_messages (id, conversation_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [randomUUID(), convId, 'assistant', finalAnswer]
    )
    await query(`UPDATE public.chat_conversations SET updated_at = NOW() WHERE id = $1`, [convId])
    const { rows: msgCount } = await query(
      `SELECT COUNT(*) as c FROM public.chat_messages WHERE conversation_id = $1 AND role = 'user'`,
      [convId]
    )
    if (parseInt(msgCount[0].c) === 1) {
      generateChatTitle(convId, userId, message.trim(), finalAnswer)
    }
    const doneData = { thinking: finalThinking, answer: finalAnswer, elapsed: Date.now() - startTime, conversationId: convId }
    if (followUps) doneData.followUps = followUps
    sendEvent('done', doneData)
  } catch (dbErr) {
    console.error('Failed to save chat:', dbErr.message)
    const doneData = { thinking: finalThinking, answer: finalAnswer, elapsed: Date.now() - startTime }
    if (followUps) doneData.followUps = followUps
    sendEvent('done', doneData)
  }
}

export default router
