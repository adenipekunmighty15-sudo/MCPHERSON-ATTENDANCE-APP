<template>
  <div class="podcast-player-wrapper card card-hover" v-if="url || generating">
    <div class="podcast-header">
      <div class="podcast-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary)"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></svg>
      </div>
      <div class="podcast-info">
        <span class="podcast-title">AI Podcast</span>
        <span class="podcast-subtitle">{{ generating ? 'Generating audio...' : formatDuration(duration) }}</span>
      </div>
      <button v-if="generating" class="gen-dots"><span></span><span></span><span></span></button>
    </div>

    <div v-if="generating" class="podcast-loading">
      <div class="load-bar"><div class="load-fill" :style="{ width: progress + '%' }"></div></div>
      <span class="load-text">Creating your podcast...</span>
    </div>

    <div v-else-if="url" class="podcast-controls">
      <button class="play-btn" @click="togglePlay">
        <svg v-if="!playing" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      </button>
      <div class="progress-area" @click="seek" ref="progressRef">
        <div class="track-bar">
          <div class="track-fill" :style="{ width: seekPct + '%' }"></div>
        </div>
      </div>
      <span class="time-label">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      <div class="speed-control">
        <button v-for="s in [0.5, 1, 1.5, 2]" :key="s" class="speed-btn" :class="{ active: playbackRate === s }" @click="setSpeed(s)">{{ s }}x</button>
      </div>
    </div>

    <audio ref="audioRef" :src="url" @timeupdate="onTimeUpdate" @loadedmetadata="onLoaded" @ended="playing = false" preload="metadata" />
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({ url: String, generating: Boolean, progress: { type: Number, default: 0 } })

const audioRef = ref(null)
const progressRef = ref(null)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playbackRate = ref(1)

const seekPct = ref(0)

function togglePlay() {
  if (!audioRef.value) return
  if (playing.value) { audioRef.value.pause() }
  else { audioRef.value.play() }
  playing.value = !playing.value
}

function onTimeUpdate() {
  if (!audioRef.value) return
  currentTime.value = audioRef.value.currentTime
  seekPct.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
}

function onLoaded() {
  if (audioRef.value) duration.value = audioRef.value.duration
}

function seek(e) {
  if (!audioRef.value || !progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  audioRef.value.currentTime = pct * duration.value
}

function setSpeed(rate) {
  playbackRate.value = rate
  if (audioRef.value) audioRef.value.playbackRate = rate
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatDuration(s) {
  if (!s) return ''
  return formatTime(s)
}

watch(() => props.url, () => {
  playing.value = false
  currentTime.value = 0
  seekPct.value = 0
})

onUnmounted(() => { if (audioRef.value) { audioRef.value.pause() } })
</script>

<style scoped>
.podcast-player-wrapper { padding: 16px; border-radius: 14px; }
.podcast-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.podcast-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.podcast-info { flex: 1; }
.podcast-title { font-size: 13px; font-weight: 700; color: var(--color-text-primary); display: block; }
.podcast-subtitle { font-size: 11px; color: var(--color-text-tertiary); }

.gen-dots { display: flex; gap: 4px; }
.gen-dots span { width: 6px; height: 6px; background: var(--color-primary); border-radius: 50%; animation: dotBounce 1.2s infinite; }
.gen-dots span:nth-child(2) { animation-delay: 0.2s; }
.gen-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

.podcast-loading { }
.load-bar { height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
.load-fill { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.5s; }
.load-text { font-size: 11px; color: var(--color-text-tertiary); }

.podcast-controls { display: flex; align-items: center; gap: 10px; }
.play-btn {
  width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary);
  color: #fff; border: none; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;
}
.play-btn:hover { opacity: 0.9; }

.progress-area { flex: 1; cursor: pointer; padding: 8px 0; }
.track-bar { height: 4px; background: var(--color-border); border-radius: 2px; }
.track-fill { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.1s linear; }

.time-label { font-size: 10px; color: var(--color-text-tertiary); font-variant-numeric: tabular-nums; white-space: nowrap; }

.speed-control { display: flex; gap: 2px; }
.speed-btn {
  padding: 2px 6px; background: none; border: 1px solid var(--color-border);
  border-radius: 4px; font-size: 9px; font-weight: 600; color: var(--color-text-tertiary); cursor: pointer;
}
.speed-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

@media (max-width: 480px) {
  .podcast-controls { flex-wrap: wrap; }
  .speed-control { margin-top: 4px; }
}
</style>
