<template>
  <div class="select-wrapper">
    <label v-if="label" :for="id" class="select-label">
      {{ label }}
      <span v-if="required" class="select-required">*</span>
    </label>

    <div class="select-container" :class="{ 'select-error': error }">
      <select
        :id="id"
        v-bind="$attrs"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="select"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      
      <div class="select-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>

    <div v-if="error" class="select-error-text">{{ error }}</div>
    <div v-if="hint" class="select-hint">{{ hint }}</div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    default: () => []
  },
  label: String,
  placeholder: String,
  error: String,
  hint: String,
  disabled: Boolean,
  required: Boolean,
  id: {
    type: String,
    default: () => `select-${Math.random().toString(36).substr(2, 9)}`
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.select-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  gap: 2px;
}

.select-required {
  color: #ef4444;
}

.select-container {
  position: relative;
  display: flex;
  align-items: center;
}

.select {
  width: 100%;
  padding: 10px 16px;
  padding-right: 36px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
}

.select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.select:disabled {
  background: var(--color-bg);
  cursor: not-allowed;
  opacity: 0.6;
}

.select-container.select-error .select {
  border-color: #ef4444;
}

.select-container.select-error .select:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.select-arrow {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--color-text-secondary);
}

.select-error-text {
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
}

.select-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
