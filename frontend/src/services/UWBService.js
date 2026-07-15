const UWB_DEVICE_BANDWIDTH = 500
const UWB_FREQUENCY = 6.5
const SIGNAL_SPEED = 299792458

function simulateRanging(anchorPos, devicePos) {
  const dx = anchorPos.x - devicePos.x
  const dy = anchorPos.y - devicePos.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const tof = distance / SIGNAL_SPEED
  const noise = (Math.random() - 0.5) * 0.05
  return { distance: distance + noise, tof: tof + noise / SIGNAL_SPEED, rssi: Math.max(-90, -20 - 20 * Math.log10(distance + 1)) }
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
  const ATA = AT.map((row, i) => row.map((_, j) => row.reduce((sum, val, k) => sum + val * A[k][j], 0)))
  const ATb = AT.map(row => row.reduce((sum, val, i) => sum + val * b[i], 0))
  const det = ATA[0][0] * ATA[1][1] - ATA[0][1] * ATA[1][0]
  if (Math.abs(det) < 1e-10) return null
  return { x: (ATA[1][1] * ATb[0] - ATA[0][1] * ATb[1]) / det, y: (ATA[0][0] * ATb[1] - ATA[1][0] * ATb[0]) / det }
}

export class UWBTransmitter {
  constructor(id, label, x, y, z = 0) {
    this.id = id
    this.label = label
    this.position = { x, y, z }
    this.lastSeen = null
    this.battery = 100
  }

  getDistanceTo(devicePos) {
    return simulateRanging(this.position, devicePos)
  }
}

export class UWBDevice {
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
    return { inside: avgDist < threshold, confidence: Math.max(0, 1 - avgDist / threshold), avgDistance: avgDist, readings }
  }
}

export function createClassroomAnchors(roomCode, centerLat, centerLng) {
  const OFFSET = 0.0004
  return [
    new UWBTransmitter(`${roomCode}-A1`, `${roomCode} Anchor 1`, centerLat - OFFSET, centerLng - OFFSET),
    new UWBTransmitter(`${roomCode}-A2`, `${roomCode} Anchor 2`, centerLat + OFFSET, centerLng - OFFSET),
    new UWBTransmitter(`${roomCode}-A3`, `${roomCode} Anchor 3`, centerLat + OFFSET, centerLng + OFFSET),
    new UWBTransmitter(`${roomCode}-A4`, `${roomCode} Anchor 4`, centerLat - OFFSET, centerLng + OFFSET),
  ]
}
