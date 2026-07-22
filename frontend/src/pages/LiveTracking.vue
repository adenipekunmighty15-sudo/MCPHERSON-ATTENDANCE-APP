<template>
  <div class="live-tracking page-wide">
    <header class="page-header">
      <h1>Live Campus Tracking</h1>
      <p class="subtitle">Real-time position monitoring with UWB geolocation and 3D mapping</p>
    </header>

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
        <GeofenceAttendance @checkin="handleCheckIn" />

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
import { useRouter } from 'vue-router'

const router = useRouter()

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

function handleCheckIn(roomCode) {
  router.push({ path: '/attendance', query: { room: roomCode, geofence: 'auto' } })
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

onMounted(async () => {
  positionChannel = supabase
    .channel('live-positions')
    .on('presence', { event: 'sync' }, () => {
      const state = positionChannel.presenceState()
      console.log('Online users:', Object.keys(state).length)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data: { user } } = await supabase.auth.getUser()
        await positionChannel.track({
          user: user?.id,
          online_at: new Date().toISOString(),
        })
      }
    })
})

onUnmounted(() => {
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
  gap: 8px;
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

@media (max-width: 1024px) {
  .tracking-layout {
    grid-template-columns: 1fr;
  }
  .map-container {
    height: 400px;
  }
}
</style>
