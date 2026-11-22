<template>
  <div
    v-if="show"
    class="modal-overlay-3d"
    role="dialog"
    aria-modal="true"
    aria-labelledby="walkthrough-title"
    tabindex="-1"
    @click.self="skip"
    @keydown.esc.prevent="skip"
  >
    <div class="modal-content-3d walkthrough">
      <div class="walkthrough__counter">Step {{ currentStep + 1 }} of {{ steps.length }}</div>

      <div class="walkthrough__illustration">
        <div class="walkthrough__icon" aria-hidden="true">{{ steps[currentStep].icon || emojiList[currentStep % emojiList.length] }}</div>
      </div>

      <h2 id="walkthrough-title" class="walkthrough__title">{{ steps[currentStep].title }}</h2>
      <p class="walkthrough__desc">{{ steps[currentStep].content }}</p>

      <div class="walkthrough__dots">
        <span
          v-for="(_, i) in steps"
          :key="i"
          class="walkthrough__dot"
          :class="{ active: i === currentStep }"
        />
      </div>

      <div class="walkthrough__actions">
        <button ref="skipButton" class="btn-3d-ghost" @click="skip">Skip</button>
        <button v-if="currentStep > 0" class="btn-3d-ghost" @click="previous">Back</button>
        <button
          v-if="currentStep < steps.length - 1"
          class="btn-3d"
          @click="next"
        >Next</button>
        <button
          v-else
          class="btn-3d"
          @click="complete"
        >Get Started</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  steps: {
    type: Array,
    default: () => [
      { title: 'Welcome', content: 'Welcome to McPherson Attendance', icon: '🎓' },
      { title: 'Features', content: 'Explore campus features', icon: '✅' },
      { title: 'Ready', content: 'You\'re all set!', icon: '🚀' },
    ],
  },
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['complete', 'skip'])

const currentStep = ref(0)
const skipButton = ref(null)

const emojiList = ['🎓', '✅', '🚀']

watch(() => props.show, (isOpen) => {
  if (isOpen) nextTick(() => skipButton.value?.focus())
})

function next() {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
  }
}

function previous() {
  if (currentStep.value > 0) currentStep.value--
}

function skip() {
  currentStep.value = 0
  emit('skip')
}

function complete() {
  currentStep.value = 0
  emit('complete')
}
</script>

<style scoped>
.modal-overlay-3d {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 20px;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(8px);
}

.modal-content-3d {
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.3);
}

.walkthrough {
  max-width: 480px;
  width: 90%;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  padding: 32px 28px;
  text-align: center;
  transform-style: preserve-3d;
}

.walkthrough__counter {
  font-size: 12px;
  font-weight: 600;
  color: #929b8e;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 24px;
}

.walkthrough__illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.walkthrough__icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 4px 16px rgba(0, 102, 255, 0.3), 0 8px 32px rgba(0, 102, 255, 0.15);
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.walkthrough:hover .walkthrough__icon {
  transform: translateZ(12px) rotateX(2deg);
}

.walkthrough__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #24352a;
}

.walkthrough__desc {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

.walkthrough__dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 28px;
}

.walkthrough__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5dece;
  transition: background 0.2s ease, transform 0.2s ease;
  transform-style: preserve-3d;
}

.walkthrough__dot.active {
  background: var(--color-primary);
  transform: translateZ(4px) scale3d(1.3, 1.3, 1.3);
}

.walkthrough__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-3d,
.btn-3d-ghost {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.btn-3d {
  background: var(--color-primary);
  color: #fff;
}

.btn-3d:hover {
  transform: translateY(-1px);
  background: var(--color-primary-hover);
}

.btn-3d-ghost {
  border-color: #e5dece;
  background: #fff;
  color: #475569;
}

.btn-3d-ghost:hover {
  background: #eee8da;
  color: #24352a;
}

.btn-3d:focus-visible,
.btn-3d-ghost:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.45);
  outline-offset: 2px;
}
</style>
