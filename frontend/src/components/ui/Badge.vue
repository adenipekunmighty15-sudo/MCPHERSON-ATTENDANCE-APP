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
  background: var(--color-bg-alt);
  color: var(--color-text-secondary);
}

.badge-success {
  background: var(--color-success-soft);
  color: #047857;
}

.badge-error {
  background: var(--color-error-soft);
  color: #dc2626;
}

.badge-warning {
  background: var(--color-warning-soft);
  color: #b45309;
}

.badge-info {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
</style>
