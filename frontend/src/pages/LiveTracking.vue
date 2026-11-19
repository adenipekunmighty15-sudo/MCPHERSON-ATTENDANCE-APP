<template>
  <div class="live-tracking page-wide">
    <header class="page-header">
      <h1>Live Campus Tracking</h1>
      <p class="subtitle">GPS-based position estimates and 3D campus mapping (no UWB hardware)</p>
    </header>

    <div v-if="locationError" class="location-banner" role="alert">
      {{ locationError }}
    </div>

    <div class="tracking-layout">
      <div class="map-section">
        <div class="map-container">
          <CampusMap3D
            :showPath="showPath"
            :showBuildings="true"
            :showAnchors="showAnchors"
            :showDevice="true"
            :autoRotate="autoRotate"
          />
        </div>
        <div class="map-controls">
          <span class="gps-status" :class="{ active: hasRealPosition }">
            {{ hasRealPosition ? 'GPS active' : 'GPS unavailable — no position shown' }}
          </span>
          <button class="ctrl-btn" :class="{ active: showPath }" @click="showPath = !showPath">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            SLAM Path
          </button>
          <button class="ctrl-btn" :class="{ active: showAnchors }" @click="showAnchors = !showAnchors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
            </svg>
            Anchors
          </button>
          <button class="ctrl-btn" :class="{ active: autoRotate }" @click="autoRotate = !autoRotate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Auto-Rotate
          </button>
        </div>
      </div>

      <div class="sidebar">
        <GeofenceAttendance />

        <div class="route-planner">
          <div class="section-title">Route Planner</div>
          <div class="route-controls">
            <select v-model="routeFrom" class="route-select">
              <option value="">From...</option>
              <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
            <select v-model="routeTo" class="route-select">
              <option value="">To...</option>
              <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
            <button class="route-btn" :disabled="!routeFrom || !routeTo" @click="calculateRoute">
              Plan Route
            </button>
          </div>
          <div v-if="routeResult" class="route-result">
            <div class="route-stats">
              <div class="stat">
                <span class="stat-label">Distance</span>
                <span class="stat-value">{{ routeResult.distance.toFixed(0) }}m</span>
              </div>
              <div class="stat">
                <span class="stat-label">Est. Time</span>
                <span class="stat-value">{{ routeResult.estimatedMinutes }} min</span>
              </div>
            </div>
          </div>
        </div>

        <div class="campus-directory">
          <div class="section-title">Campus Directory</div>
          <div v-for="b in buildings" :key="b.id" class="dir-item" @click="focusBuilding(b)">
            <div class="dir-badge" :style="{ background: buildingColors[b.id] }"></div>
            <div class="dir-info">
              <div class="dir-name">{{ b.name }}</div>
              <div class="dir-floors">{{ b.floors }} floors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CampusMap3D from '../components/CampusMap3D.vue'
import GeofenceAttendance from '../components/GeofenceAttendance.vue'
import { locationTracker } from '../services/LocationService.js'
import { supabase } from '../lib/supabase.js'

const initialLocation = locationTracker.getLocationStatus()
const hasRealPosition = ref(initialLocation.available)
const locationError = ref(initialLocation.error?.message || '')

function onLocationUpdate(event) {
  if (event?.type === 'position') {
    locationError.value = ''
    hasRealPosition.value = true
  } else if (event?.type === 'error') {
    locationError.value = typeof event.data === 'string' ? event.data : 'Location unavailable.'
    hasRealPosition.value = false
  }
}

const showPath = ref(true)
const showAnchors = ref(true)
const autoRotate = ref(false)

const buildings = ref(locationTracker.getBuildings())
const routeFrom = ref('')
const routeTo = ref('')
const routeResult = ref(null)

const buildingColors = {
  'main-hall': '#1D4ED8',
  'science-block': '#2563EB',
  'library': '#F59E0B',
  'admin-building': '#DC2626',
  'engineering-block': '#3B82F6',
  'student-center': '#60A5FA',
}

function calculateRoute() {
  const from = buildings.value.find(b => b.id === routeFrom.value)
  const to = buildings.value.find(b => b.id === routeTo.value)
  if (!from || !to) return
  const result = locationTracker.planRoute(from.lat, from.lng, to.lat, to.lng)
  routeResult.value = result
}

function focusBuilding(b) {
  routeFrom.value = b.id
}

let positionChannel = null
let unsubscribeLocation = null

onMounted(async () => {
  unsubscribeLocation = locationTracker.onPositionUpdate(onLocationUpdate)
  await locationTracker.loadVenues()
  if (supabase) {
    positionChannel = supabase
      .channel('live-positions')
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await positionChannel.track({ online_at: new Date().toISOString() })
        }
      })
  }
})

onUnmounted(() => {
  if (unsubscribeLocation) unsubscribeLocation()
  if (positionChannel) supabase.removeChannel(positionChannel)
})
</script>

<style scoped>
.live-tracking {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.tracking-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-container {
  height: 600px;
  border-radius: 16px;
  overflow: hidden;
}

.map-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gps-status {
  padding: 8px 12px;
  border: 1px solid var(--color-error);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 12px;
  font-weight: 600;
}

.gps-status.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ctrl-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text);
}

.ctrl-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-planner, .campus-directory {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.route-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-select {
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.route-select:focus {
  border-color: var(--color-primary);
}

.route-btn {
  padding: 10px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.route-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.route-btn:not(:disabled):hover {
  filter: brightness(1.15);
}

.route-result {
  margin-top: 12px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: 8px;
}

.route-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
}

.campus-directory {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dir-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--color-border);
}

.dir-item:last-child {
  border-bottom: none;
}

.dir-item:hover {
  opacity: 0.8;
  transform: translateX(4px);
}

.dir-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dir-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dir-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.dir-floors {
  font-size: 11px;
  color: var(--color-text-muted);
}

.location-banner {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid var(--color-error);
  border-radius: 8px;
  color: var(--color-error);
  background: var(--color-card);
  font-size: 13px;
}

.staff-locations {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
}

.panel-message {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.panel-message.error {
  color: var(--color-error);
}

.location-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}

.location-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
}

.location-item:last-child {
  border-bottom: none;
}

.location-name {
  color: var(--color-text);
  font-weight: 600;
}

.location-meta {
  color: var(--color-text-muted);
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .tracking-layout {
    grid-template-columns: 1fr;
  }
  .map-container {
    height: 400px;
  }
}
</style>
