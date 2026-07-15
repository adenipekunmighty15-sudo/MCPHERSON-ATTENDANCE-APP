<template>
  <div :class="['rounded-lg p-4 shadow-card bg-white', customClass]">
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({ customClass: { type: String, default: '' } })
</script>
