import { query } from '../../lib/db.js'

const GEOFENCE_DEFAULT_RADIUS = 20
const CAMPUS_BOUNDARIES = {
  center: { lat: 6.8715, lng: 3.2055 },
  radius_km: 0.5,
}

export async function recordPosition(userId, lat, lng, accuracy, source = 'gps') {
  const { rows } = await query(
    `INSERT INTO public.positions (user_id, latitude, longitude, accuracy, source)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id AS "userId", latitude, longitude, accuracy, source, timestamp`,
    [userId, lat, lng, accuracy, source]
  )
  return rows[0]
}

export async function getLatestPosition(userId) {
  const { rows } = await query(
    `SELECT id, user_id AS "userId", latitude, longitude, accuracy, source, timestamp
     FROM public.positions WHERE user_id = $1
     ORDER BY timestamp DESC LIMIT 1`,
    [userId]
  )
  return rows[0] || null
}

export async function getPositionsInRadius(lat, lng, radiusMeters = 50) {
  const { rows } = await query(
    `SELECT p.id, p.user_id AS "userId", p.latitude, p.longitude, p.accuracy, p.source, p.timestamp,
            u.name AS "userName", u.email AS "userEmail", u.role AS "userRole"
     FROM public.positions p
     JOIN public.users u ON p.user_id = u.id
     WHERE p.timestamp > NOW() - INTERVAL '5 minutes'
     ORDER BY p.timestamp DESC`
  )
  return rows.filter(r => {
    const d = haversineDistance(lat, lng, r.latitude, r.longitude)
    return d <= radiusMeters
  })
}

export async function getPositionsByRoom(roomCode) {
  const { rows: venueRows } = await query(
    'SELECT id, latitude, longitude, radius_meters FROM public.venues WHERE room_code = $1',
    [roomCode]
  )
  if (!venueRows.length) return []
  const venue = venueRows[0]
  const { rows } = await query(
    `SELECT p.id, p.user_id AS "userId", p.latitude, p.longitude, p.accuracy, p.source, p.timestamp,
            u.name AS "userName", u.email AS "userEmail", u.role AS "userRole"
     FROM public.positions p
     JOIN public.users u ON p.user_id = u.id
     WHERE p.timestamp > NOW() - INTERVAL '10 minutes'
     ORDER BY p.timestamp DESC`
  )
  return rows.filter(r => {
    if (venue.latitude == null || venue.longitude == null) return false
    const d = haversineDistance(venue.latitude, venue.longitude, r.latitude, r.longitude)
    return d <= (venue.radius_meters || GEOFENCE_DEFAULT_RADIUS)
  })
}

export async function verifyGeofence(userId, venueId) {
  const { rows: venueRows } = await query(
    'SELECT id, latitude, longitude, radius_meters FROM public.venues WHERE id = $1',
    [venueId]
  )
  if (!venueRows.length) return { verified: false, reason: 'Venue not found' }

  const venue = venueRows[0]
  if (venue.latitude == null || venue.longitude == null) {
    return { verified: false, reason: 'Venue has no location data' }
  }

  const position = await getLatestPosition(userId)
  if (!position) return { verified: false, reason: 'No position data available' }

  const distance = haversineDistance(venue.latitude, venue.longitude, position.latitude, position.longitude)
  const maxDist = venue.radius_meters || GEOFENCE_DEFAULT_RADIUS
  return {
    verified: distance <= maxDist,
    distance: Math.round(distance),
    maxDistance: maxDist,
    userLat: position.latitude,
    userLng: position.longitude,
    venueLat: venue.latitude,
    venueLng: venue.longitude,
  }
}

export async function getCampusBuildings() {
  const { rows } = await query(
    'SELECT id, name, code, latitude, longitude, floors, description FROM public.campus_buildings ORDER BY name'
  )
  return rows
}

export async function getClassroomAnchors(roomCode) {
  const { rows } = await query(
    `SELECT a.id, a.anchor_code AS "anchorCode", a.label, a.latitude, a.longitude,
            a.floor, a.status, a.last_seen AS "lastSeen"
     FROM public.classroom_anchors a
     JOIN public.venues v ON a.venue_id = v.id
     WHERE v.room_code = $1`,
    [roomCode]
  )
  return rows
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
