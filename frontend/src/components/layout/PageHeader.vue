<template>
  <div class="mb-6 flex flex-col gap-6">
    <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-[var(--color-text-primary)] md:text-4xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-2 text-sm text-[var(--color-text-secondary)]">{{ subtitle }}</p>
      </div>
      
      <div v-if="$slots.actions" class="flex w-full flex-wrap items-center justify-start gap-3 md:w-auto md:justify-end">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.default" class="flex flex-wrap gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: String
})
</script>
