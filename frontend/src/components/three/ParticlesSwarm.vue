<template>
  <div ref="container" class="particles-swarm" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const container = ref(null)
let scene, camera, renderer, composer, mesh, clock
let positions = []
let animationId = null

const COUNT = 18000
const SCALE = 90
const TWIST = 2.5
const WAVE = 6
const BREATHE = 0.5

function init() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
  camera.position.set(0, 0, 100)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.value.appendChild(renderer.domElement)

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
  bloomPass.strength = 1.2
  bloomPass.radius = 0.3
  bloomPass.threshold = 0
  composer.addPass(bloomPass)

  const geometry = new THREE.TetrahedronGeometry(0.2)
  const material = new THREE.MeshBasicMaterial({ color: 0x88ccff })

  mesh = new THREE.InstancedMesh(geometry, material, COUNT)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  scene.add(mesh)

  const color = new THREE.Color()
  for (let i = 0; i < COUNT; i++) {
    positions.push(new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ))
    const hue = 0.55 + Math.random() * 0.12
    mesh.setColorAt(i, color.setHSL(hue, 0.85, 0.45 + Math.random() * 0.15))
  }

  clock = new THREE.Clock()
  animate()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = clock.getElapsedTime()
  const dummy = new THREE.Object3D()
  const target = new THREE.Vector3()
  const pColor = new THREE.Color()

  for (let i = 0; i < COUNT; i++) {
    const u = i / COUNT
    const t = time * 0.35
    const rings = 144
    const turns = 233
    const a = u * Math.PI * 2 * rings
    const b = u * Math.PI * 2 * turns + t
    const r1 = SCALE * (1 + BREATHE * 0.25 * Math.sin(t * 2))
    const r2 = SCALE * 0.28
    const m = 1 + 0.18 * Math.sin(a * WAVE + t * 3)
    const n = 1 + 0.12 * Math.cos(b * WAVE * 0.7 - t * 2)
    const rr = (r1 + r2 * Math.cos(b * TWIST) * m)
    const x = rr * Math.cos(a)
    const y = rr * Math.sin(a)
    const z = r2 * Math.sin(b * TWIST) * n
    const rot = t * 0.6
    const cr = Math.cos(rot)
    const sr = Math.sin(rot)
    target.set(
      x * cr - z * sr,
      y + Math.sin(a * 2 + t) * SCALE * 0.03,
      x * sr + z * cr
    )
    positions[i].lerp(target, 0.1)
    dummy.position.copy(positions[i])
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    const hue = (u + 0.12 * Math.sin(b * 0.5 + t)) % 1
    pColor.setHSL(hue < 0 ? hue + 1 : hue, 0.85, 0.45 + 0.18 * Math.sin(a * 3 + b + t * 2))
    mesh.setColorAt(i, pColor)
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.instanceColor.needsUpdate = true
  composer.render()
}

function onResize() {
  if (!camera || !renderer || !composer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (mesh) { mesh.geometry.dispose(); mesh.material.dispose() }
  if (renderer) {
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    renderer.dispose()
  }
  if (composer) { composer.renderTarget1?.dispose?.(); composer.renderTarget2?.dispose?.() }
  positions.length = 0
})
</script>

<style scoped>
.particles-swarm {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.particles-swarm :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>