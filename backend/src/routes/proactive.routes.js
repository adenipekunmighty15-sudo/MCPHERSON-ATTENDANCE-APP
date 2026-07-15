import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getProactiveInsights, dismissInsight, runProactiveCheck } from '../services/proactiveMindService.js'

const router = Router()

router.get('/api/proactive/insights', authenticate, async (req, res) => {
  try {
    const insights = await getProactiveInsights(req.user.id)
    res.json({ insights })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insights' })
  }
})

router.post('/api/proactive/dismiss', authenticate, async (req, res) => {
  try {
    const { insightId } = req.body
    if (!insightId) return res.status(400).json({ error: 'insightId required' })
    await dismissInsight(req.user.id, insightId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to dismiss insight' })
  }
})

router.post('/api/proactive/refresh', authenticate, async (req, res) => {
  try {
    const insights = await runProactiveCheck(req.user.id)
    res.json({ insights })
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh insights' })
  }
})

export default router
