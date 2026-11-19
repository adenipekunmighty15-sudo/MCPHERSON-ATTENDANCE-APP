import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/api/venues', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, room_code AS "roomCode", latitude, longitude,
        radius_meters AS "radiusMeters"
       FROM public.venues ORDER BY name ASC`
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load venues:', err.message)
    res.status(500).json({ error: 'Failed to load venues' })
  }
})

router.post('/api/venues', authenticate, async (req, res) => {
  try {
    if (!['lecturer', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only lecturers can manage venues' })
    }
    const { name, roomCode, latitude, longitude, radiusMeters } = req.body
    const radius = radiusMeters === undefined ? 50 : radiusMeters
    if (
      typeof name !== 'string' || !name.trim() ||
      typeof roomCode !== 'string' || !roomCode.trim() ||
      typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      typeof radius !== 'number' || !Number.isFinite(radius) || radius < 10 || radius > 1000
    ) {
      return res.status(400).json({
        error: 'Name, room code and valid coordinates are required (lat -90..90, lng -180..180, radius 10..1000m)',
      })
    }
    const id = randomUUID()
    const { rows } = await query(
      `INSERT INTO public.venues (id, name, room_code, latitude, longitude, radius_meters, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, room_code AS "roomCode", latitude, longitude, radius_meters AS "radiusMeters"`,
      [id, name.trim(), roomCode.trim(), latitude, longitude, radius, req.user.id]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create venue:', err.message)
    res.status(500).json({ error: 'Failed to create venue' })
  }
})

router.put('/api/venues/:id', authenticate, async (req, res) => {
  try {
    if (!['lecturer', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only lecturers can manage venues' })
    }
    const { rows: existing } = await query(
      'SELECT created_by FROM public.venues WHERE id = $1',
      [req.params.id]
    )
    if (!existing.length) return res.status(404).json({ error: 'Venue not found' })
    if (!['admin', 'super_admin'].includes(req.user.role) && existing[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit venues you created' })
    }

    const fields = [
      ['name', 'name'],
      ['roomCode', 'room_code'],
      ['latitude', 'latitude'],
      ['longitude', 'longitude'],
      ['radiusMeters', 'radius_meters'],
    ].filter(([key]) => Object.prototype.hasOwnProperty.call(req.body, key))
    if (!fields.length) return res.status(400).json({ error: 'At least one venue field is required' })
    for (const [key] of fields) {
      const value = req.body[key]
      if (key === 'name' || key === 'roomCode') {
        if (typeof value !== 'string' || !value.trim()) {
          return res.status(400).json({ error: `${key} must be a non-empty string` })
        }
      } else if (typeof value !== 'number' || !Number.isFinite(value)) {
        return res.status(400).json({ error: `${key} must be a number` })
      }
    }
    if (
      ('latitude' in req.body && (req.body.latitude < -90 || req.body.latitude > 90)) ||
      ('longitude' in req.body && (req.body.longitude < -180 || req.body.longitude > 180)) ||
      ('radiusMeters' in req.body && (req.body.radiusMeters < 10 || req.body.radiusMeters > 1000))
    ) {
      return res.status(400).json({ error: 'Coordinates or radius are outside the allowed range (lat -90..90, lng -180..180, radius 10..1000m)' })
    }

    const assignments = fields.map(([key, column], index) =>
      `${column} = $${index + 1}`
    )
    const values = fields.map(([key]) =>
      typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key]
    )
    values.push(req.params.id)
    const { rows } = await query(
      `UPDATE public.venues SET ${assignments.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, name, room_code AS "roomCode", latitude, longitude,
         radius_meters AS "radiusMeters"`,
      values
    )
    if (!rows.length) return res.status(404).json({ error: 'Venue not found' })
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Failed to update venue:', err.message)
    res.status(500).json({ error: 'Failed to update venue' })
  }
})

export default router
