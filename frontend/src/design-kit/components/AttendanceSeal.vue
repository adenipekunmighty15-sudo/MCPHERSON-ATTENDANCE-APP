<template>
  <svg class="dk-seal" viewBox="0 0 100 100" aria-hidden="true" role="img">
    <defs>
      <radialGradient id="seal-wax" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#C41E1E" />
        <stop offset="70%"  stop-color="#A01818" />
        <stop offset="100%" stop-color="#7A1111" />
      </radialGradient>
      <filter id="seal-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.25)" />
      </filter>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#seal-wax)" filter="url(#seal-shadow)" class="dk-seal__body" />
    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" class="dk-seal__rim" />
    <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4 4" class="dk-seal__dots" />
    <text x="50" y="30" text-anchor="middle" font-size="9" font-weight="700" fill="rgba(255,255,255,0.9)" font-family="var(--font-display)" class="dk-seal__text">VERIFIED</text>
    <path d="M35 50 L46 62 L65 40" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="dk-seal__check" />
    <text x="50" y="78" text-anchor="middle" font-size="7" fill="rgba(255,255,255,0.6)" font-family="var(--font-mono)" class="dk-seal__time">{{ time }}</text>
  </svg>
</template>

<script setup>
defineProps({ time: { type: String, default: '' } })
</script>

<style scoped>
.dk-seal {
  width: var(--seal-size, 80px);
  height: var(--seal-size, 80px);
  flex-shrink: 0;
  overflow: visible;
}
.dk-seal__body { animation: dk-seal-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.dk-seal__check {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: dk-check-stroke 0.4s 0.35s ease-out forwards;
}
.dk-seal__text { animation: dk-fade-in 0.3s 0.2s both; }
.dk-seal__time { animation: dk-fade-in 0.3s 0.5s both; }
.dk-seal__rim { animation: dk-rim-fade 0.6s 0.1s both; }
.dk-seal__dots { animation: dk-rim-fade 0.6s 0.15s both; }

@keyframes dk-seal-pop {
  0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes dk-check-stroke { to { stroke-dashoffset: 0; } }
@keyframes dk-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dk-rim-fade { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .dk-seal * { animation: none !important; }
  .dk-seal__body { transform: scale(1); opacity: 1; }
}
</style>
