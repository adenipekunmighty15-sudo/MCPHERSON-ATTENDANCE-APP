import api from '../lib/api.js'
import { IndoorPositionEstimator, createFallbackClassroomAnchors, createVenueAnchors } from './UWBService.js'

const CAMPUS_CENTER = { lat: 6.8715, lng: 3.2055 }
const MAX_GPS_ACCURACY_METERS = 100

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
    // Only GPS coordinates are ever accepted as a real position. Indoor anchors
    // are coordinate estimates and must never be reported as a device position.
    this.uwbDevice = new IndoorPositionEstimator('device-1', 'student')
    this.watchId = null
    this.usingGeolocation = false
    this.positionHistory = []
    this.stopTracking()
    this.currentPosition = null
    this.accuracy = null
    this.error = null
    this.classroomAnchors = new Map()
    this.venues = []
    this.usingFallbackAnchors = true
    this.listeners = new Set()
    // Documented fallback: hardcoded campus points, replaced by /api/venues
    // as soon as loadVenues() succeeds.
    CLASSROOMS.forEach(cr => {
      const anchors = createFallbackClassroomAnchors(cr.code, cr.lat, cr.lng)
      anchors.forEach(a => this.uwbDevice.addAnchor(a))
      this.classroomAnchors.set(cr.code, anchors)
    })
  }

  // Prefer real venue coordinates from the API; keep the hardcoded fallback on failure.
  async loadVenues() {
    try {
      const { data } = await api.get('/venues')
      if (!Array.isArray(data) || !data.length) return false
      const next = new Map()
      data.forEach(venue => {
        const code = venue?.roomCode || venue?.room_code
        const lat = Number(venue?.latitude)
        const lng = Number(venue?.longitude)
        if (!code || !Number.isFinite(lat) || !Number.isFinite(lng)) return
        const anchors = createVenueAnchors(venue)
        if (anchors.length) next.set(code, anchors)
      })
      if (!next.size) return false
      this.classroomAnchors = next
      this.venues = data
      this.usingFallbackAnchors = false
      this.uwbDevice.anchors = [...next.values()].flat()
      return true
    } catch {
      // Network/API failure: the documented fallback anchors remain in place.
      return false
    }
  }

  // Lets any caller distinguish real GPS from an estimated/unavailable state.
  getLocationStatus() {
    return {
      available: !!this.currentPosition,
      source: this.currentPosition ? 'gps' : 'unavailable',
      position: this.currentPosition ? { ...this.currentPosition } : null,
      accuracy: this.currentPosition?.accuracy ?? null,
      error: this.error ? { ...this.error } : null,
      usingFallbackAnchors: this.usingFallbackAnchors,
    }
  }

  onPositionUpdate(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify(data) {
    this.listeners.forEach(cb => cb(data))
  }

  emitError(code, message) {
    this.stopTracking()
    this.error = { code, message }
    this.currentPosition = null
    this.accuracy = null
    this.notify({ type: 'error', data: message, code, source: 'unavailable', position: null })
  }

  startTracking() {
    if (this.watchId !== null) return
    this.error = null
    if (!('geolocation' in navigator)) {
      this.emitError('UNSUPPORTED', 'Location access is not available in this browser.')
      return
    }
    this.usingGeolocation = true
    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        if (
          !Number.isFinite(lat) || !Number.isFinite(lng) ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180 ||
          !Number.isFinite(accuracy) || accuracy < 0 || accuracy > MAX_GPS_ACCURACY_METERS
        ) {
          // Never fabricate or fall back to a nearby "guess" when GPS is unusable.
          this.emitError('INVALID_POSITION', 'Location is too imprecise or invalid (max 100m accuracy). No position is shown.')
          return
        }
        this.error = null
        this.currentPosition = { lat, lng, accuracy, timestamp: Date.now(), source: 'gps' }
        this.accuracy = accuracy
        this.uwbDevice.setPosition(lat, lng)
        this.positionHistory.push(this.currentPosition)
        this.notify({
          type: 'position',
          data: { ...this.currentPosition, source: 'gps' },
          source: 'gps',
        })
      },
      error => {
        const code = error?.code === 1 ? 'PERMISSION_DENIED'
          : error?.code === 2 ? 'UNAVAILABLE'
            : error?.code === 3 ? 'TIMEOUT' : 'UNAVAILABLE'
        const message = code === 'PERMISSION_DENIED'
          ? 'Location permission was denied. Allow location access to start tracking.'
          : code === 'TIMEOUT'
            ? 'Location request timed out. No position is shown.'
            : 'Unable to determine your current location. No position is shown.'
        this.emitError(code, message)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
    )
  }

  stopTracking() {
    if (this.watchId !== null) {
      if (this.usingGeolocation) navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
      this.usingGeolocation = false
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
