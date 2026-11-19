import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
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

// Courses shown on the student dashboard / attendance screens. Some schemas
// used enrollment_status instead of status, so fall back if the column is old.
router.get('/api/courses/enrolled', authenticate, async (req, res) => {
  const baseSql = `SELECT DISTINCT
      c.id, c.code, c.title, c.level, c.units AS "creditUnits",
      c.department_id AS "departmentId", c.lecturer_id AS "lecturerId",
      e.course_id AS "courseId", e.course_name AS "courseName", e.status,
      lecturer.name AS lecturer,
      d.name AS "departmentName"
    FROM public.enrollments e
    LEFT JOIN public.courses c ON c.id::text = e.course_id
    LEFT JOIN public.users lecturer ON lecturer.id = c.lecturer_id
    LEFT JOIN public.departments d ON d.id = c.department_id
    WHERE (e.user_id = $1 AND COALESCE(e.status, 'active') <> 'dropped')
       OR c.lecturer_id = $1
    UNION
    SELECT DISTINCT
      c.id, c.code, c.title, c.level, c.units AS "creditUnits",
      c.department_id AS "departmentId", c.lecturer_id AS "lecturerId",
      c.id::text AS "courseId", c.title AS "courseName", 'active'::text AS status,
      lecturer.name AS lecturer,
      d.name AS "departmentName"
    FROM public.users student
    JOIN public.departments d ON (
      d.id::text = student.department_id::text OR
      lower(d.name) = lower(student.department) OR
      lower(d.code) = lower(student.department)
    )
    JOIN public.courses c ON c.department_id::text = d.id::text
    LEFT JOIN public.users lecturer ON lecturer.id = c.lecturer_id
    WHERE student.id = $1
    ORDER BY code NULLS LAST, "courseName", title`

  try {
    const { rows } = await query(baseSql, [req.user.id])
    return res.status(200).json(rows)
  } catch (err) {
    if (!/column e\.status|status.*does not exist/i.test(err.message)) {
      console.error('Failed to load enrolled courses:', err.message)
      return res.status(500).json({ error: 'Failed to load enrolled courses' })
    }
  }

  try {
    const legacySql = baseSql.replace('e.status,', 'e.enrollment_status AS status,').replace(/COALESCE\(e\.status, 'active'\)/, "COALESCE(e.enrollment_status, 'Active')")
    const { rows } = await query(legacySql, [req.user.id])
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load enrolled courses:', err.message)
    res.status(500).json({ error: 'Failed to load enrolled courses' })
  }
})

router.post('/api/courses', authenticate, async (req, res) => {
  try {
    if (!['lecturer', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only lecturers and administrators can create courses' })
    }
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

export default router
