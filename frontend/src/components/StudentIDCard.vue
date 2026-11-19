<template>
  <div
    ref="cardRef"
    class="campus-id-card"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <div class="card-shell">
      <div
        class="card-inner"
        :class="{ 'is-flipped': flipped }"
        :style="innerStyles"
        role="group"
        :aria-label="`${cardLabel} for ${student.name}`"
      >
        <!-- FRONT -->
        <section class="card-face card-front" :aria-hidden="flipped">
          <img class="campus-watermark" :src="campusImage" alt="" aria-hidden="true" />
          <div class="card-wash" aria-hidden="true"></div>
          <div class="card-shine" :style="shineStyles" aria-hidden="true"></div>

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
              <small>{{ student.role === 'admin' || student.role === 'super_admin' ? 'STAFF' : 'MCU' }}</small>
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
            <span>Seriki Sotayo · Ogun State</span>
            <span>mcu.edu.ng</span>
          </footer>
        </section>

        <!-- BACK -->
        <section class="card-face card-back" :aria-hidden="!flipped">
          <div class="card-wash card-wash-back" aria-hidden="true"></div>
          <div class="card-shine" :style="shineStyles" aria-hidden="true"></div>

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
        type="button"
        class="flip-button"
        :aria-label="flipped ? 'Show front of ID card' : 'Show back of ID card'"
        :aria-pressed="flipped"
        @click.stop="flipped = !flipped"
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
</template>

<script setup>
import { computed, ref } from 'vue'
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
const rotateX = ref(0)
const rotateY = ref(0)
const shineX = ref(50)
const shineY = ref(50)
const hovering = ref(false)
const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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

const innerStyles = computed(() => {
  if (reduceMotion) return {}
  if (flipped.value) {
    return { transform: 'rotateY(180deg) translateZ(6px)', transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)' }
  }
  if (hovering.value) {
    return {
      transform: `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) translateZ(8px)`,
      transition: 'transform 90ms ease-out',
    }
  }
  return { transform: 'rotateX(0deg) rotateY(0deg)', transition: 'transform 500ms cubic-bezier(0.25, 0.8, 0.25, 1)' }
})

const shineStyles = computed(() => {
  if (reduceMotion || !hovering.value || flipped.value) return { opacity: 0 }
  return {
    opacity: 0.5,
    background: `radial-gradient(circle at ${shineX.value}% ${shineY.value}%, rgba(255,255,255,0.28), rgba(212,175,55,0.12) 36%, transparent 68%)`,
  }
})

function handleMouseMove(event) {
  if (reduceMotion || !cardRef.value) return
  hovering.value = true
  const rect = cardRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  shineX.value = (x / rect.width) * 100
  shineY.value = (y / rect.height) * 100
  rotateX.value = -((y - rect.height / 2) / (rect.height / 2)) * 10
  rotateY.value = ((x - rect.width / 2) / (rect.width / 2)) * 10
}

function handleMouseLeave() {
  hovering.value = false
  rotateX.value = 0
  rotateY.value = 0
}

if (props.autoFlip && !reduceMotion) {
  flipped.value = true
  window.setTimeout(() => { flipped.value = false }, 1800)
}
</script>

<style scoped>
.campus-id-card {
  width: 100%;
  perspective: 1200px;
  -webkit-tap-highlight-color: transparent;
}

.card-shell {
  position: relative;
  width: 100%;
  padding-bottom: 42px;
}

.card-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 1.6;
  min-height: 220px;
  transform-style: preserve-3d;
  will-change: transform;
}

.card-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 18px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 18px 36px rgba(7, 17, 31, 0.24), 0 0 0 1px rgba(212, 175, 55, 0.28);
}

.card-front,
.card-back {
  background: linear-gradient(155deg, #142744 0%, #0b192c 48%, #07111f 100%);
  color: #f8fafc;
}

.card-back {
  transform: rotateY(180deg);
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
    radial-gradient(circle at 88% 8%, rgba(212, 175, 55, 0.24), transparent 32%),
    linear-gradient(120deg, rgba(11, 25, 44, 0.78), rgba(11, 25, 44, 0.92));
}

.card-wash-back {
  background:
    radial-gradient(circle at 12% 86%, rgba(212, 175, 55, 0.2), transparent 34%),
    linear-gradient(120deg, rgba(7, 17, 31, 0.94), rgba(11, 25, 44, 0.88));
}

.card-shine {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
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
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.header-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.header-copy strong {
  font-family: var(--font-display, Georgia, serif);
  font-size: 12px;
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
}

.card-main {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px 16px;
  min-height: 0;
}

.portrait {
  position: relative;
  width: 74px;
  height: 88px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 2px solid rgba(212, 175, 55, 0.55);
  border-radius: 12px;
  background: linear-gradient(150deg, rgba(248, 250, 252, 0.94), rgba(203, 213, 225, 0.86));
  color: #0b192c;
  font-family: var(--font-display, Georgia, serif);
  font-size: 25px;
  font-weight: 700;
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
  background: rgba(11, 25, 44, 0.86);
  color: #f2df9c;
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
  color: rgba(212, 175, 55, 0.86);
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
  color: #f2df9c;
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
  border-top: 1px solid rgba(212, 175, 55, 0.16);
  color: rgba(226, 232, 240, 0.5);
  font-size: 7px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.back-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.back-header div {
  display: grid;
  gap: 2px;
}

.back-header strong {
  font-family: var(--font-display, Georgia, serif);
  font-size: 12px;
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
  background: #f8fafc;
}

.qr-grid span {
  border-radius: 0.4px;
}

.qr-grid span.filled {
  background: #0b192c;
}

.qr-tile small {
  color: rgba(242, 223, 156, 0.8);
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
  color: #f2df9c;
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
  border: 1px solid rgba(212, 175, 55, 0.34);
  border-radius: 999px;
  background: rgba(11, 25, 44, 0.72);
  color: #f2df9c;
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
  background: rgba(11, 25, 44, 0.92);
  transform: translateY(-1px);
}

.flip-button:focus-visible {
  outline: 2px solid #d4af37;
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .card-inner { min-height: 200px; }
  .card-header { padding: 10px 12px 8px; }
  .card-main { gap: 10px; padding: 10px 12px; }
  .portrait { width: 60px; height: 72px; font-size: 21px; }
  .identity h3 { font-size: 15px; }
  .identity-details { grid-template-columns: 1fr 1fr; }
  .identity-details div:last-child { display: none; }
  .back-body { gap: 10px; padding: 10px 12px; }
  .qr-grid { width: 64px; height: 64px; }
  .back-note { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .card-inner,
  .card-shine,
  .flip-button { transition: none !important; }
  .card-shine { display: none; }
}
</style>
