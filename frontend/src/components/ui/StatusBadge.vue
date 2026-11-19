<template>
  <span :class="['status-badge', `status-${status}`]" :aria-label="`Status: ${status}`">
    {{ label }}
  </span>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    default: 'active',
    validator: (v) => ['active', 'present', 'inactive', 'pending', 'late', 'error', 'absent'].includes(v)
  },
  label: {
    type: String,
    required: true
  }
})

</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.status-badge::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: status-pulse 2s ease-in-out infinite;
}

.status-active,
.status-present {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.status-inactive {
  background: var(--color-bg-alt);
  color: var(--color-text-tertiary);
  animation: none;
}

.status-inactive::before {
  animation: none;
}

.status-pending,
.status-late {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.status-error,
.status-absent {
  background: var(--color-error-soft);
  color: var(--color-error);
}

@keyframes status-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 currentColor;
  }
  50% {
    box-shadow: 0 0 0 6px rgba(0, 0, 0, 0);
  }
}
</style>
