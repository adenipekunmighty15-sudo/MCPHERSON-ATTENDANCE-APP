<template>
  <Transition name="splash">
    <div v-if="loading" class="splash-screen" role="status" aria-live="polite">
      <div class="splash-brand">
        <div class="splash-logo">
          <Logo :size="74" />
          <span class="splash-ring"></span>
        </div>
        <p class="splash-kicker">CITADEL OF CHAMPIONS</p>
        <h1>McPherson University</h1>
        <p class="splash-message">Preparing your campus portal…</p>
        <div class="splash-progress" role="progressbar" aria-label="Loading university portal">
          <span></span>
        </div>
      </div>
      <span class="splash-campus">SERIKI SOTAYO <i></i> OGUN STATE, NIGERIA</span>
    </div>
  </Transition>
</template>

<script setup>
import Logo from './Logo.vue'

defineProps({
  loading: { type: Boolean, default: false },
})
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #faf7ef;
  background:
    radial-gradient(ellipse at 50% 40%, rgba(61, 104, 75, 0.6), transparent 38rem),
    #24352a;
}

.splash-screen::before,
.splash-screen::after {
  position: absolute;
  width: min(74vw, 680px);
  aspect-ratio: 1;
  border: 1px solid rgba(226, 232, 240, 0.1);
  border-radius: 50%;
  content: '';
}

.splash-screen::after {
  width: min(58vw, 510px);
  border-color: rgba(245, 158, 11, 0.22);
}

.splash-brand {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px;
  text-align: center;
}

.splash-logo {
  position: relative;
  display: grid;
  place-items: center;
  margin-bottom: 28px;
}

.splash-ring {
  position: absolute;
  inset: -14px;
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 50%;
  animation: ring-pulse 2.4s ease-in-out infinite;
}

.splash-kicker {
  margin: 0 0 10px;
  color: #f2b28f;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.splash-brand h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(24px, 5vw, 38px);
  font-weight: 500;
  letter-spacing: -0.035em;
}

.splash-message {
  margin: 12px 0 0;
  color: #cfc5b2;
  font-size: 13px;
}

.splash-progress {
  width: 140px;
  height: 3px;
  overflow: hidden;
  margin-top: 28px;
  border-radius: 99px;
  background: rgba(226, 232, 240, 0.16);
}

.splash-progress span {
  display: block;
  width: 45%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3d684b, #b96445);
  animation: loading-progress 1.8s ease-in-out infinite;
}

.splash-campus {
  position: absolute;
  bottom: max(24px, env(safe-area-inset-bottom));
  color: #929b8e;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.splash-campus i {
  display: inline-block;
  width: 4px;
  height: 4px;
  margin: 0 7px 2px;
  border-radius: 50%;
  background: #b96445;
}

.splash-enter-active,
.splash-leave-active {
  transition: opacity 180ms ease;
}

.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}

@keyframes loading-progress {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(250%); }
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(0.96); opacity: 0.55; }
  50% { transform: scale(1.04); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .splash-ring,
  .splash-progress span {
    animation: none;
  }
}
</style>
