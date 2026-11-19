import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'

const router = Router()

const ADMIN_ROLES = ['admin', 'super_admin']
const ALLOWED_STATUSES = ['open', 'in_progress', 'resolved']

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Only administrators can manage complaints' })
  }
  next()
}

router.get('/api/complaints', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, area, title, message, status, created_at AS "createdAt"
       , admin_response AS "adminResponse"
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

router.get('/api/admin/complaints', authenticate, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only administrators can view complaints' })
  }
  const limit = Number(req.query.limit ?? 50)
  const offset = Number(req.query.offset ?? 0)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isInteger(offset) || offset < 0 || offset > 1000000) {
    return res.status(400).json({ error: 'Invalid complaint pagination' })
  }
  try {
    const { rows } = await query(
      `SELECT c.id, c.user_id AS "userId", u.name AS "studentName",
        c.area, c.title, c.message, c.status, c.priority,
        c.admin_response AS "adminResponse", c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
       FROM public.complaints c
       LEFT JOIN public.users u ON u.id = c.user_id
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load admin complaints:', err.message)
    res.status(500).json({ error: 'Failed to load complaints' })
  }
})

router.patch('/api/admin/complaints/:id', authenticate, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only administrators can update complaints' })
  }
  const { status, adminResponse } = req.body
  const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed', 'rejected']
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid complaint status' })
  }
  if (
    adminResponse !== undefined &&
    (typeof adminResponse !== 'string' || adminResponse.length > 5000)
  ) {
    return res.status(400).json({ error: 'Response must be a string of at most 5000 characters' })
  }
  if (status === undefined && adminResponse === undefined) {
    return res.status(400).json({ error: 'A status or response is required' })
  }

  try {
    const updates = []
    const params = []
    if (status !== undefined) {
      params.push(status)
      updates.push(`status = $${params.length}`)
      updates.push(`resolved_at = CASE WHEN $${params.length} IN ('resolved', 'closed', 'rejected') THEN NOW() ELSE NULL END`)
    }
    if (adminResponse !== undefined) {
      params.push(adminResponse)
      updates.push(`admin_response = $${params.length}`)
    }
    params.push(req.user.id)
    updates.push(`handled_by = $${params.length}`)
    updates.push('updated_at = NOW()')
    params.push(req.params.id)
    const { rows } = await query(
      `UPDATE public.complaints SET ${updates.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, status, admin_response AS "adminResponse",
         resolved_at AS "resolvedAt", updated_at AS "updatedAt"`,
      params
    )
    if (!rows.length) return res.status(404).json({ error: 'Complaint not found' })
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Failed to update complaint:', err.message)
    res.status(500).json({ error: 'Failed to update complaint' })
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

// Admin-only list of all complaints. Kept under /api/complaints to match the
// existing complaint route family (students continue to use GET /api/complaints,
// which is scoped to their own user_id by the handler above).
router.get('/api/complaints/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const params = []
    let sql = `SELECT c.id, c.user_id AS "userId", u.name AS "userName", u.email AS "userEmail",
                      c.area, c.title, c.message, c.priority, c.status,
                      c.assigned_to AS "assignedTo", c.created_at AS "createdAt", c.updated_at AS "updatedAt"
               FROM public.complaints c
               LEFT JOIN public.users u ON u.id = c.user_id
               WHERE 1=1`
    const { status } = req.query
    if (status && ALLOWED_STATUSES.includes(status)) {
      params.push(status)
      sql += ` AND c.status = $${params.length}`
    }
    sql += ' ORDER BY c.created_at DESC LIMIT 100'
    const { rows } = await query(sql, params)
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load admin complaints:', err.message)
    res.status(500).json({ error: 'Failed to load complaints' })
  }
})

router.patch('/api/complaints/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status must be open, in_progress, or resolved' })
    }
    const { rows } = await query(
      `UPDATE public.complaints
       SET status = $1,
           assigned_to = $2,
           resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, user_id AS "userId", area, title, message, priority, status,
                 assigned_to AS "assignedTo", resolved_at AS "resolvedAt", updated_at AS "updatedAt"`,
      [status, req.user.id, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Complaint not found' })
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Failed to update complaint status:', err.message)
    res.status(500).json({ error: 'Failed to update complaint' })
  }
})

export default router
