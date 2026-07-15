import { UWBDevice, createClassroomAnchors } from './UWBService.js'

const CAMPUS_CENTER = { lat: 6.8715, lng: 3.2055 }

const CAMPUS_BUILDINGS = [
  { id: 'main-hall', name: 'Main Hall', lat: 6.8718, lng: 3.2052, floors: 3 },
  { id: 'science-block', name: 'Science Block', lat: 6.8712, lng: 3.2058, floors: 4 },
  { id: 'library', name: 'Library', lat: 6.8710, lng: 3.2050, floors: 2 },
  { id: 'admin-building', name: 'Administration', lat: 6.8720, lng: 3.2055, floors: 3 },
  { id: 'engineering-block', name: 'Engineering Block', lat: 6.8714, lng: 3.2060, floors: 3 },
  { id: 'student-center', name: 'Student Center', lat: 6.8716, lng: 3.2048, floors: 1 },
]

const CLASSROOMS = [
  { code: 'LT-1', name: 'Lecture Theatre 1', lat: 6.8717, lng: 3.2053, building: 'main-hall', floor: 1, capacity: 200 },
  { code: 'LT-2', name: 'Lecture Theatre 2', lat: 6.8718, lng: 3.2054, building: 'main-hall', floor: 2, capacity: 150 },
  { code: 'CS-LAB-1', name: 'Computer Science Lab 1', lat: 6.8713, lng: 3.2059, building: 'science-block', floor: 2, capacity: 60 },
  { code: 'CS-LAB-2', name: 'Computer Science Lab 2', lat: 6.8713, lng: 3.2060, building: 'science-block', floor: 3, capacity: 60 },
  { code: 'PHY-LAB', name: 'Physics Laboratory', lat: 6.8711, lng: 3.2057, building: 'science-block', floor: 1, capacity: 40 },
  { code: 'ENG-101', name: 'Engineering Workshop', lat: 6.8714, lng: 3.2061, building: 'engineering-block', floor: 1, capacity: 80 },
  { code: 'LIB-READ', name: 'Library Reading Room', lat: 6.8710, lng: 3.2050, building: 'library', floor: 1, capacity: 100 },
]

export class LocationTracker {
  constructor() {
    this.uwbDevice = new UWBDevice('device-1', 'student')
    this.watchId = null
    this.positionHistory = []
    this.currentPosition = null
    this.accuracy = null
    this.classroomAnchors = new Map()
    this.listeners = new Set()
    CLASSROOMS.forEach(cr => {
      const anchors = createClassroomAnchors(cr.code, cr.lat, cr.lng)
      anchors.forEach(a => this.uwbDevice.addAnchor(a))
      this.classroomAnchors.set(cr.code, anchors)
    })
  }

  onPositionUpdate(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify(data) {
    this.listeners.forEach(cb => cb(data))
  }

  startTracking() {
    if (!('geolocation' in navigator)) {
      this.simulatePosition()
      return
    }
    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        this.currentPosition = { lat, lng, accuracy, timestamp: Date.now() }
        this.accuracy = accuracy
        this.uwbDevice.setPosition(lat, lng)
        this.positionHistory.push(this.currentPosition)
        const proximity = this.checkProximity()
        this.notify({ type: 'position', data: { ...this.currentPosition, proximity } })
      },
      () => this.simulatePosition(),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
    )
  }

  simulatePosition() {
    this.watchId = setInterval(() => {
      const lat = CAMPUS_CENTER.lat + (Math.random() - 0.5) * 0.002
      const lng = CAMPUS_CENTER.lng + (Math.random() - 0.5) * 0.002
      this.currentPosition = { lat, lng, accuracy: 5, timestamp: Date.now(), simulated: true }
      this.uwbDevice.setPosition(lat, lng)
      this.positionHistory.push(this.currentPosition)
      const proximity = this.checkProximity()
      this.notify({ type: 'position', data: { ...this.currentPosition, proximity } })
    }, 3000)
  }

  stopTracking() {
    if (this.watchId !== null) {
      if (typeof this.watchId === 'number') clearInterval(this.watchId)
      else navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  checkProximity() {
    const results = []
    CLASSROOMS.forEach(cr => {
      const anchors = this.classroomAnchors.get(cr.code)
      if (!anchors) return
      const uwbResult = this.uwbDevice.isInsidePerimeter(anchors)
      results.push({ ...cr, ...uwbResult })
    })
    return results.sort((a, b) => a.avgDistance - b.avgDistance)
  }

  getNearestClassroom() {
    const proximity = this.checkProximity()
    return proximity.length > 0 ? proximity[0] : null
  }

  confirmGeofence(roomCode, threshold = 15) {
    const anchors = this.classroomAnchors.get(roomCode)
    if (!anchors) return { confirmed: false, reason: 'No anchors for this room' }
    const result = this.uwbDevice.isInsidePerimeter(anchors, threshold)
    return {
      confirmed: result.inside,
      confidence: result.confidence,
      avgDistance: result.avgDistance,
      readings: result.readings,
      timestamp: Date.now(),
    }
  }

  planRoute(fromLat, fromLng, toLat, toLng) {
    const steps = []
    const numSteps = 20
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps
      steps.push({
        lat: fromLat + (toLat - fromLat) * t,
        lng: fromLng + (toLng - fromLng) * t,
        index: i,
      })
    }
    const distance = this.haversine(fromLat, fromLng, toLat, toLng)
    return { steps, distance, estimatedMinutes: Math.round(distance / 80) }
  }

  haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  getBuildings() {
    return CAMPUS_BUILDINGS
  }

  getClassrooms() {
    return CLASSROOMS
  }

  getCampusCenter() {
    return CAMPUS_CENTER
  }

  getPositionHistory() {
    return this.positionHistory
  }

  getSLAMPath() {
    if (this.positionHistory.length < 2) return []
    return this.positionHistory.map((p, i) => ({
      x: (p.lat - CAMPUS_CENTER.lat) * 111320,
      y: (p.lng - CAMPUS_CENTER.lng) * 111320 * Math.cos(CAMPUS_CENTER.lat * Math.PI / 180),
      timestamp: p.timestamp,
      index: i,
    }))
  }
}

export const locationTracker = new LocationTracker()
export { CAMPUS_BUILDINGS, CLASSROOMS, CAMPUS_CENTER }
