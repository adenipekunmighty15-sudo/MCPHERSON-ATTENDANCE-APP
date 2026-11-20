import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Models confirmed to return real completions (HTTP 200 with answer text) in a
 * live probe against the configured backend keys on 2026-11-20. All of these
 * are reachable with the single master NVIDIA key. They are exposed through
 * GET /api/ai/models and can be selected with the `modelId` request field.
 */
const VERIFIED_MODELS = [
  { id: 'mistral-large-4-1t', provider: 'nvidia', model: 'mistralai/mistral-large-4-1t-a52b', name: 'Mistral Large 4 (1T)', role: 'Chief Justice' },
  { id: 'nemotron-3-ultra', provider: 'nvidia', model: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra (550B)', role: 'Chief Justice' },
  { id: 'nemotron-3.5-super-vl', provider: 'nvidia', model: 'nvidia/nemotron-3.5-super-vl-120b-a12b', name: 'Nemotron 3.5 Super VL (120B)', role: 'Council Member' },
  { id: 'nemotron-3.5-bolt', provider: 'nvidia', model: 'nvidia/nemotron-3.5-bolt-e4b', name: 'Nemotron 3.5 Bolt', role: 'Council Member' },
  { id: 'step-5-preview', provider: 'nvidia', model: 'stepfun-ai/step-5-preview', name: 'Step 5 Preview', role: 'Council Member' },
  { id: 'poolside-laguna', provider: 'nvidia', model: 'poolside/laguna-xs-2.1', name: 'Poolside Laguna', role: 'Council Member' },
  { id: 'kimi-k3.1-pro', provider: 'nvidia', model: 'moonshotai/kimi-k3.1-pro', name: 'Kimi K3.1 Pro', role: 'Chief Justice' },
  {
    id: 'nemotron-3-nano-omni',
    provider: 'nvidia',
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron 3 Nano Omni (30B)',
    role: 'Council Member',
    // Verified with a real image + reasoning payload from the NVIDIA example.
    options: { max_tokens: 65536, reasoning_budget: 16384, temperature: 0.6, top_p: 0.95 },
  },
  { id: 'nemotron-3.5-lightning', provider: 'nvidia', model: 'nvidia/nemotron-3.5-lightning-30b-a3b', name: 'Nemotron 3.5 Lightning (30B)', role: 'Council Member' },
  { id: 'muse-glimmer', provider: 'nvidia', model: 'meta/muse-glimmer-30b', name: 'Muse Glimmer (30B)', role: 'Council Member' },
]

const DEFAULT_NVIDIA_MODEL = 'mistralai/mistral-large-4-1t-a52b'

// Embedding model that matches the existing vector(2048) column. Verified with
// the master NVIDIA key (HTTP 200, 2048 dimensions). nvidia/nemotron-3.5-embed-1b
// is preferred by name but currently times out, and the 8b variant returns 4096
// dimensions, so neither is safe to persist in the current schema.
const NVIDIA_EMBED_MODEL = 'nvidia/nemotron-3-embed-1b'

/**
 * Requested NVIDIA capabilities that are not exposed as chat-completion model
 * ids. Status comes from live probes with the master key; unavailable entries
 * are reported honestly instead of pretending the endpoint works.
 */
const NVIDIA_CAPABILITIES = [
  { id: 'nemotron-embed-1b', name: 'Nemotron 3 Embed 1B', kind: 'embedding', model: 'nvidia/nemotron-3-embed-1b', status: 'online', note: '2048 dimensions; used for semantic search.' },
  { id: 'nemotron-3.5-embed-1b', name: 'Nemotron 3.5 Embed 1B', kind: 'embedding', model: 'nvidia/nemotron-3.5-embed-1b', status: 'degraded', note: 'The upstream service timed out during verification.' },
  { id: 'nemotron-3.5-embed-8b', name: 'Nemotron 3.5 Embed 8B', kind: 'embedding', model: 'nvidia/nemotron-3.5-embed-8b', status: 'incompatible', note: 'Returns 4096 dimensions; current DB column is vector(2048).' },
  { id: 'nemotron-rerank', name: 'NeMo Retriever Reranking NIM', kind: 'rerank', model: 'nvidia/nemotron-rerank', status: 'unavailable', note: 'No reachable endpoint on the configured NVIDIA API plan.' },
  { id: 'magpie-tts-multilingual', name: 'Magpie Multilingual TTS', kind: 'tts', model: 'nvidia/magpie-tts-multilingual', status: 'unavailable', note: 'Master-key audio/speech requests returned HTTP 404; voices Sofia, Aria, John, Jason and Leo are configured but cannot be used until a working TTS endpoint is available.' },
  { id: 'tts_en_fastpitch', name: 'FastPitch TTS', kind: 'tts', model: 'nvidia/tts_en_fastpitch', status: 'unavailable', note: 'No reachable audio/speech model on the configured NVIDIA API plan.' },
  { id: 'tts_hifigan', name: 'HiFi-GAN Vocoder', kind: 'tts', model: 'nvidia/tts_hifigan', status: 'unavailable', note: 'No reachable audio/speech model on the configured NVIDIA API plan.' },
  { id: 'cosmos3-nano', name: 'Cosmos 3 Nano', kind: 'video', model: 'nvidia/cosmos3-nano', status: 'unavailable', note: 'The dedicated Cosmos endpoint returned HTTP 404 for both the master and Cosmos keys.' },
  { id: 'nemotron-3-super', name: 'Nemotron 3 Super (49B)', kind: 'chat', model: 'nvidia/llama-3.3-nemotron-super-49b', status: 'unavailable', note: 'NVIDIA returns HTTP 410 for this retired model id. The working Nemotron Ultra model is available in the chat selector.' },
  { id: 'nemotron-nano-2', name: 'Nemotron Nano 2 (30B)', kind: 'chat', model: 'nvidia/nemotron-3-nano-30b-a3b', status: 'unavailable', note: 'NVIDIA returns HTTP 410 for this retired model id. Nemotron 3.5 Lightning is the working low-latency replacement.' },
]

let _anthropic, _openai, _nvidia, _nvidiaUltra, _nvidiaLlama, _deepseek, _phi4, _openrouter, _groq, _minimax, _nemotronNano, _mistralNemotron, _mistralLarge, _gemma4, _stepfun, _diffusiongemma, _zai, _deepseekV4Flash, _deepseekV4Pro, _nemotronUltra2, _gptOss20b, _gptOss120b, _nemotronSuper120b, _llama33, _nemotronSuper49bV15, _nemotronSuper49bV1, _nemotronNano8b, _mistralNemotron2, _kimi, _inkling, _poolside, _opencode, _glmFlash, _nvidiaBackup, _nvidiaExtra1, _nvidiaExtra2, _nvidiaExtra3, _nvidiaExtra4, _nvidiaExtra5, _nvidiaExtra6, _nvidiaCosmos

function modelOptionsFor(model) {
  if (!model) return {}
  return VERIFIED_MODELS.find(item => item.model === model)?.options || {}
}

function nvidiaRequestOptions(options = {}, model) {
  const preset = modelOptionsFor(model)
  const extra = {}
  if (options.top_p !== undefined || preset.top_p !== undefined) extra.top_p = options.top_p ?? preset.top_p
  if (options.reasoning_budget !== undefined || preset.reasoning_budget !== undefined) {
    extra.reasoning_budget = options.reasoning_budget ?? preset.reasoning_budget
  }
  return {
    temperature: options.temperature ?? preset.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? preset.max_tokens ?? 4096,
    ...extra,
  }
}

function getAI(provider) {
  try {
    if (provider === 'anthropic' && !_anthropic && process.env.ANTHROPIC_API_KEY) {
      _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
    if (provider === 'openai' && !_openai && process.env.OPENAI_API_KEY) {
      // Backend-only backup for empty / reasoning-only NVIDIA outputs.
      _openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
        timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000),
        maxRetries: 1,
      })
    }
    if (provider === 'nvidia' && !_nvidia && process.env.NVIDIA_API_KEY) {
      _nvidia = new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nvidia-ultra' && !_nvidiaUltra && process.env.NVIDIA_ULTRA_KEY) {
      _nvidiaUltra = new OpenAI({ apiKey: process.env.NVIDIA_ULTRA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'llama' && !_nvidiaLlama && process.env.NVIDIA_LLAMA_KEY) {
      _nvidiaLlama = new OpenAI({ apiKey: process.env.NVIDIA_LLAMA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'deepseek' && !_deepseek && process.env.DEEPSEEK_KEY) {
      _deepseek = new OpenAI({ apiKey: process.env.DEEPSEEK_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'phi4' && !_phi4 && process.env.PHI4_KEY) {
      _phi4 = new OpenAI({ apiKey: process.env.PHI4_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'openrouter' && !_openrouter && process.env.OPENROUTER_API_KEY) {
      _openrouter = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })
    }
    if (provider === 'groq' && !_groq && process.env.GROQ_API_KEY) {
      _groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
    }
    if (provider === 'minimax' && !_minimax && process.env.MINIMAX_KEY) {
      _minimax = new OpenAI({ apiKey: process.env.MINIMAX_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nemotron-nano' && !_nemotronNano && (process.env.NVIDIA_NANO_KEY)) {
      _nemotronNano = new OpenAI({ apiKey: process.env.NVIDIA_NANO_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'mistral-nemotron' && !_mistralNemotron && process.env.MISTRAL_NEMOTRON_KEY) {
      _mistralNemotron = new OpenAI({ apiKey: process.env.MISTRAL_NEMOTRON_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'mistral-large' && !_mistralLarge && process.env.MISTRAL_LARGE_KEY) {
      _mistralLarge = new OpenAI({ apiKey: process.env.MISTRAL_LARGE_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'gemma-4' && !_gemma4 && process.env.GEMMA4_KEY) {
      _gemma4 = new OpenAI({ apiKey: process.env.GEMMA4_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'stepfun' && !_stepfun && process.env.STEPFUN_KEY) {
      _stepfun = new OpenAI({ apiKey: process.env.STEPFUN_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'diffusiongemma' && !_diffusiongemma && process.env.DIFFUSIONGEMMA_KEY) {
      _diffusiongemma = new OpenAI({ apiKey: process.env.DIFFUSIONGEMMA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'z-ai' && !_zai && process.env.ZAI_KEY) {
      _zai = new OpenAI({ apiKey: process.env.ZAI_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'deepseek-v4-flash' && !_deepseekV4Flash && process.env.DEEPSEEK_V4_FLASH_KEY) {
      _deepseekV4Flash = new OpenAI({ apiKey: process.env.DEEPSEEK_V4_FLASH_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'deepseek-v4-pro' && !_deepseekV4Pro && process.env.DEEPSEEK_V4_PRO_KEY) {
      _deepseekV4Pro = new OpenAI({ apiKey: process.env.DEEPSEEK_V4_PRO_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nemotron-ultra' && !_nemotronUltra2 && process.env.NVIDIA_ULTRA_KEY_2) {
      _nemotronUltra2 = new OpenAI({ apiKey: process.env.NVIDIA_ULTRA_KEY_2, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'gpt-oss-20b' && !_gptOss20b && process.env.GPT_OSS_20B_KEY) {
      _gptOss20b = new OpenAI({ apiKey: process.env.GPT_OSS_20B_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'gpt-oss-120b' && !_gptOss120b && process.env.GPT_OSS_120B_KEY) {
      _gptOss120b = new OpenAI({ apiKey: process.env.GPT_OSS_120B_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nemotron-super-120b' && !_nemotronSuper120b && process.env.NVIDIA_SUPER_120B_KEY) {
      _nemotronSuper120b = new OpenAI({ apiKey: process.env.NVIDIA_SUPER_120B_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'llama-3.3' && !_llama33 && process.env.LLAMA33_KEY) {
      _llama33 = new OpenAI({ apiKey: process.env.LLAMA33_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nemotron-super-49b-v15' && !_nemotronSuper49bV15 && process.env.NVIDIA_SUPER_49B_V15_KEY) {
      _nemotronSuper49bV15 = new OpenAI({ apiKey: process.env.NVIDIA_SUPER_49B_V15_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nemotron-super-49b-v1' && !_nemotronSuper49bV1 && process.env.NVIDIA_SUPER_49B_V1_KEY) {
      _nemotronSuper49bV1 = new OpenAI({ apiKey: process.env.NVIDIA_SUPER_49B_V1_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nemotron-nano-8b' && !_nemotronNano8b && process.env.NVIDIA_NANO_KEY_2) {
      _nemotronNano8b = new OpenAI({ apiKey: process.env.NVIDIA_NANO_KEY_2, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'mistral-nemotron-2' && !_mistralNemotron2 && process.env.MISTRAL_NEMOTRON_KEY_2) {
      _mistralNemotron2 = new OpenAI({ apiKey: process.env.MISTRAL_NEMOTRON_KEY_2, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'kimi' && !_kimi && (process.env.KIMI_KEY || process.env.NVIDIA_API_KEY)) {
      // The master NVIDIA key can reach Kimi too; use the dedicated key first.
      _kimi = new OpenAI({ apiKey: process.env.KIMI_KEY || process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'inkling' && !_inkling && process.env.INKLING_KEY) {
      _inkling = new OpenAI({ apiKey: process.env.INKLING_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'poolside' && !_poolside && process.env.POOLSIDE_KEY) {
      _poolside = new OpenAI({ apiKey: process.env.POOLSIDE_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'nvidia-backup' && !_nvidiaBackup && process.env.NVIDIA_BACKUP_KEY) {
      _nvidiaBackup = new OpenAI({ apiKey: process.env.NVIDIA_BACKUP_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'nvidia-extra-1' && !_nvidiaExtra1 && process.env.NVIDIA_EXTRA1_API_KEY) {
      _nvidiaExtra1 = new OpenAI({ apiKey: process.env.NVIDIA_EXTRA1_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'nvidia-extra-2' && !_nvidiaExtra2 && process.env.NVIDIA_EXTRA2_API_KEY) {
      _nvidiaExtra2 = new OpenAI({ apiKey: process.env.NVIDIA_EXTRA2_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'nvidia-extra-3' && !_nvidiaExtra3 && process.env.NVIDIA_EXTRA3_API_KEY) {
      _nvidiaExtra3 = new OpenAI({ apiKey: process.env.NVIDIA_EXTRA3_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'nvidia-extra-4' && !_nvidiaExtra4 && process.env.NVIDIA_EXTRA4_API_KEY) {
      _nvidiaExtra4 = new OpenAI({ apiKey: process.env.NVIDIA_EXTRA4_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'nvidia-extra-5' && !_nvidiaExtra5 && process.env.NVIDIA_EXTRA5_API_KEY) {
      _nvidiaExtra5 = new OpenAI({ apiKey: process.env.NVIDIA_EXTRA5_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'nvidia-extra-6' && !_nvidiaExtra6 && process.env.NVIDIA_EXTRA6_API_KEY) {
      _nvidiaExtra6 = new OpenAI({ apiKey: process.env.NVIDIA_EXTRA6_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'nvidia-cosmos' && !_nvidiaCosmos && process.env.NVIDIA_COSMOS_API_KEY) {
      _nvidiaCosmos = new OpenAI({ apiKey: process.env.NVIDIA_COSMOS_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1', timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000), maxRetries: 1 })
    }
    if (provider === 'glm-flash' && !_glmFlash && process.env.NVIDIA_GLM_FLASH_KEY) {
      _glmFlash = new OpenAI({
        apiKey: process.env.NVIDIA_GLM_FLASH_KEY,
        baseURL: 'https://integrate.api.nvidia.com/v1',
        timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000),
        maxRetries: 1,
      })
    }
    if (provider === 'opencode' && !_opencode && process.env.OPENCODE_API_KEY) {
      // OpenCode Console gateway. Keys are backend-only. The default endpoint
      // speaks OpenAI Chat Completions; set OPENCODE_BASE_URL to a connected
      // provider URL (https://opencode.ai/inference/custom/<id>) to use BYOK.
      _opencode = new OpenAI({
        apiKey: process.env.OPENCODE_API_KEY,
        baseURL: process.env.OPENCODE_BASE_URL || 'https://opencode.ai/inference/openai/v1',
        timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 120000),
        maxRetries: 1,
      })
    }
  } catch (e) {
    console.error(`Failed to init provider ${provider}:`, e.message)
  }
  const clients = { anthropic: _anthropic, openai: _openai, nvidia: _nvidia, 'nvidia-ultra': _nvidiaUltra, llama: _nvidiaLlama, deepseek: _deepseek, phi4: _phi4, openrouter: _openrouter, groq: _groq, minimax: _minimax, 'nemotron-nano': _nemotronNano, 'mistral-nemotron': _mistralNemotron, 'mistral-large': _mistralLarge, 'gemma-4': _gemma4, stepfun: _stepfun, diffusiongemma: _diffusiongemma, 'z-ai': _zai, 'deepseek-v4-flash': _deepseekV4Flash, 'deepseek-v4-pro': _deepseekV4Pro, 'nemotron-ultra': _nemotronUltra2, 'gpt-oss-20b': _gptOss20b, 'gpt-oss-120b': _gptOss120b, 'nemotron-super-120b': _nemotronSuper120b, 'llama-3.3': _llama33, 'nemotron-super-49b-v15': _nemotronSuper49bV15, 'nemotron-super-49b-v1': _nemotronSuper49bV1, 'nemotron-nano-8b': _nemotronNano8b, 'mistral-nemotron-2': _mistralNemotron2, kimi: _kimi, inkling: _inkling, poolside: _poolside, opencode: _opencode, 'glm-flash': _glmFlash, 'nvidia-backup': _nvidiaBackup, 'nvidia-extra-1': _nvidiaExtra1, 'nvidia-extra-2': _nvidiaExtra2, 'nvidia-extra-3': _nvidiaExtra3, 'nvidia-extra-4': _nvidiaExtra4, 'nvidia-extra-5': _nvidiaExtra5, 'nvidia-extra-6': _nvidiaExtra6, 'nvidia-cosmos': _nvidiaCosmos }
  return clients[provider] || null
}

async function getAiResponse(provider, messages, options = {}) {
  const client = getAI(provider)
  if (!client) return null

  try {
    if (provider === 'anthropic') {
      const system = messages.filter(message => message.role === 'system').map(message => message.content).join('\n\n')
      const claudeMessages = messages
        .filter(message => message.role === 'user' || message.role === 'assistant')
        .map(message => ({ role: message.role, content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content) }))
      if (!claudeMessages.length) return null
      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: options.max_tokens || 4096,
        ...(system ? { system } : {}),
        messages: claudeMessages,
        temperature: options.temperature ?? 0.3,
      }, { signal: options.signal })
      return response.content.filter(block => block.type === 'text').map(block => block.text).join('\n').trim() || null
    }
    if (provider === 'openai') {
      // Never pass a NVIDIA model id here: OpenAI is only a backup provider.
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens || 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'nvidia') {
      const model = options.model || process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL
      const completion = await client.chat.completions.create({
        // One master key can address any NVIDIA-hosted model via options.model.
        model,
        messages,
        ...nvidiaRequestOptions(options, model),
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'nvidia-ultra') {
      const completion = await client.chat.completions.create({
        model: process.env.NVIDIA_ULTRA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'llama') {
      const completion = await client.chat.completions.create({
        model: 'meta/llama-3.1-70b-instruct',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'deepseek') {
      const completion = await client.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-ai/deepseek-v4-pro',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'phi4') {
      const completion = await client.chat.completions.create({
        model: process.env.PHI4_MODEL || 'microsoft/phi-4-mini-instruct',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'openrouter') {
      const completion = await client.chat.completions.create({
        model: 'openai/gpt-4o',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 2000,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'groq') {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'minimax') {
      const completion = await client.chat.completions.create({
        model: 'minimaxai/minimax-m2.7',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'diffusiongemma') {
      const completion = await client.chat.completions.create({
        model: 'google/diffusiongemma-26b-a4b-it',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'stepfun') {
      const completion = await client.chat.completions.create({
        model: 'stepfun-ai/step-3.7-flash',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'nemotron-nano') {
      const completion = await client.chat.completions.create({
        model: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'mistral-nemotron') {
      const completion = await client.chat.completions.create({
        model: 'mistralai/mistral-nemotron',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'mistral-large') {
      const completion = await client.chat.completions.create({
        model: 'mistralai/mistral-large-3-675b-instruct-2512',
        messages,
        temperature: options.temperature || 0.15,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'gemma-4') {
      const completion = await client.chat.completions.create({
        model: 'google/gemma-4-31b-it',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'z-ai') {
      const completion = await client.chat.completions.create({
        model: process.env.ZAI_MODEL || 'z-ai/glm-5.2',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'deepseek-v4-flash') {
      const completion = await client.chat.completions.create({
        model: process.env.DEEPSEEK_V4_FLASH_MODEL || 'deepseek-ai/deepseek-v4-flash',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'deepseek-v4-pro') {
      const completion = await client.chat.completions.create({
        model: 'deepseek-ai/deepseek-v4-pro',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'nemotron-ultra') {
      const completion = await client.chat.completions.create({
        model: process.env.NVIDIA_ULTRA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
        chat_template_kwargs: { enable_thinking: true },
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'gpt-oss-20b') {
      const completion = await client.chat.completions.create({
        model: process.env.GPT_OSS_20B_MODEL || 'openai/gpt-oss-20b',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'gpt-oss-120b') {
      const completion = await client.chat.completions.create({
        model: process.env.GPT_OSS_120B_MODEL || 'openai/gpt-oss-120b',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'nemotron-super-120b') {
      const completion = await client.chat.completions.create({
        model: process.env.NVIDIA_SUPER_120B_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'llama-3.3') {
      const completion = await client.chat.completions.create({
        model: 'meta/llama-3.3-70b-instruct',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'nemotron-super-49b-v15') {
      const completion = await client.chat.completions.create({
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'nemotron-super-49b-v1') {
      const completion = await client.chat.completions.create({
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'nemotron-nano-8b') {
      const completion = await client.chat.completions.create({
        model: 'nvidia/llama-3.1-nemotron-nano-8b-v1',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'mistral-nemotron-2') {
      const completion = await client.chat.completions.create({
        model: 'mistralai/mistral-nemotron',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'kimi') {
      const completion = await client.chat.completions.create({
        model: process.env.KIMI_MODEL || 'moonshotai/kimi-k3.1-pro',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 16384,
        seed: 0,
        // Kimi K3.1 Pro rejects explicit top_p values on this endpoint.
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'inkling') {
      const completion = await client.chat.completions.create({
        model: 'thinkingmachines/inkling',
        messages,
        temperature: options.temperature ?? 1,
        top_p: options.top_p ?? 0.95,
        max_tokens: options.max_tokens ?? 8192,
        stream: false,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'poolside') {
      const completion = await client.chat.completions.create({
        model: 'poolside/laguna-xs-2.1',
        messages,
        temperature: options.temperature ?? 1,
        top_p: options.top_p ?? 0.95,
        max_tokens: options.max_tokens ?? 8192,
        stream: false,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (['nvidia-backup', 'nvidia-extra-1', 'nvidia-extra-2', 'nvidia-extra-3', 'nvidia-extra-4', 'nvidia-extra-5', 'nvidia-extra-6', 'nvidia-cosmos'].includes(provider)) {
      const model = options.model || process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL
      const completion = await client.chat.completions.create({
        model,
        messages,
        ...nvidiaRequestOptions(options, model),
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'glm-flash') {
      const completion = await client.chat.completions.create({
        model: process.env.NVIDIA_GLM_FLASH_MODEL || 'z-ai/glm-5.3-flash',
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens || 1024,
        top_p: 1,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
    if (provider === 'opencode') {
      const completion = await client.chat.completions.create({
        model: options.model || process.env.OPENCODE_MODEL || 'big-pickle',
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens || 4096,
      }, { signal: options.signal })
      return completion.choices[0]?.message?.content || null
    }
  } catch (err) {
    const isAbort = err?.name === 'AbortError' || err?.name === 'APIUserAbortError' || options.signal?.aborted
    if (isAbort) return null
    const status = err?.status || err?.response?.status || 0
    if (status === 401 || status === 403) {
      console.error(`Provider ${provider} AUTH ERROR (${status}): key invalid or expired — skipping`)
      throw Object.assign(new Error(`Auth failed for ${provider}`), { authError: true, status })
    }
    console.error(`Provider ${provider} error (${status}):`, err?.message || err || 'Unknown error')
  }
  return null
}

async function streamAnthropicResponse(messages, { signal, onText, max_tokens = 4096, temperature = 0.3 } = {}) {
  const client = getAI('anthropic')
  if (!client) return null

  const system = messages.filter(message => message.role === 'system').map(message => message.content).join('\n\n')
  const claudeMessages = messages
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map(message => ({ role: message.role, content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content) }))
  if (!claudeMessages.length) return null

  const stream = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
    max_tokens,
    ...(system ? { system } : {}),
    messages: claudeMessages,
    temperature,
    stream: true,
  }, { signal })

  let answer = ''
  for await (const event of stream) {
    if (event.type !== 'content_block_delta' || event.delta?.type !== 'text_delta') continue
    answer += event.delta.text
    onText?.(event.delta.text)
  }
  return answer.trim() || null
}

/**
 * Stream from any OpenAI-compatible backend client (NVIDIA, OpenRouter,
 * OpenCode Console, ...). Returns the assembled answer and emits deltas so the
 * chat UI can render progressively.
 */
async function streamOpenAICompatResponse(provider, messages, { signal, onText, model, max_tokens, temperature, top_p, reasoning_budget } = {}) {
  const client = getAI(provider)
  if (!client) return null
  const preset = modelOptionsFor(model)
  const extra = {}
  if (top_p !== undefined || preset.top_p !== undefined) extra.top_p = top_p ?? preset.top_p
  if (reasoning_budget !== undefined || preset.reasoning_budget !== undefined) {
    extra.reasoning_budget = reasoning_budget ?? preset.reasoning_budget
  }
  const stream = await client.chat.completions.create({
    model: model || process.env.OPENCODE_MODEL || 'big-pickle',
    messages,
    max_tokens: max_tokens ?? preset.max_tokens ?? 4096,
    temperature: temperature ?? preset.temperature ?? 0.3,
    ...extra,
    stream: true,
  }, { signal })
  let answer = ''
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content
    if (!delta) continue
    answer += delta
    onText?.(delta)
  }
  return answer.trim() || null
}

function getAvailableProviders() {
  const available = []
  if (process.env.ANTHROPIC_API_KEY) available.push('anthropic')
  if (process.env.OPENAI_API_KEY) available.push('openai')
  if (process.env.NVIDIA_API_KEY) available.push('nvidia')
  if (process.env.NVIDIA_LLAMA_KEY) available.push('llama')
  if (process.env.PHI4_KEY) available.push('phi4')
  if (process.env.DEEPSEEK_KEY) available.push('deepseek')
  if (process.env.GROQ_API_KEY) available.push('groq')
  if (process.env.MINIMAX_KEY) available.push('minimax')
  if (process.env.DIFFUSIONGEMMA_KEY) available.push('diffusiongemma')
  if (process.env.STEPFUN_KEY) available.push('stepfun')
  // nvidia-ultra intentionally excluded: same underlying model as nemotron-ultra (nemotron-3-ultra-550b-a55b)
  if (process.env.NVIDIA_NANO_KEY) available.push('nemotron-nano')
  if (process.env.MISTRAL_NEMOTRON_KEY) available.push('mistral-nemotron')
  if (process.env.MISTRAL_LARGE_KEY) available.push('mistral-large')
  if (process.env.GEMMA4_KEY) available.push('gemma-4')
  if (process.env.ZAI_KEY) available.push('z-ai')
  if (process.env.DEEPSEEK_V4_FLASH_KEY) available.push('deepseek-v4-flash')
  if (process.env.DEEPSEEK_V4_PRO_KEY) available.push('deepseek-v4-pro')
  if (process.env.NVIDIA_ULTRA_KEY_2) available.push('nemotron-ultra')
  if (process.env.GPT_OSS_20B_KEY) available.push('gpt-oss-20b')
  if (process.env.GPT_OSS_120B_KEY) available.push('gpt-oss-120b')
  if (process.env.NVIDIA_SUPER_120B_KEY) available.push('nemotron-super-120b')
  if (process.env.LLAMA33_KEY) available.push('llama-3.3')
  if (process.env.NVIDIA_SUPER_49B_V15_KEY) available.push('nemotron-super-49b-v15')
  if (process.env.NVIDIA_SUPER_49B_V1_KEY) available.push('nemotron-super-49b-v1')
  if (process.env.NVIDIA_NANO_KEY_2) available.push('nemotron-nano-8b')
  // mistral-nemotron-2 intentionally excluded: identical model to mistral-nemotron
  // The master NVIDIA key can also reach Kimi, so do not require a second key.
  if (process.env.KIMI_KEY || process.env.NVIDIA_API_KEY) available.push('kimi')
  if (process.env.INKLING_KEY) available.push('inkling')
  if (process.env.POOLSIDE_KEY) available.push('poolside')
  if (process.env.OPENROUTER_API_KEY) available.push('openrouter')
  if (process.env.OPENCODE_API_KEY) available.push('opencode')
  if (process.env.NVIDIA_GLM_FLASH_KEY) available.push('glm-flash')
  if (process.env.NVIDIA_BACKUP_KEY) available.push('nvidia-backup')
  if (process.env.NVIDIA_EXTRA1_API_KEY) available.push('nvidia-extra-1')
  if (process.env.NVIDIA_EXTRA2_API_KEY) available.push('nvidia-extra-2')
  if (process.env.NVIDIA_EXTRA3_API_KEY) available.push('nvidia-extra-3')
  if (process.env.NVIDIA_EXTRA4_API_KEY) available.push('nvidia-extra-4')
  if (process.env.NVIDIA_EXTRA5_API_KEY) available.push('nvidia-extra-5')
  if (process.env.NVIDIA_EXTRA6_API_KEY) available.push('nvidia-extra-6')
  if (process.env.NVIDIA_COSMOS_API_KEY) available.push('nvidia-cosmos')
  return available
}

const specialistRoles = {
  anthropic: 'You are a thoughtful, clear, and helpful university assistant. Give direct answers, explain uncertainty, and adapt detail to the question.',
  openai: 'You are a reliable backup study assistant. Give a direct, well-structured answer and be honest about uncertainty.',
  nvidia: 'You are the NVIDIA SPECIALIST. Provide accurate, well-structured answers with clear reasoning and practical examples.',
  'nvidia-ultra': 'You are a careful academic reviewer. Compare the evidence, identify meaningful disagreements, and present a clear, balanced conclusion without exposing private reasoning.',
  llama: 'You are the TECHNICAL ARCHITECT. Focus on technical accuracy, structure, and precision.',
  deepseek: 'You are a careful analyst. Check facts and logic, identify relevant connections, and present a concise, well-supported answer.',
  groq: 'You are the RAPID ANALYST. Provide high-velocity insights and identify key pillars instantly.',
  phi4: 'You are the ACADEMIC SPECIALIST. Focus on textbook-level accuracy and scientific rigor.',
  minimax: 'You are the CONTEXT GUARDIAN. Ensure the response stays perfectly aligned with the source material.',
  stepfun: 'You are the CREATIVE EDUCATOR. Make complex concepts simple and memorable.',
  'nemotron-nano': 'You are the VISION ANALYST. Combine visual understanding with precise reasoning.',
  'mistral-nemotron': 'You are the BALANCED CRITIC. Weigh all perspectives and find the optimal middle ground.',
  'mistral-large': 'You are the PRECISION ENGINE. Deliver mathematically rigorous and highly accurate answers.',
  'gemma-4': 'You are the THINKING PARTNER. Use structured reasoning to break down complex problems.',
  'z-ai': 'You are the GLM LINGUIST. Specialize in precise multilingual reasoning and structured logic.',
  'deepseek-v4-flash': 'You are a fast, careful analyst. Give a direct answer and include only the explanation needed to make it clear.',
  'deepseek-v4-pro': 'You are the PRO ANALYST. Provide precise, factual responses with deep technical insight.',
  'nemotron-ultra': 'You are a rigorous reviewer. Weigh the available evidence and deliver a clear, well-supported conclusion.',
  'gpt-oss-20b': 'You are the OPEN SOURCE ANALYST. Provide efficient, practical insights with a focus on real-world applications.',
  'gpt-oss-120b': 'You are a careful research assistant. Analyze complex questions and explain the conclusion clearly without exposing private reasoning.',
  'nemotron-super-120b': 'You are a thoughtful academic assistant. Solve the question carefully and present the conclusion with a clear, brief explanation.',
  'llama-3.3': 'You are the LLAMA SAGE. Provide balanced, well-reasoned responses with broad knowledge across domains.',
  'nemotron-super-49b-v15': 'You are the NEMOTRON STRATEGIST. Deliver strategic insights with super-scale reasoning.',
  'nemotron-super-49b-v1': 'You are the NEMOTRON ADVISOR. Provide clear, structured analysis with deep contextual understanding.',
  'nemotron-nano-8b': 'You are the NANO EXPERT. Deliver fast, efficient responses with precision-focused reasoning.',
  'mistral-nemotron-2': 'You are the MISTRAL CRITIC. Provide balanced, well-weighed analysis with a focus on accuracy.',
  kimi: 'You are the KIMI SAGE — a deep-reasoning expert with strong multilingual and cross-domain analytical capabilities. You excel at nuanced reasoning, long-context synthesis, and providing authoritative, well-structured verdicts. As a SUPREME JUDGE candidate, your reasoning is thorough, your conclusions are decisive, and your analysis weighs all perspectives carefully.',
  inkling: 'You are the INKLING REASONER — a creative, emergent thinker who explores novel connections and generates innovative solutions. You bring fresh perspectives and think outside conventional frameworks.',
  poolside: 'You are the POOLSIDE CODER — a specialized engineer focused on code generation, software architecture, and technical problem-solving. You excel at writing clean, efficient, and well-structured code.',
  opencode: 'You are a capable university study assistant served through OpenCode. Give clear, accurate, well-structured answers with practical examples and honest uncertainty.',
  'glm-flash': 'You are a fast, precise study assistant. Give direct, well-structured answers with clear examples.',
  'nvidia-backup': 'You are a careful backup study assistant. Give clear, well-structured answers with honest uncertainty.',
  'nvidia-extra-1': 'You are a reliable academic assistant. Give accurate, concise answers with practical examples.',
  'nvidia-extra-2': 'You are a dependable study companion. Give clear, focused answers that explain the reasoning.',
  'nvidia-extra-3': 'You are a careful study assistant. Give direct, well-supported answers.',
  'nvidia-extra-4': 'You are a precise academic assistant. Give concise answers with clear explanations.',
  'nvidia-extra-5': 'You are a helpful study companion. Give accurate answers and admit uncertainty.',
  'nvidia-extra-6': 'You are a reliable academic reviewer. Give balanced, practical answers.',
  'nvidia-cosmos': 'You are a careful backup study assistant. Give clear answers and explain uncertainty.'
}

/**
 * Read a whiteboard / lecture slide / screenshot with a vision model and turn
 * it into study-ready text. Uploaded images are passed as data URLs; the model
 * options mirror the working NVIDIA vision examples, but only final `content`
 * is returned — `reasoning_content` is never exposed to the browser.
 */
async function understandImage(buffer, mimeType = 'image/png', instruction = '') {
  if (!buffer || !Buffer.isBuffer(buffer)) return null

  const prompt = instruction || `Transcribe every word of text in this study image (slide, whiteboard, page or screenshot) in reading order.
Describe any diagram, chart, formula or table precisely in text.
Return only the extracted study content — no preamble, no commentary.`

  const content = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}`, detail: 'high' } },
  ]

  const visionModel = process.env.NVIDIA_VISION_MODEL || 'nvidia/nemotron-3.5-super-vl-120b-a12b'
  const kimiModel = process.env.KIMI_MODEL || 'moonshotai/kimi-k3.1-pro'
  const attempts = [
    {
      provider: 'nvidia',
      model: visionModel,
      options: { temperature: 1, top_p: 0.95, max_tokens: 16384, parallel_tool_calls: true, seed: 42, chat_template_kwargs: { enable_thinking: true } },
    },
    {
      provider: 'nvidia-backup',
      model: visionModel,
      options: { temperature: 1, top_p: 0.95, max_tokens: 16384, parallel_tool_calls: true, seed: 42, chat_template_kwargs: { enable_thinking: true } },
    },
    {
      provider: 'nvidia-extra-1',
      model: visionModel,
      options: { temperature: 1, top_p: 0.95, max_tokens: 16384, parallel_tool_calls: true, seed: 42, chat_template_kwargs: { enable_thinking: true } },
    },
    ...['nvidia-extra-2', 'nvidia-extra-3', 'nvidia-extra-4', 'nvidia-extra-5', 'nvidia-extra-6', 'nvidia-cosmos'].map(provider => ({
      provider,
      model: visionModel,
      options: { temperature: 1, top_p: 0.95, max_tokens: 16384, parallel_tool_calls: true, seed: 42, chat_template_kwargs: { enable_thinking: true } },
    })),
    {
      provider: 'nvidia',
      model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
      options: { max_tokens: 65536, reasoning_budget: 16384, temperature: 0.6, top_p: 0.95 },
    },
    {
      provider: 'kimi',
      model: kimiModel,
      options: { temperature: 0.2, max_tokens: 16384, seed: 0, reasoning_effort: 'low' },
    },
  ]

  for (const attempt of attempts) {
    const client = getAI(attempt.provider)
    if (!client) continue
    try {
      const completion = await client.chat.completions.create({
        model: attempt.model,
        messages: [{ role: 'user', content }],
        ...attempt.options,
      })
      const rawText = completion.choices?.[0]?.message?.content
      const text = Array.isArray(rawText)
        ? rawText.map(part => (typeof part === 'string' ? part : part?.text || '')).join('')
        : rawText
      if (text && String(text).trim().length >= 20) return String(text).trim()
    } catch (err) {
      console.warn(`Image understanding via ${attempt.provider} failed:`, err?.message || err)
    }
  }
  return null
}

function resolveModelId(modelId) {
  if (!modelId) return null
  return VERIFIED_MODELS.find(m => m.id === modelId) || null
}

export { getAI, getAiResponse, getAvailableProviders, specialistRoles, understandImage, streamAnthropicResponse, streamOpenAICompatResponse, VERIFIED_MODELS, DEFAULT_NVIDIA_MODEL, NVIDIA_EMBED_MODEL, NVIDIA_CAPABILITIES, resolveModelId }
