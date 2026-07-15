import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { notifyDepartment } from '../services/notification.js'

const router = Router()

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

    const { rows: existing } = await query('SELECT * FROM public.timetable WHERE id = $1', [id])
    if (!existing.length) return res.status(404).json({ error: 'Entry not found' })

    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to change this class' })
    }

    await query(
      `UPDATE public.timetable 
       SET course = $1, day = $2, time = $3, room = $4, lecturer = $5, type = $6, department = $7, updated_at = NOW() 
       WHERE id = $8`,
      [course, day, time, room, lecturer, type, department, id]
    )

    if (department) {
      notifyDepartment(
        department,
        'class_update',
        `Class Updated: ${course}`,
        `The schedule for ${course} has been modified. New time: ${time} in ${room}.`,
        '/timetable',
        { timetableId: id, course }
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
    const { rows } = await query('SELECT * FROM public.timetable WHERE id = $1', [id])
    if (!rows.length) return res.status(404).json({ error: 'Entry not found' })
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
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
