<template>
  <div class="progress-container">
    <div v-if="showLabel" class="progress-label">
      <span class="progress-label-text">{{ label }}</span>
      <span v-if="showPercentage" class="progress-percentage">{{ Math.round(value) }}%</span>
    </div>
    <div class="progress-bar-container" :class="`progress-${variant}`" role="progressbar" :aria-valuenow="value" :aria-valuemin="0" :aria-valuemax="100" :aria-label="label">
      <div 
        class="progress-bar-fill" 
        :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
        :class="{ 'progress-indeterminate': indeterminate }"
      ></div>
    </div>
    <div v-if="showSteps" class="progress-steps">
      <span v-for="i in steps" :key="i" :class="['step', { active: i <= currentStep }]"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: Number,
    default: 0,
    validator: (v) => v >= 0 && v <= 100
  },
  label: String,
  showLabel: {
    type: Boolean,
    default: false
  },
  showPercentage: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'error'].includes(v)
  },
  indeterminate: {
    type: Boolean,
    default: false
  },
  steps: {
    type: Number,
    default: 0
  },
  currentStep: {
    type: Number,
    default: 0
  },
  showSteps: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.progress-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
}

.progress-label-text {
  color: var(--color-text-primary);
}

.progress-percentage {
  color: var(--color-text-secondary);
}

.progress-bar-container {
  height: 6px;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width var(--duration-normal) var(--ease-out);
  background: var(--color-primary);
}

.progress-primary .progress-bar-fill {
  background: var(--color-primary);
}

.progress-success .progress-bar-fill {
  background: var(--color-success);
}

.progress-warning .progress-bar-fill {
  background: var(--color-warning);
}

.progress-error .progress-bar-fill {
  background: var(--color-error);
}

.progress-bar-fill.progress-indeterminate {
  animation: progress-indeterminate 1.5s var(--ease-out) infinite;
  width: 30% !important;
}

@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.step {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 9999px;
  transition: background var(--duration-normal) ease;
}

.step.active {
  background: var(--color-primary);
}
</style>
