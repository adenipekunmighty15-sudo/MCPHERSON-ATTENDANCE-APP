<template>
  <div ref="cardRef" class="card-wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
    <div class="card-inner" :class="{ 'is-flipped': flipped }" :style="innerStyles" @click="flipped = !flipped">
      <div class="card-face card-front">
        <div class="card-3d-shine" :style="shineStyles" />
        <div class="card-front-bg">
          <div class="card-top-stripe">
            <div class="card-logo">
              <Logo :size="36" />
            </div>
            <div class="card-title-area">
              <span class="card-uni-name">McPherson University</span>
              <span class="card-doc-type">Student Identity Card</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-photo-section">
              <div v-if="displayFace" class="card-photo-img"><img :src="displayFace" alt="Student" /></div>
              <div v-else class="card-photo-placeholder">{{ initials }}</div>
            </div>
            <div class="card-info-section">
              <div class="info-row">
                <span class="info-label">NAME</span>
                <span class="info-value">{{ student.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">MATRIC NO</span>
                <span class="info-value">{{ student.matricNo }}</span>
              </div>
              <div class="info-row info-row-duo">
                <div class="info-half">
                  <span class="info-label">DEPARTMENT</span>
                  <span class="info-value">{{ student.department }}</span>
                </div>
                <div class="info-half">
                  <span class="info-label">LEVEL</span>
                  <span class="info-value">{{ student.level }}</span>
                </div>
              </div>
              <div class="info-row info-row-duo">
                <div class="info-half">
                  <span class="info-label">VALID UNTIL</span>
                  <span class="info-value">{{ student.validUntil }}</span>
                </div>
                <div class="info-half">
                  <span class="info-label">STATUS</span>
                  <span class="info-value status-active">Active</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-traits">
            <div class="trait-badge trait-live">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
              <span>Live Marathoner</span>
            </div>
            <div class="trait-badge trait-commit">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Commiter</span>
            </div>
            <div class="trait-badge trait-flow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span>Flow Master</span>
            </div>
            <div class="trait-badge trait-consist">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
              <span>Consistency</span>
            </div>
          </div>
          <div class="card-front-footer">
            <span>km 75, Lagos-Ibadan Expwy, Seriki Sotayo, Ogun State</span>
            <span>www.mcu.edu.ng</span>
          </div>
        </div>
        <div class="card-3d-edge" @click.stop="flipped = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>

      <div class="card-face card-back">
        <div class="card-3d-shine" :style="shineStyles" />
        <div class="card-back-bg">
          <div class="card-back-top">
            <div class="card-back-header">
              <Logo :size="28" />
              <div>
                <span class="back-uni-name">McPherson University</span>
                <span class="back-motto">Building a People of Excellence and Integrity for Service</span>
              </div>
            </div>
          </div>
          <div class="card-back-body">
            <div class="back-section">
              <span class="back-section-title">Emergency Contact</span>
              <div class="back-row"><span>Security:</span><span>+234 803 456 7890</span></div>
              <div class="back-row"><span>Health Center:</span><span>+234 803 456 7891</span></div>
              <div class="back-row"><span>ICT Support:</span><span>ict@mcu.edu.ng</span></div>
            </div>
            <div class="back-section">
              <span class="back-section-title">Institution Details</span>
              <div class="back-row"><span>Accreditation:</span><span>NUC Licensed</span></div>
              <div class="back-row"><span>Established:</span><span>2012</span></div>
              <div class="back-row"><span>Type:</span><span>Private University</span></div>
            </div>
            <div class="back-barcode">
              <div v-for="i in 40" :key="i" class="bar-line" :style="{ height: (15 + (i * 7) % 31) + 'px', width: (2 + (i * 3) % 4) + 'px' }"></div>
            </div>
            <div class="back-footer">
              <p>This card is the property of McPherson University. If found, please return to the address above.</p>
              <p class="back-footer-reg">MCU-STU-{{ student.matricNo.slice(-6) }}</p>
            </div>
          </div>
        </div>
        <div class="card-3d-backside" @click.stop="flipped = false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../lib/api'
import Logo from './Logo.vue'

const props = defineProps({
  student: {
    type: Object,
    default: () => ({
      name: 'John Doe',
      matricNo: 'MCU/2022/1234',
      department: 'Computer Science',
      level: '300 Level',
      validUntil: '2027/08/31',
    }),
  },
  photo: { type: String, default: '' },
  faceImage: { type: String, default: '' },
  autoFlip: { type: Boolean, default: false },
})

const flipped = ref(false)
const cardRef = ref(null)
const rotateX = ref(0)
const rotateY = ref(0)
const shineX = ref(50)
const shineY = ref(50)
const isHovering = ref(false)
const localFace = ref('')
let observer = null

const displayFace = computed(() => props.faceImage || props.photo || localFace.value)

function handleMouseMove(e) {
  if (!cardRef.value) return
  isHovering.value = true
  const rect = cardRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  shineX.value = (x / rect.width) * 100
  shineY.value = (y / rect.height) * 100
  const xc = rect.width / 2
  const yc = rect.height / 2
  rotateX.value = -((y - yc) / yc) * 15
  rotateY.value = ((x - xc) / xc) * 15
}

function handleMouseLeave() {
  isHovering.value = false
  rotateX.value = 0
  rotateY.value = 0
}

const innerStyles = computed(() => {
  if (isHovering.value && !flipped.value) {
    return {
      transform: `translateZ(15px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) scale3d(1.02,1.02,1.02)`,
      transition: 'transform 0.08s ease-out',
    }
  }
  if (flipped.value) {
    return { transform: 'rotateY(180deg) translateZ(5px)', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }
  }
  return { transform: 'translateZ(0)', transition: 'transform 0.5s cubic-bezier(0.25,0.8,0.25,1)' }
})

const shineStyles = computed(() => {
  if (!isHovering.value) return { opacity: 0 }
  return {
    opacity: 0.15,
    background: `radial-gradient(circle at ${shineX.value}% ${shineY.value}%, rgba(29,78,216,0.3) 0%, rgba(255,255,255,0.5) 40%, transparent 70%)`,
    transition: 'opacity 0.2s ease',
  }
})

const initials = computed(() => {
  return props.student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

async function fetchFaceImage() {
  if (props.faceImage || props.photo) return
  try {
    const { data } = await api.get('/auth/face')
    if (data?.descriptor) {
      localFace.value = data.descriptor
    }
  } catch { /* no face registered */ }
}

onMounted(() => {
  fetchFaceImage()
  if (props.autoFlip && cardRef.value) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          flipped.value = true
          setTimeout(() => { flipped.value = false }, 2000)
        }
      })
    }, { threshold: 0.5 })
    observer.observe(cardRef.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.card-wrapper {
  width: 100%;
  max-width: 440px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  perspective: 1200px;
}
.card-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 440 / 280;
  min-height: 260px;
  transform-style: preserve-3d;
}
.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: none;
}
.card-back {
  transform: rotateY(180deg);
}
.card-3d-shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  border-radius: 20px;
  mix-blend-mode: overlay;
}
.card-3d-edge {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(30,58,95,0.5);
  backdrop-filter: blur(8px);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.25);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 3;
}
.card-3d-edge:hover {
  background: rgba(30,58,95,0.6);
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.4);
}
.card-3d-backside {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 3;
}
.card-3d-backside:hover {
  background: rgba(255,255,255,0.25);
  transform: translateX(-50%) translateY(-2px);
  border-color: rgba(255,255,255,0.35);
}
.card-front-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1e3a5f 0%, #1a4a7a 40%, #0f2b4c 100%);
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
}
.card-top-stripe {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255,255,255,0.3);
}

.card-title-area {
  display: flex;
  flex-direction: column;
}
.card-uni-name {
  font-size: 14px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 0.3px;
}
.card-doc-type {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.card-body {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 10px 0;
  align-items: stretch;
}
.card-photo-section {
  width: 90px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-photo-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFFFFF, #DBEAFE);
  font-size: 28px;
  font-weight: 800;
  color: #1D4ED8;
  border-radius: 12px;
  border: 2px solid rgba(255,255,255,0.6);
}
.card-photo-img {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.6);
}
.card-photo-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.info-row-duo {
  flex-direction: row;
  gap: 8px;
}
.info-half {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.info-label {
  font-size: 8px;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}
.info-value {
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.3;
}
.status-active {
  color: #86EFAC;
}
.card-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 0 2px;
}
.trait-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.2px;
  background: rgba(255,255,255,0.12);
  color: #FFFFFF;
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  white-space: nowrap;
}
.trait-badge svg { flex-shrink: 0; }
.trait-live svg { color: #FF6B6B; }
.trait-commit svg { color: #51CF66; }
.trait-flow svg { color: #74C0FC; }
.trait-consist svg { color: #FFD43B; }
.card-front-footer {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: rgba(255,255,255,0.5);
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,0.15);
}
.card-back-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1e3a5f 0%, #1a4a7a 40%, #0f2b4c 100%);
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
}
.card-back-top {
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255,255,255,0.2);
}
.card-back-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-back-header svg { flex-shrink: 0; }
.back-uni-name {
  font-size: 13px;
  font-weight: 800;
  color: #FFFFFF;
  display: block;
}
.back-motto {
  font-size: 9px;
  color: rgba(255,255,255,0.6);
  font-style: italic;
}
.card-back-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}
.back-section {
  background: rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 8px 10px;
}
.back-section-title {
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
}
.back-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255,255,255,0.85);
  line-height: 1.6;
}
.back-row span:first-child { color: rgba(255,255,255,0.5); }
.back-row span:last-child { font-weight: 600; }
.back-barcode {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  justify-content: center;
  padding: 6px 0;
}
.bar-line {
  background: rgba(255,255,255,0.8);
  border-radius: 1px;
  flex-shrink: 0;
}
.back-footer {
  margin-top: auto;
  text-align: center;
}
.back-footer p {
  font-size: 8px;
  color: rgba(255,255,255,0.5);
  margin: 0;
  line-height: 1.4;
}
.back-footer-reg {
  font-size: 9px !important;
  font-weight: 700;
  color: rgba(255,255,255,0.8) !important;
  letter-spacing: 0.5px;
  margin-top: 4px !important;
}
@media (max-width: 480px) {
  .card-wrapper { max-width: 100%; }
  .card-inner { aspect-ratio: 440 / 280; min-height: 200px; }
  .card-uni-name { font-size: 12px; }
  .info-value { font-size: 11px; }
  .card-photo-placeholder, .card-photo-img { width: 64px; height: 64px; }
  .card-photo-section { width: 76px; }
}
</style>
