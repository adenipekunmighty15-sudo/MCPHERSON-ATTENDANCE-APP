<template>
  <label class="block text-sm text-[var(--color-text-secondary,#4A4A4A)]">
    <span class="block mb-1">{{ label }}</span>
    <input v-bind="$attrs" v-model="modelValueLocal" :type="type" class="w-full border rounded-md px-3 py-2 bg-[var(--color-surface,#F8FAFC)] text-[var(--color-text-primary,#0B1B2B)]" />
  </label>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ modelValue: [String, Number], label: { type: String, default: '' }, type: { type: String, default: 'text' } })
const emit = defineEmits(['update:modelValue'])
const modelValueLocal = ref(props.modelValue)
watch(() => props.modelValue, v => modelValueLocal.value = v)
watch(modelValueLocal, v => emit('update:modelValue', v))
</script>
