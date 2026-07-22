<template>
  <div class="filter-group">
    <div class="filter-header">
      <h3 class="filter-title">{{ title }}</h3>
      <button
        v-if="hasActiveFilters"
        class="filter-clear"
        @click="clearAll"
      >
        Clear All
      </button>
    </div>

    <div class="filter-options">
      <label v-for="option in options" :key="option.value" class="filter-option">
        <input
          type="checkbox"
          :checked="isSelected(option.value)"
          @change="toggleOption(option.value)"
        />
        <span class="filter-label">
          {{ option.label }}
          <span v-if="option.count !== undefined" class="filter-count">
            ({{ option.count }})
          </span>
        </span>
      </label>
    </div>

    <div v-if="activeFilters.length" class="filter-tags">
      <span v-for="value in activeFilters" :key="value" class="filter-tag">
        {{ getOptionLabel(value) }}
        <button @click="toggleOption(value)" class="filter-tag-remove">
          ✕
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: String,
  options: {
    type: Array,
    required: true,
    validator: (v) =>
      v.every((opt) => typeof opt.label === 'string' && opt.value !== undefined)
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const activeFilters = computed(() => props.modelValue)

const hasActiveFilters = computed(() => activeFilters.value.length > 0)

function isSelected(value) {
  return activeFilters.value.includes(value)
}

function toggleOption(value) {
  let newFilters
  if (props.multiple) {
    if (isSelected(value)) {
      newFilters = activeFilters.value.filter((v) => v !== value)
    } else {
      newFilters = [...activeFilters.value, value]
    }
  } else {
    newFilters = isSelected(value) ? [] : [value]
  }
  emit('update:modelValue', newFilters)
}

function clearAll() {
  emit('update:modelValue', [])
}

function getOptionLabel(value) {
  const option = props.options.find((opt) => opt.value === value)
  return option ? option.label : value
}
</script>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.filter-clear {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
  transition: color var(--duration-fast) ease;
}

.filter-clear:hover {
  color: var(--color-primary-hover);
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.filter-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.filter-label {
  font-size: 14px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.filter-count {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}

.filter-tag-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: opacity var(--duration-fast) ease;
}

.filter-tag-remove:hover {
  opacity: 0.7;
}
</style>
