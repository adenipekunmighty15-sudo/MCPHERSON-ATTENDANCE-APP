<template>
  <div ref="container" class="campus-map-3d"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { locationTracker } from '../services/LocationService.js'

const props = defineProps({
  showPath: { type: Boolean, default: true },
  showBuildings: { type: Boolean, default: true },
  showAnchors: { type: Boolean, default: true },
  showDevice: { type: Boolean, default: true },
  autoRotate: { type: Boolean, default: false },
})

const emit = defineEmits(['buildingClick', 'roomClick'])

const container = ref(null)

let scene, camera, renderer, labelRenderer, controls
let buildings = []
let pathLine = null
let deviceMarker = null
let anchorMarkers = []
let roomLabels = []
let animationId = null
let cleanupFn = null

const BUILDING_COLORS = {
  'main-hall': 0x1D4ED8,
  'science-block': 0x2563EB,
  'library': 0xF59E0B,
  'admin-building': 0xDC2626,
  'engineering-block': 0x3B82F6,
  'student-center': 0x60A5FA,
}

function initScene() {
  if (!container.value) return
  const w = container.value.clientWidth
  const h = container.value.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0F172A)

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
  camera.position.set(0, 30, 30)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.value.appendChild(renderer.domElement)

  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(w, h)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  labelRenderer.domElement.style.left = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'
  container.value.appendChild(labelRenderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 10
  controls.maxDistance = 80
  controls.autoRotate = props.autoRotate
  controls.autoRotateSpeed = 0.5

  const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
  dirLight.position.set(10, 30, 10)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  scene.add(dirLight)

  const hemiLight = new THREE.HemisphereLight(0x606080, 0x404040, 0.8)
  scene.add(hemiLight)

  const gridHelper = new THREE.GridHelper(60, 30, 0x1D4ED8, 0x1E293B)
  gridHelper.position.y = -0.5
  scene.add(gridHelper)

  buildCampus()
  if (props.showPath) buildSLAMPath()
  if (props.showDevice) buildDeviceMarker()

  window.addEventListener('resize', onResize)
}

function buildCampus() {
  const campusData = locationTracker.getBuildings()
  campusData.forEach(b => {
    const dx = (b.lat - locationTracker.getCampusCenter().lat) * 111320
    const dz = -(b.lng - locationTracker.getCampusCenter().lng) * 111320 * Math.cos(locationTracker.getCampusCenter().lat * Math.PI / 180)
    const color = BUILDING_COLORS[b.id] || 0x334155

    const group = new THREE.Group()
    const w = 4
    const h = b.floors * 1.5
    const d = 4

    // Generate building facade texture
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Wall color
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
    ctx.fillRect(0, 0, 256, 512)

    // Brick/panel lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 1
    for (let y = 0; y < 512; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke()
    }

    // Windows grid
    const floors = b.floors
    const winRows = floors * 3
    const winCols = 4
    const winW = 28
    const winH = 36
    const gapX = (256 - winCols * winW) / (winCols + 1)
    const gapY = (512 - winRows * winH) / (winRows + 1)

    for (let row = 0; row < winRows; row++) {
      for (let col = 0; col < winCols; col++) {
        const wx = gapX + col * (winW + gapX)
        const wy = gapY + row * (winH + gapY)
        // Glass
        ctx.fillStyle = Math.random() > 0.3 ? '#87CEEB' : '#2C3E50'
        ctx.shadowColor = 'rgba(135,206,235,0.3)'
        ctx.shadowBlur = 4
        ctx.fillRect(wx, wy, winW, winH)
        ctx.shadowBlur = 0
        // Window frame
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'
        ctx.lineWidth = 1
        ctx.strokeRect(wx, wy, winW, winH)
        // Cross divider
        ctx.beginPath()
        ctx.moveTo(wx, wy + winH / 2); ctx.lineTo(wx + winW, wy + winH / 2)
        ctx.moveTo(wx + winW / 2, wy); ctx.lineTo(wx + winW / 2, wy + winH)
        ctx.stroke()
      }
    }

    // Entrance door
    ctx.fillStyle = '#1a1a2e'
    ctx.shadowBlur = 0
    ctx.fillRect(108, 512 - 60, 40, 60)
    ctx.fillStyle = '#F4B400'
    ctx.fillRect(108, 512 - 60, 40, 8)
    ctx.fillRect(108, 512 - 60, 8, 60)
    ctx.fillRect(140, 512 - 60, 8, 60)

    const texture = new THREE.CanvasTexture(canvas)

    const geo = new THREE.BoxGeometry(w, h, d)
    const materials = [
      new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.6, metalness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.6, metalness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.6, metalness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.6, metalness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, metalness: 0.1 }), // top
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, metalness: 0.1 }), // bottom
    ]
    const mesh = new THREE.Mesh(geo, materials)
    mesh.position.y = h / 2
    mesh.castShadow = true
    group.add(mesh)

    // Roof edge
    const roofGeo = new THREE.BoxGeometry(w + 0.3, 0.1, d + 0.3)
    const roofMat = new THREE.MeshPhysicalMaterial({ color: 0x374151, roughness: 0.8, metalness: 0.1 })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.y = h + 0.05
    group.add(roof)

    const edgeGeo = new THREE.EdgesGeometry(geo)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x60A5FA, transparent: true, opacity: 0.15 })
    const edges = new THREE.LineSegments(edgeGeo, edgeMat)
    edges.position.y = h / 2
    group.add(edges)

    group.position.set(dx, 0, dz)
    scene.add(group)

    const label = createLabel(b.name, dx, h + 1.5, dz)
    scene.add(label)

    buildings.push(group)

    const classrooms = locationTracker.getClassrooms().filter(cr => cr.building === b.id)
    classrooms.forEach(cr => {
      const cx = (cr.lat - locationTracker.getCampusCenter().lat) * 111320
      const cz = -(cr.lng - locationTracker.getCampusCenter().lng) * 111320 * Math.cos(locationTracker.getCampusCenter().lat * Math.PI / 180)

      // Classroom with window texture
      const crCanvas = document.createElement('canvas')
      crCanvas.width = 128
      crCanvas.height = 96
      const crCtx = crCanvas.getContext('2d')
      crCtx.fillStyle = '#3B82F6'
      crCtx.fillRect(0, 0, 128, 96)
      crCtx.fillStyle = '#60A5FA'
      crCtx.fillRect(8, 8, 112, 4)
      crCtx.fillRect(8, 84, 112, 4)
      crCtx.fillStyle = '#87CEEB'
      for (let wx = 14; wx < 128; wx += 28) {
        crCtx.fillRect(wx, 18, 16, 20)
        crCtx.strokeStyle = 'rgba(0,0,0,0.2)'
        crCtx.strokeRect(wx, 18, 16, 20)
      }
      const crTexture = new THREE.CanvasTexture(crCanvas)

      const roomGroup = new THREE.Group()
      const roomGeo = new THREE.BoxGeometry(1.8, 0.8, 1.8)
      const roomMat = new THREE.MeshPhysicalMaterial({
        map: crTexture, roughness: 0.4, metalness: 0.2, transparent: true, opacity: 0.85,
      })
      const roomMesh = new THREE.Mesh(roomGeo, roomMat)
      roomMesh.position.y = 0.4
      roomGroup.add(roomMesh)
      roomGroup.position.set(cx, cr.floor * 1.5, cz)
      roomGroup.userData = { roomCode: cr.code, roomName: cr.name }
      scene.add(roomGroup)

      const roomLabel = createLabel(cr.code, cx, cr.floor * 1.5 + 0.8, cz, '8px')
      scene.add(roomLabel)
      roomLabels.push(roomLabel)
    })

    if (props.showAnchors && buildings.length <= 1) {
      const roomAnchors = locationTracker.classroomAnchors
      roomAnchors.forEach((anchors, code) => {
        anchors.forEach(a => {
          const ax = (a.position.x - locationTracker.getCampusCenter().lat) * 111320
          const az = -(a.position.y - locationTracker.getCampusCenter().lng) * 111320 * Math.cos(locationTracker.getCampusCenter().lat * Math.PI / 180)
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x22C55E })
          )
          sphere.position.set(ax, 0.2, az)
          scene.add(sphere)
          anchorMarkers.push(sphere)
        })
      })
    }
  })
}

function createLabel(text, x, y, z, size = '10px') {
  const div = document.createElement('div')
  div.textContent = text
  div.style.color = '#F8FAFC'
  div.style.fontSize = size
  div.style.fontWeight = '600'
  div.style.fontFamily = 'Inter, sans-serif'
  div.style.textShadow = '0 1px 4px rgba(0,0,0,0.8)'
  div.style.background = 'rgba(15,23,42,0.6)'
  div.style.padding = '2px 6px'
  div.style.borderRadius = '4px'
  div.style.border = '1px solid rgba(96,165,250,0.3)'
  div.style.backdropFilter = 'blur(4px)'
  div.style.whiteSpace = 'nowrap'
  const label = new CSS2DObject(div)
  label.position.set(x, y, z)
  return label
}

function buildSLAMPath() {
  const path = locationTracker.getSLAMPath()
  if (path.length < 2) return
  const points = path.map(p => new THREE.Vector3(p.x, 0.1, p.z))
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  const mat = new THREE.LineBasicMaterial({ color: 0x60A5FA, linewidth: 2, transparent: true, opacity: 0.7 })
  pathLine = new THREE.Line(geo, mat)
  scene.add(pathLine)

  if (path.length > 1) {
    const dotMat = new THREE.PointsMaterial({ color: 0x93C5FD, size: 0.3, transparent: true, opacity: 0.5 })
    const dotGeo = new THREE.BufferGeometry().setFromPoints(points)
    const dots = new THREE.Points(dotGeo, dotMat)
    scene.add(dots)
  }
}

function buildDeviceMarker() {
  const group = new THREE.Group()

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x22C55E })
  )
  group.add(core)

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.9, 32),
    new THREE.MeshBasicMaterial({ color: 0x22C55E, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -0.1
  group.add(ring)

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x22C55E, transparent: true, opacity: 0.15 })
  )
  group.add(glow)

  deviceMarker = group
  scene.add(group)
}

function updateDevicePosition() {
  if (!deviceMarker) return
  const pos = locationTracker.currentPosition
  if (!pos) return
  const x = (pos.lat - locationTracker.getCampusCenter().lat) * 111320
  const z = -(pos.lng - locationTracker.getCampusCenter().lng) * 111320 * Math.cos(locationTracker.getCampusCenter().lat * Math.PI / 180)
  deviceMarker.position.set(x, 0.5, z)

  const ring = deviceMarker.children[1]
  if (ring) {
    ring.scale.setScalar(1 + Math.sin(Date.now() / 500) * 0.2)
  }
}

function updateSLAMPath() {
  if (!pathLine) {
    if (props.showPath) buildSLAMPath()
    return
  }
  const path = locationTracker.getSLAMPath()
  if (path.length < 2) return
  const points = path.map(p => new THREE.Vector3(p.x, 0.1, p.z))
  pathLine.geometry.dispose()
  pathLine.geometry = new THREE.BufferGeometry().setFromPoints(points)
}

function onResize() {
  if (!container.value) return
  const w = container.value.clientWidth
  const h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  labelRenderer.setSize(w, h)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()
  updateDevicePosition()
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

const unsubscribe = locationTracker.onPositionUpdate(({ type }) => {
  if (type === 'position') {
    updateDevicePosition()
    if (props.showPath) updateSLAMPath()
  }
})

onMounted(() => {
  initScene()
  animate()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (unsubscribe) unsubscribe()
  if (renderer) {
    renderer.dispose()
    container.value?.removeChild(renderer.domElement)
  }
  if (labelRenderer) {
    container.value?.removeChild(labelRenderer.domElement)
  }
})

watch(() => props.showPath, () => {
  if (pathLine) { scene.remove(pathLine); pathLine = null }
  if (props.showPath) buildSLAMPath()
})
</script>

<style scoped>
.campus-map-3d {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
}
</style>
