<template>
  <div class="tabs">
    <div class="tabs-nav" role="tablist" aria-label="Tabs">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        :class="['tabs-trigger', { 'tabs-trigger-active': activeTab === index }]"
        :aria-selected="activeTab === index"
        :aria-controls="`tab-panel-${index}`"
        role="tab"
        @click="activeTab = index"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tabs-content">
      <div
        v-for="(tab, index) in tabs"
        v-show="activeTab === index"
        :id="`tab-panel-${index}`"
        :key="index"
        class="tabs-panel"
        role="tabpanel"
        :aria-labelledby="`tab-${index}`"
      >
        <slot :name="`tab-${index}`">
          {{ tab.content }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  tabs: {
    type: Array,
    required: true,
    validator: (v) =>
      v.every(
        (tab) =>
          typeof tab.label === 'string' &&
          (typeof tab.content === 'string' || tab.content === undefined)
      )
  },
  defaultTab: {
    type: Number,
    default: 0
  }
})

const activeTab = ref(0)
</script>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tabs-nav {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.tabs-trigger {
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
  position: relative;
  transition: color var(--duration-fast) ease;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tabs-trigger:hover {
  color: var(--color-text-primary);
}

.tabs-trigger:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.tabs-trigger-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tabs-content {
  flex: 1;
}

.tabs-panel {
  animation: fade-in var(--duration-fast) ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
