import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { randomUUID } from 'crypto'
import libraryResources from '../data/librarySeed.js'

const router = Router()

const inMemoryResources = [...libraryResources]

router.get('/api/library/resources', async (req, res) => {
  try {
    const { category, search } = req.query
    let results = [...inMemoryResources]

    if (category && category !== 'All') {
      results = results.filter(r => r.category === category)
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase()
      results = results.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      )
    }

    res.json(results)
  } catch (err) {
    console.error('Library fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch resources' })
  }
})

router.get('/api/library/resources/:id', async (req, res) => {
  try {
    const resource = inMemoryResources.find(r => r.id === req.params.id)
    if (!resource) return res.status(404).json({ error: 'Resource not found' })
    res.json(resource)
  } catch (err) {
    console.error('Library detail error:', err.message)
    res.status(500).json({ error: 'Failed to fetch resource' })
  }
})

router.post('/api/library/upload', authenticate, async (req, res) => {
  try {
    const { title, author, category, type, description, fileUrl } = req.body
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' })
    }

    const newResource = {
      id: `user-${randomUUID().slice(0, 8)}`,
      title,
      author: author || req.user?.name || 'Anonymous',
      category,
      type: type || 'PDF',
      description: description || '',
      downloads: 0,
      fileUrl: fileUrl || '',
      uploadedBy: req.user?.id,
      uploadedAt: new Date().toISOString(),
    }

    inMemoryResources.unshift(newResource)
    res.status(201).json(newResource)
  } catch (err) {
    console.error('Library upload error:', err.message)
    res.status(500).json({ error: 'Failed to upload resource' })
  }
})

export default router
