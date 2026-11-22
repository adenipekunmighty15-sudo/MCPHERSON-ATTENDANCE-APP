<template>
  <div
    ref="cardRef"
    class="campus-id-card"
    :class="{ 'is-hovered': hovering, 'is-pressed': pressed }"
    @pointermove="handlePointerMove"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @pointerleave="handlePointerLeave"
    @dblclick="celebrate"
  >
    <div class="card-float" :style="floatStyles">
      <div class="card-shell">
        <div
          class="card-inner"
          :class="{ 'is-flipped': flipped }"
          :style="innerStyles"
          role="button"
          tabindex="0"
          :aria-label="`${cardLabel} for ${student.name}. Press Enter to flip the card.`"
          :aria-pressed="flipped"
          @click="toggleFlip"
          @keydown.enter.prevent="toggleFlip"
          @keydown.space.prevent="toggleFlip"
        >
          <!-- FRONT -->
          <section class="card-face card-front" :aria-hidden="flipped">
            <img class="campus-watermark" :src="campusImage" alt="" aria-hidden="true" />
            <div class="card-wash" aria-hidden="true"></div>
            <div class="card-texture" aria-hidden="true"></div>
            <div class="card-shine" :style="shineStyles" aria-hidden="true"></div>
            <div class="card-glare" aria-hidden="true"></div>

            <header class="card-header">
              <Logo :size="38" />
              <div class="header-copy">
                <strong>McPherson University</strong>
                <span>{{ cardLabel }}</span>
              </div>
              <span class="active-pill"><i></i> ACTIVE</span>
            </header>

            <div class="card-main">
              <div class="portrait">
                <img v-if="displayFace" :src="displayFace" :alt="`${student.name} photo`" />
                <span v-else>{{ initials }}</span>
                <small>{{ isStaff ? 'STAFF' : 'MCU' }}</small>
              </div>

              <div class="identity">
                <span class="identity-label">CARDHOLDER</span>
                <h3>{{ student.name }}</h3>
                <div class="identity-id">{{ student.matricNo }}</div>

                <dl class="identity-details">
                  <div>
                    <dt>Department</dt>
                    <dd>{{ student.department }}</dd>
                  </div>
                  <div>
                    <dt>Level</dt>
                    <dd>{{ student.level }}</dd>
                  </div>
                  <div>
                    <dt>Valid until</dt>
                    <dd>{{ student.validUntil }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <footer class="card-footer">
              <span class="card-tech" aria-hidden="true">
                <i class="card-chip"></i>
                <i class="card-hologram"></i>
                <i class="card-nfc"></i>
              </span>
              <span class="card-place">Seriki Sotayo · mcu.edu.ng</span>
            </footer>

            <span v-if="verifiedPulse" class="verified-flash" aria-live="polite">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
              VERIFIED
            </span>
          </section>

          <!-- BACK -->
          <section class="card-face card-back" :aria-hidden="!flipped">
            <div class="card-wash card-wash-back" aria-hidden="true"></div>
            <div class="card-texture" aria-hidden="true"></div>
            <div class="card-shine" :style="shineStyles" aria-hidden="true"></div>
            <div class="card-glare" aria-hidden="true"></div>

            <header class="back-header">
              <Logo :size="30" />
              <div>
                <strong>McPherson University</strong>
                <span>Citadel of Champions</span>
              </div>
            </header>

            <div class="back-body">
              <div class="qr-tile" aria-label="Card verification code">
                <div class="qr-grid" aria-hidden="true">
                  <span v-for="(cell, index) in qrPattern" :key="index" :class="{ filled: cell }"></span>
                </div>
                <small>{{ registrationCode }}</small>
              </div>

              <div class="back-copy">
                <span class="back-label">CAMPUS SUPPORT</span>
                <p>ICT Helpdesk</p>
                <a href="mailto:ict@mcu.edu.ng" @click.stop>ict@mcu.edu.ng</a>
                <p class="back-note">
                  This card remains university property and is valid only while the holder is actively registered.
                </p>
              </div>
            </div>

            <div class="barcode" aria-hidden="true">
              <span
                v-for="(bar, index) in barcodeBars"
                :key="index"
                :style="{ width: `${bar.width}px`, opacity: bar.opacity }"
              ></span>
            </div>
          </section>
        </div>

        <button
          v-arc="{ lift: 8, distance: 10 }"
          type="button"
          class="flip-button"
          :aria-label="flipped ? 'Show front of ID card' : 'Show back of ID card'"
          :aria-pressed="flipped"
          @click.stop="toggleFlip"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          {{ flipped ? 'Front' : 'Back' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Logo from './Logo.vue'
import campusImage from '../assets/mcu-campus.jpg'

const props = defineProps({
  student: {
    type: Object,
    default: () => ({
      name: 'Student',
      matricNo: 'MCU/—',
      department: 'Computer Science',
      level: '300 Level',
      validUntil: '2028/08/31',
      role: 'student',
      avatarUrl: '',
    }),
  },
  photo: { type: String, default: '' },
  faceImage: { type: String, default: '' },
  autoFlip: { type: Boolean, default: false },
})

const flipped = ref(false)
const cardRef = ref(null)
const hovering = ref(false)
const pressed = ref(false)
const verifiedPulse = ref(false)
const rotateX = ref(0)
const rotateY = ref(0)
const shineX = ref(50)
const shineY = ref(50)
const scrollOffset = ref(0)

const reduceMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const BASE_LIFT = -30

let targetOffset = 0
let currentOffset = 0
let scrollFrame = 0
let lerpFrame = 0
let pulseTimer = 0
let autoFlipTimer = 0

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const displayFace = computed(() => props.photo || props.faceImage || props.student.avatarUrl || '')
const initials = computed(() => {
  const parts = String(props.student.name || 'Student').trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'MCU'
})
const isStaff = computed(() => ['admin', 'super_admin', 'lecturer'].includes(props.student.role))
const cardLabel = computed(() => (isStaff.value ? 'Staff Identity Card' : 'Student Identity Card'))
const registrationCode = computed(() => {
  const raw = String(props.student.matricNo || '').replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()
  return `MCU-${raw || 'CARD'}`
})

const qrPattern = computed(() => {
  const seedText = `${props.student.matricNo || ''}${props.student.name || ''}`
  const seed = [...seedText].reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0)
  const size = 11

  const inFinder = (x, y, ox, oy) => x >= ox && x < ox + 3 && y >= oy && y < oy + 3
  const finderFilled = (x, y, ox, oy) => {
    const lx = x - ox
    const ly = y - oy
    return lx === 0 || ly === 0 || lx === 2 || ly === 2 || (lx === 1 && ly === 1)
  }

  return Array.from({ length: size * size }, (_, index) => {
    const x = index % size
    const y = Math.floor(index / size)
    if (inFinder(x, y, 0, 0)) return finderFilled(x, y, 0, 0)
    if (inFinder(x, y, size - 3, 0)) return finderFilled(x, y, size - 3, 0)
    if (inFinder(x, y, 0, size - 3)) return finderFilled(x, y, 0, size - 3)
    return Math.sin(seed + index * 1.7) * 0.5 + 0.5 > 0.54
  })
})

const barcodeBars = computed(() => {
  const seed = String(props.student.matricNo || 'MCU').charCodeAt(0) || 77
  return Array.from({ length: 42 }, (_, index) => ({
    width: 1 + ((seed + index * 7) % 3),
    opacity: 0.45 + (((seed + index * 11) % 5) / 10),
  }))
})

/* The card rests slightly higher than its layout box, then drifts with scroll
   and eases back to that same resting point as the page scrolls back. */
const floatStyles = computed(() => {
  const lift = reduceMotion ? -20 : BASE_LIFT + scrollOffset.value
  return { transform: `translate3d(0, ${lift.toFixed(2)}px, 0)` }
})

const innerStyles = computed(() => {
  if (reduceMotion) return {}

  if (flipped.value) {
    return {
      transform: `rotateX(0deg) rotateY(180deg) translateZ(8px)`,
      transition: 'transform 680ms cubic-bezier(0.16, 1, 0.3, 1)',
    }
  }

  if (hovering.value || pressed.value) {
    const depth = pressed.value ? 4 : 11
    return {
      transform: `rotateX(${rotateX.value.toFixed(2)}deg) rotateY(${rotateY.value.toFixed(2)}deg) translateZ(${depth}px)`,
      transition: pressed.value ? 'transform 120ms ease' : 'transform 90ms ease-out',
    }
  }

  return {
    transform: 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
    transition: 'transform 620ms cubic-bezier(0.16, 1, 0.3, 1)',
  }
})

const shineStyles = computed(() => {
  if (reduceMotion || !hovering.value || flipped.value) return { opacity: 0 }
  return {
    opacity: 0.65,
    background: `radial-gradient(circle at ${shineX.value.toFixed(1)}% ${shineY.value.toFixed(1)}%, rgba(255,255,255,0.34), rgba(249,172,138,0.16) 38%, transparent 70%)`,
  }
})

function measureScroll() {
  if (!cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  const viewport = window.innerHeight || 1
  const centre = rect.top + rect.height / 2
  targetOffset = clamp((centre - viewport / 2) * 0.07, -46, 46)
}

function runLerp() {
  if (lerpFrame || reduceMotion) return
  const step = () => {
    const diff = targetOffset - currentOffset
    currentOffset += diff * 0.14
    scrollOffset.value = Math.abs(diff) > 0.2 ? currentOffset : targetOffset

    if (Math.abs(diff) > 0.2) {
      lerpFrame = requestAnimationFrame(step)
    } else {
      currentOffset = targetOffset
      scrollOffset.value = targetOffset
      lerpFrame = 0
    }
  }
  lerpFrame = requestAnimationFrame(step)
}

function onScroll() {
  if (scrollFrame || reduceMotion) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    measureScroll()
    runLerp()
  })
}

function onResize() {
  if (reduceMotion) return
  measureScroll()
  runLerp()
}

function handlePointerMove(event) {
  if (reduceMotion || !cardRef.value || event.pointerType === 'touch') return
  hovering.value = true
  const rect = cardRef.value.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const px = clamp((event.clientX - rect.left) / rect.width, 0, 1)
  const py = clamp((event.clientY - rect.top) / rect.height, 0, 1)
  shineX.value = px * 100
  shineY.value = py * 100
  rotateX.value = (0.5 - py) * 17
  rotateY.value = (px - 0.5) * 21
  // Origin awareness: the card pivots from the point being touched.
  cardRef.value.style.setProperty('--origin-x', `${(px * 100).toFixed(1)}%`)
  cardRef.value.style.setProperty('--origin-y', `${(py * 100).toFixed(1)}%`)
}

function handlePointerLeave() {
  hovering.value = false
  pressed.value = false
  rotateX.value = 0
  rotateY.value = 0
}

function handlePointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  pressed.value = true
}

function handlePointerUp() {
  pressed.value = false
}

function toggleFlip() {
  flipped.value = !flipped.value
  rotateX.value = 0
  rotateY.value = 0
}

function celebrate() {
  if (reduceMotion) return
  verifiedPulse.value = true
  window.clearTimeout(pulseTimer)
  pulseTimer = window.setTimeout(() => {
    verifiedPulse.value = false
  }, 1400)
}

onMounted(() => {
  if (reduceMotion) return
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  measureScroll()
  currentOffset = targetOffset
  scrollOffset.value = targetOffset

  if (props.autoFlip) {
    autoFlipTimer = window.setTimeout(() => {
      flipped.value = true
      autoFlipTimer = window.setTimeout(() => {
        flipped.value = false
      }, 1500)
    }, 700)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  if (lerpFrame) cancelAnimationFrame(lerpFrame)
  window.clearTimeout(pulseTimer)
  window.clearTimeout(autoFlipTimer)
})
</script>

<style scoped>
.campus-id-card {
  width: 100%;
  perspective: 1400px;
  transform-style: preserve-3d;
  -webkit-tap-highlight-color: transparent;
}

.card-float {
  transform-style: preserve-3d;
  scale: 1;
  transition: scale 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

/* Squash on press, rubber-band release. */
.campus-id-card.is-pressed .card-float {
  scale: 0.985 0.968;
  transition: scale 110ms ease-out;
}

.card-shell {
  position: relative;
  width: 100%;
  padding-bottom: 46px;
  animation: cardIdle 7s ease-in-out infinite;
}

.campus-id-card.is-hovered .card-shell,
.campus-id-card.is-pressed .card-shell {
  animation-play-state: paused;
}

.card-shell::after {
  position: absolute;
  right: 9%;
  bottom: 34px;
  left: 9%;
  height: 16px;
  border-radius: 50%;
  background: rgba(36, 53, 42, 0.24);
  filter: blur(12px);
  content: '';
  transform: translateZ(-40px) scale(0.94);
  /* Follow-through: the secondary shadow settles after the card itself. */
  transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1) 90ms, opacity 420ms ease 90ms;
}

.campus-id-card.is-hovered .card-shell::after {
  opacity: 0.7;
  transform: translateZ(-40px) scale(1.02);
}

.card-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 1.586;
  min-height: 208px;
  border-radius: 18px;
  cursor: pointer;
  transform-origin: var(--origin-x, 50%) var(--origin-y, 50%);
  transform-style: preserve-3d;
  will-change: transform;
}

.card-inner:focus-visible {
  outline: 2px solid #c87958;
  outline-offset: 4px;
}

.card-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 18px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow:
    0 24px 48px rgba(36, 53, 42, 0.28),
    0 6px 14px rgba(36, 53, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -2px 0 rgba(36, 53, 42, 0.5),
    0 0 0 1px rgba(249, 172, 138, 0.22);
  transform: translateZ(0);
}

.card-front,
.card-back {
  background: linear-gradient(155deg, #31543b 0%, #24352a 48%, #1d2c23 100%);
  color: #faf7ef;
}

.card-back {
  transform: rotateY(180deg);
}

.card-texture {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image:
    repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.024) 0 1px, transparent 1px 5px),
    radial-gradient(circle at 20% 80%, rgba(61, 104, 75, 0.12), transparent 46%);
  opacity: 0.8;
  pointer-events: none;
}

.campus-watermark {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.14;
  filter: grayscale(0.7);
}

.card-wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 88% 8%, rgba(249, 172, 138, 0.24), transparent 32%),
    linear-gradient(120deg, rgba(36, 53, 42, 0.78), rgba(36, 53, 42, 0.92));
}

.card-wash-back {
  background:
    radial-gradient(circle at 12% 86%, rgba(249, 172, 138, 0.2), transparent 34%),
    linear-gradient(120deg, rgba(36, 53, 42, 0.94), rgba(36, 53, 42, 0.88));
}

.card-shine {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
}

.card-glare {
  position: absolute;
  top: -30%;
  bottom: -30%;
  left: -45%;
  z-index: 5;
  width: 38%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  pointer-events: none;
  transform: skewX(-16deg) translateX(-60%);
}

.campus-id-card.is-hovered .card-glare {
  animation: cardGlare 1050ms cubic-bezier(0.16, 1, 0.3, 1) 1;
}

.card-header,
.card-footer,
.card-main,
.back-header,
.back-body,
.barcode {
  position: relative;
  z-index: 2;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(249, 172, 138, 0.2);
}

.header-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.header-copy strong {
  font-family: var(--font-display, Georgia, serif);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.header-copy span {
  color: rgba(226, 232, 240, 0.62);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.active-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 4px 8px;
  border: 1px solid rgba(52, 211, 153, 0.28);
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.12);
  color: #6ee7b7;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.active-pill i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.16);
  animation: cardPulse 2.4s ease-in-out infinite;
}

.card-main {
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 0;
  padding: 12px 16px;
}

.portrait {
  position: relative;
  width: 74px;
  height: 88px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 2px solid rgba(249, 172, 138, 0.55);
  border-radius: 12px;
  background: linear-gradient(150deg, rgba(248, 250, 252, 0.94), rgba(203, 213, 225, 0.86));
  color: #24352a;
  font-family: var(--font-display, Georgia, serif);
  font-size: 25px;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait small {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 2px 0;
  background: rgba(36, 53, 42, 0.86);
  color: #c87958;
  font-family: inherit;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-align: center;
}

.identity {
  min-width: 0;
  flex: 1;
}

.identity-label,
.back-label {
  color: rgba(249, 172, 138, 0.86);
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.identity h3 {
  margin: 3px 0 2px;
  overflow: hidden;
  font-family: var(--font-display, Georgia, serif);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-id {
  margin-bottom: 8px;
  color: #c87958;
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.identity-details {
  display: grid;
  grid-template-columns: 1.35fr 0.65fr 0.9fr;
  gap: 8px;
  margin: 0;
}

.identity-details div {
  min-width: 0;
}

.identity-details dt {
  color: rgba(226, 232, 240, 0.42);
  font-size: 6px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.identity-details dd {
  margin: 2px 0 0;
  overflow: hidden;
  color: rgba(248, 250, 252, 0.92);
  font-size: 8px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding: 8px 16px 10px;
  border-top: 1px solid rgba(249, 172, 138, 0.16);
  color: rgba(226, 232, 240, 0.5);
  font-size: 7px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-tech {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.card-chip {
  position: relative;
  width: 24px;
  height: 17px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: linear-gradient(135deg, #c87958, #b45f3e 52%, #c87958);
  box-shadow: inset 0 0 0 1px rgba(36, 53, 42, 0.22);
}

.card-chip::before,
.card-chip::after {
  position: absolute;
  content: '';
  background: rgba(36, 53, 42, 0.34);
}

.card-chip::before {
  top: 5px;
  right: 2px;
  left: 2px;
  height: 1px;
}

.card-chip::after {
  top: 3px;
  bottom: 3px;
  left: 8px;
  width: 1px;
}

.card-hologram {
  width: 17px;
  height: 17px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 50%;
  background: conic-gradient(from 40deg, #c87958, #3d684b, #ffffff, #c87958);
  box-shadow: 0 0 10px rgba(61, 104, 75, 0.3);
}

.card-nfc {
  position: relative;
  width: 17px;
  height: 17px;
  transform: rotate(-90deg);
}

.card-nfc::before,
.card-nfc::after {
  position: absolute;
  top: 50%;
  left: 2px;
  border: 1.5px solid rgba(249, 172, 138, 0.85);
  border-left-color: transparent;
  border-radius: 50%;
  content: '';
  transform: translateY(-50%);
}

.card-nfc::before { width: 11px; height: 11px; }
.card-nfc::after { width: 17px; height: 17px; left: -1px; opacity: 0.6; }

.verified-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border: 1px solid rgba(52, 211, 153, 0.45);
  border-radius: 999px;
  background: rgba(36, 53, 42, 0.84);
  color: #6ee7b7;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.18em;
  backdrop-filter: blur(8px);
  animation: verifiedPop 1400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform: translate(-50%, -50%);
}

.verified-flash svg {
  width: 14px;
  height: 14px;
}

.back-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(249, 172, 138, 0.2);
}

.back-header div {
  display: grid;
  gap: 2px;
}

.back-header strong {
  font-family: var(--font-display, Georgia, serif);
  font-size: 12px;
  font-weight: 600;
}

.back-header span {
  color: rgba(226, 232, 240, 0.56);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.back-body {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
}

.qr-tile {
  display: grid;
  justify-items: center;
  gap: 5px;
  flex: 0 0 auto;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 0.5px;
  width: 76px;
  height: 76px;
  padding: 5px;
  border-radius: 8px;
  background: #faf7ef;
}

.qr-grid span {
  border-radius: 0.4px;
}

.qr-grid span.filled {
  background: #24352a;
}

.qr-tile small {
  color: rgba(249, 172, 138, 0.8);
  font-family: var(--font-mono, monospace);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.back-copy {
  min-width: 0;
}

.back-copy p {
  margin: 5px 0 1px;
  color: rgba(248, 250, 252, 0.92);
  font-size: 9px;
  font-weight: 700;
}

.back-copy a {
  color: #c87958;
  font-size: 9px;
  font-weight: 650;
  text-decoration: none;
}

.back-copy a:hover {
  text-decoration: underline;
}

.back-note {
  max-width: 180px;
  color: rgba(226, 232, 240, 0.48) !important;
  font-size: 7px !important;
  font-weight: 500 !important;
  line-height: 1.5;
}

.barcode {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 28px;
  margin: 0 16px 14px;
  padding: 6px 8px 0;
  border-radius: 6px;
  background: rgba(248, 250, 252, 0.06);
}

.barcode span {
  height: 18px;
  border-radius: 1px;
  background: rgba(248, 250, 252, 0.86);
}

.flip-button {
  position: absolute;
  right: 12px;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid rgba(249, 172, 138, 0.34);
  border-radius: 999px;
  background: rgba(36, 53, 42, 0.72);
  color: #c87958;
  font-family: inherit;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.08em;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: transform 160ms ease, background 160ms ease;
}

.flip-button svg {
  width: 12px;
  height: 12px;
}

.flip-button:hover {
  background: rgba(36, 53, 42, 0.92);
  transform: translateY(-1px);
}

.flip-button:active { transform: translateY(0) scale(0.96); }

.flip-button:focus-visible {
  outline: 2px solid #c87958;
  outline-offset: 2px;
}

@keyframes cardIdle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes cardGlare {
  0% { transform: skewX(-16deg) translateX(-60%); opacity: 0; }
  18% { opacity: 1; }
  100% { transform: skewX(-16deg) translateX(360%); opacity: 0; }
}

@keyframes cardPulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.14); }
  50% { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0.02); }
}

@keyframes verifiedPop {
  0% { opacity: 0; transform: translate(-50%, -42%) scale(0.86); }
  18% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
  30% { transform: translate(-50%, -50%) scale(1); }
  78% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -58%) scale(0.96); }
}

@media (max-width: 520px) {
  .card-inner { min-height: 196px; }
  .card-header { padding: 10px 12px 8px; }
  .card-main { gap: 10px; padding: 10px 12px; }
  .portrait { width: 60px; height: 72px; font-size: 21px; }
  .identity h3 { font-size: 15px; }
  .identity-details { grid-template-columns: 1fr 1fr; }
  .identity-details div:last-child { display: none; }
  .card-place { display: none; }
  .back-body { gap: 10px; padding: 10px 12px; }
  .qr-grid { width: 64px; height: 64px; }
  .back-note { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .card-shell,
  .card-inner,
  .card-shine,
  .card-glare,
  .flip-button,
  .active-pill i { animation: none !important; transition: none !important; }
  .card-shine,
  .card-glare { display: none !important; }
}
</style>
