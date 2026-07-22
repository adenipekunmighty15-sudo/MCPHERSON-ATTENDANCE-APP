<template>
  <div class="login-page min-h-screen w-full flex items-stretch relative overflow-hidden" style="background: #F5F1EA;">
    <!-- LEFT COLUMN -->
    <div class="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-16 py-12">
      <div class="max-w-lg">
        <!-- Brand header -->
        <div class="flex items-center gap-3 mb-14">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background: #EDEDED;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 1.1 3.6 3 6 3s6-1.9 6-3v-5"/>
            </svg>
          </div>
          <div>
            <div class="text-[#1A1A2E] font-bold text-base tracking-tight" style="font-family: 'Fraunces', Georgia, serif;">McPherson University</div>
            <div class="text-[#68758E] text-xs mt-0.5">Citadel of Champions</div>
          </div>
        </div>

        <!-- Headline -->
        <h1 class="mb-5 leading-tight" style="font-family: 'Fraunces', Georgia, serif;">
          <div class="text-[#1A1A2E] text-5xl font-bold tracking-tighter">Your campus,</div>
          <div class="text-[#C9902B] text-5xl font-bold tracking-tighter">reimagined.</div>
        </h1>

        <!-- Subtext -->
        <p class="text-[#68758E] text-base leading-relaxed mb-10 max-w-md" style="font-family: 'Inter', system-ui, sans-serif;">
          Track attendance, manage courses, and unlock AI-powered insights — built for McPherson students.
        </p>

        <!-- 2x2 Stats Grid -->
        <div class="grid grid-cols-2 gap-3 mb-12 max-w-md">
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-2xl font-bold" style="font-family: 'Fraunces', Georgia, serif;">4,200+</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Active Students</div>
          </div>
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-2xl font-bold" style="font-family: 'Fraunces', Georgia, serif;">89%</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Avg. Attendance</div>
          </div>
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-2xl font-bold" style="font-family: 'Fraunces', Georgia, serif;">320</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Courses Tracked</div>
          </div>
          <div class="rounded-xl py-4 px-5" style="background: #EDEDED;">
            <div class="text-[#1A1A2E] text-2xl font-bold" style="font-family: 'Fraunces', Georgia, serif;">4.9★</div>
            <div class="text-[#68758E] text-xs mt-1 font-medium">Satisfaction</div>
          </div>
        </div>

        <!-- Pull-quote -->
        <div class="pl-5" style="border-left: 3px solid #C9902B;">
          <p class="text-[#68758E] italic text-sm leading-relaxed" style="font-family: 'Inter', system-ui, sans-serif;">&ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;</p>
          <p class="text-[#96A0B5] text-xs mt-2 font-medium">&mdash; Nelson Mandela</p>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div class="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6 lg:p-8">
      <!-- Three.js container -->
      <div ref="threeContainer" class="absolute inset-0 z-0 pointer-events-none overflow-hidden" />

      <div class="w-full max-w-sm relative z-10">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-3 mb-10">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background: #EDEDED;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 1.1 3.6 3 6 3s6-1.9 6-3v-5"/>
            </svg>
          </div>
          <div>
            <div class="text-[#1A1A2E] font-bold text-sm" style="font-family: 'Fraunces', Georgia, serif;">McPherson University</div>
            <div class="text-[#68758E] text-[10px]">Citadel of Champions</div>
          </div>
        </div>

        <!-- Auth Card -->
        <div class="relative">
          <!-- Gradient top bar -->
          <div class="absolute -top-px left-6 right-6 h-[3px] rounded-full z-10" style="background: linear-gradient(90deg, #0F1E3D, #C9902B);" />

          <!-- Card body -->
          <div class="bg-white rounded-[20px] p-8 relative overflow-hidden" style="box-shadow: 0 16px 40px rgba(11, 26, 51, 0.08), 0 8px 16px rgba(11, 26, 51, 0.04);">
            <!-- Tab Switcher -->
            <div class="flex p-1 mb-7 rounded-xl" style="background: #EDEDED;">
              <button class="flex-1 py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200" style="font-family: 'Inter', system-ui, sans-serif; background: #FFFFFF; color: #1A1A2E; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">Sign In</button>
              <button class="flex-1 py-2.5 px-4 text-sm font-semibold rounded-[10px] transition-all duration-200" style="font-family: 'Inter', system-ui, sans-serif; background: transparent; color: #96A0B5;">Create Account</button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleLogin" class="space-y-5">
              <!-- Email -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-semibold text-[#68758E] uppercase tracking-wider" style="font-family: 'Inter', system-ui, sans-serif;">Email</label>
                <input v-model="email" type="email" placeholder="you@mcu.edu.ng" required
                  class="w-full text-sm rounded-xl px-4 py-3.5 border-0 outline-none transition-all duration-200"
                  style="background: #EDEDED; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;"
                  @focus="$el.style.boxShadow = '0 0 0 2px #C9902B'"
                  @blur="$el.style.boxShadow = 'none'"
                />
              </div>

              <!-- Password -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] font-semibold text-[#68758E] uppercase tracking-wider" style="font-family: 'Inter', system-ui, sans-serif;">Password</label>
                  <router-link to="/forgot-password" class="text-[11px] font-medium transition-colors" style="color: #0F1E3D; font-family: 'Inter', system-ui, sans-serif;">Forgot?</router-link>
                </div>
                <div class="relative">
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" required
                    class="w-full text-sm rounded-xl px-4 py-3.5 border-0 outline-none transition-all duration-200 pr-11"
                    style="background: #EDEDED; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;"
                    @focus="$el.style.boxShadow = '0 0 0 2px #C9902B'"
                    @blur="$el.style.boxShadow = 'none'"
                  />
                  <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-colors" style="color: #96A0B5;">
                    <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>

              <!-- Error -->
              <div v-if="authStore.error" class="flex items-start gap-2.5 text-sm p-3 rounded-xl animate-fade-in" style="background: rgba(196,30,30,0.08); color: #C41E1E; font-family: 'Inter', system-ui, sans-serif;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p>{{ authStore.error }}</p>
              </div>

              <!-- Submit -->
              <button type="submit" :disabled="authStore.loading"
                class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer"
                style="background: #0F1E3D; font-family: 'Inter', system-ui, sans-serif;"
                @mouseenter="$el.style.background = '#1A2D52'"
                @mouseleave="$el.style.background = '#0F1E3D'"
              >
                <svg v-if="authStore.loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                <template v-else>Sign In &rarr;</template>
              </button>

              <!-- Divider -->
              <div class="relative flex items-center py-1">
                <div class="flex-grow border-t" style="border-color: #E2E6ED;" />
                <span class="flex-shrink-0 mx-3 text-[10px] font-semibold uppercase tracking-wider" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">or</span>
                <div class="flex-grow border-t" style="border-color: #E2E6ED;" />
              </div>

              <!-- Secondary buttons -->
              <div class="grid grid-cols-2 gap-3">
                <button type="button" @click="handleOAuth('google')"
                  class="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] border-0 cursor-pointer"
                  style="background: #EDEDED; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;"
                  @mouseenter="$el.style.background = '#E2E6ED'"
                  @mouseleave="$el.style.background = '#EDEDED'"
                >
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span>Google</span>
                </button>
                <button type="button" @click="handleGuest"
                  class="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] border-0 cursor-pointer"
                  style="background: #EDEDED; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;"
                  @mouseenter="$el.style.background = '#E2E6ED'"
                  @mouseleave="$el.style.background = '#EDEDED'"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Guest</span>
                </button>
              </div>
            </form>

            <!-- Sign up link -->
            <p class="mt-7 text-center text-xs" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">
              Don&apos;t have an account?
              <router-link to="/signup" class="font-semibold transition-colors" style="color: #0F1E3D;">Create one</router-link>
            </p>
          </div>

          <!-- Security caption -->
          <p class="text-center text-[11px] mt-5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Protected by McPherson University IT Security</p>
        </div>
      </div>

      <!-- Floating help button -->
      <button class="fixed bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-0 cursor-pointer z-20 transition-all duration-200" style="background: #EDEDED; color: #68758E; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" @mouseenter="$el.style.background = '#E2E6ED'" @mouseleave="$el.style.background = '#EDEDED'">?</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import * as THREE from 'three'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const threeContainer = ref(null)
let scene, camera, renderer, clock
let shapes = []
let animationId = null

function createShape(geometry, color, pos, opacity) {
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.05,
    roughness: 0.6,
    transparent: true,
    opacity,
    clearcoat: 0.1,
  })
  const mesh = new THREE.Mesh(geometry, mat)
  mesh.position.set(pos.x, pos.y, pos.z)
  mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0)

  const wireMat = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: opacity * 1.5,
  })
  const wire = new THREE.Mesh(geometry.clone(), wireMat)
  wire.position.copy(mesh.position)
  wire.rotation.copy(mesh.rotation)
  wire.scale.set(1.02, 1.02, 1.02)

  const speed = 0.15 + Math.random() * 0.25
  const rotSpeed = {
    x: (Math.random() - 0.5) * 0.008,
    y: (Math.random() - 0.5) * 0.008,
    z: (Math.random() - 0.5) * 0.005,
  }
  const floatOffset = Math.random() * Math.PI * 2
  const baseY = pos.y
  const floatAmp = 0.1 + Math.random() * 0.15

  return { mesh, wire, speed, rotSpeed, floatOffset, baseY, floatAmp }
}

function initThree() {
  if (!threeContainer.value) return

  clock = new THREE.Clock()

  scene = new THREE.Scene()

  const rect = threeContainer.value.getBoundingClientRect()
  const aspect = rect.width / rect.height

  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 20)
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  })
  renderer.setSize(rect.width, rect.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  threeContainer.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xF5F1EA, 0.6)
  scene.add(ambient)

  const dir = new THREE.DirectionalLight(0xC9902B, 0.3)
  dir.position.set(2, 3, 4)
  scene.add(dir)

  const dir2 = new THREE.DirectionalLight(0x0F1E3D, 0.2)
  dir2.position.set(-2, -1, 3)
  scene.add(dir2)

  const palette = [0x0F1E3D, 0xC9902B, 0xF5F1EA, 0x2B3A9E]
  const geometries = [
    new THREE.SphereGeometry(0.6, 24, 24),
    new THREE.SphereGeometry(0.4, 20, 20),
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.OctahedronGeometry(0.5),
    new THREE.OctahedronGeometry(0.35),
    new THREE.TetrahedronGeometry(0.6),
    new THREE.TetrahedronGeometry(0.4),
  ]

  const depthPlanes = [
    { z: -1.5, opacity: 0.15 },
    { z: -3, opacity: 0.1 },
    { z: -6, opacity: 0.06 },
  ]

  geometries.forEach((geo, i) => {
    const plane = depthPlanes[i % depthPlanes.length]
    const color = palette[i % palette.length]
    const obj = createShape(geo, color, {
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 4,
      z: plane.z,
    }, plane.opacity)
    scene.add(obj.mesh)
    scene.add(obj.wire)
    shapes.push(obj)
  })

  animate()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  shapes.forEach((obj) => {
    obj.mesh.rotation.x += obj.rotSpeed.x
    obj.mesh.rotation.y += obj.rotSpeed.y
    obj.mesh.rotation.z += obj.rotSpeed.z
    obj.mesh.position.y = obj.baseY + Math.sin(t * obj.speed + obj.floatOffset) * obj.floatAmp

    obj.wire.rotation.copy(obj.mesh.rotation)
    obj.wire.position.copy(obj.mesh.position)
  })

  renderer.render(scene, camera)
}

function resizeThree() {
  if (!threeContainer.value || !renderer) return
  const rect = threeContainer.value.getBoundingClientRect()
  camera.aspect = rect.width / rect.height
  camera.updateProjectionMatrix()
  renderer.setSize(rect.width, rect.height)
}

function destroyThree() {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
  shapes.forEach((obj) => {
    obj.mesh.geometry.dispose()
    obj.mesh.material.dispose()
    obj.wire.geometry.dispose()
    obj.wire.material.dispose()
  })
  shapes = []
}

onMounted(async () => {
  await authStore.ready
  if (authStore.isAuthenticated) router.push('/')

  if (threeContainer.value) {
    initThree()
    window.addEventListener('resize', resizeThree)
  }
})

onUnmounted(() => {
  destroyThree()
  window.removeEventListener('resize', resizeThree)
})

async function handleLogin() {
  try {
    await authStore.signIn(email.value, password.value)
    router.push('/')
  } catch (e) { console.warn('[Login] Sign in failed:', e) }
}

async function handleOAuth(provider) {
  try {
    await authStore.signInWithOAuth(provider)
  } catch (e) {
    console.error('OAuth error:', e)
  }
}

async function handleGuest() {
  try {
    await authStore.loginAsGuest()
    router.push('/')
  } catch (e) { console.warn('[Login] Guest login failed:', e) }
}
</script>

<style>
.login-page {
  min-height: 100dvh;
}

.login-page input::placeholder {
  color: #96A0B5;
  opacity: 0.7;
}

.login-page input:-webkit-autofill,
.login-page input:-webkit-autofill:hover,
.login-page input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px #EDEDED inset !important;
  -webkit-text-fill-color: #1A1A2E !important;
  caret-color: #1A1A2E;
  transition: background-color 5000s ease-in-out 0s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@media (max-width: 1024px) {
  .login-page .fixed.bottom-6.right-6 {
    bottom: 80px;
  }
}
</style>
