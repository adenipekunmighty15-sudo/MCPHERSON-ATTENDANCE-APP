import OpenAI from 'openai'

export async function generateImage(prompt, options = {}) {
  const size = options.size || '1024x1024'
  const n = options.n || 1

  // Try OpenAI DALL-E first
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const resp = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: Math.min(n, 1),
        size: size,
      })
      return { url: resp.data[0]?.url, provider: 'dall-e' }
    } catch (e) {
      console.error('DALL-E image gen error:', e.message)
    }
  }

  // Try NVIDIA image generation (Stable Diffusion / SDXL)
  const nvidiaKey = process.env.NVIDIA_ULTRA_KEY || process.env.NVIDIA_LLAMA_KEY
  if (nvidiaKey) {
    try {
      const resp = await fetch('https://integrate.api.nvidia.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nvidiaKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'stabilityai/stable-diffusion-3.5-large',
          prompt,
          n: Math.min(n, 4),
          size,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        const url = data.data?.[0]?.url || data.data?.[0]?.b64_json
        return { url, provider: 'nvidia' }
      }
    } catch (e) {
      console.error('NVIDIA image gen error:', e.message)
    }
  }

  return { error: 'No image generation provider available' }
}
