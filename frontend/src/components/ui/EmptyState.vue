<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <component v-if="icon" :is="icon" />
      <span v-else>📭</span>
    </div>
    <h3 class="empty-state-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-description">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon: Object,
  title: {
    type: String,
    default: 'Nothing here yet'
  },
  description: String
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
  color: var(--color-text-secondary);
  min-height: 300px;
}

.empty-state-icon {
  font-size: 32px;
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border);
  color: var(--color-accent);
}

.empty-state-icon svg {
  width: 38px;
  height: 38px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text-primary);
}

.empty-state-description {
  font-size: 14px;
  color: var(--color-text-tertiary);
  max-width: 300px;
  margin: 0 auto var(--space-6) auto;
}
</style>
