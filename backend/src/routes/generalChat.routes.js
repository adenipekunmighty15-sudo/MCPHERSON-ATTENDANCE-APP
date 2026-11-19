import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import multer from 'multer'
import { getAiResponse } from '../config/ai.js'
import { uploadFile, extensionForMime } from '../services/storage.js'

const MAX_CHAT_FILE_SIZE = 20 * 1024 * 1024 // 20 MB cap on uploaded chat files
// .jpeg is a legacy alias for image/jpeg; the stored extension is still the
// canonical one derived from the MIME allowlist in storage.js.
const EXTRA_VALID_EXTENSIONS = { 'image/jpeg': ['.jpeg'] }
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CHAT_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    // Require the MIME type to be allowlisted AND the filename extension to be
    // the exact one for that MIME type (blocks .exe/.html/.svg disguised as an
    // image). The stored object name is generated separately and never uses
    // this original name.
    const expectedExtensions = [
      extensionForMime(file.mimetype),
      ...(EXTRA_VALID_EXTENSIONS[file.mimetype] || []),
    ].filter(Boolean)
    const lowerName = (file.originalname || '').toLowerCase()
    if (expectedExtensions.length === 0 || !expectedExtensions.some(ext => lowerName.endsWith(ext))) {
      return cb(new Error('Unsupported file type'))
    }
    cb(null, true)
  },
})

// Simple process-local per-user cooldown for @assistant mentions. The app's
// existing `aiLimiter` is IP-based, not per-user, so a small TTL Map is used
// instead of adding a dependency. NOTE: state resets on restart and is not
// shared between multiple server instances.
const ASSISTANT_COOLDOWN_MS = 10 * 1000
const assistantCooldowns = new Map() // userId -> last allowed trigger timestamp

function canTriggerAssistant(userId) {
  const now = Date.now()
  const last = assistantCooldowns.get(userId)
  if (last !== undefined && now - last < ASSISTANT_COOLDOWN_MS) return false
  assistantCooldowns.set(userId, now)
  // Opportunistic expiry so the map cannot grow without bound.
  for (const [id, timestamp] of assistantCooldowns) {
    if (now - timestamp >= ASSISTANT_COOLDOWN_MS) assistantCooldowns.delete(id)
  }
  return true
}

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
      // Pass only a generated safe name to storage; the original filename and
      // any path it contains never reach the object key.
      const safeFileName = `${randomUUID()}${extensionForMime(req.file.mimetype)}`
      const uploaded = await uploadFile(req.file.buffer, safeFileName, req.file.mimetype)
      fileUrl = uploaded.publicUrl
      fileType = req.file.mimetype
      // Display name only: strip path separators/control chars and cap length.
      fileName = (req.file.originalname || 'file')
        .replace(/[\\/\u0000-\u001f]/g, '_')
        .slice(0, 255)
    }
    await query(
      `INSERT INTO public.general_chat_messages (id, sender_id, message, file_url, file_type, file_name, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [id, req.user.id, (message || '').trim(), fileUrl, fileType, fileName]
    )

    // ── NEURAL ASSISTANT (Auto-reply in chat if mentioned) ──
    // The user's message is always saved above; the cooldown only suppresses
    // the paid/AI auto-reply when the same user spams mentions.
    const mentionsAssistant = !!message && /@assistant|neural core/i.test(message)
    if (mentionsAssistant && canTriggerAssistant(req.user.id)) {
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
    if (err instanceof multer.MulterError || err.message === 'Unsupported file type') {
      return res.status(400).json({ error: err.message })
    }
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
