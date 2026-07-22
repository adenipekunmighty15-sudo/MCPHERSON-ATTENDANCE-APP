<template>
  <div class="tooltip-container">
    <div 
      class="tooltip-trigger"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
      :aria-describedby="`tooltip-${id}`"
      role="button"
      :tabindex="0"
    >
      <slot name="trigger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </slot>
    </div>

    <Transition name="tooltip-fade">
      <div 
        v-if="showTooltip"
        :id="`tooltip-${id}`"
        :class="['tooltip-content', `tooltip-${position}`]"
        role="tooltip"
      >
        <slot>{{ text }}</slot>
        <div class="tooltip-arrow"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  text: String,
  position: {
    type: String,
    default: 'top',
    validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v)
  }
})

const showTooltip = ref(false)
const id = Math.random().toString(36).substr(2, 9)
</script>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tooltip-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  opacity: 0.7;
  transition: opacity var(--duration-fast) ease;
}

.tooltip-trigger:hover {
  opacity: 1;
}

.tooltip-content {
  position: absolute;
  padding: 8px 12px;
  background: var(--color-text-primary);
  color: var(--color-bg);
  font-size: 12px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 4px solid transparent;
}

.tooltip-top .tooltip-arrow {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: var(--color-text-primary);
}

.tooltip-bottom .tooltip-arrow {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: var(--color-text-primary);
}

.tooltip-left .tooltip-arrow {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: var(--color-text-primary);
}

.tooltip-right .tooltip-arrow {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: var(--color-text-primary);
}

/* Transitions */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all var(--duration-fast) ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
