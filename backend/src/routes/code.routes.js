import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/api/ai/execute', authenticate, (req, res) => {
  res.status(410).json({ error: 'Code execution is disabled until an isolated sandbox is configured' })
})

export default router
