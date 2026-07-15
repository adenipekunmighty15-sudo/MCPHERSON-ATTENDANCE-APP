<template>
  <span
    v-if="count > 0"
    :style="{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '20px',
      height: '20px',
      padding: '0 5px',
      background: 'var(--color-error)',
      color: '#FFFFFF',
      fontSize: '11px',
      fontWeight: 700,
      lineHeight: 1,
      borderRadius: '10px',
      transform: 'translateZ(0)',
      boxShadow: 'none',
      transition: 'transform 0.2s',
      userSelect: 'none',
    }"
    :class="{ pulse: pulse }"
  >
    {{ count > 99 ? '99+' : count }}
  </span>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 0 },
  pulse: { type: Boolean, default: false },
})
</script>

<style scoped>
@keyframes badge-pulse {
  0%, 100% { transform: translateZ(0) scale(1); }
  50% { transform: translateZ(0) scale(1.15); }
}
.pulse {
  animation: badge-pulse 1.5s ease-in-out infinite;
}
</style>
