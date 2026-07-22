<template>
  <div class="expandable">
    <div
      class="expandable-header"
      @click="isOpen = !isOpen"
      @keydown.enter="isOpen = !isOpen"
      @keydown.space="isOpen = !isOpen"
      role="button"
      :tabindex="0"
      :aria-expanded="isOpen"
      :aria-controls="`expandable-content-${id}`"
    >
      <span class="expandable-icon" :class="{ 'expandable-icon-open': isOpen }">
        ▶
      </span>
      <span class="expandable-title">{{ title }}</span>
      <slot name="header-append" />
    </div>

    <Transition name="expandable-transition">
      <div
        v-if="isOpen"
        :id="`expandable-content-${id}`"
        class="expandable-content"
        role="region"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  defaultOpen: {
    type: Boolean,
    default: false
  }
})

const isOpen = ref(false)
const id = Math.random().toString(36).substr(2, 9)
</script>

<style scoped>
.expandable {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.expandable-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  cursor: pointer;
  user-select: none;
  transition: background var(--duration-fast) ease;
}

.expandable-header:hover {
  background: var(--color-bg-tertiary);
}

.expandable-header:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.expandable-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-normal) var(--ease-smooth);
  color: var(--color-text-secondary);
}

.expandable-icon-open {
  transform: rotate(90deg);
}

.expandable-title {
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.expandable-content {
  padding: var(--space-4);
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.expandable-transition-enter-active,
.expandable-transition-leave-active {
  transition: all var(--duration-normal) var(--ease-smooth);
}

.expandable-transition-enter-from,
.expandable-transition-leave-to {
  opacity: 0;
  max-height: 0;
}

.expandable-transition-enter-to,
.expandable-transition-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
