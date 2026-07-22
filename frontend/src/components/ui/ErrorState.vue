<template>
  <div class="error-state">
    <div class="error-state-icon">
      <component v-if="icon" :is="icon" />
      <span v-else>⚠️</span>
    </div>
    <h3 class="error-state-title">{{ title }}</h3>
    <p v-if="description" class="error-state-description">{{ description }}</p>
    <div v-if="error" class="error-state-details">
      {{ error }}
    </div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon: Object,
  title: {
    type: String,
    default: 'Something went wrong'
  },
  description: String,
  error: String
})
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
  min-height: 300px;
}

.error-state-icon {
  font-size: 48px;
  color: var(--color-error);
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
}

.error-state-icon svg {
  width: 100%;
  height: 100%;
  color: inherit;
}

.error-state-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 var(--space-2) 0;
  color: var(--color-error);
}

.error-state-description {
  font-size: 14px;
  color: var(--color-text-tertiary);
  max-width: 300px;
  margin: 0 auto var(--space-4) auto;
}

.error-state-details {
  font-size: 12px;
  font-family: var(--font-mono);
  background: var(--color-error-soft);
  color: var(--color-error);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-align: left;
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
