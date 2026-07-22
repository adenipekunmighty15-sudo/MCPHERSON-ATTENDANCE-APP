<template>
  <div class="id-card-wrap" ref="cardRef" @click="onCardClick"
    @mousemove="!flipped && onCardMove($event)" @mouseleave="onCardLeave">
    <div class="id-aura"></div>
    <div class="id-tilt" ref="tiltRef">
      <div class="id-flipper" :class="{ flipped }">
        <div class="id-front">
          <div class="id-shine"></div>
          <div class="id-stripe"></div>
          <div class="id-top">
            <div class="id-top-left">
              <GraduationCap class="w-[14px] h-[14px]" />
              <span>McPherson University</span>
            </div>
            <span class="id-year">{{ currentYear }}</span>
          </div>
          <div class="id-body">
            <div class="id-photo">
              <div class="id-avatar" :style="{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }">
                <span v-if="!avatarUrl">{{ avatarLetter }}</span>
              </div>
            </div>
            <div class="id-info">
              <div class="id-name">{{ fullName }}</div>
              <div class="id-student-id">{{ studentId }}</div>
              <div class="id-row"><span>Programme</span><span>{{ department }}</span></div>
              <div class="id-row"><span>Level</span><span>{{ level }}00</span></div>
              <div class="id-row"><span>Expires</span><span>{{ expiryYear }}</span></div>
            </div>
          </div>
          <div class="id-footer">
            <span>Student ID Card</span>
            <span>MCU</span>
          </div>
        </div>
        <div class="id-back">
          <div class="id-back-stripe"></div>
          <div class="id-back-body">
            <div class="id-back-top">
              <GraduationCap class="w-[14px] h-[14px]" />
              <span>McPherson University</span>
            </div>
            <div class="id-back-main">
              <div class="id-qr">
                <div class="id-qr-grid">
                  <div v-for="n in 121" :key="n" class="id-qr-cell" :class="qrPattern[n-1] ? 'active' : ''"></div>
                </div>
                <span class="id-qr-label">{{ studentId }}</span>
              </div>
              <div class="id-back-details">
                <div class="id-holo">
                  <div class="id-holo-shine"></div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
                <div class="id-signature">
                  <span>Authorised Signature</span>
                  <div class="id-sig-line"></div>
                </div>
              </div>
            </div>
            <div class="id-barcode">
              <div v-for="n in 40" :key="n" class="id-bar" :style="{ width: (Math.sin(n*2.3)*0.3+0.7)*2+'px' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { GraduationCap } from 'lucide-vue-next';
import gsap from 'gsap';

const authStore = useAuthStore();

const flipped = ref(false);
const cardRef = ref(null);
const tiltRef = ref(null);
let spinTween = null;
let bobTween = null;
let tiltTween = null;
let floatTween = null;

/* ── USER DATA ── */
const fullName = computed(() => authStore.user?.name || 'Student Name');
const department = computed(() => authStore.user?.department || 'Computer Science');
const studentId = computed(() => {
  const id = authStore.user?.id || '';
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : 'MCU' + id.slice(0, 5);
});
const avatarLetter = computed(() => (authStore.user?.name?.charAt(0) || 'S').toUpperCase());
const avatarUrl = computed(() => '');
const level = computed(() => 3);

/* ── DATE ── */
const now = new Date();
const currentYear = now.getFullYear();
const expiryYear = currentYear + 4;

/* ── QR CODE ── */
const qrPattern = ref([]);
function generateQR() {
  const seed = studentId.value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const arr = [];
  for (let i = 0; i < 121; i++) {
    arr.push(Math.sin(seed + i * 1.7) * 0.5 + 0.5 > 0.5);
  }
  qrPattern.value = arr;
}
generateQR();

/* ── CARD ANIMATION: idle spin + user tilt, no conflicts ── */
function stopSpin() {
  if (spinTween) { spinTween.kill(); spinTween = null; }
  if (bobTween) { bobTween.kill(); bobTween = null; }
}

function startSpin() {
  if (!tiltRef.value || flipped.value) return;
  stopSpin();
  spinTween = gsap.to(tiltRef.value, {
    rotationY: '+=360',
    duration: 10,
    ease: 'none',
    repeat: -1,
    modifiers: { rotationY: (v) => parseFloat(v) % 360 },
  });
  bobTween = gsap.to(tiltRef.value, {
    rotationX: 3,
    duration: 4,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

function onCardMove(e) {
  if (!cardRef.value || flipped.value) return;
  stopSpin();
  if (tiltTween) tiltTween.kill();
  const rect = cardRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const px = ((e.clientX - cx) / rect.width) * 2;
  const py = ((e.clientY - cy) / rect.height) * 2;
  tiltTween = gsap.to(tiltRef.value, {
    rotationX: -py * 12,
    rotationY: px * 12,
    duration: 0.5,
    ease: 'power3.out',
    overwrite: 'auto',
  });
}

function onCardLeave() {
  if (flipped.value) return;
  if (tiltTween) tiltTween.kill();
  gsap.to(tiltRef.value, {
    rotationX: 0, rotationY: 0,
    duration: 0.6, ease: 'power3.out',
    onComplete: () => { if (!flipped.value) startSpin(); },
  });
}

function onCardClick() {
  flipped.value = !flipped.value;
  stopSpin();
  if (tiltTween) tiltTween.kill();
  if (flipped.value) {
    gsap.to(tiltRef.value, { rotationY: 180, duration: 0.7, ease: 'power2.inOut' });
  } else {
    gsap.to(tiltRef.value, { rotationY: 0, duration: 0.7, ease: 'power2.inOut', onComplete: startSpin });
  }
}

onMounted(() => {
  if (cardRef.value) {
    floatTween = gsap.to(cardRef.value, { y: 5, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }
  startSpin();
});

onUnmounted(() => {
  if (floatTween) floatTween.kill();
  stopSpin();
  if (tiltTween) tiltTween.kill();
});
</script>

<style scoped>
/* ID Card - 3D Gliding Experience */
.id-card-wrap {
  width: 100%;
  min-width: 0;
  height: 280px;
  border-radius: 14px;
  cursor: pointer;
  perspective: 1200px;
  flex-shrink: 0;
  position: relative;
}

.id-card-wrap::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(30,64,175,0.15), rgba(217,119,6,0.1), rgba(30,64,175,0.05));
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
  filter: blur(6px);
}

.id-card-wrap:hover::before {
  opacity: 1;
}

.id-tilt {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
  backface-visibility: hidden;
}

.id-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.id-front, .id-back {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  backface-visibility: hidden;
  overflow: hidden;
}

.id-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 140%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.2), rgba(217,119,6,0.08), transparent 70%);
  filter: blur(40px);
  z-index: -1;
  animation: auraPulse 3.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes auraPulse {
  0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
}

.id-front {
  background: linear-gradient(160deg, #1a2744, #14203d 50%, #0e1a35);
  border: 1px solid rgba(59, 130, 246, 0.15);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 30px rgba(30, 64, 175, 0.1) inset;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
}

.id-back {
  background: linear-gradient(160deg, #0e1a35, #14203d 50%, #0c162e);
  border: 1px solid rgba(59, 130, 246, 0.12);
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
}

.id-shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  mix-blend-mode: overlay;
}

.id-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 5px;
  background: linear-gradient(90deg, transparent, rgba(96,165,250,0.15), transparent);
  z-index: 3;
}

.id-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(96,165,250,0.06);
  position: relative;
  z-index: 1;
  margin-top: 5px;
}

.id-top-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  font-weight: 600;
  color: rgba(96,165,250,0.7);
  letter-spacing: 0.5px;
}

.id-year {
  font-size: 8px;
  font-weight: 500;
  color: rgba(96,165,250,0.35);
}

.id-body {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.id-photo {
  flex-shrink: 0;
}

.id-avatar {
  width: 52px;
  height: 62px;
  border-radius: 8px;
  background: rgba(96,165,250,0.06);
  border: 1px solid rgba(96,165,250,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: rgba(96,165,250,0.25);
  background-size: cover;
  background-position: center 20%;
}

.id-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.id-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
  margin-bottom: 1px;
}

.id-student-id {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: 600;
  color: rgba(96,165,250,0.7);
  letter-spacing: 1.5px;
  margin-bottom: 3px;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  line-height: 1.4;
}

.id-row span:first-child {
  font-weight: 500;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 50px;
  flex-shrink: 0;
}

.id-row span:last-child {
  font-weight: 500;
  color: rgba(255,255,255,0.6);
}

.id-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 14px 6px;
  border-top: 1px solid rgba(96,165,250,0.06);
  font-size: 7px;
  color: rgba(255,255,255,0.15);
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
}

/* Back */
.id-back-stripe {
  height: 8px;
  background: linear-gradient(90deg, #1a1a2e, #2a2a4e 20%, #1a1a2e 40%, #2a2a4e 60%, #1a1a2e 80%, #2a2a4e);
  flex-shrink: 0;
  border-bottom: 1px solid rgba(96,165,250,0.06);
}

.id-back-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  gap: 6px;
}

.id-back-top {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
  font-weight: 600;
  color: rgba(96,165,250,0.5);
  letter-spacing: 0.5px;
}

.id-back-main {
  flex: 1;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.id-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.id-qr-grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 0.5px;
  width: 68px;
  height: 68px;
  background: #fff;
  border-radius: 6px;
  padding: 4px;
}

.id-qr-cell {
  border-radius: 0.3px;
}

.id-qr-cell.active {
  background: #1a1a2e;
}

.id-qr-label {
  font-size: 6px;
  font-family: 'Courier New', monospace;
  color: rgba(96,165,250,0.35);
  letter-spacing: 1px;
}

.id-back-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.id-holo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.08), rgba(255,255,255,0.1));
  border: 1px solid rgba(96,165,250,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  align-self: flex-end;
}

.id-holo-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  animation: holoShift 3s ease-in-out infinite;
}

@keyframes holoShift {
  0%, 100% { transform: translateX(-30px) rotate(-20deg); }
  50% { transform: translateX(30px) rotate(-20deg); }
}

.id-signature {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
}

.id-signature span {
  font-size: 5px;
  font-weight: 600;
  color: rgba(96,165,250,0.25);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.id-sig-line {
  height: 10px;
  background: repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgba(96,165,250,0.15) 2px, rgba(96,165,250,0.15) 4px, transparent 4px, transparent 6px, rgba(96,165,250,0.2) 6px, rgba(96,165,250,0.2) 8px);
  border-radius: 1px;
  mask-image: linear-gradient(90deg, transparent 2%, black 10%, black 90%, transparent 98%);
  -webkit-mask-image: linear-gradient(90deg, transparent 2%, black 10%, black 90%, transparent 98%);
}

.id-barcode {
  display: flex;
  align-items: center;
  gap: 1px;
  height: 18px;
  padding: 0 4px;
  background: rgba(96,165,250,0.03);
  border-radius: 3px;
}

.id-bar {
  height: 12px;
  background: rgba(96,165,250,0.4);
  border-radius: 0.5px;
  flex-shrink: 0;
}

/* ── RESPONSIVE ── */
@media (max-width: 1280px) {
  .id-card-wrap { height: 240px; }
  .id-avatar { width: 44px; height: 54px; font-size: 17px; }
  .id-name { font-size: 13px; }
}

@media (max-width: 768px) {
  .id-card-wrap { height: 200px; }
  .id-body { padding: 0 10px; gap: 10px; }
  .id-photo { display: none; }
  .id-name { font-size: 12px; }
  .id-student-id { font-size: 8px; }
  .id-row { font-size: 7px; }
  .id-row span:first-child { width: 42px; }
  .id-avatar { width: 44px; height: 54px; font-size: 17px; }
  .id-qr-grid { width: 56px; height: 56px; padding: 3px; }
  .id-back-details { gap: 4px; }
  .id-holo { width: 32px; height: 32px; }
  .id-barcode { height: 14px; }
  .id-bar { height: 10px; }
}

@media (max-width: 480px) {
  .id-card-wrap { height: 170px; border-radius: 10px; }
  .id-avatar { width: 36px; height: 44px; font-size: 14px; }
  .id-name { font-size: 11px; }
  .id-student-id { font-size: 7px; letter-spacing: 1px; }
  .id-row { font-size: 6px; }
  .id-row span:first-child { width: 36px; }
  .id-footer { font-size: 6px; padding: 3px 10px 4px; }
  .id-top { padding: 6px 10px; }
  .id-top-left { font-size: 8px; }
  .id-year { font-size: 7px; }
  .id-qr-grid { width: 48px; height: 48px; padding: 2px; gap: 0.3px; }
  .id-qr-label { font-size: 5px; }
  .id-back-body { padding: 6px 10px; gap: 4px; }
  .id-holo { width: 28px; height: 28px; }
  .id-holo svg { width: 18px; height: 18px; }
  .id-barcode { height: 12px; }
  .id-bar { height: 8px; }
  .id-signature span { font-size: 4px; }
}
</style>
