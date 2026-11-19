// HONEST LABEL: browsers have no UWB radio API and this app has no UWB hardware
// integration. "Anchors" here are fixed coordinate points and all distances are
// ESTIMATES derived from GPS coordinates, not real UWB time-of-flight ranging.
// Prefer anchors built from /api/venues; hardcoded campus points are a documented fallback.

const ESTIMATED_SIGNAL_SPEED = 299792458

function estimateRangeToAnchor(anchorPos, devicePos) {
  const dx = anchorPos.x - devicePos.x
  const dy = anchorPos.y - devicePos.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const tof = distance / ESTIMATED_SIGNAL_SPEED
  const noise = (Math.random() - 0.5) * 0.05
  return {
    distance: distance + noise,
    tof: tof + noise / ESTIMATED_SIGNAL_SPEED,
    rssi: Math.max(-90, -20 - 20 * Math.log10(distance + 1)),
    method: 'coordinate-estimate',
  }
}

function multilateration(anchors) {
  if (anchors.length < 3) return null
  const A = []
  const b = []
  const ref = anchors[0]
  for (let i = 1; i < anchors.length; i++) {
    const ai = anchors[i]
    A.push([2 * (ai.x - ref.x), 2 * (ai.y - ref.y)])
    b.push(ai.distance * ai.distance - ref.distance * ref.distance - ai.x * ai.x + ref.x * ref.x - ai.y * ai.y + ref.y * ref.y)
  }
  const AT = A[0].map((_, col) => A.map(row => row[col]))
  const ATA = AT.map(row => row.map((_, j) => row.reduce((sum, val, k) => sum + val * A[k][j], 0)))
  const ATb = AT.map(row => row.reduce((sum, val, i) => sum + val * b[i], 0))
  const det = ATA[0][0] * ATA[1][1] - ATA[0][1] * ATA[1][0]
  if (Math.abs(det) < 1e-10) return null
  return { x: (ATA[1][1] * ATb[0] - ATA[0][1] * ATb[1]) / det, y: (ATA[0][0] * ATb[1] - ATA[1][0] * ATb[0]) / det }
}

export class SiteAnchor {
  constructor(id, label, x, y, z = 0) {
    this.id = id
    this.label = label
    this.position = { x, y, z }
    this.estimated = true
  }

  getDistanceTo(devicePos) {
    return estimateRangeToAnchor(this.position, devicePos)
  }
}

// Deprecated alias kept so existing components keep working.
export const UWBTransmitter = SiteAnchor

export class IndoorPositionEstimator {
  constructor(id, role) {
    this.id = id
    this.role = role
    this.position = { x: 0, y: 0, z: 0 }
    this.anchors = []
    this.rangingHistory = []
  }

  setPosition(x, y, z = 0) {
    this.position = { x, y, z }
  }

  addAnchor(anchor) {
    this.anchors.push(anchor)
  }

  scan() {
    return this.anchors.map(a => {
      const result = a.getDistanceTo(this.position)
      result.anchorId = a.id
      result.anchorLabel = a.label
      return result
    })
  }

  locate() {
    const readings = this.scan()
    this.rangingHistory.push({ time: Date.now(), readings })
    if (readings.length < 3) return null
    const pos = multilateration(readings)
    if (pos) {
      this.position.x = pos.x
      this.position.y = pos.y
    }
    return pos
  }

  isInsidePerimeter(perimeterAnchors, threshold = 15) {
    const readings = perimeterAnchors.map(a => a.getDistanceTo(this.position))
    const avgDist = readings.reduce((s, r) => s + r.distance, 0) / readings.length
    return {
      inside: avgDist < threshold,
      confidence: Math.max(0, 1 - avgDist / threshold),
      avgDistance: avgDist,
      method: 'gps-coordinate-estimate',
      readings,
    }
  }
}

// Deprecated alias kept so existing components keep working.
export const UWBDevice = IndoorPositionEstimator

function buildAnchors(roomCode, centerLat, centerLng, labelPrefix) {
  const OFFSET = 0.0004
  return [
    new SiteAnchor(`${roomCode}-A1`, `${labelPrefix} estimated point 1`, centerLat - OFFSET, centerLng - OFFSET),
    new SiteAnchor(`${roomCode}-A2`, `${labelPrefix} estimated point 2`, centerLat + OFFSET, centerLng - OFFSET),
    new SiteAnchor(`${roomCode}-A3`, `${labelPrefix} estimated point 3`, centerLat + OFFSET, centerLng + OFFSET),
    new SiteAnchor(`${roomCode}-A4`, `${labelPrefix} estimated point 4`, centerLat - OFFSET, centerLng + OFFSET),
  ]
}

// Preferred source: a venue returned by GET /api/venues.
export function createVenueAnchors(venue) {
  const code = venue?.roomCode || venue?.room_code
  const lat = Number(venue?.latitude)
  const lng = Number(venue?.longitude)
  if (!code || !Number.isFinite(lat) || !Number.isFinite(lng)) return []
  return buildAnchors(code, lat, lng, code)
}

// Documented fallback only: hardcoded campus coordinates used when the venue
// API is unavailable. These are estimates, not surveyed UWB anchor positions.
export function createFallbackClassroomAnchors(roomCode, centerLat, centerLng) {
  return buildAnchors(roomCode, centerLat, centerLng, roomCode)
}

export const createClassroomAnchors = createFallbackClassroomAnchors
