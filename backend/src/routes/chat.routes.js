import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { generateChatTitle } from '../services/aiService.js'

const router = Router()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

router.get('/api/chats', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, title, model, context, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM public.chat_conversations WHERE user_id = $1
       ORDER BY updated_at DESC LIMIT 50`,
      [req.user.id]
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load chats:', err.message)
    res.status(500).json({ error: 'Failed to load chats' })
  }
})

router.post('/api/chats', authenticate, async (req, res) => {
  try {
    const { title, model, context } = req.body
    const id = randomUUID()
    await query(
      `INSERT INTO public.chat_conversations (id, user_id, title, model, context, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,NOW(),NOW())`,
      [id, req.user.id, title || 'New Chat', model || 'council', JSON.stringify(context || {})]
    )
    const { rows } = await query('SELECT * FROM public.chat_conversations WHERE id = $1', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create chat:', err.message)
    res.status(500).json({ error: 'Failed to create chat' })
  }
})

router.put('/api/chats/:id', authenticate, async (req, res) => {
  try {
    const { title } = req.body
    const { rowCount } = await query(
      `UPDATE public.chat_conversations SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
      [title, req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Conversation not found' })
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to update chat:', err.message)
    res.status(500).json({ error: 'Failed to update chat' })
  }
})

router.delete('/api/chats/:id', authenticate, async (req, res) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM public.chat_conversations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Conversation not found' })
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to delete chat:', err.message)
    res.status(500).json({ error: 'Failed to delete chat' })
  }
})

router.get('/api/chats/:id/messages', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT cm.id, cm.role, cm.content, cm.metadata->>'feedback' AS rating, cm.created_at AS "createdAt"
       FROM public.chat_messages cm
       JOIN public.chat_conversations cc ON cm.conversation_id = cc.id
       WHERE cm.conversation_id = $1 AND cc.user_id = $2
       ORDER BY cm.created_at ASC`,
      [req.params.id, req.user.id]
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load chat messages:', err.message)
    res.status(500).json({ error: 'Failed to load chat messages' })
  }
})

router.post('/api/chats/:id/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ error: 'Content required' })
    const { rows: owned } = await query(
      'SELECT id FROM public.chat_conversations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!owned.length) return res.status(404).json({ error: 'Conversation not found' })
    const role = 'user'
    const msgId = randomUUID()
    await query(
      `INSERT INTO public.chat_messages (id, conversation_id, role, content, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [msgId, req.params.id, role, content]
    )
    await query(
      `UPDATE public.chat_conversations SET updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    )
    const { rows: userMsgCount } = await query(
      `SELECT COUNT(*) as c FROM public.chat_messages WHERE conversation_id = $1 AND role = 'user'`,
      [req.params.id]
    )
    if (parseInt(userMsgCount[0].c) === 1 && role === 'assistant') {
      const { rows: firstUserMsg } = await query(
        `SELECT content FROM public.chat_messages WHERE conversation_id = $1 AND role = 'user' ORDER BY created_at ASC LIMIT 1`,
        [req.params.id]
      )
      const userQuestion = firstUserMsg.length ? firstUserMsg[0].content : ''
      generateChatTitle(req.params.id, req.user.id, userQuestion, content)
    }
    const { rows } = await query('SELECT * FROM public.chat_messages WHERE id = $1', [msgId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to send chat message:', err.message)
    res.status(500).json({ error: 'Failed to send chat message' })
  }
})

router.patch('/api/chats/:id/messages/:messageId/feedback', authenticate, async (req, res) => {
  const { rating } = req.body || {}
  if (rating !== null && rating !== 'like' && rating !== 'dislike') {
    return res.status(400).json({ error: 'Rating must be like, dislike, or null' })
  }
  if (!UUID_PATTERN.test(req.params.id) || !UUID_PATTERN.test(req.params.messageId)) {
    return res.status(400).json({ error: 'Invalid conversation or message ID' })
  }

  try {
    const { rows } = await query(
      `UPDATE public.chat_messages cm
       SET metadata = COALESCE(cm.metadata, '{}'::jsonb) || $3::jsonb
       WHERE cm.id = $1 AND cm.conversation_id = $2 AND cm.role = 'assistant'
         AND EXISTS (
           SELECT 1 FROM public.chat_conversations cc
           WHERE cc.id = $2 AND cc.user_id = $4
         )
       RETURNING cm.id`,
      [req.params.messageId, req.params.id, JSON.stringify({ feedback: rating }), req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Message not found in this conversation' })
    res.status(200).json({ success: true, rating })
  } catch (err) {
    console.error('Failed to save chat feedback:', err.message)
    res.status(500).json({ error: 'Failed to save feedback' })
  }
})

export default router
