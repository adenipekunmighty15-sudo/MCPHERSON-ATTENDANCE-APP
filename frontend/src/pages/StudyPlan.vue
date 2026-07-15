<template>
  <div class="study-plan-page">
    <div class="page-header">
      <h1 class="page-title">Your Study Plan</h1>
      <p class="page-subtitle">Personalized recommendations based on your learning progress</p>
      <button class="refresh-btn" @click="loadPlan" :disabled="loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36M20.49 15a9 9 0 01-14.85 3.36"/>
        </svg>
      </button>
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your study plan...</p>
    </div>

    <div v-else class="plan-content">
      <!-- Daily Recommendation -->
      <div class="section">
        <h2 class="section-title">Today's Recommendation</h2>
        <div class="recommendation-card card card-hover">
          <div class="recommendation-grid">
            <div class="recommendation-item">
              <div class="item-label">Cards Due</div>
              <div class="item-value">{{ plan.cardsReady || 0 }}</div>
            </div>
            <div class="recommendation-item">
              <div class="item-label">Study Time</div>
              <div class="item-value">{{ plan.recommendedDaily?.minutes || 0 }}m</div>
            </div>
            <div class="recommendation-item">
              <div class="item-label">Cards/Session</div>
              <div class="item-value">{{ plan.recommendedDaily?.cardsPerSession || 0 }}</div>
            </div>
          </div>
          <button class="start-study-btn" @click="startStudy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21"/>
            </svg>
            Start Study Session
          </button>
        </div>
      </div>

      <!-- Weak Areas -->
      <div class="section">
        <h2 class="section-title">Areas Needing Focus</h2>
        <div v-if="!plan.weakAreas?.length" class="empty-section">
          <p>✓ No weak areas identified! Keep up the great work.</p>
        </div>
        <div v-else class="weak-areas-grid">
          <div v-for="area in plan.weakAreas" :key="area.materialId" class="weak-area-card card card-hover">
            <div class="area-header">
              <h3 class="area-title">{{ area.title }}</h3>
              <span class="area-strength" :style="{ color: getStrengthColor(area.strength) }">
                {{ area.strength }}%
              </span>
            </div>
            <div class="area-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: area.strength + '%', backgroundColor: getStrengthColor(area.strength) }"></div>
              </div>
            </div>
            <div class="area-stats">
              <span>{{ area.cardCount }} cards</span>
            </div>
            <button class="study-area-btn" @click="studyArea(area.materialId)">
              Study This Area
            </button>
          </div>
        </div>
      </div>

      <!-- Overall Statistics -->
      <div class="section">
        <h2 class="section-title">Learning Progress</h2>
        <div class="stats-grid">
          <div class="stat-card card card-hover">
            <div class="stat-icon" style="background:rgba(34,197,94,0.1);color:#22C55E">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Mastered</p>
              <p class="stat-number">{{ plan.statistics?.masteredCards || 0 }}</p>
            </div>
          </div>
          <div class="stat-card card card-hover">
            <div class="stat-icon" style="background:rgba(59,130,246,0.1);color:#3B82F6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">In Progress</p>
              <p class="stat-number">{{ plan.statistics?.learningCards || 0 }}</p>
            </div>
          </div>
          <div class="stat-card card card-hover">
            <div class="stat-icon" style="background:rgba(168,85,247,0.1);color:#A855F7">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="6" fill="currentColor">+</text>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">New Cards</p>
              <p class="stat-number">{{ plan.statistics?.newCards || 0 }}</p>
            </div>
          </div>
          <div class="stat-card card card-hover">
            <div class="stat-icon" style="background:rgba(249,115,22,0.1);color:#F97316">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Study Materials</p>
              <p class="stat-number">{{ plan.statistics?.totalMaterials || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../lib/api'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const plan = ref({})

async function loadPlan() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/study/spaced-repetition-plan')
    const { data, success } = response
    if (success || data) {
      plan.value = data || response
    }
  } catch (err) {
    console.error('Failed to load study plan:', err)
    error.value = err.message || 'Failed to load study plan'
  } finally {
    loading.value = false
  }
}

function getStrengthColor(strength) {
  if (strength >= 80) return '#22C55E'
  if (strength >= 60) return '#EAB308'
  if (strength >= 40) return '#F97316'
  return '#EF4444'
}

function startStudy() {
  router.push({ name: 'flashcard-review', params: { type: 'due' } })
}

function studyArea(materialId) {
  router.push({ name: 'flashcard-review', params: { materialId } })
}

onMounted(() => {
  loadPlan()
})
</script>

<style scoped>
.study-plan-page {
  padding: 20px;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
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

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-banner {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #EF4444;
  margin-bottom: 20px;
  font-size: 13px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.recommendation-card {
  padding: 24px;
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.recommendation-item {
  text-align: center;
}

.item-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 500;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
}

.start-study-btn {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-primary);
  color: white;
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

.start-study-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.empty-section {
  padding: 20px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.weak-areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.weak-area-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.area-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.area-strength {
  font-size: 18px;
  font-weight: 700;
}

.area-progress {
  margin-bottom: 12px;
}

.progress-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.area-stats {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 12px;
}

.study-area-btn {
  padding: 8px 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.study-area-btn:hover {
  background: var(--color-primary);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}
</style>
