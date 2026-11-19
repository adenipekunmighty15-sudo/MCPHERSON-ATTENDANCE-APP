import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { notifyDepartment } from '../services/notification.js'

const router = Router()

const STAFF_ROLES = ['lecturer', 'admin', 'super_admin']
const isStaff = role => STAFF_ROLES.includes(role)

router.get('/api/timetable', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.timetable ORDER BY created_at ASC')
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load timetable:', err.message)
    res.status(500).json({ error: 'Failed to load timetable' })
  }
})

router.post('/api/timetable', authenticate, async (req, res) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only lecturers and administrators can create timetable entries' })
    }
    const { course, day, time, room, lecturer, type } = req.body
    if (!course || !day || !time) return res.status(400).json({ error: 'Course, day and time required' })
    const id = randomUUID()
    await query(
      `INSERT INTO public.timetable (id, course, day, time, room, lecturer, type, user_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [id, course, day, time, room || '', lecturer || '', type || 'lecture', req.user.id]
    )
    const { rows } = await query('SELECT * FROM public.timetable WHERE id = $1', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create timetable entry:', err.message)
    res.status(500).json({ error: 'Failed to create timetable entry' })
  }
})

router.put('/api/timetable/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { course, day, time, room, lecturer, type, department } = req.body

    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only lecturers and administrators can change timetable entries' })
    }

    const { rows: existing } = await query('SELECT * FROM public.timetable WHERE id = $1', [id])
    if (!existing.length) return res.status(404).json({ error: 'Entry not found' })

    if (!['admin', 'super_admin'].includes(req.user.role) && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to change this class' })
    }

    const changes = { course, day, time, room, lecturer, type, department }
    const fields = Object.entries(changes).filter(([field]) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    )
    if (!fields.length) return res.status(400).json({ error: 'At least one timetable field is required' })
    if (fields.some(([, value]) => value === null || typeof value !== 'string')) {
      return res.status(400).json({ error: 'Timetable fields must be strings' })
    }
    if (fields.some(([field, value]) => ['course', 'day', 'time'].includes(field) && !value.trim())) {
      return res.status(400).json({ error: 'Course, day and time cannot be empty' })
    }

    const assignments = fields.map(([field], index) => `${field} = $${index + 1}`)
    const values = fields.map(([, value]) => value)
    assignments.push(`updated_at = NOW()`)
    values.push(id)
    await query(
      `UPDATE public.timetable SET ${assignments.join(', ')} WHERE id = $${values.length}`,
      values
    )

    // Patch-safe notification: use stored values for fields the caller omitted.
    const notifyDepartmentName = department || existing[0].department
    if (notifyDepartmentName) {
      const notifiedCourse = course || existing[0].course
      notifyDepartment(
        notifyDepartmentName,
        'class_update',
        `Class Updated: ${notifiedCourse}`,
        `The schedule for ${notifiedCourse} has been modified. New time: ${time || existing[0].time} in ${room || existing[0].room}.`,
        '/timetable',
        { timetableId: id, course: notifiedCourse }
      )
    }

    const { rows } = await query('SELECT * FROM public.timetable WHERE id = $1', [id])
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Failed to update timetable entry:', err.message)
    res.status(500).json({ error: 'Failed to update timetable entry' })
  }
})

router.delete('/api/timetable/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only lecturers and administrators can delete timetable entries' })
    }
    const { rows } = await query('SELECT * FROM public.timetable WHERE id = $1', [id])
    if (!rows.length) return res.status(404).json({ error: 'Entry not found' })
    if (rows[0].user_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    await query('DELETE FROM public.timetable WHERE id = $1', [id])
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to delete timetable entry:', err.message)
    res.status(500).json({ error: 'Failed to delete timetable entry' })
  }
})

export default router
