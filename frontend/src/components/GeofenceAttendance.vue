<template>
  <div class="geofence-attendance">
    <div class="signal-status">
      <div class="status-header">
        <div class="status-dot" :class="{ active: tracking }"></div>
        <span>UWB Geolocation</span>
        <span v-if="tracking" class="badge">Live</span>
      </div>
      <div class="signal-bars">
        <div v-for="i in 5" :key="i" class="bar" :class="{ active: tracking && i <= signalStrength }"
          :style="{ animationDelay: `${i * 0.1}s` }"></div>
      </div>
    </div>

    <div class="location-info">
      <div class="info-row">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <div>
          <div class="label">Current Position</div>
          <div class="value" v-if="position">
            {{ position.lat.toFixed(6) }}, {{ position.lng.toFixed(6) }}
            <span v-if="position.simulated" class="sim-badge">SIM</span>
          </div>
          <div class="value" v-else>Acquiring...</div>
        </div>
      </div>
      <div class="info-row">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <div>
          <div class="label">Accuracy</div>
          <div class="value">{{ accuracy ? `${accuracy.toFixed(1)}m` : 'N/A' }}</div>
        </div>
      </div>
    </div>

    <div class="uwb-readings" v-if="readings.length > 0">
      <div class="section-title">UWB Anchor Readings</div>
      <div v-for="r in readings" :key="r.anchorId" class="reading-row">
        <div class="anchor-label">{{ r.anchorLabel }}</div>
        <div class="reading-details">
          <span class="dist">{{ r.distance.toFixed(2) }}m</span>
          <span class="rssi" :class="{ good: r.rssi > -60, mid: r.rssi > -80 && r.rssi <= -60, poor: r.rssi <= -80 }">
            {{ r.rssi.toFixed(1) }} dBm
          </span>
        </div>
      </div>
    </div>

    <div class="geofence-status" v-if="proximity">
      <div class="section-title">Geofence Status</div>
      <div v-for="p in proximity.slice(0, 3)" :key="p.code"
        class="proximity-card" :class="{ inside: p.inside }">
        <div class="room-code">{{ p.code }}</div>
        <div class="room-name">{{ p.name }}</div>
        <div class="proximity-meter">
          <div class="meter-fill" :style="{ width: `${p.confidence * 100}%` }"
            :class="{ high: p.confidence > 0.7, mid: p.confidence > 0.3 && p.confidence <= 0.7, low: p.confidence <= 0.3 }">
          </div>
        </div>
        <div class="proximity-details">
          <span>{{ p.avgDistance.toFixed(1) }}m</span>
          <span>{{ (p.confidence * 100).toFixed(0) }}%</span>
        </div>
        <button v-if="p.inside" class="checkin-btn" @click="$emit('checkin', p.code)">
          Check In
        </button>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn" @click="toggleTracking">
        {{ tracking ? 'Stop Tracking' : 'Start Tracking' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { locationTracker } from '../services/LocationService.js'

defineEmits(['checkin'])

const tracking = ref(false)
const position = ref(null)
const accuracy = ref(null)
const readings = ref([])
const proximity = ref(null)

const signalStrength = computed(() => {
  if (!accuracy.value) return 0
  if (accuracy.value < 3) return 5
  if (accuracy.value < 5) return 4
  if (accuracy.value < 10) return 3
  if (accuracy.value < 20) return 2
  return 1
})

let unsubscribe = null

function onUpdate({ type, data }) {
  if (type === 'position') {
    position.value = data
    accuracy.value = data.accuracy
    readings.value = locationTracker.uwbDevice.scan()
    proximity.value = data.proximity
  }
}

function toggleTracking() {
  if (tracking.value) {
    locationTracker.stopTracking()
    tracking.value = false
  } else {
    locationTracker.startTracking()
    tracking.value = true
  }
}

onMounted(() => {
  unsubscribe = locationTracker.onPositionUpdate(onUpdate)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (tracking.value) locationTracker.stopTracking()
})
</script>

<style scoped>
.geofence-attendance {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.signal-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #475569;
  transition: all 0.3s;
}

.status-dot.active {
  background: #22C55E;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  animation: pulse-dot 2s infinite;
}

.badge {
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 20px;
}

.bar {
  width: 6px;
  height: 4px;
  background: #334155;
  border-radius: 2px;
  transition: all 0.3s;
}

.bar.active {
  background: var(--color-primary);
  animation: bar-glow 1s ease-in-out infinite;
}

.bar:nth-child(1).active { height: 8px; }
.bar:nth-child(2).active { height: 12px; }
.bar:nth-child(3).active { height: 16px; }
.bar:nth-child(4).active { height: 20px; }
.bar:nth-child(5).active { height: 20px; }

.location-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: 12px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 13px;
  color: var(--color-text);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.sim-badge {
  background: #F59E0B;
  color: #0F172A;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 700;
  margin-left: 4px;
}

.uwb-readings, .geofence-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reading-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--color-bg);
  border-radius: 8px;
  font-size: 12px;
}

.anchor-label {
  color: var(--color-text);
  font-weight: 500;
}

.reading-details {
  display: flex;
  gap: 12px;
}

.dist {
  color: var(--color-primary);
  font-family: monospace;
}

.rssi {
  font-family: monospace;
}

.rssi.good { color: #22C55E; }
.rssi.mid { color: #F59E0B; }
.rssi.poor { color: #EF4444; }

.proximity-card {
  padding: 12px;
  background: var(--color-bg);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.proximity-card.inside {
  border-color: var(--color-primary);
  box-shadow: 0 0 12px rgba(29, 78, 216, 0.15);
}

.room-code {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.room-name {
  font-size: 12px;
  color: var(--color-text-muted);
}

.proximity-meter {
  height: 4px;
  background: #1E293B;
  border-radius: 2px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.meter-fill.high { background: #22C55E; }
.meter-fill.mid { background: #F59E0B; }
.meter-fill.low { background: #EF4444; }

.proximity-details {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: monospace;
}

.checkin-btn {
  padding: 8px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.checkin-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bar-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}
</style>
