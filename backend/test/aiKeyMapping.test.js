import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { envKeyForProvider, PROVIDER_ENV_KEYS } from '../src/config/providerKeys.js'

test('every provider served by the AI config resolves to its real env key', () => {
  const expected = {
    openai: 'OPENAI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    groq: 'GROQ_API_KEY',
    gemini: 'GEMINI_API_KEY',
    nvidia: 'NVIDIA_API_KEY',
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
  }
  for (const [provider, envKey] of Object.entries(expected)) {
    assert.equal(envKeyForProvider(provider), envKey, `wrong env key for ${provider}`)
  }
})

test('mapping covers every provider env key that ai.js reads', () => {
  const ai = readFileSync(new URL('../src/config/ai.js', import.meta.url), 'utf8')
  const referenced = [...ai.matchAll(/process\.env\.([A-Z0-9_]+_KEY)/g)].map(m => m[1])
  const mapped = new Set(Object.values(PROVIDER_ENV_KEYS))
  const missing = [...new Set(referenced)].filter(key => !mapped.has(key))
  assert.deepEqual(missing, [], `unmapped env keys in ai.js: ${missing.join(', ')}`)
})
