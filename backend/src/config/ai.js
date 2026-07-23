import OpenAI from 'openai'

let _nvidiaUltra, _nvidiaLlama, _deepseek, _phi4, _openrouter, _groq, _minimax, _nemotronNano, _mistralNemotron, _mistralLarge, _gemma4, _stepfun, _diffusiongemma, _ollamaLlama, _ollamaQwen, _zai, _deepseekV4Flash, _deepseekV4Pro, _nemotronUltra2, _gptOss20b, _gptOss120b, _nemotronSuper120b, _llama33, _nemotronSuper49bV15, _nemotronSuper49bV1, _nemotronNano8b, _mistralNemotron2, _kimi, _inkling, _poolside

function getAI(provider) {
  try {
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
    if (provider === 'ollama-llama' && !_ollamaLlama) {
      const host = process.env.OLLAMA_HOST || 'http://localhost:11434'
      _ollamaLlama = new OpenAI({ apiKey: 'ollama', baseURL: `${host}/v1` })
    }
    if (provider === 'ollama-qwen' && !_ollamaQwen) {
      const host = process.env.OLLAMA_HOST || 'http://localhost:11434'
      _ollamaQwen = new OpenAI({ apiKey: 'ollama', baseURL: `${host}/v1` })
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
    if (provider === 'kimi' && !_kimi && process.env.KIMI_KEY) {
      _kimi = new OpenAI({ apiKey: process.env.KIMI_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'inkling' && !_inkling && process.env.INKLING_KEY) {
      _inkling = new OpenAI({ apiKey: process.env.INKLING_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
    if (provider === 'poolside' && !_poolside && process.env.POOLSIDE_KEY) {
      _poolside = new OpenAI({ apiKey: process.env.POOLSIDE_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
    }
  } catch (e) {
    console.error(`Failed to init provider ${provider}:`, e.message)
  }
  const clients = { 'nvidia-ultra': _nvidiaUltra, llama: _nvidiaLlama, deepseek: _deepseek, phi4: _phi4, openrouter: _openrouter, groq: _groq, minimax: _minimax, 'nemotron-nano': _nemotronNano, 'mistral-nemotron': _mistralNemotron, 'mistral-large': _mistralLarge, 'gemma-4': _gemma4, stepfun: _stepfun, diffusiongemma: _diffusiongemma, 'ollama-llama': _ollamaLlama, 'ollama-qwen': _ollamaQwen, 'z-ai': _zai, 'deepseek-v4-flash': _deepseekV4Flash, 'deepseek-v4-pro': _deepseekV4Pro, 'nemotron-ultra': _nemotronUltra2, 'gpt-oss-20b': _gptOss20b, 'gpt-oss-120b': _gptOss120b, 'nemotron-super-120b': _nemotronSuper120b, 'llama-3.3': _llama33, 'nemotron-super-49b-v15': _nemotronSuper49bV15, 'nemotron-super-49b-v1': _nemotronSuper49bV1, 'nemotron-nano-8b': _nemotronNano8b, 'mistral-nemotron-2': _mistralNemotron2, kimi: _kimi, inkling: _inkling, poolside: _poolside }
  return clients[provider] || null
}

async function getAiResponse(provider, messages, options = {}) {
  const client = getAI(provider)
  if (!client) return null

  try {
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
    if (provider === 'ollama-llama') {
      const completion = await client.chat.completions.create({
        model: 'llama3.2:3b',
        messages,
        temperature: options.temperature || 0.3,
      }, { signal: options.signal })
      return completion.choices[0].message.content
    }
    if (provider === 'ollama-qwen') {
      const completion = await client.chat.completions.create({
        model: 'qwen2.5:7b',
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
        model: 'moonshotai/kimi-k2.6',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: 16384,
        seed: 0,
        top_p: options.temperature >= 0.5 ? 0.9 : 1,
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
  } catch (err) {
    const isAbort = err?.name === 'AbortError' || err?.name === 'APIUserAbortError' || options.signal?.aborted
    if (!isAbort) {
      console.error(`Provider ${provider} error:`, err?.message || err || 'Unknown error')
    }
  }
  return null
}

function getAvailableProviders() {
  const available = []
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
  if (process.env.KIMI_KEY) available.push('kimi')
  if (process.env.INKLING_KEY) available.push('inkling')
  if (process.env.POOLSIDE_KEY) available.push('poolside')
  if (process.env.OPENROUTER_API_KEY) available.push('openrouter')
  return available
}

const specialistRoles = {
  'nvidia-ultra': 'You are the CHIEF JUSTICE of the McPherson AI Council. You preside over all deliberations with supreme authority. Your reasoning is deep, nuanced, and decisive. You synthesize all expert testimonies into a single authoritative verdict.',
  llama: 'You are the TECHNICAL ARCHITECT. Focus on technical accuracy, structure, and precision.',
  deepseek: 'You are the REASONING MASTER. Use deep Chain-of-Thought to find hidden connections.',
  groq: 'You are the RAPID ANALYST. Provide high-velocity insights and identify key pillars instantly.',
  phi4: 'You are the ACADEMIC SPECIALIST. Focus on textbook-level accuracy and scientific rigor.',
  minimax: 'You are the CONTEXT GUARDIAN. Ensure the response stays perfectly aligned with the source material.',
  stepfun: 'You are the CREATIVE EDUCATOR. Make complex concepts simple and memorable.',
  'nemotron-nano': 'You are the VISION ANALYST. Combine visual understanding with precise reasoning.',
  'mistral-nemotron': 'You are the BALANCED CRITIC. Weigh all perspectives and find the optimal middle ground.',
  'mistral-large': 'You are the PRECISION ENGINE. Deliver mathematically rigorous and highly accurate answers.',
  'gemma-4': 'You are the THINKING PARTNER. Use structured reasoning to break down complex problems.',
  'ollama-llama': 'You are the LOCAL SAGE. Provide fast, efficient reasoning with a focus on practical insights.',
  'ollama-qwen': 'You are the LOCAL POLYMATH. Deliver well-rounded, comprehensive answers with deep contextual understanding.',
  'z-ai': 'You are the GLM LINGUIST. Specialize in precise multilingual reasoning and structured logic.',
  'deepseek-v4-flash': 'You are the FLASH REASONER. Deliver rapid yet deep chain-of-thought responses with high reasoning effort.',
  'deepseek-v4-pro': 'You are the PRO ANALYST. Provide precise, factual responses with deep technical insight.',
  'nemotron-ultra': 'You are the SUPREME JUDGE. Use ultra-deep reasoning with thinking enabled to deliver authoritative, well-justified verdicts.',
  'gpt-oss-20b': 'You are the OPEN SOURCE ANALYST. Provide efficient, practical insights with a focus on real-world applications.',
  'gpt-oss-120b': 'You are the DEEP REASONER. Leverage extensive parameters for nuanced, highly detailed analysis and complex problem-solving.',
  'nemotron-super-120b': 'You are the SUPER ANALYST. Use advanced reasoning with thinking capabilities for complex problem-solving.',
  'llama-3.3': 'You are the LLAMA SAGE. Provide balanced, well-reasoned responses with broad knowledge across domains.',
  'nemotron-super-49b-v15': 'You are the NEMOTRON STRATEGIST. Deliver strategic insights with super-scale reasoning.',
  'nemotron-super-49b-v1': 'You are the NEMOTRON ADVISOR. Provide clear, structured analysis with deep contextual understanding.',
  'nemotron-nano-8b': 'You are the NANO EXPERT. Deliver fast, efficient responses with precision-focused reasoning.',
  'mistral-nemotron-2': 'You are the MISTRAL CRITIC. Provide balanced, well-weighed analysis with a focus on accuracy.',
  kimi: 'You are the KIMI SAGE — a deep-reasoning expert with strong multilingual and cross-domain analytical capabilities. You excel at nuanced reasoning, long-context synthesis, and providing authoritative, well-structured verdicts. As a SUPREME JUDGE candidate, your reasoning is thorough, your conclusions are decisive, and your analysis weighs all perspectives carefully.',
  inkling: 'You are the INKLING REASONER — a creative, emergent thinker who explores novel connections and generates innovative solutions. You bring fresh perspectives and think outside conventional frameworks.',
  poolside: 'You are the POOLSIDE CODER — a specialized engineer focused on code generation, software architecture, and technical problem-solving. You excel at writing clean, efficient, and well-structured code.'
}

export { getAI, getAiResponse, getAvailableProviders, specialistRoles }
