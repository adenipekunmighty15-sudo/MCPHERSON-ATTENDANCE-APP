import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  recordPosition, getLatestPosition, getPositionsInRadius,
  getPositionsByRoom, verifyGeofence, getCampusBuildings, getClassroomAnchors,
} from '../services/trackingService.js'
import { query } from '../../lib/db.js'

const router = Router()
const STAFF_ROLES = ['lecturer', 'admin', 'super_admin']

// Location consumers receive only the minimal, non-identifying fields.
function toPublicPosition(position, roomCode) {
  const result = {
    userId: position.userId,
    name: position.name,
    latitude: position.latitude,
    longitude: position.longitude,
    lastSeen: position.lastSeen,
  }
  if (roomCode !== undefined) result.roomCode = roomCode
  return result
}

router.post('/api/tracking/position', authenticate, async (req, res) => {
  const { latitude, longitude, accuracy } = req.body
  if (
    typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    (accuracy !== undefined && (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100))
  ) {
    return res.status(400).json({ error: 'Valid latitude, longitude and GPS accuracy (max 100m) are required' })
  }
  try {
    // Client-supplied source is ignored: only real device GPS is accepted here.
    // Values such as fake/mock/simulated can never be persisted as a location.
    const record = await recordPosition(req.user.id, latitude, longitude, accuracy ?? null, 'gps')
    res.status(201).json(record)
  } catch (err) {
    console.error('Position record error:', err.message)
    res.status(500).json({ error: 'Failed to record position' })
  }
})

router.get('/api/tracking/position', authenticate, async (req, res) => {
  try {
    const position = await getLatestPosition(req.user.id)
    res.status(200).json(position || {})
  } catch (err) {
    console.error('Position fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch position' })
  }
})

router.get('/api/tracking/nearby', authenticate, async (req, res) => {
  if (!STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Only lecturers and administrators can view live locations' })
  }
  const { sessionId } = req.query
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
  try {
    const params = [sessionId]
    let sessionSql =
      `SELECT venue_id, lecturer_id FROM public.live_sessions
       WHERE id = $1 AND status = 'active'`
    if (req.user.role === 'lecturer') {
      params.push(req.user.id)
      sessionSql += ' AND lecturer_id = $2'
    }
    const { rows: sessions } = await query(sessionSql, params)
    if (!sessions.length) return res.status(404).json({ error: 'Active session not found' })
    if (req.user.role === 'lecturer' && sessions[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view locations for your own sessions' })
    }
    if (!sessions[0].venue_id) return res.status(400).json({ error: 'Session has no venue configured' })
    const { rows: venues } = await query(
      'SELECT latitude, longitude, radius_meters, room_code AS "roomCode" FROM public.venues WHERE id = $1',
      [sessions[0].venue_id]
    )
    if (!venues.length || venues[0].latitude == null || venues[0].longitude == null) {
      return res.status(400).json({ error: 'Session venue has no location configured' })
    }
    const users = await getPositionsInRadius(
      Number(venues[0].latitude),
      Number(venues[0].longitude),
      Math.min(Math.max(Number(venues[0].radius_meters) || 50, 10), 1000)
    )
    res.status(200).json(users.map(position => toPublicPosition(position, venues[0].roomCode)))
  } catch (err) {
    console.error('Nearby error:', err.message)
    res.status(500).json({ error: 'Failed to fetch nearby users' })
  }
})

router.get('/api/tracking/room/:roomCode', authenticate, async (req, res) => {
  if (!STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Only lecturers and administrators can view live locations' })
  }
  try {
    const params = [req.params.roomCode]
    let sessionSql =
      `SELECT ls.lecturer_id FROM public.live_sessions ls
       LEFT JOIN public.venues v ON v.id = ls.venue_id
       WHERE ls.status = 'active' AND (ls.room = $1 OR v.room_code = $1)`
    if (req.user.role === 'lecturer') {
      params.push(req.user.id)
      sessionSql += ' AND ls.lecturer_id = $2'
    }
    sessionSql += ' ORDER BY ls.started_at DESC LIMIT 1'
    const { rows: sessions } = await query(sessionSql, params)
    if (!sessions.length) return res.status(404).json({ error: 'Active room session not found' })
    if (req.user.role === 'lecturer' && sessions[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view your own room sessions' })
    }
    const users = await getPositionsByRoom(req.params.roomCode)
    res.status(200).json(users.map(position => toPublicPosition(position, req.params.roomCode)))
  } catch (err) {
    console.error('Room positions error:', err.message)
    res.status(500).json({ error: 'Failed to fetch room positions' })
  }
})

router.get('/api/tracking/geofence/:venueId', authenticate, async (req, res) => {
  try {
    const result = await verifyGeofence(req.user.id, req.params.venueId)
    res.status(200).json(result)
  } catch (err) {
    console.error('Geofence verify error:', err.message)
    res.status(500).json({ error: 'Failed to verify geofence' })
  }
})

router.get('/api/tracking/buildings', authenticate, async (req, res) => {
  try {
    const buildings = await getCampusBuildings()
    res.status(200).json(buildings)
  } catch (err) {
    console.error('Buildings error:', err.message)
    res.status(500).json({ error: 'Failed to fetch buildings' })
  }
})

router.get('/api/tracking/anchors/:roomCode', authenticate, async (req, res) => {
  try {
    const anchors = await getClassroomAnchors(req.params.roomCode)
    res.status(200).json(anchors)
  } catch (err) {
    console.error('Anchors error:', err.message)
    res.status(500).json({ error: 'Failed to fetch anchors' })
  }
})

export default router
