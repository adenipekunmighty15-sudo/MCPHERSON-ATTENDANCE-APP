import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'

const router = Router()

const ADMIN_ROLES = ['admin', 'super_admin']
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 100

// Returns null when the supplied value is not a valid positive integer.
function parsePositiveInt(value, fallback, max) {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) return null
  return parsed
}

// Admins see all attendance. Lecturers are scoped to courses they teach
// (course ownership, explicit assignments, or sessions they ran); students
// are scoped to their own records.
function attendanceScope(req) {
  if (ADMIN_ROLES.includes(req.user.role)) return { where: '', params: [] }
  if (req.user.role === 'lecturer') {
    return {
      where: `WHERE (
          c.lecturer_id = $1
          OR EXISTS (
            SELECT 1 FROM public.lecturer_courses lc
            WHERE lc.course_id::text = a.course_id::text AND lc.lecturer_id = $1
          )
          OR EXISTS (
            SELECT 1 FROM public.live_sessions ls
            WHERE ls.id::text = a.session_id::text AND ls.lecturer_id = $1
          )
        )`,
      params: [req.user.id],
    }
  }
  return { where: 'WHERE a.user_id = $1', params: [req.user.id] }
}

router.get('/api/reports', authenticate, async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT)
    const page = parsePositiveInt(req.query.page, 1, 1000000)
    if (limit === null || page === null) {
      return res.status(400).json({ error: 'Invalid report pagination' })
    }

    // ?page= is preferred; legacy ?offset= remains supported for existing callers.
    let offset
    if (req.query.page !== undefined) {
      offset = (page - 1) * limit
    } else {
      const legacyOffset = Number(req.query.offset ?? 0)
      if (!Number.isInteger(legacyOffset) || legacyOffset < 0 || legacyOffset > 1000000) {
        return res.status(400).json({ error: 'Invalid report pagination' })
      }
      offset = legacyOffset
      // Derive a page number so meta remains meaningful for legacy callers.
      // (Reassigned below via a local const to avoid mutating `page`.)
    }
    const effectivePage = req.query.page !== undefined ? page : Math.floor(offset / limit) + 1

    const scope = attendanceScope(req)
    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total
       FROM public.attendance a
       LEFT JOIN public.courses c ON a.course_id = c.id
       ${scope.where}`,
      scope.params
    )
    const total = countRows[0]?.total ?? 0

    const params = [...scope.params, limit, offset]
    const { rows } = await query(
      `SELECT a.*, c.title as course_name_fallback, u.name as student_name, u.email as student_email
       FROM public.attendance a
       LEFT JOIN public.courses c ON a.course_id = c.id
       LEFT JOIN public.users u ON a.user_id = u.id
       ${scope.where}
       ORDER BY a.timestamp DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )
    const enriched = rows.map(r => ({
      ...r,
      courseId: r.course_id || '',
      courseName: r.course_name_fallback || r.course_name || 'Unknown',
      userId: r.user_id || '',
      studentName: r.student_name || 'Unknown',
      studentEmail: r.student_email || '',
    }))
    res.status(200).json({ data: enriched, meta: { page: effectivePage, limit, total } })
  } catch (err) {
    console.error('Failed to load reports:', err.message)
    res.status(500).json({ error: 'Failed to load reports' })
  }
})

router.get('/api/insights', authenticate, async (req, res) => {
  try {
    const canViewAll = ADMIN_ROLES.includes(req.user.role)
    const scope = attendanceScope(req)
    const { rows } = await query(
      `SELECT a.*, c.code AS course_code, c.title AS course_title, u.name AS student_name,
        u.email AS student_email, COALESCE(d.name, u.department) AS student_department
       FROM public.attendance a
       LEFT JOIN public.courses c ON a.course_id = c.id
       LEFT JOIN public.users u ON a.user_id = u.id
       LEFT JOIN public.departments d ON d.id = u.department_id
       ${scope.where}
       ORDER BY a.timestamp DESC`,
      scope.params
    )

    const totals = { records: rows.length, present: 0, absent: 0, ooo: 0, late: 0 }
    const byCourse = new Map()
    const byStudent = new Map()
    const byDepartment = new Map()

    for (const row of rows) {
      if (Object.prototype.hasOwnProperty.call(totals, row.status)) totals[row.status] += 1

      const courseId = row.course_id || row.course_name || 'general'
      if (!byCourse.has(courseId)) {
        byCourse.set(courseId, {
          courseId,
          courseName: row.course_code ? `${row.course_code} - ${row.course_title}` : row.course_name || 'General Check-in',
          records: 0,
          present: 0,
          absent: 0,
          ooo: 0,
          late: 0,
        })
      }
      const course = byCourse.get(courseId)
      course.records += 1
      if (Object.prototype.hasOwnProperty.call(course, row.status)) course[row.status] += 1

      const departmentName = String(row.student_department || '').trim()
      if (canViewAll && departmentName) {
        if (!byDepartment.has(departmentName)) {
          byDepartment.set(departmentName, { department: departmentName, records: 0, present: 0, late: 0, absent: 0 })
        }
        const department = byDepartment.get(departmentName)
        department.records += 1
        if (Object.prototype.hasOwnProperty.call(department, row.status)) department[row.status] += 1
      }

      if (canViewAll || req.user.role === 'lecturer') {
        const studentId = row.user_id || 'unknown'
        if (!byStudent.has(studentId)) {
          byStudent.set(studentId, {
            studentId,
            studentName: row.student_name || 'Unknown',
            studentEmail: row.student_email || '',
            department: row.student_department || '',
            records: 0,
            present: 0,
            lastSeen: row.timestamp,
          })
        }
        const student = byStudent.get(studentId)
        student.records += 1
        if (row.status === 'present') student.present += 1
        if (!student.lastSeen || new Date(row.timestamp) > new Date(student.lastSeen)) student.lastSeen = row.timestamp
      }
    }

    const courseBreakdown = [...byCourse.values()]
      .map(course => ({
        ...course,
        attendanceRate: course.records ? Math.round((course.present / course.records) * 100) : 0,
      }))
      .sort((a, b) => a.attendanceRate - b.attendanceRate || b.records - a.records)

    const atRiskStudents = [...byStudent.values()]
      .map(student => ({
        ...student,
        attendanceRate: student.records ? Math.round((student.present / student.records) * 100) : 0,
      }))
      .filter(student => student.records >= 2 && student.attendanceRate < 75)
      .sort((a, b) => a.attendanceRate - b.attendanceRate || b.records - a.records)
      .slice(0, 10)

    const departmentBreakdown = [...byDepartment.values()]
      .map(department => ({
        ...department,
        attendanceRate: department.records ? Math.round((department.present / department.records) * 100) : 0,
      }))
      .sort((a, b) => a.attendanceRate - b.attendanceRate || a.department.localeCompare(b.department))

    res.status(200).json({
      canViewAll,
      summary: {
        ...totals,
        attendanceRate: totals.records ? Math.round((totals.present / totals.records) * 100) : 0,
        courses: byCourse.size,
        atRiskStudents: atRiskStudents.length,
      },
      courseBreakdown,
      departmentBreakdown,
      atRiskStudents,
    })
  } catch (err) {
    console.error('Failed to load insights:', err.message)
    res.status(500).json({ error: 'Failed to load insights' })
  }
})

router.get('/api/stats', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [cRes, aRes, pRes, tRes, dRes, uRes] = await Promise.all([
      query('SELECT COUNT(*) as c FROM public.courses'),
      query("SELECT COUNT(*) as c FROM public.attendance WHERE user_id=$1", [req.user.id]),
      query("SELECT COUNT(*) as c FROM public.attendance WHERE user_id=$1 AND status='present'", [req.user.id]),
      query("SELECT COUNT(*) as c FROM public.attendance WHERE user_id=$1 AND date=$2", [req.user.id, today]),
      query("SELECT COUNT(DISTINCT department) as c FROM public.courses WHERE department IS NOT NULL AND department <> ''"),
      query('SELECT COUNT(*) as c FROM public.users'),
    ])
    const total = parseInt(aRes.rows[0].c)
    const present = parseInt(pRes.rows[0].c)
    res.status(200).json({
      courses: parseInt(cRes.rows[0].c),
      attendance: total,
      present,
      percentage: total ? Math.round((present / total) * 100) : 0,
      today: parseInt(tRes.rows[0].c),
      streak: present,
      departments: parseInt(dRes.rows[0].c),
      users: parseInt(uRes.rows[0].c),
    })
  } catch (err) {
    console.error('Failed to load stats:', err.message)
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

export default router
