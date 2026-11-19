import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { randomUUID } from 'crypto'
import { query } from '../../lib/db.js'

const router = Router()

function sanitizeText(value, maxLength = 200) {
  if (typeof value !== 'string') return ''
  // Drop control characters (including embedded newlines/NUL) and normalise whitespace.
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength)
}

function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const parsed = new URL(value)
    // Only http/https are accepted. This rejects javascript:, data:, file:, etc.
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : null
  } catch {
    return null
  }
}

router.get('/api/library/resources', async (req, res) => {
  try {
    const { category, search } = req.query
    const { rows } = await query(
      `SELECT id, title, author, category, type, description, downloads,
        file_url AS "fileUrl", uploaded_by AS "uploadedBy",
        uploaded_at AS "uploadedAt"
       FROM public.library_resources
       ORDER BY uploaded_at DESC LIMIT 200`
    )
    let results = rows

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
    const { rows } = await query(
      `SELECT id, title, author, category, type, description, downloads,
        file_url AS "fileUrl", uploaded_by AS "uploadedBy",
        uploaded_at AS "uploadedAt"
       FROM public.library_resources WHERE id = $1`,
      [req.params.id]
    )
    const resource = rows[0]
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
    const cleanTitle = sanitizeText(title)
    const cleanCategory = sanitizeText(category, 50)
    if (!cleanTitle || !cleanCategory) {
      return res.status(400).json({ error: 'Title and category are required' })
    }

    let cleanFileUrl = ''
    if (fileUrl !== undefined && fileUrl !== null && fileUrl !== '') {
      cleanFileUrl = safeHttpUrl(fileUrl)
      if (!cleanFileUrl) {
        return res.status(400).json({ error: 'fileUrl must be a valid HTTPS URL' })
      }
    }

    const { rows } = await query(
      `INSERT INTO public.library_resources
        (id, title, author, category, type, description, file_url, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, title, author, category, type, description, downloads,
         file_url AS "fileUrl", uploaded_by AS "uploadedBy",
         uploaded_at AS "uploadedAt"`,
      [
        `user-${randomUUID()}`,
        cleanTitle,
        sanitizeText(author, 100) || 'Anonymous',
        cleanCategory,
        sanitizeText(type, 30) || 'PDF',
        sanitizeText(description, 1000),
        cleanFileUrl,
        req.user.id,
      ]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Library upload error:', err.message)
    res.status(500).json({ error: 'Failed to upload resource' })
  }
})

export default router
