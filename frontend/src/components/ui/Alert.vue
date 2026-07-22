<template>
  <div 
    :class="[
      'alert',
      `alert-${type}`
    ]"
    role="alert"
  >
    <div class="alert-icon">
      <component :is="getIcon(type)" />
    </div>
    <div class="alert-content">
      <div v-if="title" class="alert-title">{{ title }}</div>
      <slot />
    </div>
    <button v-if="closable" class="alert-close" @click="$emit('close')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6l-12 12M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, markRaw } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'error', 'warning', 'info'].includes(v)
  },
  title: String,
  closable: Boolean
})

const emit = defineEmits(['close'])

const icons = {
  success: markRaw({
    template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
  }),
  error: markRaw({
    template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  }),
  warning: markRaw({
    template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  }),
  info: markRaw({
    template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  })
}

function getIcon(type) {
  return icons[type] || icons.info
}
</script>

<style scoped>
.alert {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid;
  animation: slideIn 0.3s ease;
}

.alert-success {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  color: #047857;
}

.alert-error {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
  color: #b45309;
}

.alert-info {
  background: rgba(11, 79, 140, 0.08);
  border-color: rgba(11, 79, 140, 0.3);
  color: var(--color-primary);
}

.alert-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.alert-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.alert-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.alert-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
