<template>
  <div class="min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text-primary)]">
    <div class="page page-wide">
      
      <header class="text-center">
        <div class="w-16 h-16 bg-[var(--color-primary-soft)] border border-[var(--color-border-accent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ScanFace class="w-8 h-8 text-[var(--color-text-primary)]" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Face ID Setup</h1>
        <p class="text-[var(--color-text-secondary)] mt-2 text-sm max-w-md mx-auto">Register your biometric profile for seamless, contactless check-ins to your University lectures.</p>
        <p v-if="hasFace" class="text-[var(--color-text-primary)] mt-1 text-xs font-medium">{{ hasFace ? 'Face profile already registered — capturing will overwrite' : '' }}</p>
      </header>

      <!-- Loading models -->
      <div v-if="!modelsReady && !modelsError" class="text-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-3" />
        <p class="text-sm text-[var(--color-text-secondary)]">Loading face recognition models...</p>
      </div>
      <div v-if="modelsError" class="text-center py-12">
        <p class="text-sm text-[var(--color-error)]">{{ modelsError }}</p>
        <button @click="initFaceModels" class="mt-3 text-sm text-[var(--color-primary)] hover:underline">Retry</button>
      </div>

      <div v-if="modelsReady" class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-primary-glow)] blur-[100px] rounded-full pointer-events-none" />

        <div class="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          
          <div class="relative w-full md:w-96 aspect-square rounded-2xl overflow-hidden bg-black border-2 border-[var(--color-border)] shadow-inner">
            <video ref="videoEl" class="w-full h-full object-cover" autoplay playsinline muted></video>
            
            <div class="absolute inset-0 border-4 border-[var(--color-primary)]/50 rounded-2xl m-4 pointer-events-none">
              <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[var(--color-primary)] -mt-1 -ml-1"></div>
              <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[var(--color-primary)] -mt-1 -mr-1"></div>
              <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[var(--color-primary)] -mb-1 -ml-1"></div>
              <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[var(--color-primary)] -mb-1 -mr-1"></div>
            </div>

            <div v-if="isScanning" class="absolute left-0 right-0 h-1 bg-[var(--color-primary)] shadow-[0_0_20px_var(--color-primary)] animate-scan pointer-events-none"></div>
            <div v-if="faceDetected" class="absolute inset-0 border-4 border-[var(--color-primary)] rounded-2xl pointer-events-none animate-pulse"></div>

            <div v-if="!cameraActive" class="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-sm">
              <CameraOff class="w-12 h-12 text-[var(--color-text-tertiary)] mb-3" />
              <p class="text-sm font-semibold text-[var(--color-text-secondary)]">Camera Inactive</p>
            </div>
          </div>

          <div class="flex-1 space-y-6">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-text-primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <p class="text-sm text-[var(--color-text-primary)]">Ensure you are in a well-lit environment with your face clearly visible.</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-text-primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <p class="text-sm text-[var(--color-text-primary)]">Remove any accessories like sunglasses or heavy hats.</p>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-text-primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <p class="text-sm text-[var(--color-text-primary)]">Look directly into the camera and hold still while scanning.</p>
              </div>
            </div>

            <div class="pt-4 border-t border-[var(--color-border)] flex flex-col gap-3">
              <button v-if="!cameraActive" @click="startCamera" class="flex-1 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Camera class="w-5 h-5" />
                Enable Camera
              </button>
              
              <div v-else class="flex gap-3">
                <button @click="captureFace" :disabled="isScanning || saved" class="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-[var(--color-primary)]/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                  <Loader2 v-if="isScanning" class="w-5 h-5 animate-spin" />
                  <ScanFace v-else class="w-5 h-5" />
                  {{ isScanning ? 'Scanning...' : saved ? 'Saved!' : 'Capture Face ID' }}
                </button>
                <button @click="stopCamera" class="px-4 py-3 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                  <CameraOff class="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <p v-if="errorMsg" class="text-sm text-[var(--color-error)] font-medium">{{ errorMsg }}</p>
            <p v-if="successMsg" class="text-sm text-[var(--color-text-primary)] font-medium flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4" />
              {{ successMsg }}
            </p>
            <p v-if="distance !== null" class="text-xs text-[var(--color-text-tertiary)]">Match confidence: {{ ((1 - distance) * 100).toFixed(1) }}%</p>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ScanFace, Camera, CameraOff, Loader2, CheckCircle2 } from 'lucide-vue-next'
import { loadFaceModels, captureFaceDescriptor } from '../lib/face'
import api from '../lib/api'

const videoEl = ref(null)
const cameraActive = ref(false)
const isScanning = ref(false)
const modelsReady = ref(false)
const modelsError = ref('')
const successMsg = ref('')
const errorMsg = ref('')
const faceDetected = ref(false)
const saved = ref(false)
const hasFace = ref(false)
const distance = ref(null)
let stream = null

async function initFaceModels() {
  modelsError.value = ''
  const ok = await loadFaceModels()
  if (ok) modelsReady.value = true
  else modelsError.value = 'Failed to load face recognition models. Check your connection.'
}
onMounted(async () => {
  await initFaceModels()
  try {
    const { data } = await api.get('/auth/face')
    if (data?.descriptor) hasFace.value = true
  } catch (e) { console.warn('[FaceReg] Load face failed:', e) }
})

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      cameraActive.value = true
      successMsg.value = ''
      errorMsg.value = ''
    }
  } catch (err) {
    errorMsg.value = 'Could not access camera. Please check permissions.'
  }
}

const stopCamera = () => {
  if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null }
  cameraActive.value = false
}

const captureFace = async () => {
  if (!modelsReady.value || !videoEl.value) return
  isScanning.value = true
  errorMsg.value = ''
  successMsg.value = ''
  saved.value = false
  distance.value = null
  faceDetected.value = false

  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    const descriptor = await captureFaceDescriptor(videoEl.value)
    if (!descriptor) {
      errorMsg.value = 'No face detected. Ensure you are looking directly at the camera in good lighting.'
      isScanning.value = false
      return
    }
    faceDetected.value = true
    await api.put('/auth/face', { descriptor: JSON.stringify(descriptor) })
    saved.value = true
    hasFace.value = true
    successMsg.value = 'Biometric profile registered successfully!'
    setTimeout(() => stopCamera(), 2000)
  } catch (err) {
    errorMsg.value = err?.response?.data?.error || err?.message || 'Failed to save face data.'
  } finally {
    isScanning.value = false
  }
}

onUnmounted(() => stopCamera())
</script>

<style scoped>
@keyframes scan {
  0%, 100% { top: 10%; }
  50% { top: 90%; }
}
.animate-scan {
  animation: scan 2s ease-in-out infinite;
}
</style>
