<template>
  <div class="input-wrapper">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    
    <div class="input-container" :class="{ 'input-error': error }">
      <input
        :id="id"
        v-bind="$attrs"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="input"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <div v-if="icon" class="input-icon">
        <component :is="icon" />
      </div>
    </div>

    <div v-if="error" class="input-error-text">{{ error }}</div>
    <div v-if="hint" class="input-hint">{{ hint }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: 'text'
  },
  label: String,
  placeholder: String,
  error: String,
  hint: String,
  icon: Object,
  disabled: Boolean,
  required: Boolean,
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).substr(2, 9)}`
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  gap: 2px;
}

.input-required {
  color: #ef4444;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-family: inherit;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.input::placeholder {
  color: var(--color-text-secondary);
}

.input:disabled {
  background: var(--color-bg);
  cursor: not-allowed;
  opacity: 0.6;
}

.input-container.input-error .input {
  border-color: #ef4444;
}

.input-container.input-error .input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-icon {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--color-text-secondary);
  width: 20px;
  height: 20px;
}

.input:focus ~ .input-icon {
  color: var(--color-primary);
}

.input-error-text {
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
}

.input-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
