<template>
  <div class="bg-3d-fixed" aria-hidden="true">
    <div
      v-for="orb in orbs"
      :key="orb.id"
      :style="{
        position: 'absolute',
        width: orb.size + 'px',
        height: orb.size + 'px',
        borderRadius: '50%',
        background: orb.gradient,
        opacity: orb.opacity,
        top: orb.top + '%',
        left: orb.left + '%',
        filter: 'blur(' + orb.blur + 'px)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        animation: 'orb-float-' + orb.id + ' ' + orb.duration + 's ease-in-out infinite alternate',
      }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const orbs = computed(() => [
  {
    id: 1,
    size: 450,
    top: 10,
    left: 5,
    opacity: 0.25,
    blur: 80,
    duration: 25,
    gradient: 'radial-gradient(circle at 30% 30%, var(--color-primary), var(--color-primary-hover))',
  },
  {
    id: 2,
    size: 350,
    top: 55,
    left: 70,
    opacity: 0.2,
    blur: 100,
    duration: 30,
    gradient: 'radial-gradient(circle at 70% 20%, var(--color-primary), #1D4ED8)',
  },
  {
    id: 3,
    size: 250,
    top: 75,
    left: 15,
    opacity: 0.22,
    blur: 70,
    duration: 20,
    gradient: 'radial-gradient(circle at 50% 50%, #3B82F6, var(--color-primary))',
  },
  {
    id: 4,
    size: 500,
    top: 5,
    left: 60,
    opacity: 0.18,
    blur: 120,
    duration: 28,
    gradient: 'radial-gradient(circle at 60% 40%, var(--color-primary), #1E3A5F)',
  },
])
</script>

<style scoped>
.bg-3d-fixed {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  perspective: 1000px;
}
</style>

<style>
@keyframes orb-float-1 {
  0% { transform: translateX(0) translateY(0) translateZ(0); }
  100% { transform: translateX(30px) translateY(-40px) translateZ(60px); }
}
@keyframes orb-float-2 {
  0% { transform: translateX(0) translateY(0) translateZ(0); }
  100% { transform: translateX(-40px) translateY(20px) translateZ(-30px); }
}
@keyframes orb-float-3 {
  0% { transform: translateX(0) translateY(0) translateZ(0); }
  100% { transform: translateX(20px) translateY(-30px) translateZ(40px); }
}
@keyframes orb-float-4 {
  0% { transform: translateX(0) translateY(0) translateZ(0); }
  100% { transform: translateX(-25px) translateY(35px) translateZ(-50px); }
}
</style>
