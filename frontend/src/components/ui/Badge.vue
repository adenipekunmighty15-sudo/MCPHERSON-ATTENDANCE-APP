<template>
  <span 
    :class="[
      'badge',
      `badge-${variant}`,
      `badge-${size}`
    ]"
  >
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'success', 'error', 'warning', 'info'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-radius: 9999px;
  white-space: nowrap;
}

/* Sizes */
.badge-sm {
  padding: 2px 8px;
  font-size: 11px;
  height: 20px;
}

.badge-md {
  padding: 4px 12px;
  font-size: 12px;
  height: 24px;
}

.badge-lg {
  padding: 6px 16px;
  font-size: 13px;
  height: 32px;
}

/* Variants */
.badge-primary {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.badge-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.badge-error {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
}

.badge-info {
  background: rgba(11, 79, 140, 0.15);
  color: var(--color-primary);
}
</style>
