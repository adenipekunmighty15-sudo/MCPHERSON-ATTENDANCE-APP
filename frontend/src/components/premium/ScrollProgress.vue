<template>
  <div class="scroll-progress" aria-hidden="true">
    <span ref="bar" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const bar = ref(null)
let frame = 0
let lastTarget = null

function updateFrom(target) {
  const el = target && typeof target === 'object' && 'scrollHeight' in target && target !== document.documentElement ? target : null
  let progress = 0

  if (el && el.scrollHeight > el.clientHeight) {
    const max = el.scrollHeight - el.clientHeight
    progress = max > 0 ? el.scrollTop / max : 0
  } else {
    const doc = document.scrollingElement || document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    progress = max > 0 ? (window.scrollY || doc.scrollTop || 0) / max : 0
  }

  const clamped = Math.max(0, Math.min(1, progress))
  bar.value?.style.setProperty('--scroll-progress', clamped.toFixed(4))
}

function schedule(event) {
  if (event?.target) lastTarget = event.target
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    updateFrom(lastTarget)
  })
}

function onResize() {
  updateFrom(lastTarget)
}

onMounted(() => {
  document.addEventListener('scroll', schedule, { passive: true, capture: true })
  window.addEventListener('resize', onResize, { passive: true })
  updateFrom(null)
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  document.removeEventListener('scroll', schedule, true)
  window.removeEventListener('resize', onResize)
})
</script>
