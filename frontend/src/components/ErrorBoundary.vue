<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useToastStore } from '@/stores/toast'

const isDev = import.meta.env.DEV
const hasError = ref(false)
const error = ref(null)
const errorInfo = ref(null)

onErrorCaptured((err, instance, info) => {
  hasError.value = true
  error.value = err
  errorInfo.value = info

  const toast = useToastStore()
  if (toast.show) toast.show(err?.message || 'An unexpected error occurred', 'error')

  if (isDev) {
    console.warn('ErrorBoundary caught:', err, info)
  }

  return false
})

const reset = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = null
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h2>Something went wrong</h2>
      <p class="error-message">{{ error?.message || 'An unexpected error occurred' }}</p>
      <details class="error-details" v-if="isDev">
        <summary>Error details</summary>
        <pre>{{ error?.stack }}</pre>
        <p><strong>Component:</strong> {{ errorInfo }}</p>
      </details>
      <button @click="reset" class="btn btn-primary">Try again</button>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
}

.error-content {
  text-align: center;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);
}

.error-icon {
  width: 64px;
  height: 64px;
  color: var(--color-error);
  margin-bottom: var(--space-4);
}

.error-content h2 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.error-message {
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
}

.error-details {
  text-align: left;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  font-size: var(--text-sm);
}

.error-details summary {
  cursor: pointer;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.error-details pre {
  overflow: auto;
  max-height: 200px;
  color: var(--color-error);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--text-sm);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}
</style>