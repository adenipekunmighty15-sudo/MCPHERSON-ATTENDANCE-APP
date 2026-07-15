<template>
  <Teleport to="body">
    <div class="progress-overlay" @click.self="$emit('close')">
      <div class="progress-panel card card-hover">
        <div class="progress-header">
          <h2 class="progress-title">Study Progress</h2>
          <button class="close-btn" @click="$emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="streak-bar card card-hover">
          <div class="streak-flame">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#F59E0B"><path d="M12 2c1.5 3.5 4 6 4 10a4 4 0 0 1-8 0c0-4 2.5-6.5 4-10z"/></svg>
          </div>
          <div class="streak-info">
            <span class="streak-count">{{ studyStreak }} day streak</span>
            <span class="streak-sub">{{ totalSessions }} total sessions</span>
          </div>
          <div class="streak-dots">
            <div v-for="d in 7" :key="d" class="streak-dot" :class="{ active: d <= studyStreak }"></div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-block card card-hover" v-for="s in summaryStats" :key="s.label">
            <span class="stat-val" :style="{ color: s.color }">{{ s.value }}</span>
            <span class="stat-lbl">{{ s.label }}</span>
          </div>
        </div>

        <div class="xp-section">
          <div class="xp-header">
            <span class="xp-label">Total XP</span>
            <span class="xp-value">{{ totalXP }}</span>
          </div>
          <div class="xp-track">
            <div class="xp-fill" :style="{ width: xpPct + '%' }"></div>
          </div>
          <span class="xp-next">Level {{ currentLevel + 1 }} at {{ xpNextLevel }} XP</span>
        </div>

        <div class="badges-section">
          <h3 class="section-heading">Badges</h3>
          <div class="badges-grid">
            <div v-for="b in badges" :key="b.id" class="badge-item" :class="{ earned: b.earned }">
              <div class="badge-icon" :style="{ background: b.color + '18', color: b.color }">
                <span v-html="b.icon"></span>
              </div>
              <span class="badge-name">{{ b.name }}</span>
            </div>
          </div>
        </div>

        <div class="recent-section">
          <h3 class="section-heading">Recent Activity</h3>
          <div v-if="recentActivity.length" class="activity-list">
            <div v-for="(a, i) in recentActivity" :key="i" class="activity-item">
              <div class="activity-dot" :style="{ background: a.color }"></div>
              <div class="activity-info">
                <span class="activity-text">{{ a.text }}</span>
                <span class="activity-time">{{ a.time }}</span>
              </div>
            </div>
          </div>
          <p v-else class="no-activity">No recent activity yet</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../lib/api'

defineEmits(['close'])

const loading = ref(true)
const studyStreak = ref(0)
const totalSessions = ref(0)
const totalXP = ref(0)
const currentLevel = ref(1)
const totalNotes = ref(0)
const totalFlashcards = ref(0)
const totalQuizzes = ref(0)
const avgQuizScore = ref(0)
const recentActivity = ref([])

const xpNextLevel = computed(() => currentLevel.value * 1000)
const xpPct = computed(() => Math.min((totalXP.value / xpNextLevel.value) * 100, 100))

const summaryStats = computed(() => [
  { label: 'Notes', value: totalNotes.value, color: 'var(--color-primary)' },
  { label: 'Flashcards', value: totalFlashcards.value, color: '#60A5FA' },
  { label: 'Quizzes', value: totalQuizzes.value, color: '#818CF8' },
  { label: 'Avg Score', value: avgQuizScore.value + '%', color: '#34D399' },
])

const badges = computed(() => [
  { id: 1, name: 'First Note', color: '#3B82F6', earned: totalNotes.value > 0, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { id: 2, name: 'Card Master', color: '#F59E0B', earned: totalFlashcards.value >= 50, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/></svg>' },
  { id: 3, name: 'Quiz Whiz', color: '#8B5CF6', earned: avgQuizScore.value >= 90, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' },
  { id: 4, name: '7-Day Streak', color: '#EF4444', earned: studyStreak.value >= 7, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c1.5 3.5 4 6 4 10a4 4 0 0 1-8 0c0-4 2.5-6.5 4-10z"/></svg>' },
  { id: 5, name: '10 Notes', color: '#10B981', earned: totalNotes.value >= 10, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>' },
  { id: 6, name: 'Podcaster', color: '#EC4899', earned: false, icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>' },
])

onMounted(async () => {
  try {
    const [matRes, sessionsRes, badgesRes] = await Promise.allSettled([
      api.get('/study-materials'),
      api.get('/study-sessions/stats'),
      api.get('/gamification/badges'),
    ])
    if (matRes.status === 'fulfilled') {
      const mats = matRes.value.data || []
      totalNotes.value = mats.length
      totalFlashcards.value = mats.reduce((a, m) => a + (m.flashcardCount || 0), 0)
      totalQuizzes.value = mats.reduce((a, m) => {
        const q = m.quiz
        if (Array.isArray(q)) return a + q.length
        if (typeof q === 'string') { try { return a + JSON.parse(q).length } catch {} }
        return a
      }, 0)
    }
    if (sessionsRes.status === 'fulfilled') {
      const s = sessionsRes.value.data || {}
      studyStreak.value = s.streak || 0
      totalSessions.value = s.totalSessions || 0
      avgQuizScore.value = s.avgQuizScore || 0
      totalXP.value = s.totalXP || 0
      currentLevel.value = s.level || 1
      recentActivity.value = s.recentActivity || []
    }
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.progress-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px); z-index: 9000; display: flex;
  align-items: center; justify-content: center; padding: 20px;
}
.progress-panel {
  width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto;
  padding: 24px; border-radius: 18px; background: var(--color-surface);
  border: 1px solid var(--color-border); box-shadow: 0 24px 80px rgba(0,0,0,0.2);
}
.progress-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.progress-title { font-size: 18px; font-weight: 800; color: var(--color-text-primary); }
.close-btn {
  background: none; border: none; color: var(--color-text-tertiary);
  cursor: pointer; padding: 4px; border-radius: 6px;
}
.close-btn:hover { background: var(--color-primary-soft); }

.streak-bar {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  border-radius: 12px; background: var(--color-surface);
  border: 1px solid var(--color-border); margin-bottom: 16px;
}
.streak-info { flex: 1; }
.streak-count { font-size: 14px; font-weight: 700; color: var(--color-text-primary); display: block; }
.streak-sub { font-size: 11px; color: var(--color-text-tertiary); }
.streak-dots { display: flex; gap: 4px; }
.streak-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--color-border);
}
.streak-dot.active { background: #F59E0B; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
.stat-block {
  display: flex; flex-direction: column; align-items: center;
  padding: 12px 8px; border-radius: 10px; background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
}
.stat-val { font-size: 18px; font-weight: 800; }
.stat-lbl { font-size: 10px; color: var(--color-text-tertiary); margin-top: 2px; }

.xp-section { margin-bottom: 20px; }
.xp-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.xp-label { font-size: 12px; font-weight: 600; color: var(--color-text-tertiary); }
.xp-value { font-size: 14px; font-weight: 800; color: var(--color-primary); }
.xp-track { height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.xp-fill { height: 100%; background: linear-gradient(90deg, #3B82F6, #8B5CF6); border-radius: 4px; transition: width 0.6s ease; }
.xp-next { font-size: 10px; color: var(--color-text-tertiary); display: block; margin-top: 4px; }

.section-heading { font-size: 12px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 10px; }
.badges-section { margin-bottom: 20px; }
.badges-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.badge-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px; border-radius: 10px; border: 1px solid var(--color-border);
  background: var(--color-surface-elevated); opacity: 0.4;
}
.badge-item.earned { opacity: 1; }
.badge-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.badge-name { font-size: 10px; font-weight: 600; color: var(--color-text-secondary); text-align: center; }

.recent-section { }
.activity-list { display: flex; flex-direction: column; gap: 8px; }
.activity-item { display: flex; align-items: flex-start; gap: 10px; }
.activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.activity-info { flex: 1; }
.activity-text { font-size: 12px; color: var(--color-text-secondary); display: block; }
.activity-time { font-size: 10px; color: var(--color-text-tertiary); }
.no-activity { font-size: 12px; color: var(--color-text-tertiary); text-align: center; padding: 20px; }

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .badges-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
