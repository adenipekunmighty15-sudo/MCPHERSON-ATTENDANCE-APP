import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import multer from 'multer'
import { getAiResponse } from '../config/ai.js'
import { uploadFile } from '../services/storage.js'

const chatUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

const router = Router()

router.get('/api/general-chat/messages', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const before = req.query.before || null
    let queryStr = `SELECT gc.id, gc.sender_id, gc.message, gc.file_url, gc.file_type, gc.file_name, gc.created_at AS "createdAt",
      COALESCE(u.name, '') AS "senderName", COALESCE(u.avatar_url, '') AS "senderAvatar"
      FROM public.general_chat_messages gc
      LEFT JOIN public.users u ON gc.sender_id = u.id::text`
    const params = []
    if (before) {
      params.push(before)
      queryStr += ` WHERE gc.created_at < $${params.length}`
    }
    queryStr += ` ORDER BY gc.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)
    const { rows } = await query(queryStr, params)
    res.status(200).json(rows.reverse())
  } catch (err) {
    console.error('Failed to load general chat messages:', err.message)
    res.status(500).json({ error: 'Failed to load general chat messages' })
  }
})

router.post('/api/general-chat/messages', authenticate, chatUpload.single('file'), async (req, res) => {
  try {
    const { message } = req.body
    if ((!message || !message.trim()) && !req.file) {
      return res.status(400).json({ error: 'Message or file required' })
    }
    const id = randomUUID()
    let fileUrl = '', fileType = '', fileName = ''
    if (req.file) {
      const uploaded = await uploadFile(req.file.buffer, `${randomUUID()}-${req.file.originalname}`, req.file.mimetype)
      fileUrl = uploaded.publicUrl
      fileType = req.file.mimetype
      fileName = req.file.originalname
    }
    await query(
      `INSERT INTO public.general_chat_messages (id, sender_id, message, file_url, file_type, file_name, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [id, req.user.id, (message || '').trim(), fileUrl, fileType, fileName]
    )

    // ── NEURAL ASSISTANT (Auto-reply in chat if mentioned) ──
    if (message && (message.toLowerCase().includes('neural core') || message.toLowerCase().includes('@assistant'))) {
      setTimeout(async () => {
        try {
          const assistantId = 'neural-core-assistant'
          const prompt = `
            You are the Neural Assistant in a student group chat for McPherson University.
            A student said: "${message}"
            Provide a helpful, concise, and slightly futuristic response (max 2 sentences).
            If they ask about attendance or study, encourage them to use the app's specialized hubs.
          `
          const { getAvailableProviders } = await import('../config/ai.js')
          const providers = getAvailableProviders()
          const provider = providers.includes('groq') ? 'groq' : providers.includes('openrouter') ? 'openrouter' : providers[0]
          if (!provider) return
          const response = await getAiResponse(provider, [{ role: 'user', content: prompt }])
          if (!response) return
          const replyId = randomUUID()
          await query(
            `INSERT INTO public.general_chat_messages (id, sender_id, message, created_at)
             VALUES ($1,$2,$3,NOW())`,
            [replyId, assistantId, response]
          )
        } catch (err) {
          console.error('Neural Assistant chat error:', err.message)
        }
      }, 1500) // Delay for realism
    }

    const { rows } = await query(
      `SELECT gc.id, gc.sender_id, gc.message, gc.file_url, gc.file_type, gc.file_name, gc.created_at AS "createdAt",
        COALESCE(u.name, '') AS "senderName", COALESCE(u.avatar_url, '') AS "senderAvatar"
       FROM public.general_chat_messages gc
       LEFT JOIN public.users u ON gc.sender_id = u.id::text
       WHERE gc.id = $1`,
      [id]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to send general chat message:', err.message)
    res.status(500).json({ error: 'Failed to send general chat message' })
  }
})

router.delete('/api/general-chat/messages/:id', authenticate, async (req, res) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM public.general_chat_messages WHERE id = $1 AND sender_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Message not found' })
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to delete general chat message:', err.message)
    res.status(500).json({ error: 'Failed to delete general chat message' })
  }
})

export default router
