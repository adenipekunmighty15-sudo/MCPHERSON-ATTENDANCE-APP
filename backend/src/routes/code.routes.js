import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { executeCode } from '../services/codeService.js'
import { query } from '../../lib/db.js'

const router = Router()

router.post('/api/ai/execute', authenticate, async (req, res) => {
  try {
    const { language, code } = req.body
    if (!code || !code.trim()) return res.status(400).json({ error: 'Code is required' })
    if (!language) return res.status(400).json({ error: 'Language is required' })

    const result = await executeCode(language, code.trim())

    // Log to DB
    try {
      await query(
        `INSERT INTO public.code_executions (user_id, language, code, output, error, elapsed_ms) VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.user.id, language, code.trim(), result.output || '', result.error || '', result.elapsed || 0]
      )
    } catch {}

    if (result.error) {
      return res.json({ output: result.output || '', error: result.error, elapsed: result.elapsed })
    }
    res.json({ output: result.output, elapsed: result.elapsed })
  } catch (err) {
    console.error('Code execution error:', err.message)
    res.status(500).json({ error: 'Code execution failed' })
  }
})

export default router
