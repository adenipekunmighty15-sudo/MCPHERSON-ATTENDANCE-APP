import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/api/venues', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.venues ORDER BY name ASC')
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load venues:', err.message)
    res.status(500).json({ error: 'Failed to load venues' })
  }
})

router.post('/api/venues', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only lecturers can manage venues' })
    }
    const { name, roomCode, latitude, longitude, radiusMeters } = req.body
    if (!name || !roomCode || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Name, room code, latitude and longitude are required' })
    }
    const id = randomUUID()
    const { rows } = await query(
      `INSERT INTO public.venues (id, name, room_code, latitude, longitude, radius_meters)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, room_code AS "roomCode", latitude, longitude, radius_meters AS "radiusMeters"`,
      [id, name, roomCode, latitude, longitude, radiusMeters != null ? radiusMeters : 50]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create venue:', err.message)
    res.status(500).json({ error: 'Failed to create venue' })
  }
})

router.put('/api/venues/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only lecturers can manage venues' })
    }
    const { name, roomCode, latitude, longitude, radiusMeters } = req.body
    const { rows } = await query(
      `UPDATE public.venues SET name = $1, room_code = $2, latitude = $3, longitude = $4, radius_meters = $5
       WHERE id = $6 RETURNING id, name, room_code AS "roomCode", latitude, longitude, radius_meters AS "radiusMeters"`,
      [name, roomCode, latitude, longitude, radiusMeters != null ? radiusMeters : 50, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Venue not found' })
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Failed to update venue:', err.message)
    res.status(500).json({ error: 'Failed to update venue' })
  }
})

export default router
