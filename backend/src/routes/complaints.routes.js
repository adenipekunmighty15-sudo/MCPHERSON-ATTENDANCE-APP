import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/api/complaints', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, area, title, message, status, created_at AS "createdAt"
       FROM public.complaints WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load complaints:', err.message)
    res.status(500).json({ error: 'Failed to load complaints' })
  }
})

router.post('/api/complaints', authenticate, async (req, res) => {
  try {
    const { area, title, message, priority } = req.body
    if (!area || !message) return res.status(400).json({ error: 'Area and message required' })
    const id = randomUUID()
    await query(
      `INSERT INTO public.complaints (id, user_id, area, title, message, priority, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'open',NOW())`,
      [id, req.user.id, area, title || '', message, priority || 'medium']
    )
    const { rows } = await query(
      `SELECT id, area, title, message, priority, status, created_at AS "createdAt"
       FROM public.complaints WHERE id = $1`,
      [id]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create complaint:', err.message)
    res.status(500).json({ error: 'Failed to create complaint' })
  }
})

export default router
