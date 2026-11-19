<template>
  <section class="location-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Campus information</p>
        <h1>Campus venues</h1>
        <p class="page-description">Venue details come from the university database. Your device location stays on this device.</p>
      </div>
      <button class="refresh-button" type="button" :disabled="venuesLoading" @click="loadVenues">
        {{ venuesLoading ? 'Refreshing…' : 'Refresh venues' }}
      </button>
    </header>

    <div class="location-grid">
      <section class="location-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">This device</p>
            <h2>GPS location</h2>
          </div>
          <span class="status-chip" :class="{ active: tracking }">{{ tracking ? 'Active' : 'Off' }}</span>
        </div>

        <div v-if="position" class="coordinates">
          <strong>{{ position.lat.toFixed(6) }}, {{ position.lng.toFixed(6) }}</strong>
          <span>Accuracy ±{{ Math.round(position.accuracy) }} m</span>
        </div>
        <p v-else class="location-empty">{{ tracking ? 'Waiting for an accurate GPS fix…' : 'Location is not being read.' }}</p>
        <p v-if="locationError" class="error-message" role="alert">{{ locationError }}</p>
        <button class="tracking-button" type="button" @click="toggleTracking">
          {{ tracking ? 'Stop reading location' : 'Read my location' }}
        </button>
        <p class="privacy-note">Location is shown only in this browser and is not shared from this page.</p>
      </section>

      <section class="venues-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Verified venue records</p>
            <h2>Available venues</h2>
          </div>
          <span v-if="venues.length" class="venue-count">{{ venues.length }}</span>
        </div>

        <p v-if="venuesError" class="error-message" role="alert">{{ venuesError }}</p>
        <div v-else-if="venuesLoading && !venues.length" class="venue-loading" aria-label="Loading venues">
          <span v-for="index in 3" :key="index"></span>
        </div>
        <div v-else-if="!venues.length" class="venues-empty">
          <h3>No venues are configured</h3>
          <p>Ask an administrator or lecturer to add campus venues with verified coordinates.</p>
        </div>
        <ul v-else class="venue-list">
          <li v-for="venue in venues" :key="venue.id" class="venue-item">
            <span class="venue-marker" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
            </span>
            <span class="venue-copy">
              <strong>{{ venue.name }}</strong>
              <span>{{ venue.roomCode || 'Room code not set' }}<template v-if="venue.radiusMeters"> · {{ venue.radiusMeters }} m radius</template></span>
              <span v-if="hasCoordinates(venue)" class="venue-coordinates">
                {{ Number(venue.latitude).toFixed(5) }}, {{ Number(venue.longitude).toFixed(5) }}
              </span>
              <span v-else class="venue-coordinates">Coordinates not configured</span>
            </span>
            <span v-if="distanceTo(venue) !== null" class="venue-distance">~{{ distanceTo(venue) }} m</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import api from '../lib/api'
import { locationTracker } from '../services/LocationService.js'

const venues = ref([])
const venuesLoading = ref(false)
const venuesError = ref('')
const tracking = ref(false)
const position = ref(locationTracker.getLocationStatus().position)
const locationError = ref('')
let unsubscribe = null

function hasCoordinates(venue) {
  const latitude = Number(venue.latitude)
  const longitude = Number(venue.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
}

function distanceTo(venue) {
  if (!position.value || !hasCoordinates(venue)) return null
  const distance = locationTracker.haversine(
    position.value.lat,
    position.value.lng,
    Number(venue.latitude),
    Number(venue.longitude)
  )
  return Number.isFinite(distance) ? Math.round(distance) : null
}

async function loadVenues() {
  venuesLoading.value = true
  venuesError.value = ''
  try {
    const { data } = await api.get('/venues')
    if (!Array.isArray(data)) throw new Error('The server returned invalid venue data.')
    venues.value = data
  } catch (error) {
    console.error('Failed to load venues:', error)
    venuesError.value = error?.response?.data?.error || 'Could not load campus venues. Please try again.'
  } finally {
    venuesLoading.value = false
  }
}

function onLocationUpdate(event) {
  if (event.type === 'position') {
    position.value = event.data
    locationError.value = ''
  } else if (event.type === 'error') {
    position.value = null
    tracking.value = false
    locationError.value = event.data
  }
}

function toggleTracking() {
  if (tracking.value) {
    locationTracker.stopTracking()
    tracking.value = false
    position.value = null
  } else {
    locationTracker.startTracking()
    tracking.value = locationTracker.watchId !== null
    if (locationTracker.error) locationError.value = locationTracker.error.message
  }
}

onMounted(() => {
  unsubscribe = locationTracker.onPositionUpdate(onLocationUpdate)
  loadVenues()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (tracking.value) locationTracker.stopTracking()
})
</script>

<style scoped>
.location-page {
  min-height: 100%;
  padding: clamp(16px, 3vw, 32px);
  color: var(--color-text-primary);
}

.page-header,
.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header {
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 850;
  letter-spacing: -0.04em;
}

.page-description {
  max-width: 600px;
  margin: 7px 0 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.refresh-button,
.tracking-button {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.location-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 16px;
}

.location-card,
.venues-card {
  min-width: 0;
  padding: clamp(16px, 2.5vw, 24px);
  border: 1px solid var(--color-border);
  border-radius: 17px;
  background: var(--color-surface);
  box-shadow: 0 8px 26px rgba(15, 30, 61, 0.04);
}

.card-heading {
  align-items: center;
  margin-bottom: 20px;
}

.card-heading h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.status-chip,
.venue-count {
  display: inline-flex;
  min-width: 28px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--color-surface-elevated);
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 800;
}

.status-chip.active {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.venue-count {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.coordinates {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 15px;
  border-radius: 12px;
  background: var(--color-surface-elevated);
}

.coordinates strong {
  overflow-wrap: anywhere;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
}

.coordinates span,
.location-empty,
.privacy-note {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.location-empty {
  min-height: 49px;
  margin: 0;
  padding: 15px;
  border-radius: 12px;
  background: var(--color-surface-elevated);
}

.tracking-button {
  width: 100%;
  margin-top: 13px;
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.privacy-note {
  margin: 11px 2px 0;
  line-height: 1.5;
}

.error-message {
  margin: 10px 0;
  color: var(--color-error, #b91c1c);
  font-size: 11px;
  line-height: 1.5;
}

.venue-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.venue-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 11px 4px;
  border-bottom: 1px solid var(--color-border);
}

.venue-item:last-child {
  border-bottom: 0;
}

.venue-marker {
  display: grid;
  width: 37px;
  height: 37px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.venue-marker svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.venue-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.venue-copy strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.venue-copy span {
  color: var(--color-text-tertiary);
  font-size: 9px;
}

.venue-coordinates {
  font-family: var(--font-mono, monospace);
}

.venue-distance {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 800;
}

.venues-empty {
  padding: 24px 12px;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  text-align: center;
}

.venues-empty h3 {
  margin: 0;
  font-size: 12px;
}

.venues-empty p {
  margin: 7px auto 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.5;
}

.venue-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.venue-loading span {
  height: 48px;
  border-radius: 10px;
  background: var(--color-surface-elevated);
}

@media (max-width: 780px) {
  .location-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
