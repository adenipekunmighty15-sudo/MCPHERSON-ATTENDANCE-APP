<template>
  <div ref="host" class="spatial-scene" :class="[`spatial-${variant}`, { 'is-fallback': failed }]" aria-hidden="true">
    <canvas ref="canvas" />
    <span class="spatial-scene-glow" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  variant: { type: String, default: 'orb' },
  intensity: { type: Number, default: 1 },
})

const host = ref(null)
const canvas = ref(null)
const failed = ref(false)

let renderer = null
let scene = null
let camera = null
let group = null
let core = null
let wire = null
let shell = null
let nodes = null
let ringA = null
let ringB = null
let stars = null
let clock = null
let raf = null
let running = false
let inView = true
let reduced = false
let resizeObserver = null
let intersectionObserver = null

const pointer = { x: 0, y: 0 }
const target = { x: 0, y: 0 }
const satellites = []

function makeSatellite(color, radius, speed, offset) {
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.055, 0),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  )
  group.add(mesh)
  satellites.push({ mesh, radius, speed, offset })
}

function resize() {
  if (!host.value || !renderer || !camera) return
  const width = host.value.clientWidth
  const height = host.value.clientHeight
  if (!width || !height) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
  if (reduced) renderer.render(scene, camera)
}

function init() {
  if (!host.value || !canvas.value) return

  reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
  } catch {
    failed.value = true
    return
  }

  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene = new THREE.Scene()
  clock = new THREE.Clock()

  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0, 6.4)

  group = new THREE.Group()
  scene.add(group)

  // Deep navy core with a gold wireframe shell.
  core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.32, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0x0b192c,
      metalness: 0.55,
      roughness: 0.34,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      emissive: 0x07111f,
      emissiveIntensity: 0.7,
    }),
  )
  group.add(core)

  wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.5, 1)),
    new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.6 * props.intensity }),
  )
  group.add(wire)

  shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.86, 0)),
    new THREE.LineBasicMaterial({ color: 0xf2df9c, transparent: true, opacity: 0.2 * props.intensity }),
  )
  group.add(shell)

  // Gold nodes distributed across a sphere.
  const nodeCount = props.variant === 'minimal' ? 72 : 150
  const nodePositions = new Float32Array(nodeCount * 3)
  for (let i = 0; i < nodeCount; i += 1) {
    const phi = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2
    const radius = 2.02 + Math.random() * 0.16
    nodePositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
    nodePositions[i * 3 + 1] = Math.cos(phi) * radius
    nodePositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
  }
  const nodeGeometry = new THREE.BufferGeometry()
  nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
  nodes = new THREE.Points(
    nodeGeometry,
    new THREE.PointsMaterial({
      color: 0xf2df9c,
      size: 0.032,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  group.add(nodes)

  ringA = new THREE.Mesh(
    new THREE.TorusGeometry(2.22, 0.006, 8, 180),
    new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 * props.intensity }),
  )
  ringA.rotation.set(Math.PI / 2.4, 0.3, 0.18)
  group.add(ringA)

  ringB = new THREE.Mesh(
    new THREE.TorusGeometry(2.62, 0.004, 8, 200),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.2 * props.intensity }),
  )
  ringB.rotation.set(Math.PI / 3.2, -0.5, -0.28)
  group.add(ringB)

  makeSatellite(0xf2df9c, 2.22, 0.26, 0)
  makeSatellite(0x428bca, 2.62, -0.2, 2.1)
  makeSatellite(0xd4af37, 1.88, 0.34, 4.2)

  // Ambient star dust.
  const starCount = props.variant === 'minimal' ? 90 : 220
  const starPositions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount * 3; i += 1) {
    starPositions[i] = (Math.random() - 0.5) * 14
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.018,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  )
  scene.add(stars)

  scene.add(new THREE.AmbientLight(0x93a4b8, 1.1))
  const keyLight = new THREE.DirectionalLight(0xf2df9c, 2.4)
  keyLight.position.set(3.5, 4, 5)
  scene.add(keyLight)
  const rimLight = new THREE.DirectionalLight(0x428bca, 1.6)
  rimLight.position.set(-4, -2, 3)
  scene.add(rimLight)

  resize()

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('resize', resize, { passive: true })

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)
  }

  if (typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = !!entry?.isIntersecting
        if (inView) start()
        else stop()
      },
      { threshold: 0.02 },
    )
    intersectionObserver.observe(host.value)
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  if (reduced) {
    renderer.render(scene, camera)
  } else {
    start()
  }
}

function onPointerMove(event) {
  target.x = (event.clientX / (window.innerWidth || 1)) * 2 - 1
  target.y = -((event.clientY / (window.innerHeight || 1)) * 2 - 1)
}

function onVisibilityChange() {
  if (document.hidden) stop()
  else if (inView) start()
}

function start() {
  if (running || reduced || !renderer) return
  running = true
  clock.getDelta()
  loop()
}

function stop() {
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = null
}

function loop() {
  if (!running) return
  raf = requestAnimationFrame(loop)

  const time = clock.getElapsedTime()
  pointer.x += (target.x - pointer.x) * 0.045
  pointer.y += (target.y - pointer.y) * 0.045

  group.rotation.y = time * 0.11 + pointer.x * 0.42
  group.rotation.x = Math.sin(time * 0.24) * 0.08 + pointer.y * 0.2
  group.position.y = Math.sin(time * 0.5) * 0.06

  wire.rotation.y = -time * 0.05
  wire.rotation.x = Math.sin(time * 0.17) * 0.12
  shell.rotation.y = time * 0.035
  nodes.rotation.y = time * 0.06
  ringA.rotation.z = time * 0.12
  ringB.rotation.z = -time * 0.09

  satellites.forEach(({ mesh, radius, speed, offset }) => {
    const angle = time * speed + offset
    mesh.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.3) * 0.5, Math.sin(angle) * radius)
    mesh.rotation.x = time * 0.7
    mesh.rotation.y = time * 0.9
  })

  stars.rotation.y = time * 0.008
  stars.rotation.x = Math.sin(time * 0.05) * 0.04

  camera.position.x = pointer.x * 0.28
  camera.position.y = pointer.y * 0.16
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
}

onMounted(init)

onBeforeUnmount(() => {
  stop()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  if (scene) {
    scene.traverse((object) => {
      object.geometry?.dispose?.()
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.())
      else object.material?.dispose?.()
    })
  }

  renderer?.dispose?.()
  renderer?.forceContextLoss?.()
  renderer = null
  scene = null
  camera = null
  group = null
  satellites.length = 0
})
</script>

<style scoped>
.spatial-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.spatial-scene canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.spatial-scene-glow {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(249, 172, 138, 0.18), rgba(1, 10, 42, 0.08) 45%, transparent 70%);
  filter: blur(18px);
  opacity: 0.7;
}

.spatial-scene.is-fallback {
  background:
    radial-gradient(circle at 50% 45%, rgba(249, 172, 138, 0.22), transparent 32%),
    radial-gradient(circle at 60% 60%, rgba(66, 139, 202, 0.16), transparent 46%);
}

.spatial-scene.is-fallback::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(58%, 340px);
  aspect-ratio: 1;
  border: 1px solid rgba(249, 172, 138, 0.35);
  border-radius: 50%;
  box-shadow: inset 0 0 60px rgba(249, 172, 138, 0.12), 0 0 80px rgba(249, 172, 138, 0.1);
  content: '';
  transform: translate(-50%, -50%);
}

.spatial-scene.is-fallback canvas { display: none; }
</style>
