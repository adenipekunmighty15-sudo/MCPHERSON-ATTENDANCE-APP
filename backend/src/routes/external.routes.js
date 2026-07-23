import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { nvidiaTTS } from '../services/externalService.js'

const router = Router()

router.post('/api/tts', authenticate, async (req, res) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Text is required' })
    const audio = await nvidiaTTS(text.slice(0, 2000))
    if (!audio) return res.status(503).json({ error: 'TTS service unavailable — check NVIDIA_TTS_KEY' })
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audio.length)
    res.send(audio)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
