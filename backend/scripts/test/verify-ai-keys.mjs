// Verifies configured AI keys with the smallest possible request.
// Prints provider name + status only. Never prints key material.
import 'dotenv/config'

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1'

// env key -> { label, baseURL, model (or modelEnv), mode }
const chatProviders = {
  GROQ_API_KEY: { label: 'Groq', baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  NVIDIA_LLAMA_KEY: { label: 'NVIDIA Llama', baseURL: NVIDIA_BASE, model: 'meta/llama-3.1-70b-instruct' },
  PHI4_KEY: { label: 'Phi-4', baseURL: NVIDIA_BASE, modelEnv: 'PHI4_MODEL', model: 'microsoft/phi-4-mini-instruct' },
  DEEPSEEK_KEY: { label: 'DeepSeek', baseURL: NVIDIA_BASE, modelEnv: 'DEEPSEEK_MODEL', model: 'deepseek-ai/deepseek-v4-pro' },
  MINIMAX_KEY: { label: 'MiniMax', baseURL: NVIDIA_BASE, model: 'minimaxai/minimax-m2.7' },
  DIFFUSIONGEMMA_KEY: { label: 'DiffusionGemma', baseURL: NVIDIA_BASE, model: 'google/diffusiongemma-26b-a4b-it' },
  STEPFUN_KEY: { label: 'StepFun', baseURL: NVIDIA_BASE, model: 'stepfun-ai/step-3.7-flash' },
  NVIDIA_NANO_KEY: { label: 'Nemotron Nano VL', baseURL: NVIDIA_BASE, model: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1' },
  MISTRAL_NEMOTRON_KEY: { label: 'Mistral Nemotron', baseURL: NVIDIA_BASE, model: 'mistralai/mistral-nemotron' },
  MISTRAL_LARGE_KEY: { label: 'Mistral Large', baseURL: NVIDIA_BASE, model: 'mistralai/mistral-large-3-675b-instruct-2512' },
  GEMMA4_KEY: { label: 'Gemma 4', baseURL: NVIDIA_BASE, model: 'google/gemma-4-31b-it' },
  ZAI_KEY: { label: 'Z-AI GLM', baseURL: NVIDIA_BASE, modelEnv: 'ZAI_MODEL', model: 'z-ai/glm-5.2' },
  DEEPSEEK_V4_FLASH_KEY: { label: 'DeepSeek V4 Flash', baseURL: NVIDIA_BASE, modelEnv: 'DEEPSEEK_V4_FLASH_MODEL', model: 'deepseek-ai/deepseek-v4-flash' },
  DEEPSEEK_V4_PRO_KEY: { label: 'DeepSeek V4 Pro', baseURL: NVIDIA_BASE, model: 'deepseek-ai/deepseek-v4-pro' },
  NVIDIA_ULTRA_KEY: { label: 'Nemotron Ultra', baseURL: NVIDIA_BASE, modelEnv: 'NVIDIA_ULTRA_MODEL', model: 'nvidia/nemotron-3-ultra-550b-a55b' },
  NVIDIA_ULTRA_KEY_2: { label: 'Nemotron Ultra (alt)', baseURL: NVIDIA_BASE, modelEnv: 'NVIDIA_ULTRA_MODEL', model: 'nvidia/nemotron-3-ultra-550b-a55b' },
  GPT_OSS_20B_KEY: { label: 'GPT-OSS 20B', baseURL: NVIDIA_BASE, modelEnv: 'GPT_OSS_20B_MODEL', model: 'openai/gpt-oss-20b' },
  GPT_OSS_120B_KEY: { label: 'GPT-OSS 120B', baseURL: NVIDIA_BASE, modelEnv: 'GPT_OSS_120B_MODEL', model: 'openai/gpt-oss-120b' },
  NVIDIA_SUPER_120B_KEY: { label: 'Nemotron Super 120B', baseURL: NVIDIA_BASE, modelEnv: 'NVIDIA_SUPER_120B_MODEL', model: 'nvidia/nemotron-3-super-120b-a12b' },
  LLAMA33_KEY: { label: 'Llama 3.3', baseURL: NVIDIA_BASE, model: 'meta/llama-3.3-70b-instruct' },
  NVIDIA_SUPER_49B_V15_KEY: { label: 'Nemotron Super 49B v1.5', baseURL: NVIDIA_BASE, model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5' },
  NVIDIA_SUPER_49B_V1_KEY: { label: 'Nemotron Super 49B v1', baseURL: NVIDIA_BASE, model: 'nvidia/llama-3.3-nemotron-super-49b-v1' },
  NVIDIA_NANO_KEY_2: { label: 'Nemotron Nano 8B', baseURL: NVIDIA_BASE, model: 'nvidia/llama-3.1-nemotron-nano-8b-v1' },
  MISTRAL_NEMOTRON_KEY_2: { label: 'Mistral Nemotron (alt)', baseURL: NVIDIA_BASE, model: 'mistralai/mistral-nemotron' },
  KIMI_KEY: { label: 'Kimi', baseURL: NVIDIA_BASE, modelEnv: 'KIMI_MODEL', model: 'moonshotai/kimi-k3.1-pro' },
  INKLING_KEY: { label: 'Inkling', baseURL: NVIDIA_BASE, model: 'thinkingmachines/inkling' },
  POOLSIDE_KEY: { label: 'Poolside', baseURL: NVIDIA_BASE, model: 'poolside/laguna-xs-2.1' },
}

// Keys without a known chat model are checked with a read-only models/health call.
const listProviders = {
  OPENAI_API_KEY: { label: 'OpenAI', url: 'https://api.openai.com/v1/models' },
  OPENROUTER_API_KEY: { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/auth/key' },
  HERMES_API_KEY: { label: 'Hermes (NVIDIA)', url: `${NVIDIA_BASE}/models` },
  NVIDIA_WHISPER_KEY: { label: 'NVIDIA Whisper', url: `${NVIDIA_BASE}/models` },
}

const results = []

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) })
  return response.status
}

async function verifyChat(envKey, config) {
  const key = process.env[envKey]
  if (!key) return
  const model = config.modelEnv && process.env[config.modelEnv]
    ? process.env[config.modelEnv]
    : config.model
  try {
    const status = await request(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        temperature: 0,
      }),
    })
    results.push({ envKey, label: config.label, status, ok: status >= 200 && status < 300 })
  } catch (err) {
    results.push({ envKey, label: config.label, status: 0, ok: false, error: err.name || 'request-failed' })
  }
}

async function verifyList(envKey, config) {
  const key = process.env[envKey]
  if (!key) return
  try {
    const status = await request(config.url, { headers: { Authorization: `Bearer ${key}` } })
    results.push({ envKey, label: config.label, status, ok: status >= 200 && status < 300 })
  } catch (err) {
    results.push({ envKey, label: config.label, status: 0, ok: false, error: err.name || 'request-failed' })
  }
}

async function verifyGemini() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return
  try {
    const status = await request(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 1 } }),
      }
    )
    results.push({ envKey: 'GEMINI_API_KEY', label: 'Gemini', status, ok: status >= 200 && status < 300 })
  } catch (err) {
    results.push({ envKey: 'GEMINI_API_KEY', label: 'Gemini', status: 0, ok: false, error: err.name || 'request-failed' })
  }
}

const configured = [...Object.keys(chatProviders), ...Object.keys(listProviders), 'GEMINI_API_KEY']
  .filter(key => Boolean(process.env[key]))

if (configured.length === 0) {
  console.log('No AI keys configured in backend/.env — fill in the keys you want tested, then rerun.')
  process.exit(0)
}

console.log(`Testing ${configured.length} configured AI key(s)...\n`)
await verifyGemini()
await Promise.all([
  ...Object.entries(chatProviders).map(([key, config]) => verifyChat(key, config)),
  ...Object.entries(listProviders).map(([key, config]) => verifyList(key, config)),
])

for (const result of results) {
  const state = result.ok ? 'WORKS' : result.status ? `FAILED (HTTP ${result.status})` : `ERROR (${result.error})`
  console.log(`  ${result.ok ? 'OK ' : '-- '} ${result.label.padEnd(24)} ${state}`)
}

const working = results.filter(r => r.ok)
console.log(`\n${working.length}/${results.length} keys working.`)
if (working.length) {
  console.log('Working env keys: ' + working.map(r => r.envKey).join(', '))
}

process.exitCode = working.length === results.length ? 0 : 1
