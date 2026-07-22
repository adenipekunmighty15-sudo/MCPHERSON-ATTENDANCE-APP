<template>
  <div :class="['background', `background-${type}`]" :aria-hidden="true">
    <!-- Orbs/Gradient Background -->
    <div v-for="orb in activeOrbs" :key="orb.id" :class="['bg-orb', `orb-${orb.id}`]" :style="orb.style" />

    <!-- Grid Overlay (optional) -->
    <div v-if="showGrid" class="grid-overlay"></div>

    <!-- Canvas for Neural Network (optional) -->
    <canvas v-if="type === 'neural'" ref="canvasRef" class="neural-canvas"></canvas>

    <!-- Particle Layer (optional) -->
    <div v-if="type === 'neural' || type === 'particles'" ref="particleContainer" class="particle-layer"></div>

    <!-- Floating Elements (optional) -->
    <div v-if="showElements" class="floating-elements">
      <div v-for="(item, i) in floatingElements" :key="i" :class="['floating-item', `item-${i}`]">
        {{ item }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'orbs',
    validator: (v) => ['orbs', 'neural', 'grid', 'particles'].includes(v)
  },
  animated: {
    type: Boolean,
    default: true
  },
  intensity: {
    type: Number,
    default: 1,
    validator: (v) => v >= 0.1 && v <= 2
  },
  showGrid: {
    type: Boolean,
    default: false
  },
  showElements: {
    type: Boolean,
    default: false
  }
})

const canvasRef = ref(null)
const particleContainer = ref(null)
let animationFrameId = null

// Generate orbs based on type
const activeOrbs = computed(() => {
  const baseOrbs = [
    { id: 1, size: 35, top: -15, left: -5 },
    { id: 2, size: 30, top: -10, right: -5 },
    { id: 3, size: 20, top: 40, right: 10 },
    { id: 4, size: 15, bottom: 20, left: 15 },
  ]

  return baseOrbs.map((orb) => ({
    ...orb,
    style: {
      width: `${orb.size}%`,
      height: `${orb.size}%`,
      top: orb.top ? `${orb.top}%` : 'auto',
      bottom: orb.bottom ? `${orb.bottom}%` : 'auto',
      left: orb.left ? `${orb.left}%` : 'auto',
      right: orb.right ? `${orb.right}%` : 'auto',
      opacity: 0.6 * props.intensity,
      filter: `blur(${120 * props.intensity}px)`,
    },
  }))
})

const floatingElements = computed(() => ['✧', '⨯', '○'])

// Initialize canvas for neural background
onMounted(() => {
  if (props.type === 'neural' && canvasRef.value) {
    initNeuralCanvas()
  }
})

function initNeuralCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height

  function drawNeuralNetwork() {
    ctx.fillStyle = 'rgba(7, 16, 28, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw nodes
    const nodeCount = 8
    const nodes = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      })
    }

    // Draw connections
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((otherNode) => {
        const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y)
        if (dist < 150) {
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.3 * (1 - dist / 150)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(otherNode.x, otherNode.y)
          ctx.stroke()
        }
      })
    })

    // Draw nodes
    nodes.forEach((node) => {
      ctx.fillStyle = 'rgba(96, 165, 250, 0.8)'
      ctx.beginPath()
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    if (props.animated) {
      animationFrameId = requestAnimationFrame(drawNeuralNetwork)
    }
  }

  drawNeuralNetwork()
}

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.background {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  will-change: transform;
}

/* Background Types */
.background-orbs .bg-orb {
  animation: orbFloat 25s ease-in-out infinite;
}

.background-orbs .orb-2 {
  animation-name: orbFloat;
  animation-duration: 30s;
  animation-direction: reverse;
}

.background-orbs .orb-3 {
  animation-name: orbFloat;
  animation-duration: 20s;
  animation-delay: 5s;
}

.background-orbs .orb-4 {
  animation-name: orbFloat;
  animation-duration: 22s;
  animation-delay: 8s;
}

.background-grid {
  background: linear-gradient(0deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

.neural-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.particle-layer {
  position: absolute;
  inset: 0;
}

.floating-elements {
  position: absolute;
  inset: 0;
}

.floating-item {
  position: absolute;
  font-size: 2rem;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.floating-item.item-0 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.floating-item.item-1 {
  top: 50%;
  right: 15%;
  animation-delay: 1s;
}

.floating-item.item-2 {
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(40px, 30px) scale(1.05); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

[data-theme="dark"] .bg-orb {
  opacity: 0.4;
}
</style>
