<template>
  <div class="accordion">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="accordion-item"
    >
      <div
        :class="['accordion-header', { 'accordion-header-open': openItems.includes(index) }]"
        @click="toggleItem(index)"
        @keydown.enter="toggleItem(index)"
        @keydown.space="toggleItem(index)"
        role="button"
        :tabindex="0"
        :aria-expanded="openItems.includes(index)"
        :aria-controls="`accordion-${index}`"
      >
        <span class="accordion-icon">▶</span>
        <span class="accordion-title">{{ item.title }}</span>
      </div>

      <Transition name="accordion-transition">
        <div
          v-if="openItems.includes(index)"
          :id="`accordion-${index}`"
          class="accordion-content"
          role="region"
        >
          <slot :name="`item-${index}`">
            {{ item.content }}
          </slot>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (v) =>
      v.every(
        (item) =>
          typeof item.title === 'string' &&
          (typeof item.content === 'string' || item.content === undefined)
      )
  },
  allowMultiple: {
    type: Boolean,
    default: false
  }
})

const openItems = ref([])

function toggleItem(index) {
  const isOpen = openItems.value.includes(index)

  if (isOpen) {
    openItems.value = openItems.value.filter((i) => i !== index)
  } else {
    if (!props.allowMultiple) {
      openItems.value = [index]
    } else {
      openItems.value.push(index)
    }
  }
}
</script>

<style scoped>
.accordion {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.accordion-item {
  border-bottom: 1px solid var(--color-border);
}

.accordion-item:last-child {
  border-bottom: none;
}

.accordion-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  cursor: pointer;
  user-select: none;
  transition: background var(--duration-fast) ease;
}

.accordion-header:hover {
  background: var(--color-bg-tertiary);
}

.accordion-header:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.accordion-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-normal) var(--ease-smooth);
  color: var(--color-text-secondary);
}

.accordion-header-open .accordion-icon {
  transform: rotate(90deg);
}

.accordion-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.accordion-content {
  padding: var(--space-4);
  background: var(--color-bg);
}

.accordion-transition-enter-active,
.accordion-transition-leave-active {
  transition: all var(--duration-normal) var(--ease-smooth);
}

.accordion-transition-enter-from,
.accordion-transition-leave-to {
  opacity: 0;
  max-height: 0;
}

.accordion-transition-enter-to,
.accordion-transition-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
