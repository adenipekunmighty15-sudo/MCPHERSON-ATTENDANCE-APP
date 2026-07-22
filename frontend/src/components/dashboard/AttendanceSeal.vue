<template>
  <svg class="seal" viewBox="0 0 80 80" aria-hidden="true">
    <defs>
      <linearGradient id="seal-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--color-success)" />
        <stop offset="100%" stop-color="var(--color-success)" stop-opacity="0.6" />
      </linearGradient>
    </defs>
    <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-success-soft)" stroke-width="3" />
    <circle cx="40" cy="40" r="36" fill="none" stroke="url(#seal-grad)" stroke-width="3"
      stroke-dasharray="226" stroke-dashoffset="0" class="seal-ring" />
    <path d="M28 42l8 8 16-18" fill="none" stroke="var(--color-success)" stroke-width="4"
      stroke-linecap="round" stroke-linejoin="round" class="seal-check" />
    <text x="40" y="68" text-anchor="middle" font-size="7" font-weight="600"
      fill="var(--color-success)" font-family="var(--font-mono)">{{ time }}</text>
  </svg>
</template>

<script setup>
defineProps({ time: { type: String, default: '' } })
</script>

<style scoped>
.seal {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}
.seal-ring {
  animation: seal-draw 0.8s ease-out forwards;
  transform-origin: center;
  transform: rotate(-90deg);
}
.seal-check {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: seal-check-in 0.4s 0.3s ease-out forwards;
}
@keyframes seal-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes seal-check-in {
  to { stroke-dashoffset: 0; }
}
</style>
