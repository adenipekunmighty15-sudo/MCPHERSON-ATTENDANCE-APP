<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal card card-hover">
        <div class="results-header">
          <div class="score-ring" :class="{ perfect: pct === 100, great: pct >= 80, ok: pct >= 50, bad: pct < 50 }">
            <span class="score-pct">{{ pct }}%</span>
          </div>
          <h2 class="results-title">{{ resultTitle }}</h2>
          <p class="results-sub">{{ correct }} / {{ total }} correct</p>
        </div>

        <div class="results-stats">
          <div class="rs-item">
            <span class="rs-value correct-val">{{ correct }}</span>
            <span class="rs-label">Correct</span>
          </div>
          <div class="rs-item">
            <span class="rs-value wrong-val">{{ total - correct }}</span>
            <span class="rs-label">Incorrect</span>
          </div>
          <div class="rs-item">
            <span class="rs-value time-val">{{ formatDuration(duration) }}</span>
            <span class="rs-label">Time</span>
          </div>
          <div class="rs-item">
            <span class="rs-value streak-val">{{ bestStreak }}</span>
            <span class="rs-label">Best Streak</span>
          </div>
        </div>

        <div v-if="questions.length" class="review-section">
          <h3 class="review-heading">Question Review</h3>
          <div v-for="(q, i) in questions" :key="i" class="review-item" :class="answers[i] === q.answerIndex ? 'review-correct' : 'review-wrong'">
            <div class="review-q-header">
              <span class="review-qnum">Q{{ i + 1 }}</span>
              <span class="review-status">
                <svg v-if="answers[i] === q.answerIndex" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </span>
            </div>
            <p class="review-qtext">{{ q.question }}</p>
            <div v-if="answers[i] !== q.answerIndex" class="review-correction">
              <span class="review-yours">Your answer: {{ q.options[answers[i]] || 'None' }}</span>
              <span class="review-correct-answer">Correct: {{ q.options[q.answerIndex] }}</span>
            </div>
            <div v-if="q.explanation" class="review-explanation">{{ q.explanation }}</div>
          </div>
        </div>

        <div class="results-actions">
          <button class="primary-btn" @click="$emit('retry')">Try Again</button>
          <button class="secondary-btn" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  correct: { type: Number, required: true },
  total: { type: Number, required: true },
  questions: { type: Array, default: () => [] },
  answers: { type: Array, default: () => [] },
  duration: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
})

defineEmits(['close', 'retry'])

const pct = computed(() => props.total ? Math.round((props.correct / props.total) * 100) : 0)
const resultTitle = computed(() => {
  if (pct.value === 100) return 'Perfect Score!'
  if (pct.value >= 80) return 'Great Job!'
  if (pct.value >= 50) return 'Not Bad!'
  return 'Keep Practicing'
})

function formatDuration(s) {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px); display: flex; align-items: center;
  justify-content: center; z-index: 9000; padding: 20px;
}
.modal {
  width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto;
  padding: 24px; border-radius: 18px; background: var(--color-surface);
  border: 1px solid var(--color-border); box-shadow: 0 24px 80px rgba(0,0,0,0.2);
}
.results-header { text-align: center; margin-bottom: 20px; }
.score-ring {
  width: 80px; height: 80px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px; color: #fff;
}
.score-ring.perfect, .score-ring.great { background: var(--color-success); }
.score-ring.ok { background: var(--color-warning); }
.score-ring.bad { background: var(--color-error); }
.score-pct { font-size: 22px; font-weight: 800; }
.results-title { font-size: 18px; font-weight: 800; color: var(--color-text-primary); margin-bottom: 2px; }
.results-sub { font-size: 13px; color: var(--color-text-tertiary); }

.results-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  margin-bottom: 20px;
}
.rs-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px; background: var(--color-surface-elevated);
  border-radius: 10px; border: 1px solid var(--color-border);
}
.rs-value { font-size: 16px; font-weight: 800; }
.rs-label { font-size: 10px; color: var(--color-text-tertiary); margin-top: 2px; }
.correct-val { color: var(--color-success); }
.wrong-val { color: var(--color-error); }
.time-val { color: var(--color-info); }
.streak-val { color: var(--color-warning); }

.review-section { margin-bottom: 20px; }
.review-heading { font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 10px; }
.review-item {
  padding: 12px; border-radius: 10px; border: 1px solid var(--color-border);
  margin-bottom: 8px; background: var(--color-surface-elevated);
}
.review-correct { border-left: 3px solid var(--color-success); }
.review-wrong { border-left: 3px solid var(--color-error); }
.review-q-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.review-qnum { font-size: 11px; font-weight: 700; color: var(--color-primary); background: var(--color-primary-soft); padding: 2px 6px; border-radius: 4px; }
.review-status { color: var(--color-success); }
.review-wrong .review-status { color: var(--color-error); }
.review-qtext { font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px; }
.review-correction { display: flex; flex-direction: column; gap: 2px; font-size: 11px; margin-bottom: 4px; }
.review-yours { color: var(--color-error); }
.review-correct-answer { color: var(--color-success); font-weight: 600; }
.review-explanation { font-size: 11px; color: var(--color-text-tertiary); line-height: 1.5; padding: 8px; background: var(--color-info-soft); border-radius: 6px; }

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

@media (max-width: 480px) { .results-stats { grid-template-columns: repeat(2, 1fr); } }
</style>
