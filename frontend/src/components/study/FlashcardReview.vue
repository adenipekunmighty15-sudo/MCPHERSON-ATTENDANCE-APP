<template>
  <Teleport to="body">
    <div class="review-overlay" @click.self="$emit('close')">
      <div class="review-panel card card-hover">
        <div class="review-header">
          <button class="back-btn" @click="$emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div class="review-title-area">
            <h2 class="review-title">Flashcard Review</h2>
            <span class="review-meta">{{ currentIndex + 1 }} / {{ cards.length }}</span>
          </div>
          <div class="review-stats">
            <span class="stat-pill correct">{{ correctCount }}</span>
            <span class="stat-pill wrong">{{ wrongCount }}</span>
          </div>
        </div>

        <div v-if="loading" class="review-loading">
          <div class="spinner-lg"></div>
          <p>Loading flashcards...</p>
        </div>

        <div v-else-if="!cards.length" class="review-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-tertiary)">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h4M6 12h8"/></svg>
          <p>No flashcards to review</p>
        </div>

        <div v-else class="review-body">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
          </div>

          <div class="card-stage">
            <div class="fc-card" :class="{ flipped }" @click="flipped = !flipped">
              <div class="fc-face fc-front card card-hover">
                <span class="fc-label">Question</span>
                <p class="fc-text">{{ cards[currentIndex]?.front }}</p>
                <span class="fc-hint">Tap to reveal</span>
              </div>
              <div class="fc-face fc-back" :class="lastRating === 3 ? 'correct-back' : lastRating === 1 ? 'wrong-back' : ''">
                <span class="fc-label">Answer</span>
                <p class="fc-text">{{ cards[currentIndex]?.back }}</p>
                <span class="fc-hint">Rate below</span>
              </div>
            </div>
          </div>

          <div v-if="flipped" class="rating-row">
            <button class="rate-btn rate-hard" @click="rate(1)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15 3 8M14 15l7-7"/><path d="M3 8h18v8H3z"/></svg>
              Again
            </button>
            <button class="rate-btn rate-ok" @click="rate(2)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/></svg>
              Hard
            </button>
            <button class="rate-btn rate-good" @click="rate(3)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              Good
            </button>
            <button class="rate-btn rate-easy" @click="rate(4)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Easy
            </button>
          </div>

          <div v-if="finished" class="review-results">
            <div class="results-circle" :class="{ great: scorePct >= 80 }">
              <span class="results-num">{{ scorePct }}%</span>
            </div>
            <h3>Review Complete!</h3>
            <p>{{ correctCount }}/{{ cards.length }} mastered</p>
            <div class="results-actions">
              <button class="primary-btn" @click="resetReview">Review Again</button>
              <button class="secondary-btn" @click="$emit('close')">Done</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../lib/api'

const props = defineProps({ materialId: String, initialCards: { type: Array, default: () => [] } })
const emit = defineEmits(['close', 'reviewed'])

const loading = ref(true)
const cards = ref([])
const currentIndex = ref(0)
const flipped = ref(false)
const correctCount = ref(0)
const wrongCount = ref(0)
const lastRating = ref(0)
const finished = ref(false)
const ratings = ref([])

const progressPct = computed(() => cards.value.length ? (currentIndex.value / cards.value.length) * 100 : 0)
const scorePct = computed(() => {
  if (!cards.value.length) return 0
  const score = ratings.value.reduce((a, r) => a + (r >= 3 ? 1 : 0), 0)
  return Math.round((score / cards.value.length) * 100)
})

function rate(quality) {
  ratings.value.push(quality)
  lastRating.value = quality
  if (quality >= 3) correctCount.value++
  else wrongCount.value++

  api.post(`/study-materials/${props.materialId}/flashcards/review`, {
    flashcardId: cards.value[currentIndex.value]?.id, quality
  }).catch(() => {})

  if (currentIndex.value < cards.value.length - 1) {
    currentIndex.value++
    flipped.value = false
  } else {
    finished.value = true
    emit('reviewed', { correct: correctCount.value, wrong: wrongCount.value, total: cards.value.length })
  }
}

function resetReview() {
  currentIndex.value = 0
  flipped.value = false
  correctCount.value = 0
  wrongCount.value = 0
  lastRating.value = 0
  finished.value = false
  ratings.value = []
  cards.value = [...cards.value].sort(() => Math.random() - 0.5)
}

onMounted(async () => {
  if (props.initialCards.length) {
    cards.value = [...props.initialCards].sort(() => Math.random() - 0.5)
    loading.value = false
    return
  }
  try {
    const { data } = await api.get(`/study-materials/${props.materialId}`)
    try {
      cards.value = typeof data.flashcards === 'string' ? JSON.parse(data.flashcards) : (data.flashcards || [])
    } catch (e) { console.warn('[Flashcard] Parse failed:', e); cards.value = [] }
    cards.value = [...cards.value].sort(() => Math.random() - 0.5)
  } catch (e) { console.warn('[Flashcard] Load failed:', e) }
  loading.value = false
})
</script>

<style scoped>
.review-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px); z-index: 9000; display: flex;
  align-items: center; justify-content: center; padding: 20px;
}
.review-panel {
  width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
  padding: 24px; border-radius: 18px; background: var(--color-surface);
  border: 1px solid var(--color-border); box-shadow: 0 24px 80px rgba(0,0,0,0.2);
}
.review-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
}
.back-btn {
  background: none; border: none; color: var(--color-text-tertiary);
  cursor: pointer; padding: 4px; border-radius: 6px;
}
.back-btn:hover { background: var(--color-primary-soft); }
.review-title-area { flex: 1; }
.review-title { font-size: 18px; font-weight: 800; color: var(--color-text-primary); }
.review-meta { font-size: 11px; color: var(--color-text-tertiary); }
.review-stats { display: flex; gap: 6px; }
.stat-pill {
  padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.stat-pill.correct { background: var(--color-success-soft); color: var(--color-success); }
.stat-pill.wrong { background: var(--color-error-soft); color: var(--color-error); }

.review-loading, .review-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px; gap: 12px;
  color: var(--color-text-tertiary);
}
.spinner-lg {
  width: 36px; height: 36px; border: 3px solid var(--color-border);
  border-top-color: var(--color-primary); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.progress-track {
  height: 4px; background: var(--color-border); border-radius: 2px;
  margin-bottom: 24px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--color-primary); border-radius: 2px;
  transition: width 0.4s ease;
}

.card-stage { perspective: 1000px; margin-bottom: 20px; }
.fc-card {
  width: 100%; max-width: 480px; height: 300px; margin: 0 auto;
  position: relative; cursor: pointer; transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.fc-card.flipped { transform: rotateY(180deg); }
.fc-face {
  position: absolute; inset: 0; border-radius: 16px; padding: 24px;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; backface-visibility: hidden;
}
.fc-front {
  background: var(--color-surface); border: 2px solid var(--color-border);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.fc-back {
  background: var(--color-primary); color: #fff;
  transform: rotateY(180deg);
}
.fc-back.correct-back { background: var(--color-success); }
.fc-back.wrong-back { background: var(--color-error); }
.fc-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; opacity: 0.6; margin-bottom: 12px;
}
.fc-text {
  font-size: 16px; font-weight: 600; line-height: 1.5; text-align: center;
}
.fc-hint { font-size: 11px; opacity: 0.4; margin-top: 16px; }

.rating-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.rate-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 8px; border: 2px solid var(--color-border);
  border-radius: 12px; background: var(--color-surface);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.rate-hard { color: var(--color-error); }
.rate-hard:hover { border-color: var(--color-error); background: var(--color-error-soft); }
.rate-ok { color: var(--color-warning); }
.rate-ok:hover { border-color: var(--color-warning); background: var(--color-warning-soft); }
.rate-good { color: var(--color-success); }
.rate-good:hover { border-color: var(--color-success); background: var(--color-success-soft); }
.rate-easy { color: var(--color-info); }
.rate-easy:hover { border-color: var(--color-info); background: var(--color-info-soft); }

.review-results {
  text-align: center; padding: 20px 0;
}
.results-circle {
  width: 80px; height: 80px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.results-circle.great { background: var(--color-success); }
.results-num { font-size: 20px; font-weight: 800; }
.review-results h3 { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.review-results p { font-size: 13px; color: var(--color-text-tertiary); margin-bottom: 20px; }
.results-actions { display: flex; gap: 8px; justify-content: center; }
.primary-btn {
  padding: 10px 20px; background: var(--color-primary); color: #fff;
  border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.primary-btn:hover { opacity: 0.9; }
.secondary-btn {
  padding: 10px 20px; background: var(--color-surface-elevated); color: var(--color-text-secondary);
  border: 1px solid var(--color-border); border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.secondary-btn:hover { border-color: var(--color-border-strong); }

@media (max-width: 480px) {
  .rating-row { grid-template-columns: repeat(2, 1fr); }
  .fc-card { height: 240px; }
}
</style>
