<template>
  <div class="loading-state">
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>
    <p v-if="hint" class="loading-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: String,
  hint: String
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  gap: var(--space-4);
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-message {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.loading-hint {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
