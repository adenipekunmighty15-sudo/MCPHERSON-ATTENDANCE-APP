import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getMemory, setMemory, deleteMemory } from '../services/memoryService.js'

const router = Router()

router.get('/api/memory', authenticate, async (req, res) => {
  try {
    const mems = await getMemory(req.user.id, req.query.category || null)
    res.json({ memories: mems })
  } catch (err) {
    console.error('Get memory error:', err.message)
    res.status(500).json({ error: 'Failed to load memories' })
  }
})

router.post('/api/memory', authenticate, async (req, res) => {
  try {
    const { key, value, category } = req.body
    if (!key) return res.status(400).json({ error: 'Key is required' })
    const mem = await setMemory(req.user.id, key, value || '', category || 'general')
    res.json({ memory: mem })
  } catch (err) {
    console.error('Set memory error:', err.message)
    res.status(500).json({ error: 'Failed to save memory' })
  }
})

router.delete('/api/memory/:key', authenticate, async (req, res) => {
  try {
    const ok = await deleteMemory(req.user.id, req.params.key)
    res.json({ deleted: ok })
  } catch (err) {
    console.error('Delete memory error:', err.message)
    res.status(500).json({ error: 'Failed to delete memory' })
  }
})

export default router
