import { getAiResponse, getAvailableProviders } from '../config/ai.js'

const FAST_PROVIDERS = ['groq', 'openrouter', 'mistral-large', 'deepseek', 'gemini']

const previewCache = new Map()

const CACHE_TTL = 30_000

function getFastProvider() {
  const avail = getAvailableProviders()
  return FAST_PROVIDERS.find(p => avail.includes(p)) || avail[0] || null
}

export async function generatePreview(text, userId) {
  const clean = text.trim()
  if (!clean || clean.length < 3) {
    return { intent: '', preview: '', suggestions: [], followUps: [], suggestedCompletion: '' }
  }

  const provider = getFastProvider()
  if (!provider) return { intent: '', preview: '', suggestions: [], followUps: [], suggestedCompletion: '' }

  const prompt = [
    {
      role: 'system',
      content: `You are a preview analyzer for an academic AI assistant. Analyze the user's partial input and return valid JSON ONLY.
{
  "intent": "1-2 word topic or subject of their question",
  "preview": "a 1-sentence summary of what they're likely asking",
  "suggestedCompletion": "a possible full question completion in 5-10 words",
  "suggestions": ["3 short auto-complete options (2-5 words each)"],
  "followUps": ["3 likely follow-up questions (5-10 words each) they might ask next"]
}`
    },
    { role: 'user', content: `Partial input: "${clean}"\n\nAnalyze what they are typing. Return only valid JSON.` }
  ]

  try {
    const resp = await Promise.race([
      getAiResponse(provider, prompt, { temperature: 0.3, json: true }),
      new Promise(resolve => setTimeout(() => resolve(null), 5000))
    ])
    if (!resp) return null

    let parsed
    try { parsed = typeof resp === 'string' ? JSON.parse(resp) : resp } catch { return null }
    if (!parsed || !parsed.intent) return null

    const result = {
      intent: parsed.intent || '',
      preview: parsed.preview || '',
      suggestedCompletion: parsed.suggestedCompletion || '',
      suggestions: (parsed.suggestions || []).slice(0, 3),
      followUps: (parsed.followUps || []).slice(0, 3),
    }

    previewCache.set(userId, { text: clean, result, expiresAt: Date.now() + CACHE_TTL })
    return result
  } catch {
    return null
  }
}

export function getCachedPreview(userId, text) {
  const cached = previewCache.get(userId)
  if (!cached || cached.expiresAt < Date.now()) {
    previewCache.delete(userId)
    return null
  }
  const similarity = text.toLowerCase().includes(cached.text.toLowerCase()) ||
    cached.text.toLowerCase().includes(text.toLowerCase())
  if (!similarity) return null

  previewCache.delete(userId)
  return cached.result
}

export function clearPreviewCache(userId) {
  previewCache.delete(userId)
}
