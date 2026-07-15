<template>
  <div 
    class="neural-background" 
    :class="{ 
      'has-messages': hasMessages, 
      'web-search-active': webSearchActive 
    }"
    v-show="!webSearchActive && !inputFocused"
  >
    <!-- Layer 1: Deep ambient glow -->
    <div class="ambient-layer">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
    </div>

    <!-- Layer 2: Neural network canvas -->
    <canvas class="neural-canvas" ref="canvas" width="1920" height="1080"></canvas>

    <!-- Layer 3: Energy pulses -->
    <div class="pulse-layer">
      <div class="pulse-ring pulse-1"></div>
      <div class="pulse-ring pulse-2"></div>
      <div class="pulse-ring pulse-3"></div>
    </div>

    <!-- Layer 4: Floating particles -->
    <div class="particle-layer" ref="particleContainer"></div>

    <!-- Layer 5: Subtle vignette -->
    <div class="vignette"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineProps, watch } from 'vue'
import { useMindStore } from '../stores/mind'

const props = defineProps({
  messageCount: { type: Number, default: 0 },
  webSearchActive: { type: Boolean, default: false },
  inputFocused: { type: Boolean, default: false }
})

const mindStore = useMindStore()
const canvas = ref(null)
const particleContainer = ref(null)
let animationId = null
let ctx = null
let nodes = []
let connections = []
let particles = []
let time = 0
let mouseX = 0.5
let mouseY = 0.5
let hasMessages = false

// Watch for message count changes
watch(() => props.messageCount, (newVal) => {
  hasMessages = newVal > 0
}, { immediate: true })

// Watch for web search active state - pause animation when web search is active
watch(() => props.webSearchActive, (active) => {
  if (active) {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  } else if (!props.inputFocused) {
    if (!animationId) {
      animate()
    }
  }
}, { immediate: true })

// Watch for input focus - pause animation when user is typing
watch(() => props.inputFocused, (focused) => {
  if (focused) {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  } else if (!props.webSearchActive) {
    if (!animationId) {
      animate()
    }
  }
}, { immediate: true })

// Configuration
const NODE_COUNT = 45
const CONNECTION_DISTANCE = 180
const PARTICLE_COUNT = 30

function initCanvas() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  
  // Create neural nodes
  nodes = []
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 1.5 + Math.random() * 2.5,
      baseRadius: 1.5 + Math.random() * 2.5,
      hue: 210 + Math.random() * 40, // Blue to cyan range
      type: Math.random() > 0.7 ? 'core' : 'normal',
      pulsePhase: Math.random() * Math.PI * 2,
      energy: Math.random()
    })
  }

  // Create floating particles
  particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.4,
      hue: 210 + Math.random() * 60
    })
  }
}

function resizeCanvas() {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  canvas.value.width = rect.width * window.devicePixelRatio
  canvas.value.height = rect.height * window.devicePixelRatio
  canvas.value.style.width = rect.width + 'px'
  canvas.value.style.height = rect.height + 'px'
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
}

function drawNodes() {
  nodes.forEach(node => {
    // Pulse animation
    const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.3 + 0.7
    const currentRadius = node.baseRadius * pulse * (node.type === 'core' ? 1.5 : 1)
    
    // Energy boost when messages exist
    const energyBoost = hasMessages ? 1 + node.energy * 0.5 : 1
    
    const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, currentRadius * 3)
    gradient.addColorStop(0, `hsla(${node.hue}, 85%, 65%, ${0.6 * pulse * energyBoost})`)
    gradient.addColorStop(0.5, `hsla(${node.hue}, 85%, 55%, ${0.3 * pulse * energyBoost})`)
    gradient.addColorStop(1, `hsla(${node.hue}, 85%, 45%, 0)`)
    
    ctx.beginPath()
    ctx.arc(node.x, node.y, currentRadius * 3, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    
    // Core glow
    const coreGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, currentRadius)
    coreGradient.addColorStop(0, `hsla(${node.hue}, 90%, 75%, ${0.9 * pulse * energyBoost})`)
    coreGradient.addColorStop(1, `hsla(${node.hue}, 85%, 55%, ${0.4 * pulse * energyBoost})`)
    
    ctx.beginPath()
    ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2)
    ctx.fillStyle = coreGradient
    ctx.fill()
    
    // Core highlight
    if (node.type === 'core') {
      ctx.beginPath()
      ctx.arc(node.x, node.y, currentRadius * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${node.hue}, 100%, 90%, ${0.8 * pulse})`
      ctx.fill()
    }
  })
}

function drawConnections() {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x
      const dy = nodes[j].y - nodes[i].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < CONNECTION_DISTANCE) {
        const intensity = (1 - dist / CONNECTION_DISTANCE) * 0.3
        const pulse1 = Math.sin(time * 2 + nodes[i].pulsePhase) * 0.5 + 0.5
        const pulse2 = Math.sin(time * 2 + nodes[j].pulsePhase) * 0.5 + 0.5
        const avgPulse = (pulse1 + pulse2) / 2
        
        const energyBoost = hasMessages ? 1.5 : 1
        const alpha = intensity * avgPulse * energyBoost * 0.4
        
        if (alpha > 0.02) {
          const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)
          const hue = (nodes[i].hue + nodes[j].hue) / 2
          gradient.addColorStop(0, `hsla(${hue}, 85%, 60%, 0)`)
          gradient.addColorStop(0.5, `hsla(${hue}, 85%, 55%, ${alpha})`)
          gradient.addColorStop(1, `hsla(${hue}, 85%, 60%, 0)`)
          
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(nodes[j].x, nodes[j].y)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 0.8 + avgPulse * 1.2
          ctx.stroke()
          
          // Energy flow particles along connections
          if (Math.random() < 0.02 && hasMessages) {
            const t = Math.random()
            createEnergyParticle(
              nodes[i].x + dx * t,
              nodes[i].y + dy * t,
              hue
            )
          }
        }
      }
    }
  }
}

const energyParticles = []

function createEnergyParticle(x, y, hue) {
  energyParticles.push({
    x, y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    life: 1,
    maxLife: 1,
    size: 1 + Math.random() * 2,
    hue
  })
}

function drawEnergyParticles() {
  for (let i = energyParticles.length - 1; i >= 0; i--) {
    const p = energyParticles[i]
    p.x += p.vx
    p.y += p.vy
    p.life -= 0.02
    p.vx *= 0.98
    p.vy *= 0.98
    
    if (p.life <= 0) {
      energyParticles.splice(i, 1)
      continue
    }
    
    const alpha = p.life * 0.8
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${alpha})`
    ctx.fill()
  }
}

function updateNodes() {
  const width = canvas.value.width / window.devicePixelRatio
  const height = canvas.value.height / window.devicePixelRatio
  
  nodes.forEach(node => {
    // Mouse attraction
    const targetX = mouseX * width
    const targetY = mouseY * height
    const dx = targetX - node.x
    const dy = targetY - node.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist > 0 && dist < 300) {
      const force = (300 - dist) / 300 * 0.003
      node.vx += (dx / dist) * force
      node.vy += (dy / dist) * force
    }
    
    // Apply velocity
    node.x += node.vx
    node.y += node.vy
    
    // Damping
    node.vx *= 0.99
    node.vy *= 0.99
    
    // Boundary bounce with energy
    if (node.x < 50 || node.x > width - 50) {
      node.vx *= -0.5
      node.x = Math.max(50, Math.min(width - 50, node.x))
      node.energy = Math.min(1, node.energy + 0.1)
    }
    if (node.y < 50 || node.y > height - 50) {
      node.vy *= -0.5
      node.y = Math.max(50, Math.min(height - 50, node.y))
      node.energy = Math.min(1, node.energy + 0.1)
    }
    
    // Energy decay
    node.energy *= 0.995
  })
}

function updateParticles() {
  const width = canvas.value.width / window.devicePixelRatio
  const height = canvas.value.height / window.devicePixelRatio
  
  particles.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    
    // Gentle drift towards center
    const cx = width / 2
    const cy = height / 2
    const dx = cx - p.x
    const dy = cy - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 100) {
      p.vx += dx * 0.00001
      p.vy += dy * 0.00001
    }
    
    // Boundary wrap
    if (p.x < 0) p.x = width
    if (p.x > width) p.x = 0
    if (p.y < 0) p.y = height
    if (p.y > height) p.y = 0
    
    // Mouse repulsion
    const mx = mouseX * width
    const my = mouseY * height
    const mdx = p.x - mx
    const mdy = p.y - my
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
    if (mdist < 150 && mdist > 0) {
      p.vx += (mdx / mdist) * 0.01
      p.vy += (mdy / mdist) * 0.01
    }
  })
}

function animate() {
  if (!ctx || !canvas.value) return
  
  const width = canvas.value.width / window.devicePixelRatio
  const height = canvas.value.height / window.devicePixelRatio
  
  // Clear with trailing effect for motion blur
  ctx.fillStyle = 'rgba(8, 18, 38, 0.15)'
  ctx.fillRect(0, 0, width, height)
  
  time += 0.016
  
  updateNodes()
  updateParticles()
  
  // Draw connections first (behind nodes)
  drawConnections()
  
  // Draw energy particles
  drawEnergyParticles()
  
  // Draw nodes
  drawNodes()
  
  // Draw ambient particles
  drawAmbientParticles()
  
  animationId = requestAnimationFrame(animate)
}

function drawAmbientParticles() {
  particles.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity * (0.5 + Math.sin(time + p.x * 0.01) * 0.3)})`
    ctx.fill()
  })
}

function handleMouseMove(e) {
  const rect = canvas.value.getBoundingClientRect()
  mouseX = (e.clientX - rect.left) / rect.width
  mouseY = (e.clientY - rect.top) / rect.height
}

function handleResize() {
  resizeCanvas()
}

onMounted(async () => {
  await nextTick()
  initCanvas()
  canvas.value.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('resize', handleResize)
  animate()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (canvas.value) canvas.value.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.neural-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: 
    radial-gradient(ellipse 80% 60% at 20% 0%, hsl(220 100% 60% / 0.12), transparent 60%),
    radial-gradient(ellipse 60% 80% at 80% 100%, hsl(210 80% 65% / 0.1), transparent 60%),
    radial-gradient(ellipse 100% 100% at 50% 50%, hsl(220 50% 70% / 0.15), transparent 70%),
    var(--color-bg);
  opacity: 0.6;
  transition: opacity 0.6s ease;
}

.neural-background.has-messages {
  opacity: 1;
}

.ambient-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: orbFloat 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  left: -150px;
  background: radial-gradient(circle at 30% 30%, hsl(220 100% 60% / 0.15), hsl(220 100% 50% / 0.08), transparent 70%);
  animation-delay: 0s;
  animation-duration: 25s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  top: 10%;
  right: -100px;
  background: radial-gradient(circle at 70% 70%, hsl(200 100% 60% / 0.12), hsl(200 100% 50% / 0.06), transparent 70%);
  animation-delay: -5s;
  animation-duration: 22s;
}

.orb-3 {
  width: 450px;
  height: 450px;
  bottom: -150px;
  left: 15%;
  background: radial-gradient(circle at 50% 50%, hsl(190 100% 55% / 0.1), hsl(190 100% 45% / 0.05), transparent 70%);
  animation-delay: -12s;
  animation-duration: 28s;
}

.orb-4 {
  width: 350px;
  height: 350px;
  top: 35%;
  left: 35%;
  background: radial-gradient(circle at 50% 50%, hsl(220 90% 60% / 0.1), transparent 60%);
  animation-delay: -8s;
  animation-duration: 18s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  25% { transform: translate(30px, -20px) scale(1.05) rotate(2deg); }
  50% { transform: translate(-20px, 30px) scale(0.95) rotate(-1deg); }
  75% { transform: translate(25px, 25px) scale(1.02) rotate(1deg); }
}

.neural-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pulse-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pulse-ring {
  position: absolute;
  border: 1px solid hsl(220 100% 60% / 0.3);
  border-radius: 50%;
  animation: pulseExpand 4s ease-out infinite;
}

.pulse-1 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 0s;
}

.pulse-2 {
  width: 150px;
  height: 150px;
  top: 30%;
  left: 70%;
  transform: translate(-50%, -50%);
  animation-delay: 1.3s;
  border-color: hsl(200 100% 60% / 0.25);
}

.pulse-3 {
  width: 180px;
  height: 180px;
  bottom: 20%;
  left: 20%;
  transform: translate(-50%, -50%);
  animation-delay: 2.6s;
  border-color: hsl(190 100% 55% / 0.2);
}

@keyframes pulseExpand {
  0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0.4; }
  50% { opacity: 0.15; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

.particle-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, hsl(220 50% 5% / 0.6) 100%);
  pointer-events: none;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .orb, .pulse-ring {
    animation: none !important;
  }
}
</style>