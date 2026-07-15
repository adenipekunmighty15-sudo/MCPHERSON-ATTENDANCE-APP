import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { notifyUser, notifyDepartment } from '../services/notification.js'

const router = Router()

router.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, user_id AS "userId", type, title, message, data, link, read, created_at AS "createdAt"
       FROM public.notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    )
    const unread = rows.filter(n => !n.read).length
    res.status(200).json({ notifications: rows, unread })
  } catch (err) {
    console.error('Failed to load notifications:', err.message)
    res.status(500).json({ error: 'Failed to load notifications' })
  }
})

router.put('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await query(
      "UPDATE public.notifications SET read = true WHERE user_id = $1",
      [req.user.id]
    )
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to mark notifications as read:', err.message)
    res.status(500).json({ error: 'Failed to mark notifications as read' })
  }
})

router.post('/api/notifications/test', authenticate, async (req, res) => {
  try {
    await notifyUser(req.user.id, 'info', 'Test Notification', 'This is a test notification from the system. Your notifications are working!', '/dashboard')
    res.status(201).json({ success: true })
  } catch (err) {
    console.error('Failed to send test notification:', err.message)
    res.status(500).json({ error: 'Failed to send test notification' })
  }
})

router.put('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await query(
      "UPDATE public.notifications SET read = true WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    )
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to mark notification as read:', err.message)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

export default router
