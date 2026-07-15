<template>
  <div v-if="show" class="modal-overlay-3d" @click.self="skip">
    <div class="modal-content-3d walkthrough">
      <div class="walkthrough__counter">Step {{ currentStep + 1 }} of {{ steps.length }}</div>

      <div class="walkthrough__illustration">
        <div class="walkthrough__icon">{{ emojiList[currentStep] }}</div>
      </div>

      <h2 class="walkthrough__title">{{ steps[currentStep].title }}</h2>
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
        <button class="btn-3d-ghost" @click="skip">Skip</button>
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
import { ref } from 'vue'

const props = defineProps({
  steps: {
    type: Array,
    default: () => [
      { title: 'Welcome', content: 'Welcome to McPherson Attendance', target: '', placement: '' },
      { title: 'Features', content: 'Explore campus features', target: '', placement: '' },
      { title: 'Ready', content: 'You\'re all set!', target: '', placement: '' },
    ],
  },
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['complete', 'skip'])

const currentStep = ref(0)

const emojiList = ['🎓', '✅', '🚀']

function next() {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
  }
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
.walkthrough {
  max-width: 480px;
  width: 90%;
  padding: 32px 28px;
  text-align: center;
  transform-style: preserve-3d;
}

.walkthrough__counter {
  font-size: 12px;
  font-weight: 600;
  color: #94A3B8;
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
  color: #0F172A;
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
  background: #E2E8F0;
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
}
</style>
