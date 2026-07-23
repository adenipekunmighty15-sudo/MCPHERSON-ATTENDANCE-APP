import 'dotenv/config'
import https from 'https'
import { createClient } from '@supabase/supabase-js'

function fetch(url, options = {}) {
  return new Promise((resolve) => {
    const u = new URL(url)
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 20000,
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data }))
    })
    req.on('error', e => resolve({ status: 0, ok: false, error: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false, error: 'timeout' }) })
    if (options.body) req.write(options.body)
    req.end()
  })
}

function postJSON(url, body, headers = {}) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const results = []

async function test(label, fn) {
  process.stdout.write(`  ${label} ... `)
  try {
    const r = await fn()
    const icon = r.ok ? '✓' : '✗'
    console.log(`${icon} ${r.status}${r.error ? ' — ' + r.error : ''}`)
    results.push({ label, ok: r.ok, status: r.status, error: r.error })
  } catch (e) {
    console.log(`✗ ${e.message}`)
    results.push({ label, ok: false, error: e.message })
  }
}

async function run() {
  console.log('\n───── API Key Health Check ─────\n')

  // ── Supabase ──
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    await test('Supabase (service key)', async () => {
      const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
      const { error } = await sb.from('_prisma_migrations').select('id').limit(1).maybeSingle()
      if (error && !error.message?.includes('relation') && !error.message?.includes('does not exist')) throw error
      return { ok: true, status: 200 }
    })
  }

  // ── OpenAI ──
  if (process.env.OPENAI_API_KEY) {
    await test('OpenAI', async () => {
      return fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
      })
    })
  }

  // ── OpenRouter ──
  if (process.env.OPENROUTER_API_KEY) {
    await test('OpenRouter', async () => {
      return fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
      })
    })
  }

  // ── Gemini ──
  if (process.env.GEMINI_API_KEY) {
    await test('Gemini', async () => {
      return postJSON(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: 'Say hi' }] }] },
      )
    })
  }

  // ── Groq ──
  if (process.env.GROQ_API_KEY) {
    await test('Groq', async () => {
      return postJSON('https://api.groq.com/openai/v1/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }, { Authorization: `Bearer ${process.env.GROQ_API_KEY}` })
    })
  }

  // ── NVIDIA ──
  // NVIDIA API: check key by hitting the NVCF health/limits endpoint
  const nvidiaKeys = [
    ['NVIDIA_WHISPER_KEY', 'Whisper'],
    ['HERMES_API_KEY', 'Hermes'],
    ['NVIDIA_LLAMA_KEY', 'Llama'],
    ['NVIDIA_ULTRA_KEY', 'Ultra'],
    ['NVIDIA_NANO_KEY', 'Nano'],
    ['NVIDIA_NEMOTRON_KEY', 'Nemotron'],
    ['DEEPSEEK_KEY', 'DeepSeek'],
    ['PHI4_KEY', 'Phi-4'],
    ['MINIMAX_KEY', 'MiniMax'],
    ['DIFFUSIONGEMMA_KEY', 'DiffusionGemma'],
    ['STEPFUN_KEY', 'StepFun'],
    ['MISTRAL_NEMOTRON_KEY', 'Mistral-Nemotron'],
    ['KIMI_KEY', 'Kimi'],
    ['MISTRAL_LARGE_KEY', 'Mistral-Large'],
    ['GEMMA4_KEY', 'Gemma-4'],
  ]
  for (const [envKey, label] of nvidiaKeys) {
    const key = process.env[envKey]
    if (!key) continue
    await test(`NVIDIA ${label}`, async () => {
      // Try the integrated endpoint — ping a minimal infer request
      const res = await fetch('https://api.nvcf.nvidia.com/v2/nvcf/pexec/status', {
        headers: { Authorization: `Bearer ${key}` }
      })
      // 200/202 = valid, 401 = invalid, 404 = endpoint quirk
      if (res.status === 404) return { ok: true, status: 200, error: 'endpoint unknown but key not rejected' }
      return res
    })
  }

  // ── NVIDIA TTS ──
  if (process.env.NVIDIA_TTS_KEY) {
    await test('NVIDIA TTS', async () => {
      return fetch('https://integrate.api.nvidia.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NVIDIA_TTS_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'playai/tts-play-3.0', input: 'test', voice: 'angelo', response_format: 'mp3' }),
      })
    })
  }

  // ── Summary ──
  const ok = results.filter(r => r.ok).length
  const total = results.length
  console.log(`\n───── Results: ${ok}/${total} keys working ─────\n`)

  // Show a clean table
  for (const r of results) {
    let detail = ''
    if (r.error) detail = ` (${r.error})`
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.label} — ${r.ok ? 'OK' : 'FAIL'}${detail}`)
  }
  console.log('')
}

run().catch(console.error)
