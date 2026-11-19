// Maps a provider id (as stored in public.ai_config.provider, or passed to
// getAI()) to the environment variable that src/config/ai.js actually reads.
//
// The old server.js fallback (`PROVIDER.toUpperCase().replace(/-/g, '_') +
// '_API_KEY'`) produced names like DEEPSEEK_API_KEY, but ai.js reads
// DEEPSEEK_KEY, NVIDIA_NANO_KEY, etc. Keeping the mapping here — the single
// source of truth next to ai.js — means a key stored in the DB table actually
// enables its provider in the Study Hub.

export const PROVIDER_ENV_KEYS = Object.freeze({
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
  deepseek: 'DEEPSEEK_KEY',
  phi4: 'PHI4_KEY',
  minimax: 'MINIMAX_KEY',
  'mistral-large': 'MISTRAL_LARGE_KEY',
  'mistral-nemotron': 'MISTRAL_NEMOTRON_KEY',
  'gemma-4': 'GEMMA4_KEY',
  stepfun: 'STEPFUN_KEY',
  diffusiongemma: 'DIFFUSIONGEMMA_KEY',
  'z-ai': 'ZAI_KEY',
  'deepseek-v4-flash': 'DEEPSEEK_V4_FLASH_KEY',
  'deepseek-v4-pro': 'DEEPSEEK_V4_PRO_KEY',
  'nvidia-ultra': 'NVIDIA_ULTRA_KEY',
  'nemotron-ultra': 'NVIDIA_ULTRA_KEY_2',
  'nemotron-nano': 'NVIDIA_NANO_KEY',
  'nemotron-nano-8b': 'NVIDIA_NANO_KEY_2',
  'gpt-oss-20b': 'GPT_OSS_20B_KEY',
  'gpt-oss-120b': 'GPT_OSS_120B_KEY',
  'nemotron-super-120b': 'NVIDIA_SUPER_120B_KEY',
  'nemotron-super-49b-v15': 'NVIDIA_SUPER_49B_V15_KEY',
  'nemotron-super-49b-v1': 'NVIDIA_SUPER_49B_V1_KEY',
  llama: 'NVIDIA_LLAMA_KEY',
  'llama-3.3': 'LLAMA33_KEY',
  kimi: 'KIMI_KEY',
  inkling: 'INKLING_KEY',
  poolside: 'POOLSIDE_KEY',
})

export function envKeyForProvider(provider) {
  if (typeof provider !== 'string') return null
  const normalized = provider.trim().toLowerCase()
  if (PROVIDER_ENV_KEYS[normalized]) return PROVIDER_ENV_KEYS[normalized]
  // Unknown provider: fall back to the conventional UPPER_SNAKE_API_KEY form
  // so future providers without an explicit entry still work.
  return `${normalized.replace(/[^a-z0-9]+/g, '_')}_API_KEY`.toUpperCase()
}
