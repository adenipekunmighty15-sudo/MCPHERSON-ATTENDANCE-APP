import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { generateImage } from '../services/imageService.js'

const router = Router()

router.post('/api/ai/generate-image', authenticate, async (req, res) => {
  try {
    const { prompt, size, n } = req.body
    if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' })

    const result = await generateImage(prompt.trim(), { size, n })
    if (result.error) return res.status(502).json({ error: result.error })

    res.json({ url: result.url, provider: result.provider })
  } catch (err) {
    console.error('Image generation error:', err.message)
    res.status(500).json({ error: 'Image generation failed' })
  }
})

export default router
