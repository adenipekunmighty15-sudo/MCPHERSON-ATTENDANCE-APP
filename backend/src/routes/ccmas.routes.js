import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  buildBuiltinNotes,
  getCcmasCourse,
  getCcmasCourses,
  getCcmasOverview,
} from '../services/ccmasCatalog.js'

const router = Router()

router.get('/api/ccmas/overview', authenticate, async (_req, res) => {
  try {
    res.status(200).json(getCcmasOverview())
  } catch (err) {
    console.error('Failed to load CCMAS overview:', err.message)
    res.status(500).json({ error: 'Failed to load CCMAS catalog' })
  }
})

router.get('/api/ccmas/courses', authenticate, async (req, res) => {
  try {
    res.status(200).json(getCcmasCourses({
      department: req.query.department,
      search: req.query.search,
      level: req.query.level,
      limit: req.query.limit,
      offset: req.query.offset,
    }))
  } catch (err) {
    console.error('Failed to load CCMAS courses:', err.message)
    res.status(500).json({ error: 'Failed to load CCMAS courses' })
  }
})

router.get('/api/ccmas/courses/:id', authenticate, async (req, res) => {
  try {
    const course = getCcmasCourse(req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.status(200).json({ ...course, builtinNotes: buildBuiltinNotes(course) })
  } catch (err) {
    console.error('Failed to load CCMAS course:', err.message)
    res.status(500).json({ error: 'Failed to load course' })
  }
})

export default router
