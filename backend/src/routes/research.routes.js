import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { deepResearch } from '../services/researchService.js'
import { query } from '../../lib/db.js'

const router = Router()

router.post('/api/ai/research', authenticate, async (req, res) => {
  const start = Date.now()
  try {
    const { query: q, depth } = req.body
    if (!q || !q.trim()) return res.status(400).json({ error: 'Research query is required' })

    const result = await deepResearch(q.trim(), depth || 'standard')
    const elapsed = Date.now() - start

    // Save to DB
    try {
      await query(
        `INSERT INTO public.research_reports (user_id, query, report, sources, depth, elapsed_ms) VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.user.id, q.trim(), result.report, JSON.stringify(result.sources), depth || 'standard', elapsed]
      )
    } catch {}

    res.json({
      report: result.report,
      sources: result.sources,
      elapsed,
    })
  } catch (err) {
    console.error('Research error:', err.message)
    res.status(500).json({ error: 'Research failed' })
  }
})

router.get('/api/ai/research/history', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, query, depth, elapsed_ms, created_at FROM public.research_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    )
    res.json({ reports: rows })
  } catch (err) {
    console.error('Research history error:', err.message)
    res.status(500).json({ error: 'Failed to load research history' })
  }
})

router.get('/api/ai/research/history/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM public.research_reports WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Report not found' })
    res.json({ report: rows[0] })
  } catch (err) {
    console.error('Get report error:', err.message)
    res.status(500).json({ error: 'Failed to load report' })
  }
})

export default router
