import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  recordPosition, getLatestPosition, getPositionsInRadius,
  getPositionsByRoom, verifyGeofence, getCampusBuildings, getClassroomAnchors,
} from '../services/trackingService.js'

const router = Router()

router.post('/api/tracking/position', authenticate, async (req, res) => {
  const { latitude, longitude, accuracy, source } = req.body
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Latitude and longitude required' })
  }
  try {
    const record = await recordPosition(req.user.id, latitude, longitude, accuracy || null, source || 'gps')
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
  const { lat, lng, radius } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' })
  try {
    const users = await getPositionsInRadius(parseFloat(lat), parseFloat(lng), parseInt(radius) || 50)
    res.status(200).json(users)
  } catch (err) {
    console.error('Nearby error:', err.message)
    res.status(500).json({ error: 'Failed to fetch nearby users' })
  }
})

router.get('/api/tracking/room/:roomCode', authenticate, async (req, res) => {
  try {
    const users = await getPositionsByRoom(req.params.roomCode)
    res.status(200).json(users)
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
