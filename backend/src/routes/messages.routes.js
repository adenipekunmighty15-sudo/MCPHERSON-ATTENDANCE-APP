import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { pool, query } from '../../lib/db.js'
import { authenticate } from '../middleware/auth.js'
import { emitMessageEvent, subscribeToMessages } from '../services/messageEvents.js'

const router = Router()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CHAT_ROLES = ['student', 'lecturer']
const MESSAGE_LIMIT = 100

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function requireChatRole(req, res, next) {
  if (!CHAT_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Messaging is available to students and lecturers' })
  }
  next()
}

router.get('/api/messages/stream', authenticate, requireChatRole, (req, res) => {
  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()
  res.write(': connected\n\n')

  const unsubscribe = subscribeToMessages(req.user.id, (chunk) => {
    try { res.write(chunk) } catch { /* closed connection */ }
  })
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n') } catch { /* closed connection */ }
  }, 25000)

  const cleanup = () => {
    clearInterval(heartbeat)
    unsubscribe()
  }
  req.on('close', cleanup)
  req.on('error', cleanup)
})

function toMessage(row, currentUserId) {
  return {
    id: row.id,
    senderId: row.sender_id === currentUserId ? 'me' : row.sender_id,
    content: row.body,
    timestamp: row.created_at,
    status: row.sender_id === currentUserId ? row.status : null,
    replyTo: row.reply_to_id,
    replyPreview: row.reply_body
      ? {
          senderId: row.reply_sender_id === currentUserId ? 'me' : row.reply_sender_id,
          content: row.reply_body,
        }
      : null,
  }
}

router.get('/api/messages/contacts', authenticate, requireChatRole, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, department, role
       FROM public.users
       WHERE id <> $1 AND is_active IS TRUE AND role = ANY($2::text[])
       ORDER BY name
       LIMIT 500`,
      [req.user.id, CHAT_ROLES]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('Failed to load message contacts:', err.message)
    res.status(500).json({ error: 'Failed to load contacts' })
  }
})

router.get('/api/messages/conversations', authenticate, requireChatRole, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         c.id,
         partner.id AS partner_id,
         partner.name AS partner_name,
         partner.department AS partner_department,
         partner.role AS partner_role,
         latest.id AS last_message_id,
         latest.sender_id AS last_sender_id,
         latest.body AS last_message_body,
         latest.created_at AS last_message_at,
         CASE
           WHEN latest.sender_id = $1 AND partner_member.last_read_at >= latest.created_at THEN 'read'
           WHEN latest.sender_id = $1 THEN 'sent'
           ELSE NULL
         END AS last_message_status,
         (
           SELECT COUNT(*)::int
           FROM public.direct_messages unread
           WHERE unread.conversation_id = c.id
             AND unread.sender_id <> $1
             AND unread.created_at > mine.last_read_at
         ) AS unread_count,
         c.updated_at
       FROM public.direct_conversations c
       JOIN public.direct_conversation_members mine
         ON mine.conversation_id = c.id AND mine.user_id = $1 AND mine.archived_at IS NULL
       JOIN public.users partner
         ON partner.id = CASE
           WHEN c.participant_low = $1 THEN c.participant_high
           ELSE c.participant_low
         END
       JOIN public.direct_conversation_members partner_member
         ON partner_member.conversation_id = c.id AND partner_member.user_id = partner.id
       LEFT JOIN LATERAL (
         SELECT id, sender_id, body, created_at
         FROM public.direct_messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) latest ON TRUE
       ORDER BY c.updated_at DESC
       LIMIT 100`,
      [req.user.id]
    )

    res.json({
      data: rows.map(row => ({
        id: row.id,
        participants: [row.partner_id],
        type: 'individual',
        partner: {
          id: row.partner_id,
          name: row.partner_name,
          department: row.partner_department,
          role: row.partner_role,
        },
        lastMessage: row.last_message_id
          ? {
              id: row.last_message_id,
              senderId: row.last_sender_id === req.user.id ? 'me' : row.last_sender_id,
              content: row.last_message_body,
              timestamp: row.last_message_at,
              status: row.last_message_status,
            }
          : null,
        unreadCount: row.unread_count,
        updatedAt: row.updated_at,
      })),
    })
  } catch (err) {
    console.error('Failed to load conversations:', err.message)
    res.status(500).json({ error: 'Failed to load conversations' })
  }
})

router.post('/api/messages/conversations', authenticate, requireChatRole, async (req, res) => {
  const { recipientId } = req.body || {}
  if (!isUuid(recipientId) || recipientId === req.user.id) {
    return res.status(400).json({ error: 'A valid recipient is required' })
  }

  try {
    const { rows: recipients } = await query(
      `SELECT id FROM public.users
       WHERE id = $1 AND is_active IS TRUE AND role = ANY($2::text[])`,
      [recipientId, CHAT_ROLES]
    )
    if (!recipients.length) return res.status(404).json({ error: 'Recipient not found' })

    const [participantLow, participantHigh] = [req.user.id, recipientId].sort()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO public.direct_conversations (participant_low, participant_high)
         VALUES ($1, $2)
         ON CONFLICT (participant_low, participant_high) DO NOTHING`,
        [participantLow, participantHigh]
      )
      const { rows } = await client.query(
        `SELECT id FROM public.direct_conversations
         WHERE participant_low = $1 AND participant_high = $2`,
        [participantLow, participantHigh]
      )
      const conversationId = rows[0].id
      await client.query(
        `INSERT INTO public.direct_conversation_members (conversation_id, user_id)
         VALUES ($1, $2), ($1, $3)
         ON CONFLICT (conversation_id, user_id) DO NOTHING`,
        [conversationId, participantLow, participantHigh]
      )
      await client.query(
        `UPDATE public.direct_conversation_members
         SET archived_at = NULL
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, req.user.id]
      )
      await client.query('COMMIT')
      res.status(200).json({ data: { id: conversationId } })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Failed to create conversation:', err.message)
    res.status(500).json({ error: 'Failed to start conversation' })
  }
})

router.get('/api/messages/conversations/:conversationId/messages', authenticate, requireChatRole, async (req, res) => {
  const { conversationId } = req.params
  if (!isUuid(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' })

  try {
    const { rows: members } = await query(
      `SELECT user_id FROM public.direct_conversation_members
       WHERE conversation_id = $1`,
      [conversationId]
    )
    if (!members.some(member => member.user_id === req.user.id)) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    await query(
      `UPDATE public.direct_conversation_members
       SET last_read_at = now()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, req.user.id]
    )

    const partnerId = members.find(member => member.user_id !== req.user.id)?.user_id
    if (partnerId) {
      emitMessageEvent([partnerId], { type: 'read', conversationId, userId: req.user.id })
    }

    const { rows } = await query(
      `SELECT
         message.id, message.sender_id, message.body, message.created_at,
         message.reply_to_id, replied.body AS reply_body, replied.sender_id AS reply_sender_id,
         CASE
           WHEN message.sender_id = $2 AND partner.last_read_at >= message.created_at THEN 'read'
           WHEN message.sender_id = $2 THEN 'sent'
           ELSE NULL
         END AS status
       FROM public.direct_messages message
       LEFT JOIN public.direct_messages replied
         ON replied.id = message.reply_to_id
        AND replied.conversation_id = message.conversation_id
       LEFT JOIN public.direct_conversation_members partner
         ON partner.conversation_id = message.conversation_id
        AND partner.user_id <> $2
       WHERE message.conversation_id = $1
       ORDER BY message.created_at DESC
       LIMIT $3`,
      [conversationId, req.user.id, MESSAGE_LIMIT]
    )

    res.json({ data: rows.reverse().map(row => toMessage(row, req.user.id)) })
  } catch (err) {
    console.error('Failed to load conversation messages:', err.message)
    res.status(500).json({ error: 'Failed to load messages' })
  }
})

router.post('/api/messages/conversations/:conversationId/messages', authenticate, requireChatRole, async (req, res) => {
  const { conversationId } = req.params
  const body = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  const replyToId = req.body?.replyToId || null

  if (!isUuid(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' })
  if (!body || body.length > 5000) {
    return res.status(400).json({ error: 'Message must contain 1 to 5000 characters' })
  }
  if (replyToId !== null && !isUuid(replyToId)) {
    return res.status(400).json({ error: 'Invalid reply target' })
  }

  try {
    const { rows: members } = await query(
      `SELECT user_id FROM public.direct_conversation_members
       WHERE conversation_id = $1`,
      [conversationId]
    )
    if (!members.some(member => member.user_id === req.user.id)) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    if (replyToId) {
      const { rows: replied } = await query(
        `SELECT 1 FROM public.direct_messages
         WHERE id = $1 AND conversation_id = $2`,
        [replyToId, conversationId]
      )
      if (!replied.length) return res.status(400).json({ error: 'Reply target is not in this conversation' })
    }

    const messageId = randomUUID()
    const { rows } = await query(
      `INSERT INTO public.direct_messages (id, conversation_id, sender_id, body, reply_to_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sender_id, body, created_at, reply_to_id`,
      [messageId, conversationId, req.user.id, body, replyToId]
    )
    await query(
      `UPDATE public.direct_conversations SET updated_at = now() WHERE id = $1`,
      [conversationId]
    )
    await query(
      `UPDATE public.direct_conversation_members SET last_read_at = now()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, req.user.id]
    )

    emitMessageEvent(members.map(member => member.user_id), {
      type: 'message',
      conversationId,
      messageId: rows[0].id,
      senderId: req.user.id,
    })

    res.status(201).json({
      data: {
        id: rows[0].id,
        senderId: 'me',
        content: rows[0].body,
        timestamp: rows[0].created_at,
        status: 'sent',
        replyTo: rows[0].reply_to_id,
        replyPreview: null,
      },
    })
  } catch (err) {
    console.error('Failed to send message:', err.message)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

router.delete('/api/messages/conversations/:conversationId', authenticate, requireChatRole, async (req, res) => {
  const { conversationId } = req.params
  if (!isUuid(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID' })

  try {
    const { rowCount } = await query(
      `UPDATE public.direct_conversation_members
       SET archived_at = now()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Conversation not found' })
    emitMessageEvent([req.user.id], { type: 'conversations', conversationId })
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to archive conversation:', err.message)
    res.status(500).json({ error: 'Failed to hide conversation' })
  }
})

export default router
