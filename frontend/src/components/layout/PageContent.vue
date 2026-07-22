<template>
  <div class="page-content" :class="{ 'page-content-narrow': narrow }">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  narrow: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.page-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-content-narrow {
  max-width: 800px;
}

@media (max-width: 768px) {
  .page-content {
    padding: 20px 16px;
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: 16px 12px;
  }
}
</style>
