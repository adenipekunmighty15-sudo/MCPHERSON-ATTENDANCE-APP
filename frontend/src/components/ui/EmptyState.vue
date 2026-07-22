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
  font-size: 48px;
  margin-bottom: var(--space-6);
  opacity: 0.4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
}

.empty-state-icon svg {
  width: 100%;
  height: 100%;
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
