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
import { randomUUID } from 'crypto'

const router = Router()

router.get('/api/predictor/my-risk', authenticate, async (req, res) => {
  try {
    const [attendanceRisk, academicRisk] = await Promise.all([
      predictAttendanceRisk(req.user.id),
      predictAcademicRisk(req.user.id),
    ])

    try {
      await query(
        `INSERT INTO public.ai_predictions (id, user_id, risk_score, academic_risk, feature_vector, factors, predicted_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          randomUUID(),
          req.user.id,
          attendanceRisk.risk_score,
          academicRisk.academic_risk_score,
          JSON.stringify(attendanceRisk.feature_vector),
          JSON.stringify(attendanceRisk.factors),
        ]
      )
    } catch {}

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
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Only admin and faculty can view at-risk students' })
  }
  try {
    const atRisk = await getAtRiskStudents()
    res.json({ count: atRisk.length, students: atRisk })
  } catch (err) {
    console.error('Predictor at-risk error:', err.message)
    res.status(500).json({ error: 'Failed to retrieve at-risk students' })
  }
})

router.get('/api/predictor/insights', authenticate, async (req, res) => {
  try {
    const insights = await generateInsights(req.user.id)

    for (const insight of insights) {
      try {
        await query(
          `INSERT INTO public.ai_insights (id, user_id, insight, category, severity, created_at, read)
           VALUES ($1, $2, $3, $4, $5, NOW(), false)`,
          [randomUUID(), req.user.id, insight.text, insight.type, insight.severity]
        )
      } catch {}
    }

    const { rows: recentInsights } = await query(
      "SELECT * FROM public.ai_insights WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    )

    res.json({ insights: recentInsights })
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
