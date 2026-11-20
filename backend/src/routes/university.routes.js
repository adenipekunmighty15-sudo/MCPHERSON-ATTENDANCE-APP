import { Router } from 'express'
import { authenticate, isValidRole } from '../middleware/auth.js'
import { query } from '../../lib/db.js'

const router = Router()

const ADMIN_ROLES = ['super_admin', 'admin']
const STAFF_ROLES = ['super_admin', 'admin', 'lecturer']

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` })
    }
    next()
  }
}

// There is no audit table in the current schema. Mutations are therefore
// logged server-side only. If an audit table is added later, insert a row here
// (action, actor id/role, target, timestamp) instead of / in addition to this log.
router.use('/api/admin', (req, res, next) => {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      console.error('[admin-audit]', JSON.stringify({
        at: new Date().toISOString(),
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
      }))
    })
  }
  next()
})

function serverError(res, message, err) {
  console.error(`[admin] ${message}:`, err?.message || err)
  return res.status(500).json({ error: message })
}

// The admin UI uses shorter date field names than the database columns.
// Normalise them here so the browser never needs to know the schema.
const DATE_FIELD_ALIASES = Object.freeze({
  registration_start: 'registration_start_date',
  registration_end: 'registration_end_date',
  exam_start: 'exam_start_date',
  exam_end: 'exam_end_date',
})

function normaliseAdminBody(req, res, next) {
  if (req.method === 'GET' || !req.body || typeof req.body !== 'object') return next()
  for (const [alias, column] of Object.entries(DATE_FIELD_ALIASES)) {
    if (!Object.prototype.hasOwnProperty.call(req.body, alias)) continue
    const value = req.body[alias]
    if (!Object.prototype.hasOwnProperty.call(req.body, column)) {
      req.body[column] = value === '' ? null : value
    }
    delete req.body[alias]
  }
  if (req.body.established_date === '') req.body.established_date = null
  next()
}

router.use('/api/admin', normaliseAdminBody)

// Build a parameterized UPDATE from only the fields the caller actually sent.
// Missing fields must never null out existing values.
function buildUpdate(body, allowedFields) {
  const assignments = []
  const values = []
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      assignments.push(`${field} = $${values.length + 1}`)
      values.push(body[field])
    }
  }
  return { assignments, values }
}

async function updateRecord(table, id, body, allowedFields, options = {}) {
  const { assignments, values } = buildUpdate(body, allowedFields)
  if (!assignments.length) return null
  if (options.touch) assignments.push('updated_at = NOW()')
  values.push(id)
  const returning = options.returning || '*'
  const { rows } = await query(
    `UPDATE public.${table} SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING ${returning}`,
    values
  )
  return rows[0] || null
}

// ── Faculties ──────────────────────────────────────────────
router.get('/api/admin/faculties', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.faculties ORDER BY name')
    res.json(rows)
  } catch (err) { serverError(res, 'Failed to load faculties', err) }
})

router.post('/api/admin/faculties', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { name, code, description, dean_id, established_date } = req.body
    const { rows } = await query(
      `INSERT INTO public.faculties (name, code, description, dean_id, established_date) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, code, description || '', dean_id || null, established_date || null]
    )
    res.status(201).json(rows[0])
  } catch (err) { serverError(res, 'Failed to create faculty', err) }
})

router.put('/api/admin/faculties/:id', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const row = await updateRecord('faculties', req.params.id, req.body,
      ['name', 'code', 'description', 'dean_id', 'established_date', 'is_active'], { touch: true })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update faculty', err) }
})

router.delete('/api/admin/faculties/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.faculties WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { serverError(res, 'Failed to delete faculty', err) }
})

// ── Departments ────────────────────────────────────────────
router.get('/api/admin/departments', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { faculty_id } = req.query
    let sql = `SELECT d.*, f.name AS faculty_name FROM public.departments d LEFT JOIN public.faculties f ON f.id = d.faculty_id`
    const params = []
    if (faculty_id) { params.push(faculty_id); sql += ` WHERE d.faculty_id = $1` }
    sql += ' ORDER BY d.name'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { serverError(res, 'Failed to load departments', err) }
})

router.post('/api/admin/departments', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { name, code, faculty_id, description, hod_id } = req.body
    const { rows } = await query(
      `INSERT INTO public.departments (name, code, faculty_id, description, hod_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, code, faculty_id || null, description || '', hod_id || null]
    )
    res.status(201).json(rows[0])
  } catch (err) { serverError(res, 'Failed to create department', err) }
})

router.put('/api/admin/departments/:id', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const row = await updateRecord('departments', req.params.id, req.body,
      ['name', 'code', 'faculty_id', 'description', 'hod_id', 'is_active'], { touch: true })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update department', err) }
})

router.delete('/api/admin/departments/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.departments WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { serverError(res, 'Failed to delete department', err) }
})

// ── Programmes ─────────────────────────────────────────────
router.get('/api/admin/programmes', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
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
  } catch (err) { serverError(res, 'Failed to load programmes', err) }
})

router.post('/api/admin/programmes', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { name, code, department_id, faculty_id, degree_type, duration_years, description } = req.body
    const { rows } = await query(
      `INSERT INTO public.programmes (name, code, department_id, faculty_id, degree_type, duration_years, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, code, department_id || null, faculty_id || null, degree_type || 'Bachelor', duration_years || 4, description || '']
    )
    res.status(201).json(rows[0])
  } catch (err) { serverError(res, 'Failed to create programme', err) }
})

router.put('/api/admin/programmes/:id', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const row = await updateRecord('programmes', req.params.id, req.body,
      ['name', 'code', 'department_id', 'faculty_id', 'degree_type', 'duration_years', 'description', 'is_active'],
      { touch: true })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update programme', err) }
})

router.delete('/api/admin/programmes/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.programmes WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { serverError(res, 'Failed to delete programme', err) }
})

// ── Academic Years ─────────────────────────────────────────
router.get('/api/admin/academic-years', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.academic_years ORDER BY start_date DESC')
    res.json(rows)
  } catch (err) { serverError(res, 'Failed to load academic years', err) }
})

router.post('/api/admin/academic-years', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { name, start_date, end_date, is_current } = req.body
    if (is_current) await query('UPDATE public.academic_years SET is_current = false')
    const { rows } = await query(
      `INSERT INTO public.academic_years (name, start_date, end_date, is_current) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, start_date, end_date, is_current || false]
    )
    res.status(201).json(rows[0])
  } catch (err) { serverError(res, 'Failed to create academic year', err) }
})

router.put('/api/admin/academic-years/:id', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    if (req.body.is_current === true) await query('UPDATE public.academic_years SET is_current = false')
    const row = await updateRecord('academic_years', req.params.id, req.body,
      ['name', 'start_date', 'end_date', 'is_current'], { touch: true })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update academic year', err) }
})

router.delete('/api/admin/academic-years/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.academic_years WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { serverError(res, 'Failed to delete academic year', err) }
})

// ── Semesters ──────────────────────────────────────────────
router.get('/api/admin/semesters', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
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
  } catch (err) { serverError(res, 'Failed to load semesters', err) }
})

router.post('/api/admin/semesters', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { academic_year_id, name, type, start_date, end_date, registration_start_date, registration_end_date, exam_start_date, exam_end_date, is_current } = req.body
    if (is_current) await query('UPDATE public.semesters SET is_current = false')
    const { rows } = await query(
      `INSERT INTO public.semesters (academic_year_id, name, type, start_date, end_date, registration_start_date, registration_end_date, exam_start_date, exam_end_date, is_current)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [academic_year_id, name, type, start_date, end_date, registration_start_date || null, registration_end_date || null, exam_start_date || null, exam_end_date || null, is_current || false]
    )
    res.status(201).json(rows[0])
  } catch (err) { serverError(res, 'Failed to create semester', err) }
})

router.put('/api/admin/semesters/:id', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    if (req.body.is_current === true) await query('UPDATE public.semesters SET is_current = false')
    const row = await updateRecord('semesters', req.params.id, req.body,
      ['academic_year_id', 'name', 'type', 'start_date', 'end_date', 'registration_start_date',
        'registration_end_date', 'exam_start_date', 'exam_end_date', 'is_current'],
      { touch: true })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update semester', err) }
})

router.delete('/api/admin/semesters/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query('DELETE FROM public.semesters WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { serverError(res, 'Failed to delete semester', err) }
})

// ── Users (admin: list/update role) ────────────────────────
router.get('/api/admin/users', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
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
  } catch (err) { serverError(res, 'Failed to load users', err) }
})

router.put('/api/admin/users/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, 'role') && !isValidRole(req.body.role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    const row = await updateRecord('users', req.params.id, req.body,
      ['role', 'faculty_id', 'department', 'department_id', 'programme_id', 'level', 'is_active'],
      { returning: 'id, email, name, role, department' })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update user', err) }
})

// ── Courses (admin: full control) ──────────────────────────
router.get('/api/admin/courses', authenticate, requireRole(...STAFF_ROLES), async (req, res) => {
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
  } catch (err) { serverError(res, 'Failed to load courses', err) }
})

router.put('/api/admin/courses/:id', authenticate, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const row = await updateRecord('courses', req.params.id, req.body,
      ['faculty_id', 'programme_id', 'semester_id', 'academic_year_id', 'department_id', 'level', 'is_elective', 'status'],
      { touch: true })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update course', err) }
})

// ── Lecturer Course Assignment ─────────────────────────────
router.get('/api/admin/lecturer-courses', authenticate, requireRole(...STAFF_ROLES), async (req, res) => {
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
  } catch (err) { serverError(res, 'Failed to load lecturer courses', err) }
})

router.post('/api/admin/lecturer-courses', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { lecturer_id, course_id, semester_id, role } = req.body
    const { rows } = await query(
      `INSERT INTO public.lecturer_courses (lecturer_id, course_id, semester_id, role)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [lecturer_id, course_id, semester_id || null, role || 'instructor']
    )
    res.status(201).json(rows[0])
  } catch (err) { serverError(res, 'Failed to assign lecturer', err) }
})

router.delete('/api/admin/lecturer-courses/:id', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    await query('DELETE FROM public.lecturer_courses WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { serverError(res, 'Failed to remove lecturer assignment', err) }
})

// ── Enrollments ────────────────────────────────────────────
router.get('/api/admin/enrollments', authenticate, requireRole(...STAFF_ROLES), async (req, res) => {
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
  } catch (err) { serverError(res, 'Failed to load enrollments', err) }
})

router.post('/api/admin/enrollments', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
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
    serverError(res, 'Failed to create enrollment', err)
  }
})

router.put('/api/admin/enrollments/:id', authenticate, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const row = await updateRecord('enrollments', req.params.id, req.body,
      ['grade', 'grade_point', 'status'], { touch: true })
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) { serverError(res, 'Failed to update enrollment', err) }
})

router.delete('/api/admin/enrollments/:id', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    await query('DELETE FROM public.enrollments WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { serverError(res, 'Failed to delete enrollment', err) }
})

// ── Grade System ───────────────────────────────────────────
router.get('/api/admin/grade-system', authenticate, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.grade_system ORDER BY min_score DESC')
    res.json(rows)
  } catch (err) { serverError(res, 'Failed to load grade system', err) }
})

// ── Eligibility / Attendance Summary ───────────────────────
router.get('/api/admin/eligibility', authenticate, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const { course_id, semester_id } = req.query
    let sql = `SELECT e.*, u.name AS user_name, u.admission_number, c.code AS course_code, c.title AS course_title
               FROM public.exam_eligibility_status e
               JOIN public.users u ON u.id::text = e.user_id
               JOIN public.courses c ON c.id = e.course_id
               WHERE 1=1`
    const params = []
    if (course_id) { params.push(course_id); sql += ` AND e.course_id = $${params.length}` }
    if (semester_id) { params.push(semester_id); sql += ` AND c.semester_id = $${params.length}` }
    sql += ' ORDER BY u.name'
    const { rows } = await query(sql, params)
    res.json(rows)
  } catch (err) { serverError(res, 'Failed to load eligibility', err) }
})

export default router
