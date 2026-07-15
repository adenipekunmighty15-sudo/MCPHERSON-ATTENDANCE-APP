import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { indexContent, searchSimilar, ragChat } from '../services/ragService.js'

const router = Router()

router.post('/api/rag/embed', authenticate, async (req, res) => {
  try {
    const { content, title, type, sourceId } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }
    const id = await indexContent(req.user.id, content.trim(), { title, type, sourceId })
    res.status(201).json({ id, message: 'Content indexed successfully' })
  } catch (err) {
    console.error('RAG embed error:', err.message)
    res.status(500).json({ error: 'Failed to index content' })
  }
})

router.post('/api/rag/chat', authenticate, async (req, res) => {
  try {
    const { message, history } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    const result = await ragChat(req.user.id, message.trim(), history || [])
    res.json(result)
  } catch (err) {
    console.error('RAG chat error:', err.message)
    res.status(500).json({ response: 'An error occurred while processing your request.', citations: [], sources: [] })
  }
})

router.get('/api/rag/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }
    const results = await searchSimilar(req.user.id, q.trim(), parseInt(req.query.limit) || 5)
    res.json({ results })
  } catch (err) {
    console.error('RAG search error:', err.message)
    res.status(500).json({ error: 'Search failed' })
  }
})

router.post('/api/rag/embed-study-material/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, title, source_text FROM public.study_materials WHERE id = $1 AND created_by = $2',
      [req.params.id, req.user.id]
    )
    if (!rows.length) {
      return res.status(404).json({ error: 'Study material not found' })
    }
    const material = rows[0]
    const id = await indexContent(req.user.id, material.source_text, {
      title: material.title,
      type: 'study_material',
      sourceId: material.id,
    })
    res.status(201).json({ id, message: 'Study material embedded successfully' })
  } catch (err) {
    console.error('RAG embed study material error:', err.message)
    res.status(500).json({ error: 'Failed to embed study material' })
  }
})

export default router
