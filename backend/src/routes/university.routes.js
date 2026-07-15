import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'

const router = Router()

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` })
    next()
  }
}

// ── Faculties ──────────────────────────────────────────────
router.get('/api/admin/faculties', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.faculties ORDER BY name')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/api/admin/faculties', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, code, description, dean_id } = req.body
    const { rows } = await query(
      `INSERT INTO public.faculties (name, code, description, dean_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, code, description || '', dean_id || null]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/api/admin/faculties/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, code, description, dean_id, is_active } = req.body
    const { rows } = await query(
      `UPDATE public.faculties SET name=$1, code=$2, description=$3, dean_id=$4, is_active=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [name, code, description, dean_id, is_active, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/api/admin/faculties/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.faculties WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Departments ────────────────────────────────────────────
router.get('/api/admin/departments', authenticate, async (req, res) => {
  try {
    const { faculty_id } = req.query
    let sql = `SELECT d.*, f.name AS faculty_name FROM public.departments d LEFT JOIN public.faculties f ON f.id = d.faculty_id`
    const params = []
    if (faculty_id) { params.push(faculty_id); sql += ` WHERE d.faculty_id = $1` }
    sql += ' ORDER BY d.name'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/api/admin/departments', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, code, faculty_id, description, hod_id } = req.body
    const { rows } = await query(
      `INSERT INTO public.departments (name, code, faculty_id, description, hod_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, code, faculty_id || null, description || '', hod_id || null]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/api/admin/departments/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, code, faculty_id, description, hod_id, is_active } = req.body
    const { rows } = await query(
      `UPDATE public.departments SET name=$1, code=$2, faculty_id=$3, description=$4, hod_id=$5, is_active=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [name, code, faculty_id, description, hod_id, is_active, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/api/admin/departments/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.departments WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Programmes ─────────────────────────────────────────────
router.get('/api/admin/programmes', authenticate, async (req, res) => {
  try {
    const { department_id, faculty_id } = req.query
    let sql = `SELECT p.*, d.name AS department_name, f.name AS faculty_name
               FROM public.programmes p
               LEFT JOIN public.departments d ON d.id = p.department_id
               LEFT JOIN public.faculties f ON f.id = p.faculty_id
               WHERE 1=1`
    const params = []
    if (department_id) { params.push(department_id); sql += ` AND p.department_id = $${params.length}` }
    if (faculty_id) { params.push(faculty_id); sql += ` AND p.faculty_id = $${params.length}` }
    sql += ' ORDER BY p.name'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/api/admin/programmes', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, code, department_id, faculty_id, degree_type, duration_years, description } = req.body
    const { rows } = await query(
      `INSERT INTO public.programmes (name, code, department_id, faculty_id, degree_type, duration_years, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, code, department_id || null, faculty_id || null, degree_type || 'Bachelor', duration_years || 4, description || '']
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/api/admin/programmes/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, code, department_id, faculty_id, degree_type, duration_years, description, is_active } = req.body
    const { rows } = await query(
      `UPDATE public.programmes SET name=$1, code=$2, department_id=$3, faculty_id=$4, degree_type=$5, duration_years=$6, description=$7, is_active=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, code, department_id, faculty_id, degree_type, duration_years, description, is_active, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/api/admin/programmes/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.programmes WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Academic Years ─────────────────────────────────────────
router.get('/api/admin/academic-years', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.academic_years ORDER BY start_date DESC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/api/admin/academic-years', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, start_date, end_date, is_current } = req.body
    if (is_current) await query('UPDATE public.academic_years SET is_current = false')
    const { rows } = await query(
      `INSERT INTO public.academic_years (name, start_date, end_date, is_current) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, start_date, end_date, is_current || false]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/api/admin/academic-years/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, start_date, end_date, is_current } = req.body
    if (is_current) await query('UPDATE public.academic_years SET is_current = false')
    const { rows } = await query(
      `UPDATE public.academic_years SET name=$1, start_date=$2, end_date=$3, is_current=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [name, start_date, end_date, is_current, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/api/admin/academic-years/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.academic_years WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Semesters ──────────────────────────────────────────────
router.get('/api/admin/semesters', authenticate, async (req, res) => {
  try {
    const { academic_year_id } = req.query
    let sql = `SELECT s.*, ay.name AS academic_year_name
               FROM public.semesters s
               JOIN public.academic_years ay ON ay.id = s.academic_year_id`
    const params = []
    if (academic_year_id) { params.push(academic_year_id); sql += ` WHERE s.academic_year_id = $1` }
    sql += ' ORDER BY s.start_date DESC'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/api/admin/semesters', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { academic_year_id, name, type, start_date, end_date, registration_start_date, registration_end_date, exam_start_date, exam_end_date, is_current } = req.body
    if (is_current) await query('UPDATE public.semesters SET is_current = false')
    const { rows } = await query(
      `INSERT INTO public.semesters (academic_year_id, name, type, start_date, end_date, registration_start_date, registration_end_date, exam_start_date, exam_end_date, is_current)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [academic_year_id, name, type, start_date, end_date, registration_start_date || null, registration_end_date || null, exam_start_date || null, exam_end_date || null, is_current || false]
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/api/admin/semesters/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const updates = req.body
    if (updates.is_current) await query('UPDATE public.semesters SET is_current = false')
    const { rows } = await query(
      `UPDATE public.semesters SET academic_year_id=$1, name=$2, type=$3, start_date=$4, end_date=$5, registration_start_date=$6, registration_end_date=$7, exam_start_date=$8, exam_end_date=$9, is_current=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [updates.academic_year_id, updates.name, updates.type, updates.start_date, updates.end_date, updates.registration_start_date || null, updates.registration_end_date || null, updates.exam_start_date || null, updates.exam_end_date || null, updates.is_current, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/api/admin/semesters/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.semesters WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Users (admin: list/update role) ────────────────────────
router.get('/api/admin/users', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { role: filterRole } = req.query
    let sql = `SELECT u.id, u.email, u.name, u.role, u.department, u.is_active, u.admission_number, u.staff_id, u.level, u.cgpa, u.faculty_id, u.department_id, u.programme_id, u.created_at,
               f.name AS faculty_name, d.name AS department_name
               FROM public.users u
               LEFT JOIN public.faculties f ON f.id = u.faculty_id
               LEFT JOIN public.departments d ON d.id = u.department_id
               WHERE 1=1`
    const params = []
    if (filterRole) { params.push(filterRole); sql += ` AND u.role = $${params.length}` }
    sql += ' ORDER BY u.created_at DESC'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/api/admin/users/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { role, faculty_id, department_id, programme_id, level, is_active } = req.body
    const { rows } = await query(
      `UPDATE public.users SET role=$1, faculty_id=$2, department_id=$3, programme_id=$4, level=$5, is_active=$6 WHERE id=$7 RETURNING id, email, name, role, department`,
      [role, faculty_id || null, department_id || null, programme_id || null, level || '100', is_active, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Courses (admin: full control) ──────────────────────────
router.get('/api/admin/courses', authenticate, requireRole('super_admin', 'admin', 'lecturer'), async (req, res) => {
  try {
    const { department, level, faculty_id, programme_id } = req.query
    let sql = `SELECT c.*, d.name AS department_name, f.name AS faculty_name
               FROM public.courses c
               LEFT JOIN public.departments d ON d.code = c.department
               LEFT JOIN public.faculties f ON f.id = c.faculty_id
               WHERE 1=1`
    const params = []
    if (department) { params.push(department); sql += ` AND c.department = $${params.length}` }
    if (level) { params.push(level); sql += ` AND c.level = $${params.length}` }
    if (faculty_id) { params.push(faculty_id); sql += ` AND c.faculty_id = $${params.length}` }
    sql += ' ORDER BY c.code'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/api/admin/courses/:id', authenticate, requireRole('super_admin', 'admin', 'lecturer'), async (req, res) => {
  try {
    const { faculty_id, programme_id, semester_id, academic_year_id, department_id, is_elective, status } = req.body
    const { rows } = await query(
      `UPDATE public.courses SET faculty_id=$1, programme_id=$2, semester_id=$3, academic_year_id=$4, is_elective=$5, status=$6 WHERE id=$7 RETURNING *`,
      [faculty_id || null, programme_id || null, semester_id || null, academic_year_id || null, is_elective || false, status || 'active', req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Lecturer Course Assignment ─────────────────────────────
router.get('/api/admin/lecturer-courses', authenticate, requireRole('super_admin', 'admin', 'lecturer'), async (req, res) => {
  try {
    const { lecturer_id } = req.query
    let sql = `SELECT lc.*, c.code AS course_code, c.title AS course_title
               FROM public.lecturer_courses lc
               JOIN public.courses c ON c.id = lc.course_id`
    const params = []
    if (lecturer_id) { params.push(lecturer_id); sql += ` WHERE lc.lecturer_id = $1` }
    sql += ' ORDER BY c.code'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/api/admin/lecturer-courses', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { lecturer_id, course_id, semester_id, role } = req.body
    const { rows } = await query(
      `INSERT INTO public.lecturer_courses (lecturer_id, course_id, semester_id, role)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [lecturer_id, course_id, semester_id || null, role || 'instructor']
    )
    res.status(201).json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/api/admin/lecturer-courses/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.lecturer_courses WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Enrollments ────────────────────────────────────────────
router.get('/api/admin/enrollments', authenticate, requireRole('super_admin', 'admin', 'lecturer'), async (req, res) => {
  try {
    const { course_id, semester_id } = req.query
    let sql = `SELECT e.*, u.name AS user_name, u.email AS user_email, u.admission_number
               FROM public.enrollments e
               JOIN public.users u ON u.id = e.user_id
               WHERE 1=1`
    const params = []
    if (course_id) { params.push(course_id); sql += ` AND e.course_id = $${params.length}` }
    if (semester_id) { params.push(semester_id); sql += ` AND e.semester_id = $${params.length}` }
    sql += ' ORDER BY u.name'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/api/admin/enrollments', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { user_id, course_id, course_name, semester_id, academic_year_id } = req.body
    const { rows } = await query(
      `INSERT INTO public.enrollments (user_id, course_id, course_name, semester_id, academic_year_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user_id, course_id, course_name || '', semester_id || null, academic_year_id || null]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already enrolled' })
    res.status(500).json({ error: err.message })
  }
})

router.put('/api/admin/enrollments/:id', authenticate, requireRole('super_admin', 'admin', 'lecturer'), async (req, res) => {
  try {
    const { grade, grade_point, status } = req.body
    const { rows } = await query(
      `UPDATE public.enrollments SET grade=$1, grade_point=$2, status=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [grade || '', grade_point || 0, status || 'active', req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/api/admin/enrollments/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.enrollments WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Grade System ───────────────────────────────────────────
router.get('/api/admin/grade-system', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.grade_system ORDER BY min_score DESC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Eligibility / Attendance Summary ───────────────────────
router.get('/api/admin/eligibility', authenticate, requireRole('super_admin', 'admin', 'lecturer'), async (req, res) => {
  try {
    const { course_id, semester_id } = req.query
    let sql = `SELECT e.*, u.name AS user_name, u.admission_number, c.code AS course_code, c.title AS course_title
               FROM public.jupeb_eligibility_status e
               JOIN public.users u ON u.id::text = e.user_id
               JOIN public.courses c ON c.id = e.course_id
               WHERE 1=1`
    const params = []
    if (course_id) { params.push(course_id); sql += ` AND e.course_id = $${params.length}` }
    if (semester_id) { params.push(semester_id); sql += ` AND c.semester_id = $${params.length}` }
    sql += ' ORDER BY u.name'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router