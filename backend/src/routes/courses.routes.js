import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query, generateCourses } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { notifyDepartment } from '../services/notification.js'

const router = Router()

router.get('/api/faculties', async (req, res) => {
  try {
    const { rows } = await query('SELECT id, name, code FROM public.faculties ORDER BY name')
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load faculties:', err.message)
    res.status(500).json({ error: 'Failed to load faculties' })
  }
})

router.get('/api/departments', async (req, res) => {
  try {
    const { facultyId } = req.query
    let sql = `SELECT d.id, d.name, d.code, d.faculty_id AS "facultyId", f.name AS "facultyName"
      FROM public.departments d
      LEFT JOIN public.faculties f ON f.id = d.faculty_id`
    const params = []
    if (facultyId) { params.push(facultyId); sql += ` WHERE d.faculty_id = $${params.length}` }
    sql += ' ORDER BY d.name'
    const { rows } = await query(sql, params)
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load departments:', err.message)
    res.status(500).json({ error: 'Failed to load departments' })
  }
})

router.get('/api/courses', async (req, res) => {
  try {
    const { department, departmentId, level, college, facultyId } = req.query
    let sql = `SELECT c.id, c.code, c.title, c.level, c.units,
      c.department_id AS "departmentId", c.faculty_id AS "facultyId",
      c.lecturer_id AS "lecturerId", c.custom, c.created_at AS "createdAt",
      d.name AS "departmentName", d.code AS "departmentCode",
      f.name AS "facultyName", f.code AS "facultyCode"
      FROM public.courses c
      LEFT JOIN public.departments d ON d.id = c.department_id
      LEFT JOIN public.faculties f ON f.id = c.faculty_id
      WHERE 1=1`
    const params = []
    if (departmentId) { params.push(departmentId); sql += ` AND c.department_id = $${params.length}` }
    if (facultyId) { params.push(facultyId); sql += ` AND c.faculty_id = $${params.length}` }
    if (level) { params.push(level); sql += ` AND c.level = $${params.length}` }
    sql += ' ORDER BY c.code ASC'
    const { rows } = await query(sql, params)
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load courses:', err.message)
    res.status(500).json({ error: 'Failed to load courses' })
  }
})

router.post('/api/courses', authenticate, async (req, res) => {
  try {
    const { code, title, level, units, departmentId, facultyId } = req.body
    if (!code || !title) return res.status(400).json({ error: 'Code and title required' })
    const id = randomUUID()
    await query(
      `INSERT INTO public.courses (id, code, title, level, units, department_id, faculty_id, custom, lecturer_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,NOW())`,
      [id, code, title, level || '100', units || 3, departmentId || null, facultyId || null, req.user.id]
    )
    const { rows } = await query(
      `SELECT c.id, c.code, c.title, c.level, c.units,
        c.department_id AS "departmentId", c.faculty_id AS "facultyId",
        c.lecturer_id AS "lecturerId", c.custom, c.created_at AS "createdAt",
        d.name AS "departmentName", f.name AS "facultyName"
       FROM public.courses c
       LEFT JOIN public.departments d ON d.id = c.department_id
       LEFT JOIN public.faculties f ON f.id = c.faculty_id
       WHERE c.id = $1`,
      [id]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create course:', err.message)
    res.status(500).json({ error: 'Failed to create course' })
  }
})

router.post('/api/courses/seed', async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT COUNT(*) as c FROM public.courses')
    if (parseInt(existing[0].c) > 0) {
      return res.status(200).json({ message: 'Courses already seeded', count: parseInt(existing[0].c) })
    }
    const { courses } = generateCourses()
    let inserted = 0
    for (const c of courses) {
      try {
        await query(
          `INSERT INTO public.courses (id, code, title, level, units, custom)
           VALUES ($1,$2,$3,$4,$5,false) ON CONFLICT (id) DO NOTHING`,
          [c.id, c.code, c.title, c.level, c.units]
        )
        inserted++
      } catch (e) { console.error('Seed course failed:', c.code, e.message) }
    }
    res.status(201).json({ message: 'Courses seeded', count: inserted })
  } catch (err) {
    console.error('Seed error:', err.message)
    res.status(500).json({ error: 'Seed failed' })
  }
})

export default router
