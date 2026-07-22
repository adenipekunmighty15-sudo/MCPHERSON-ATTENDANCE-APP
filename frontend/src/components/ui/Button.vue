<template>
  <button 
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-disabled': disabled, 'btn-loading': loading, 'btn-icon-only': iconOnly }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <component v-if="icon && !loading" :is="icon" class="btn-icon" />
    <span v-if="!iconOnly" class="btn-label"><slot /></span>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  disabled: Boolean,
  loading: Boolean,
  icon: Object,
  iconOnly: Boolean
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  user-select: none;
  position: relative;
  overflow: hidden;
}

/* Sizes */
.btn-xs {
  padding: 4px 12px;
  font-size: 12px;
  height: 28px;
}

.btn-sm {
  padding: 6px 16px;
  font-size: 13px;
  height: 32px;
}

.btn-md {
  padding: 8px 20px;
  font-size: 14px;
  height: 40px;
}

.btn-lg {
  padding: 10px 24px;
  font-size: 15px;
  height: 48px;
}

.btn-xl {
  padding: 12px 28px;
  font-size: 16px;
  height: 56px;
}

/* Variants */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  box-shadow: 0 4px 15px rgba(11, 79, 140, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(11, 79, 140, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--color-primary);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-primary-soft);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
}

/* States */
.btn-disabled,
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn-loading {
  pointer-events: none;
}

.btn-icon-only {
  width: var(--btn-height);
  height: var(--btn-height);
  padding: 0;
  border-radius: 50%;
}

.btn-xs.btn-icon-only { --btn-height: 28px; }
.btn-sm.btn-icon-only { --btn-height: 32px; }
.btn-md.btn-icon-only { --btn-height: 40px; }
.btn-lg.btn-icon-only { --btn-height: 48px; }
.btn-xl.btn-icon-only { --btn-height: 56px; }

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-label {
  font-weight: 600;
}
</style>
