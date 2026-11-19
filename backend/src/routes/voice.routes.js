import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth.js'
import { aiChat } from '../services/aiService.js'
import { nvidiaTTS, getNvidiaTTSStream } from '../services/externalService.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

async function transcribeAudio(audioBuffer, mimeType) {
  const formData = new FormData()
  const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' })
  formData.append('file', blob, 'audio.' + (mimeType?.includes('mp4') ? 'm4a' : 'webm'))
  formData.append('model', 'nvidia/nvidia-whisper-6b')

  const whisperKey = process.env.NVIDIA_WHISPER_KEY
  if (!whisperKey) throw new Error('Transcription service not configured')
  const resp = await fetch('https://integrate.api.nvidia.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${whisperKey}` },
    body: formData,
  })
  if (!resp.ok) {
    // Do not surface the upstream body to clients — it may contain request
    // metadata or provider internals. The status is logged server-side below.
    throw new Error(`Whisper API error ${resp.status}`)
  }
  const data = await resp.json()
  return data.text || ''
}

router.post('/api/voice/stt', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file required' })
    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype)
    res.json({ transcript })
  } catch (err) {
    console.error('STT error:', err.message)
    res.status(500).json({ error: 'Transcription failed' })
  }
})

router.post('/api/voice/chat', authenticate, upload.single('audio'), async (req, res) => {
  try {
    let text = req.body.text || ''
    const audioFile = req.file

    if (audioFile && !text.trim()) {
      text = await transcribeAudio(audioFile.buffer, audioFile.mimetype)
    }

    if (!text.trim()) return res.status(400).json({ error: 'Text or audio required' })

    const result = await aiChat([{ role: 'user', content: text.trim() }])
    const responseText = result?.final || "I'm here to help with your academic questions."

    let audioUrl = null
    try {
      const ttsBuffer = await nvidiaTTS(responseText)
      if (ttsBuffer) {
        const base64 = ttsBuffer.toString('base64')
        audioUrl = `data:audio/mpeg;base64,${base64}`
      }
    } catch (ttsErr) {
      console.error('TTS generation error:', ttsErr.message)
    }

    res.json({
      transcript: audioFile ? text : undefined,
      response: responseText,
      mood: 'neutral',
      audioUrl,
    })
  } catch (err) {
    console.error('Voice chat error:', err.message)
    res.status(500).json({ error: 'Voice chat failed' })
  }
})

router.get('/api/voice/tts', authenticate, async (req, res) => {
  try {
    const text = req.query.text
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text query parameter required' })
    }

    const ttsResp = await getNvidiaTTSStream(text.trim().slice(0, 2000))
    if (!ttsResp) return res.status(502).json({ error: 'TTS service unavailable' })

    res.setHeader('Content-Type', 'audio/mpeg')
    ttsResp.body.pipe(res)
  } catch (err) {
    console.error('TTS error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'TTS failed' })
  }
})

export default router
