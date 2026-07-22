<template>
  <div class="search-input-wrapper">
    <div class="search-input-container">
      <svg
        class="search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        v-model="localQuery"
        :placeholder="placeholder"
        class="search-input"
        type="text"
        @input="handleInput"
        @keydown.enter="handleSearch"
        @keydown.escape="clearSearch"
      />

      <button
        v-if="localQuery"
        class="search-clear"
        @click="clearSearch"
        aria-label="Clear search"
      >
        ✕
      </button>
    </div>

    <!-- Results dropdown -->
    <Transition name="search-dropdown">
      <div v-if="showResults && results.length" class="search-results">
        <div
          v-for="(result, index) in results"
          :key="index"
          :class="['search-result', { 'search-result-active': selectedIndex === index }]"
          @click="selectResult(result)"
          @mouseenter="selectedIndex = index"
        >
          <div class="search-result-title">{{ result.title || result.label }}</div>
          <div v-if="result.subtitle" class="search-result-subtitle">
            {{ result.subtitle }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: 'Search...'
  },
  debounce: {
    type: Number,
    default: 300
  },
  minChars: {
    type: Number,
    default: 2
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'select'])

const localQuery = ref(props.modelValue || '')
const showResults = ref(false)
const selectedIndex = ref(-1)
let debounceTimer

const results = computed(() => {
  if (localQuery.value.length < props.minChars) return []

  const query = localQuery.value.toLowerCase()
  return props.items.filter((item) => {
    const title = (item.title || item.label || '').toLowerCase()
    const subtitle = (item.subtitle || '').toLowerCase()
    return title.includes(query) || subtitle.includes(query)
  })
})

function handleInput() {
  emit('update:modelValue', localQuery.value)
  selectedIndex.value = -1

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (localQuery.value.length >= props.minChars) {
      showResults.value = true
      emit('search', localQuery.value)
    } else {
      showResults.value = false
    }
  }, props.debounce)
}

function handleSearch() {
  if (selectedIndex.value >= 0 && results.value[selectedIndex.value]) {
    selectResult(results.value[selectedIndex.value])
  } else {
    emit('search', localQuery.value)
    showResults.value = false
  }
}

function selectResult(result) {
  emit('select', result)
  localQuery.value = result.title || result.label
  showResults.value = false
}

function clearSearch() {
  localQuery.value = ''
  showResults.value = false
  selectedIndex.value = -1
  emit('update:modelValue', '')
}
</script>

<style scoped>
.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) ease;
}

.search-input-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-state-focus);
}

.search-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: var(--space-3) 0;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-clear {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-fast) ease;
}

.search-clear:hover {
  color: var(--color-error);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--space-1);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.search-result {
  padding: var(--space-3);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.search-result:hover,
.search-result-active {
  background: var(--color-bg-tertiary);
}

.search-result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.search-result-subtitle {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition: all var(--duration-fast) ease;
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
