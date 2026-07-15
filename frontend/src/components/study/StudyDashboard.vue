<template>
  <div class="study-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">Study Dashboard</h1>
        <p class="dashboard-subtitle">Your personalized learning analytics & recommendations</p>
      </div>
      <button class="refresh-btn" @click="loadData" :disabled="loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36M20.49 15a9 9 0 01-14.85 3.36"/>
        </svg>
      </button>
    </div>

    <!-- Main Grid -->
    <div class="dashboard-grid">
      <!-- Study Plan Card -->
      <div class="dashboard-card card card-hover">
        <div class="card-header">
          <h2 class="card-title">Today's Study Plan</h2>
          <span class="card-badge">{{ plan.recommendedDaily?.minutes || 0 }}m</span>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading-skeleton">
            <div class="skeleton-bar" style="width:80%"></div>
            <div class="skeleton-bar" style="width:60%;margin-top:8px"></div>
          </div>
          <div v-else class="plan-details">
            <div class="plan-item">
              <span class="plan-label">Cards Ready</span>
              <span class="plan-value">{{ plan.cardsReady || 0 }}</span>
            </div>
            <div class="plan-item">
              <span class="plan-label">Cards per Session</span>
              <span class="plan-value">{{ plan.recommendedDaily?.cardsPerSession || 0 }}</span>
            </div>
            <div class="plan-item">
              <span class="plan-label">Daily Goal</span>
              <span class="plan-value">{{ plan.recommendedDaily?.minutes || 0 }} minutes</span>
            </div>
            <button class="plan-btn" @click="startStudySession">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21"/>
              </svg>
              Start Session
            </button>
          </div>
        </div>
      </div>

      <!-- Weak Areas Card -->
      <div class="dashboard-card card card-hover">
        <div class="card-header">
          <h2 class="card-title">Areas to Focus</h2>
          <span class="card-badge">{{ plan.weakAreas?.length || 0 }}</span>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading-skeleton">
            <div v-for="n in 3" :key="n" style="margin-bottom:12px">
              <div class="skeleton-bar" style="width:90%;height:10px"></div>
              <div class="skeleton-bar" style="width:40%;height:8px;margin-top:6px"></div>
            </div>
          </div>
          <div v-else-if="!plan.weakAreas?.length" class="empty-state">
            <p>Great job! No weak areas detected.</p>
          </div>
          <div v-else class="weak-areas-list">
            <div v-for="area in plan.weakAreas" :key="area.materialId" class="weak-area-item">
              <div class="weak-area-info">
                <p class="weak-area-title">{{ area.title }}</p>
                <div class="weak-area-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: area.strength + '%', backgroundColor: getStrengthColor(area.strength) }"></div>
                  </div>
                  <span class="progress-label">{{ area.strength }}% strength</span>
                </div>
              </div>
              <button class="weak-area-action" @click="studyMaterial(area.materialId)" title="Study this material">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7m0-14h5a2 2 0 0 1 2 2v5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Learning Stats Card -->
      <div class="dashboard-card card card-hover">
        <div class="card-header">
          <h2 class="card-title">Learning Progress</h2>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading-skeleton">
            <div v-for="n in 4" :key="n" style="margin-bottom:12px">
              <div class="skeleton-bar" style="width:70%"></div>
            </div>
          </div>
          <div v-else class="stats-grid">
            <div class="stat-item">
              <span class="stat-icon" style="background:rgba(34,197,94,0.1);color:#22C55E">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <div>
                <p class="stat-name">Mastered</p>
                <p class="stat-count">{{ stats.masteredCards || 0 }}</p>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon" style="background:rgba(59,130,246,0.1);color:#3B82F6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </span>
              <div>
                <p class="stat-name">In Progress</p>
                <p class="stat-count">{{ stats.learningCards || 0 }}</p>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon" style="background:rgba(168,85,247,0.1);color:#A855F7">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <div>
                <p class="stat-name">New Cards</p>
                <p class="stat-count">{{ stats.newCards || 0 }}</p>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon" style="background:rgba(249,115,22,0.1);color:#F97316">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
                </svg>
              </span>
              <div>
                <p class="stat-name">Sessions</p>
                <p class="stat-count">{{ stats.sessionsCompleted || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div class="dashboard-card card card-hover">
        <div class="card-header">
          <h2 class="card-title">Quick Actions</h2>
        </div>
        <div class="card-content">
          <div class="actions-grid">
            <button class="action-btn" @click="createNewNote">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>New Note</span>
            </button>
            <button class="action-btn" @click="viewStudyPlan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2"/>
                <path d="M9 5v2M15 5v2"/>
              </svg>
              <span>Study Plan</span>
            </button>
            <button class="action-btn" @click="createStudyGroup">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Study Group</span>
            </button>
            <button class="action-btn" @click="generatePodcast">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="13" r="8"/><path d="M12 9v8M9 12h6M8 19h8"/>
              </svg>
              <span>Podcast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../lib/api'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const plan = ref({})
const stats = ref({})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/api/study/spaced-repetition-plan')
    const { data, success } = response
    if (success || data) {
      plan.value = data || response
      stats.value = data?.statistics || data
    } else {
      error.value = response.error || 'Failed to load study data'
    }
  } catch (err) {
    console.error('Failed to load study data:', err)
    error.value = err.message || 'Failed to load study data'
  } finally {
    loading.value = false
  }
}

function startStudySession() {
  if (plan.value?.cardsReady > 0) {
    router.push({ name: 'flashcard-review', params: { type: 'due' } })
  } else {
    alert('No cards due for review today! Great job staying on top of your studies. 🎉')
  }
}

function studyMaterial(materialId) {
  router.push({ name: 'flashcard-review', params: { materialId } })
}

function getStrengthColor(strength) {
  if (strength >= 80) return '#22C55E' // Green
  if (strength >= 60) return '#EAB308' // Yellow
  if (strength >= 40) return '#F97316' // Orange
  return '#EF4444' // Red
}

function createNewNote() {
  // Emit event to show create note modal
  window.dispatchEvent(new CustomEvent('show-create-note-modal'))
}

function viewStudyPlan() {
  router.push({ name: 'study-plan' })
}

function createStudyGroup() {
  // Emit event to show create group modal
  window.dispatchEvent(new CustomEvent('show-create-group-modal'))
}

function generatePodcast() {
  // Navigate to podcast generation or show modal
  router.push({ name: 'podcast-generator' })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.study-dashboard {
  padding: 20px;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.header-content {
  flex: 1;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.dashboard-subtitle {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.refresh-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.dashboard-card {
  padding: 20px;
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.card-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
}

.card-content {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-bar {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--color-surface-elevated) 25%,
    var(--color-border) 50%,
    var(--color-surface-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.plan-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.plan-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
}

.plan-btn {
  margin-top: 12px;
  width: 100%;
  padding: 10px 14px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.plan-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--color-text-tertiary);
}

.weak-areas-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weak-area-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-surface-elevated);
  transition: all 0.2s ease;
}

.weak-area-item:hover {
  background: var(--color-primary-soft);
}

.weak-area-info {
  flex: 1;
}

.weak-area-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.weak-area-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 10px;
  color: var(--color-text-tertiary);
  min-width: 50px;
}

.weak-area-action {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.weak-area-action:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-surface-elevated);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-name {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-count {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.action-btn {
  padding: 12px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
