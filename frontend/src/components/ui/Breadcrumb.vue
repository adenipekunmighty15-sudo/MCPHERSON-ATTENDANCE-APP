<template>
  <nav class="breadcrumb" aria-label="Breadcrumb" role="navigation">
    <ol class="breadcrumb-list">
      <li v-for="(item, i) in breadcrumbs" :key="`breadcrumb-${i}`" class="breadcrumb-item">
        <router-link 
          v-if="item.to && !isActive(i)"
          :to="item.to"
          class="breadcrumb-link"
        >
          {{ item.label }}
        </router-link>
        <span v-else :class="['breadcrumb-text', { active: isActive(i) }]">
          {{ item.label }}
        </span>
        <span v-if="i < breadcrumbs.length - 1" class="breadcrumb-divider" aria-hidden="true">
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const props = defineProps({
  breadcrumbs: {
    type: Array,
    required: true
  }
})

const route = useRoute()

function isActive(index) {
  return index === props.breadcrumbs.length - 1
}
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  margin-bottom: var(--space-4);
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}

.breadcrumb-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.breadcrumb-text {
  color: var(--color-text-secondary);
  transition: color var(--duration-fast) ease;
}

.breadcrumb-text.active {
  color: var(--color-text-primary);
  font-weight: 600;
}

.breadcrumb-divider {
  opacity: 0.5;
}
</style>
