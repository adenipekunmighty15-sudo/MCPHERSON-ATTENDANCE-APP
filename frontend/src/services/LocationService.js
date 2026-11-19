const MAX_GPS_ACCURACY_METERS = 100

export class LocationTracker {
  constructor() {
    this.watchId = null
    this.currentPosition = null
    this.accuracy = null
    this.error = null
    this.positionHistory = []
    this.listeners = new Set()
  }

  getLocationStatus() {
    return {
      available: !!this.currentPosition,
      source: this.currentPosition ? 'gps' : 'unavailable',
      position: this.currentPosition ? { ...this.currentPosition } : null,
      accuracy: this.currentPosition?.accuracy ?? null,
      error: this.error ? { ...this.error } : null,
    }
  }

  onPositionUpdate(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify(event) {
    this.listeners.forEach(callback => callback(event))
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

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.emitError('UNSUPPORTED', 'Location access is not available in this browser.')
      return
    }

    try {
      this.watchId = navigator.geolocation.watchPosition(
        position => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords
          if (
            !Number.isFinite(lat) || !Number.isFinite(lng) ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180 ||
            !Number.isFinite(accuracy) || accuracy < 0 || accuracy > MAX_GPS_ACCURACY_METERS
          ) {
            this.emitError('INVALID_POSITION', 'Location is too imprecise or invalid (max 100m accuracy). No position is shown.')
            return
          }

          this.error = null
          this.currentPosition = {
            lat,
            lng,
            accuracy,
            timestamp: position.timestamp || Date.now(),
            source: 'gps',
          }
          this.accuracy = accuracy
          this.positionHistory.push(this.currentPosition)
          this.notify({ type: 'position', data: { ...this.currentPosition }, source: 'gps' })
        },
        error => {
          const code = error?.code === 1 ? 'PERMISSION_DENIED'
            : error?.code === 3 ? 'TIMEOUT' : 'UNAVAILABLE'
          const message = code === 'PERMISSION_DENIED'
            ? 'Location permission was denied. Allow location access to start tracking.'
            : code === 'TIMEOUT'
              ? 'Location request timed out. No position is shown.'
              : 'Unable to determine your current location. No position is shown.'
          this.emitError(code, message)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      )
    } catch (error) {
      this.emitError('UNAVAILABLE', error?.message || 'Unable to start location tracking.')
    }
  }

  stopTracking() {
    if (this.watchId !== null) {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(this.watchId)
      }
      this.watchId = null
    }
    this.currentPosition = null
    this.accuracy = null
  }

  haversine(lat1, lng1, lat2, lng2) {
    const radius = 6371000
    const deltaLat = (lat2 - lat1) * Math.PI / 180
    const deltaLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(deltaLng / 2) ** 2
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}

export const locationTracker = new LocationTracker()
