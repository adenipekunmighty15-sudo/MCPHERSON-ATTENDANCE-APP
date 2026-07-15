<template>
  <Teleport to="body">
    <div class="timer-overlay" @click.self="$emit('close')">
      <div class="timer-panel card card-hover">
        <button class="close-btn" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div class="timer-display">
          <svg class="timer-ring" width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="82" fill="none" stroke="var(--color-border)" stroke-width="6" />
            <circle cx="90" cy="90" r="82" fill="none" stroke="currentColor" stroke-width="6"
              stroke-linecap="round" :stroke-dasharray="circumference"
              :stroke-dashoffset="progressOffset"
              :style="{ color: isBreak ? '#34D399' : 'var(--color-primary)', transition: 'stroke-dashoffset 1s linear' }" />
          </svg>
          <div class="timer-center">
            <span class="timer-time">{{ displayTime }}</span>
            <span class="timer-label">{{ isBreak ? 'Break Time' : 'Focus Time' }}</span>
          </div>
        </div>

        <div class="session-dots">
          <div v-for="n in totalSessions" :key="n" class="session-dot"
            :class="{ done: n <= completedSessions, active: n === completedSessions + 1 && !isBreak }">
          </div>
        </div>

        <div class="timer-controls">
          <button v-if="!running && !paused" class="ctrl-btn primary" @click="startFocus">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
            Start Focus
          </button>
          <button v-else-if="running && !paused" class="ctrl-btn pause" @click="pauseTimer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Pause
          </button>
          <button v-else-if="paused" class="ctrl-btn primary" @click="resumeTimer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
            Resume
          </button>
          <button class="ctrl-btn secondary" @click="skipTimer" v-if="running || paused">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            Skip
          </button>
        </div>

        <div class="timer-settings">
          <div class="setting-row">
            <span class="setting-label">Focus</span>
            <input v-model.number="focusMinutes" type="range" min="5" max="60" step="5" class="setting-slider" />
            <span class="setting-val">{{ focusMinutes }}m</span>
          </div>
          <div class="setting-row">
            <span class="setting-label">Break</span>
            <input v-model.number="breakMinutes" type="range" min="1" max="15" step="1" class="setting-slider" />
            <span class="setting-val">{{ breakMinutes }}m</span>
          </div>
        </div>

        <div class="stats-row">
          <div class="mini-stat">
            <span class="mini-val">{{ totalFocusMin }}</span>
            <span class="mini-lbl">min focused</span>
          </div>
          <div class="mini-stat">
            <span class="mini-val">{{ completedSessions }}</span>
            <span class="mini-lbl">sessions</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

defineEmits(['close'])

const focusMinutes = ref(25)
const breakMinutes = ref(5)
const totalSessions = ref(4)
const completedSessions = ref(0)
const isBreak = ref(false)
const running = ref(false)
const paused = ref(false)
const remaining = ref(0)
const totalFocusMin = ref(0)
let timer = null

const circumference = 2 * Math.PI * 82

const progressOffset = computed(() => {
  const total = isBreak.value ? breakMinutes.value * 60 : focusMinutes.value * 60
  const pct = total > 0 ? remaining.value / total : 1
  return circumference * (1 - pct)
})

const displayTime = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

function startFocus() {
  isBreak.value = false
  remaining.value = focusMinutes.value * 60
  running.value = true
  paused.value = false
  tick()
}

function tick() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (remaining.value > 0) {
      remaining.value--
    } else {
      clearInterval(timer)
      if (!isBreak.value) {
        totalFocusMin.value += focusMinutes.value
        completedSessions.value++
        isBreak.value = true
        remaining.value = breakMinutes.value * 60
        running.value = true
        paused.value = false
        tick()
      } else {
        isBreak.value = false
        running.value = false
        paused.value = false
        remaining.value = 0
      }
    }
  }, 1000)
}

function pauseTimer() { paused.value = true; running.value = false; clearInterval(timer) }
function resumeTimer() { running.value = true; paused.value = false; tick() }
function skipTimer() {
  clearInterval(timer)
  if (!isBreak.value) {
    totalFocusMin.value += Math.floor((focusMinutes.value * 60 - remaining.value) / 60)
    completedSessions.value++
  }
  isBreak.value = !isBreak.value
  remaining.value = isBreak.value ? breakMinutes.value * 60 : focusMinutes.value * 60
  running.value = false
  paused.value = false
}

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.timer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px); z-index: 9000; display: flex;
  align-items: center; justify-content: center; padding: 20px;
}
.timer-panel {
  width: 100%; max-width: 360px; padding: 28px; border-radius: 18px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  box-shadow: 0 24px 80px rgba(0,0,0,0.2); position: relative; text-align: center;
}
.close-btn {
  position: absolute; top: 12px; right: 12px; background: none; border: none;
  color: var(--color-text-tertiary); cursor: pointer; padding: 4px; border-radius: 6px;
}
.close-btn:hover { background: var(--color-primary-soft); }

.timer-display { position: relative; width: 180px; height: 180px; margin: 0 auto 20px; }
.timer-ring { transform: rotate(-90deg); }
.timer-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.timer-time { font-size: 36px; font-weight: 800; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
.timer-label { font-size: 11px; color: var(--color-text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.session-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 20px; }
.session-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-border); }
.session-dot.done { background: var(--color-success); }
.session-dot.active { background: var(--color-primary); animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.timer-controls { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
.ctrl-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  border: none; border-radius: 10px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.ctrl-btn.primary { background: var(--color-primary); color: #fff; }
.ctrl-btn.primary:hover { opacity: 0.9; }
.ctrl-btn.pause { background: var(--color-warning); color: #fff; }
.ctrl-btn.secondary {
  background: var(--color-surface-elevated); color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.ctrl-btn.secondary:hover { border-color: var(--color-border-strong); }

.timer-settings { margin-bottom: 16px; }
.setting-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.setting-label { font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); width: 40px; }
.setting-slider { flex: 1; accent-color: var(--color-primary); }
.setting-val { font-size: 12px; font-weight: 700; color: var(--color-primary); width: 30px; text-align: right; }

.stats-row { display: flex; gap: 16px; justify-content: center; }
.mini-stat { display: flex; flex-direction: column; align-items: center; }
.mini-val { font-size: 16px; font-weight: 800; color: var(--color-text-primary); }
.mini-lbl { font-size: 10px; color: var(--color-text-tertiary); }
</style>
