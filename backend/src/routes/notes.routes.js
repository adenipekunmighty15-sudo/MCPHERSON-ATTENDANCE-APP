import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'

const router = Router()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const NOTE_FIELDS = `id, course_code AS "courseCode", course_title AS "courseTitle",
  department, title, content, created_at AS "createdAt", updated_at AS "updatedAt"`

function cleanText(value, fallback = '', max = 20_000) {
  return String(value ?? fallback).trim().slice(0, max)
}

router.get('/api/course-notes', authenticate, async (req, res) => {
  try {
    const params = [req.user.id]
    let where = 'WHERE user_id = $1'
    const courseCode = cleanText(req.query.courseCode, '', 40)
    if (courseCode) {
      params.push(courseCode)
      where += ` AND course_code = $${params.length}`
    }
    const { rows } = await query(
      `SELECT ${NOTE_FIELDS} FROM public.course_notes ${where} ORDER BY updated_at DESC`,
      params
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load course notes:', err.message)
    res.status(500).json({ error: 'Failed to load notes' })
  }
})

router.post('/api/course-notes', authenticate, async (req, res) => {
  const courseCode = cleanText(req.body?.courseCode, '', 40)
  if (!courseCode) return res.status(400).json({ error: 'A course code is required' })

  try {
    const { rows } = await query(
      `INSERT INTO public.course_notes
        (user_id, course_code, course_title, department, title, content)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING ${NOTE_FIELDS}`,
      [
        req.user.id,
        courseCode,
        cleanText(req.body?.courseTitle, '', 200),
        cleanText(req.body?.department, '', 120),
        cleanText(req.body?.title, 'Untitled note', 200) || 'Untitled note',
        cleanText(req.body?.content, '', 20_000),
      ]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create course note:', err.message)
    res.status(500).json({ error: 'Failed to save note' })
  }
})

router.put('/api/course-notes/:id', authenticate, async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid note ID' })

  try {
    const { rows } = await query(
      `UPDATE public.course_notes
       SET title = $1, content = $2, course_title = $3, department = $4, updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING ${NOTE_FIELDS}`,
      [
        cleanText(req.body?.title, 'Untitled note', 200) || 'Untitled note',
        cleanText(req.body?.content, '', 20_000),
        cleanText(req.body?.courseTitle, '', 200),
        cleanText(req.body?.department, '', 120),
        req.params.id,
        req.user.id,
      ]
    )
    if (!rows.length) return res.status(404).json({ error: 'Note not found' })
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Failed to update course note:', err.message)
    res.status(500).json({ error: 'Failed to update note' })
  }
})

router.delete('/api/course-notes/:id', authenticate, async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid note ID' })

  try {
    const { rowCount } = await query(
      'DELETE FROM public.course_notes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Note not found' })
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to delete course note:', err.message)
    res.status(500).json({ error: 'Failed to delete note' })
  }
})

export default router
