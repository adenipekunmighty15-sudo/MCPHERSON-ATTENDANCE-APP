import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getGems, getGemById, createGem, updateGem, deleteGem } from '../services/gemsService.js'

const router = Router()

router.get('/api/gems', authenticate, async (req, res) => {
  try {
    const gems = await getGems(req.user.id, true)
    res.json({ gems })
  } catch (err) {
    console.error('Get gems error:', err.message)
    res.status(500).json({ error: 'Failed to load gems' })
  }
})

router.get('/api/gems/:id', authenticate, async (req, res) => {
  try {
    const gem = await getGemById(req.params.id)
    if (!gem) return res.status(404).json({ error: 'Gem not found' })
    res.json({ gem })
  } catch (err) {
    console.error('Get gem error:', err.message)
    res.status(500).json({ error: 'Failed to load gem' })
  }
})

router.post('/api/gems', authenticate, async (req, res) => {
  try {
    const gem = await createGem(req.user.id, req.body)
    res.status(201).json({ gem })
  } catch (err) {
    console.error('Create gem error:', err.message)
    res.status(500).json({ error: 'Failed to create gem' })
  }
})

router.put('/api/gems/:id', authenticate, async (req, res) => {
  try {
    const gem = await updateGem(req.params.id, req.user.id, req.body)
    if (!gem) return res.status(404).json({ error: 'Gem not found or not editable' })
    res.json({ gem })
  } catch (err) {
    console.error('Update gem error:', err.message)
    res.status(500).json({ error: 'Failed to update gem' })
  }
})

router.delete('/api/gems/:id', authenticate, async (req, res) => {
  try {
    const ok = await deleteGem(req.params.id, req.user.id)
    if (!ok) return res.status(404).json({ error: 'Gem not found' })
    res.json({ deleted: true })
  } catch (err) {
    console.error('Delete gem error:', err.message)
    res.status(500).json({ error: 'Failed to delete gem' })
  }
})

export default router
