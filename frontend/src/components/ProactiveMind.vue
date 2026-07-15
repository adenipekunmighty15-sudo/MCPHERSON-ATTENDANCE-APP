<template>
  <div class="proactive-panel" :class="{ visible: visible }">
    <div class="panel-header">
      <h3>Proactive Insights</h3>
      <button class="panel-close" @click="$emit('close')">&times;</button>
    </div>
    <div class="panel-body">
      <div v-if="loading" class="panel-loading">
        <div class="spinner"></div>
        <span>Checking in on you...</span>
      </div>
      <div v-else-if="items.length === 0" class="panel-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p>All clear! No insights right now.</p>
      </div>
      <div v-else class="insights-list">
        <div v-for="item in items" :key="item.id" class="insight-card" :class="'priority-' + item.priority">
          <div class="insight-icon" :class="'type-' + item.type">
            <span v-if="item.type === 'flashcards_due'">&#x1F4CF;</span>
            <span v-else-if="item.type === 'quiz_drop'">&#x1F4CA;</span>
            <span v-else-if="item.type === 'study_today'">&#x1F4D6;</span>
            <span v-else-if="item.type === 'study_streak'">&#x1F525;</span>
            <span v-else-if="item.type === 'podcast_available'">&#x1F3A7;</span>
            <span v-else-if="item.type === 'no_flashcards'">&#x1F4AD;</span>
            <span v-else-if="item.type === 'exam_approaching'">&#x23F0;</span>
            <span v-else-if="item.type === 'attendance_drop'">&#x26A0;</span>
            <span v-else-if="item.type === 'streak_reset'">&#x1F4AA;</span>
            <span v-else>&#x1F4A1;</span>
          </div>
          <div class="insight-priority">
            <span class="priority-badge" :class="item.priority">{{ item.priority }}</span>
          </div>
          <div class="insight-content">
            <p class="insight-text">{{ item.text }}</p>
            <span class="insight-time">{{ timeAgo(item.createdAt) }}</span>
          </div>
          <button class="insight-dismiss" @click="dismiss(item.id)" title="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="panel-footer">
      <span class="auto-refresh" :class="{ refreshing }">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Auto-refreshing
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../lib/api'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'update'])

const items = ref([])
const loading = ref(true)
const refreshing = ref(false)

let refreshTimer = null

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  return Math.floor(hours / 24) + 'd ago'
}

async function load() {
  try {
    const { data } = await api.get('/proactive/insights')
    items.value = data.insights || []
    emit('update', items.value.length)
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

async function dismiss(id) {
  try {
    await api.post('/proactive/dismiss', { insightId: id })
    items.value = items.value.filter(i => i.id !== id)
    emit('update', items.value.length)
  } catch {}
}

async function refresh() {
  refreshing.value = true
  try {
    const { data } = await api.post('/proactive/refresh')
    items.value = data.insights || []
    emit('update', items.value.length)
  } catch {}
  setTimeout(() => { refreshing.value = false }, 1000)
}

onMounted(() => {
  load()
  refreshTimer = setInterval(load, 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.proactive-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 360px;
  max-height: 480px;
  background: var(--color-surface-elevated, #1E1E2E);
  border: 1px solid var(--color-border, #2D2D3D);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 999;
  transform: translateY(16px);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.proactive-panel.visible {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--color-border, #2D2D3D);
}
.panel-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #FFFFFF);
}
.panel-close {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--color-text-tertiary, #888);
  font-size: 20px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.panel-close:hover { background: var(--color-bg-tertiary, #2D2D3D); color: var(--color-text-primary, #FFF); }
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}
.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: var(--color-text-tertiary, #888);
  font-size: 13px;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border-strong, #444);
  border-top-color: var(--color-primary, var(--color-primary));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--color-text-tertiary, #888);
  font-size: 13px;
  text-align: center;
}
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.insight-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-surface-raised, #1A1A2E);
  border: 1px solid var(--color-border, #2D2D3D);
  transition: all 0.2s ease;
}
.insight-card:hover { border-color: var(--color-primary, var(--color-primary)); }
.insight-card.priority-high { border-left: 3px solid #FF4D4D; }
.insight-card.priority-medium { border-left: 3px solid #FFB347; }
.insight-card.priority-low { border-left: 3px solid #4CAF50; }
.insight-priority { flex-shrink: 0; padding-top: 1px; }
.insight-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: var(--color-surface, rgba(255,255,255,0.05));
  border: 1px solid var(--color-border, #2D2D3D);
}
.insight-icon.type-flashcards_due { background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); }
.insight-icon.type-quiz_drop { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }
.insight-icon.type-study_today { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
.insight-icon.type-study_streak { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }
.insight-icon.type-podcast_available { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }
.insight-icon.type-exam_approaching { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }
.insight-icon.type-attendance_drop { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }
.insight-icon.type-streak_reset { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }
.priority-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.priority-badge.high { background: rgba(255, 77, 77, 0.15); color: #FF4D4D; }
.priority-badge.medium { background: rgba(255, 179, 71, 0.15); color: #FFB347; }
.priority-badge.low { background: rgba(76, 175, 80, 0.15); color: #4CAF50; }
.insight-content { flex: 1; min-width: 0; }
.insight-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-primary, #FFF);
}
.insight-time {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary, #888);
}
.insight-dismiss {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--color-text-tertiary, #888);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: all 0.2s;
  margin-top: 2px;
}
.insight-dismiss:hover { opacity: 1; background: var(--color-bg-tertiary, #2D2D3D); color: var(--color-text-primary, #FFF); }
.panel-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--color-border, #2D2D3D);
  display: flex;
  align-items: center;
  justify-content: center;
}
.auto-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-tertiary, #888);
}
.auto-refresh.refreshing svg { animation: spin 0.8s linear infinite; }
</style>
