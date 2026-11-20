import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { nvidiaTTS, resolveTtsVoice } from '../services/externalService.js'

const router = Router()

router.post('/api/tts', authenticate, async (req, res) => {
  try {
    const { text, voice } = req.body
    if (!text) return res.status(400).json({ error: 'Text is required' })
    const audio = await nvidiaTTS(text.slice(0, 2000), resolveTtsVoice(voice))
    if (!audio) return res.status(503).json({ error: 'TTS service unavailable — no working NVIDIA text-to-speech endpoint is configured' })
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audio.length)
    res.send(audio)
  } catch (err) {
    console.error('TTS request failed:', err.message)
    res.status(500).json({ error: 'Text-to-speech service failed' })
  }
})

export default router
