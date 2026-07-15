<template>
  <button
    :class="buttonClass"
    :style="buttonStyle"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | ghost | outline
  size: { type: String, default: 'md' } // sm | md | lg
})

const sizes = {
  sm: 'py-1 px-3 text-sm',
  md: 'py-2 px-4 text-base',
  lg: 'py-3 px-6 text-lg'
}

const buttonClass = computed(() => {
  if (props.variant === 'primary') return `bg-[var(--color-primary,#0B4F8C)] text-white rounded-md font-semibold ${sizes[props.size]}`
  if (props.variant === 'ghost') return `bg-transparent text-[var(--color-primary,#0B4F8C)] rounded-md border border-transparent ${sizes[props.size]}`
  if (props.variant === 'outline') return `bg-white text-[var(--color-primary,#0B4F8C)] rounded-md border border-[var(--color-border)] ${sizes[props.size]}`
  return `bg-[var(--color-primary,#0B4F8C)] text-white rounded-md ${sizes[props.size]}`
})

const buttonStyle = {
  // fallback inline styles for projects that don't yet wire CSS variables
}
</script>
