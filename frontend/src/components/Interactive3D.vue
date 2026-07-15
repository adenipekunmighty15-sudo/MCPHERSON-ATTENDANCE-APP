<template>
  <div ref="container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref(null)

let scene, camera, renderer, mouse, clock
let shapes = []
let animationId = null

const COLORS = [0x1d4ed8, 0xdc2626, 0xf59e0b, 0x2563eb, 0xb91c1c, 0xd97706]

function createShape(geometry, color, pos) {
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.1,
    roughness: 0.3,
    transparent: true,
    opacity: 0.35,
    wireframe: false,
    clearcoat: 0.2,
  })
  const mesh = new THREE.Mesh(geometry, mat)
  mesh.position.set(pos.x, pos.y, pos.z)
  mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0)

  const wireMat = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  })
  const wire = new THREE.Mesh(geometry.clone(), wireMat)
  wire.position.copy(mesh.position)
  wire.rotation.copy(mesh.rotation)

  const speed = 0.2 + Math.random() * 0.4
  const rotSpeed = { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01 }
  const floatOffset = Math.random() * Math.PI * 2
  const baseY = pos.y

  return { mesh, wire, speed, rotSpeed, floatOffset, baseY, phase: Math.random() * Math.PI * 2 }
}

function initScene() {
  if (!container.value) return

  const rect = container.value.getBoundingClientRect()
  const w = rect.width || window.innerWidth
  const h = rect.height || window.innerHeight

  scene = new THREE.Scene()
  clock = new THREE.Clock()

  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000)
  camera.position.z = 20

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  container.value.appendChild(renderer.domElement)

  mouse = new THREE.Vector2(0, 0)

  // Create shapes
  const spread = 18
  const geometries = [
    new THREE.TorusGeometry(1.2, 0.4, 16, 32),
    new THREE.OctahedronGeometry(1.2),
    new THREE.IcosahedronGeometry(1.1),
    new THREE.DodecahedronGeometry(1.0),
    new THREE.TorusKnotGeometry(0.9, 0.3, 64, 8),
  ]

  for (let i = 0; i < 20; i++) {
    const geo = geometries[i % geometries.length]
    const color = COLORS[i % COLORS.length]
    const pos = {
      x: (Math.random() - 0.5) * spread * 1.5,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * 10 - 5,
    }
    const s = createShape(geo, color, pos)
    scene.add(s.mesh)
    scene.add(s.wire)
    shapes.push(s)
  }

  // Ambient particles
  const particleCount = 400
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 50
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0x3b82f6,
    size: 0.04,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
  })
  const particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  // Mouse tracking
  window.addEventListener('mousemove', onMouseMove)
}

function onMouseMove(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const elapsed = clock.getElapsedTime()

  // Rotate camera slightly based on mouse
  camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02
  camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02
  camera.lookAt(0, 0, 0)

  shapes.forEach((s, i) => {
    s.mesh.rotation.x += s.rotSpeed.x
    s.mesh.rotation.y += s.rotSpeed.y
    s.wire.rotation.x = s.mesh.rotation.x
    s.wire.rotation.y = s.mesh.rotation.y

    const float = Math.sin(elapsed * s.speed + s.floatOffset) * 1.5
    s.mesh.position.y = s.baseY + float
    s.wire.position.y = s.mesh.position.y

    // Subtle mouse influence
    s.mesh.position.x += (mouse.x * 0.5 - s.mesh.position.x * 0.02) * 0.01
    s.mesh.position.z += (mouse.y * 0.3 - s.mesh.position.z * 0.02) * 0.01
    s.wire.position.x = s.mesh.position.x
    s.wire.position.z = s.mesh.position.z
  })

  renderer.render(scene, camera)
}

function handleResize() {
  if (!container.value) return
  const w = container.value.clientWidth
  const h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  initScene()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', onMouseMove)
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
  shapes = []
})
</script>
