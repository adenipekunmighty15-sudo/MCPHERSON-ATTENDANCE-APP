<template>
  <div v-if="show" :class="['skeleton', `skeleton-${variant}`]">
    <template v-if="variant === 'card'">
      <div class="skeleton-text"></div>
      <div class="skeleton-text" style="width: 80%;"></div>
      <div class="skeleton-text" style="width: 60%; margin-bottom: 16px;"></div>
      <div class="skeleton-text" style="width: 100%;"></div>
      <div class="skeleton-text" style="width: 100%;"></div>
    </template>
    <template v-else-if="variant === 'list'">
      <div v-for="i in (count || 3)" :key="i" class="skeleton-item">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-text"></div>
          <div class="skeleton-text" style="width: 70%;"></div>
        </div>
      </div>
    </template>
    <template v-else>
      <div :class="`skeleton-${variant}`"></div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'avatar', 'button', 'card', 'list'].includes(v)
  },
  show: {
    type: Boolean,
    default: true
  },
  count: {
    type: Number,
    default: 3
  }
})
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 0%,
    var(--color-surface-elevated) 50%,
    var(--color-bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 2s infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
  border-radius: var(--radius-sm);
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-button {
  width: 120px;
  height: 40px;
  border-radius: var(--radius-md);
}

.skeleton-card {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-list {
  width: 100%;
}

.skeleton-item {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  align-items: center;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-content .skeleton-text:last-child {
  margin-bottom: 0;
}
</style>
