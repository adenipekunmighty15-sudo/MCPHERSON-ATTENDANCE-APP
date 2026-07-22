<template>
  <div class="form-group" :class="{ 'form-group-invalid': error }">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="form-required">*</span>
    </label>

    <div class="form-control">
      <slot />
    </div>

    <div v-if="error" class="form-error" role="alert">
      {{ error }}
    </div>

    <div v-if="hint && !error" class="form-hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  error: String,
  hint: String,
  required: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    required: true
  }
})

const hasError = computed(() => Boolean(props.error))
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-required {
  color: var(--color-error);
}

.form-control {
  display: flex;
}

.form-error {
  font-size: 12px;
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--color-error-soft);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-error);
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.form-group-invalid {
  /* Adds subtle red tint */
}

.form-group-invalid .form-control :deep(input),
.form-group-invalid .form-control :deep(textarea),
.form-group-invalid .form-control :deep(select) {
  border-color: var(--color-error);
  background-color: var(--color-error-soft);
}
</style>
