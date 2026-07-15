import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { elevenLabsTTS, getElevenLabsVoices } from '../services/externalService.js'

const router = Router()

// ─── ElevenLabs TTS (only external route) ───
router.post('/api/tts', authenticate, async (req, res) => {
  try {
    const { text, voiceId } = req.body
    if (!text) return res.status(400).json({ error: 'Text is required' })
    const audio = await elevenLabsTTS(text.slice(0, 500), voiceId)
    if (!audio) return res.status(503).json({ error: 'TTS service unavailable — check ELEVENLABS_API_KEY' })
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audio.length)
    res.send(audio)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/api/tts/voices', authenticate, async (req, res) => {
  try {
    const voices = await getElevenLabsVoices()
    res.json({ voices })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
