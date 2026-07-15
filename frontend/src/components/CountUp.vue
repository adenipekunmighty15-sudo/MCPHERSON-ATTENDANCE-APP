<template>
  <span ref="elRef">{{ displayValue }}</span>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  to: { type: Number, default: 0 },
  decimals: { type: Number, default: 0 },
  suffix: { type: String, default: '' },
  duration: { type: Number, default: 1200 },
})

const displayValue = ref('0')
const elRef = ref(null)

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function animate() {
  const start = performance.now()
  const from = 0
  const range = Math.abs(props.to - from)

  if (range < 0.01) {
    displayValue.value = props.to.toFixed(props.decimals) + props.suffix
    return
  }

  function frame(now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / props.duration, 1)
    const eased = easeOutCubic(progress)
    const current = from + (props.to - from) * eased
    displayValue.value = current.toFixed(props.decimals) + props.suffix
    if (progress < 1) {
      requestAnimationFrame(frame)
    }
  }
  requestAnimationFrame(frame)
}

onMounted(() => animate())

watch(() => props.to, () => animate())
</script>
