import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  predictAttendanceRisk,
  predictAcademicRisk,
  getAtRiskStudents,
  generateInsights,
  predictNextWeekAttendance,
} from '../services/predictorService.js'
import { query } from '../../lib/db.js'

const router = Router()

const ADMIN_ROLES = ['admin', 'super_admin']
const ALL_STAFF_ROLES = ['admin', 'super_admin', 'lecturer']
const MAX_AT_RISK_LIMIT = 100
const DEFAULT_AT_RISK_LIMIT = 50

function parseLimit(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, 1), MAX_AT_RISK_LIMIT)
}

// Lecturers may only see students enrolled in courses they teach (either as the
// course lecturer or via a lecturer_courses assignment). Admins see everyone.
async function visibleStudentIds(req) {
  if (ADMIN_ROLES.includes(req.user.role)) return null // null means "no restriction"
  const { rows } = await query(
    `SELECT DISTINCT e.user_id::text AS user_id
       FROM public.enrollments e
      WHERE e.course_id::text IN (
          SELECT c.id::text FROM public.courses c WHERE c.lecturer_id = $1
          UNION
          SELECT lc.course_id::text FROM public.lecturer_courses lc WHERE lc.lecturer_id = $1
        )`,
    [req.user.id]
  )
  return new Set(rows.map(row => row.user_id))
}

// GET routes are read-only: prediction/insight generation never writes to the DB.
router.get('/api/predictor/my-risk', authenticate, async (req, res) => {
  try {
    const [attendanceRisk, academicRisk] = await Promise.all([
      predictAttendanceRisk(req.user.id),
      predictAcademicRisk(req.user.id),
    ])

    res.json({
      risk_score: attendanceRisk.risk_score,
      next_absence_probability: attendanceRisk.predicted_next_absence_probability,
      academic_risk_score: academicRisk.academic_risk_score,
      avg_quiz_score: academicRisk.avg_quiz_score,
      factors: attendanceRisk.factors,
      feature_vector: attendanceRisk.feature_vector,
      academic_components: academicRisk.components,
    })
  } catch (err) {
    console.error('Predictor risk error:', err.message)
    res.status(500).json({ error: 'Failed to compute risk assessment' })
  }
})

router.get('/api/predictor/at-risk', authenticate, async (req, res) => {
  if (!ALL_STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Only admin and faculty can view at-risk students' })
  }
  try {
    const limit = parseLimit(req.query.limit, DEFAULT_AT_RISK_LIMIT)
    const [atRisk, allowedIds] = await Promise.all([getAtRiskStudents(), visibleStudentIds(req)])
    const scoped = allowedIds ? atRisk.filter(student => allowedIds.has(String(student.user_id))) : atRisk
    const students = scoped.slice(0, limit)
    res.json({ count: students.length, students, meta: { limit } })
  } catch (err) {
    console.error('Predictor at-risk error:', err.message)
    res.status(500).json({ error: 'Failed to retrieve at-risk students' })
  }
})

// Insights are generated on demand and returned directly. Persisting them here
// previously inserted duplicates on every GET; persistence is intentionally
// skipped (no DB write) until an explicit upsert endpoint is designed.
router.get('/api/predictor/insights', authenticate, async (req, res) => {
  try {
    const generated = await generateInsights(req.user.id)
    const insights = generated.map((insight, index) => ({
      id: `generated-${index + 1}`,
      insight: insight.text,
      text: insight.text,
      category: insight.type,
      severity: insight.severity,
      read: true,
      created_at: new Date().toISOString(),
    }))
    res.json({ insights })
  } catch (err) {
    console.error('Predictor insights error:', err.message)
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

router.get('/api/predictor/weekly', authenticate, async (req, res) => {
  try {
    const weeklyPredictions = await predictNextWeekAttendance(req.user.id)
    res.json({ predictions: weeklyPredictions })
  } catch (err) {
    console.error('Predictor weekly error:', err.message)
    res.status(500).json({ error: 'Failed to generate weekly predictions' })
  }
})

export default router
