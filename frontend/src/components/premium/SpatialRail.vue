<template>
  <section class="spatial-rail" aria-labelledby="spatial-rail-title">
    <div class="spatial-rail-head">
      <div>
        <span class="spatial-rail-kicker">{{ kicker }}</span>
        <h2 id="spatial-rail-title">{{ title }}</h2>
      </div>
      <div class="spatial-rail-controls">
        <button type="button" aria-label="Previous card" @click="step(-1)">
          <ArrowLeft :size="17" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Next card" @click="step(1)">
          <ArrowRight :size="17" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div
      ref="track"
      class="spatial-rail-track"
      tabindex="0"
      role="region"
      aria-label="Spatial card browser. Use arrow keys or swipe to browse."
      @scroll.passive="scheduleActive"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown.left.prevent="step(-1)"
      @keydown.right.prevent="step(1)"
    >
      <article
        v-for="(item, index) in items"
        :key="item.title"
        class="spatial-rail-item"
        :class="{ 'is-active': active === index }"
      >
        <div class="rail-card" v-tilt="{ max: 5 }" v-spotlight v-ripple>
          <span class="rail-card-top">
            <span class="rail-icon" :class="`tone-${item.tone || 'navy'}`">
              <component :is="item.icon" :size="19" aria-hidden="true" />
            </span>
            <span class="rail-index">{{ String(index + 1).padStart(2, '0') }}</span>
          </span>
          <span class="rail-kicker">{{ item.kicker || 'PORTAL FEATURE' }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
          <span class="rail-foot">
            <span class="rail-line" aria-hidden="true" />
            <span>{{ item.meta || 'Explore' }}</span>
            <ArrowUpRight :size="14" aria-hidden="true" />
          </span>
        </div>
      </article>
    </div>

    <div class="spatial-rail-dots" role="tablist" aria-label="Choose a card">
      <button
        v-for="(item, index) in items"
        :key="`dot-${item.title}`"
        type="button"
        role="tab"
        :aria-selected="active === index"
        :aria-label="`Show card ${index + 1}: ${item.title}`"
        :class="{ active: active === index }"
        @click="goTo(index)"
      />
    </div>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-vue-next'

defineProps({
  kicker: { type: String, default: 'EXPLORE THE PORTAL' },
  title: { type: String, default: 'Move through your campus day' },
  items: { type: Array, default: () => [] },
})

const track = ref(null)
const active = ref(0)
let pointerDown = false
let startX = 0
let startScroll = 0
let activeFrame = 0

function scheduleActive() {
  if (activeFrame) return
  activeFrame = requestAnimationFrame(() => {
    activeFrame = 0
    updateActive()
  })
}

function updateActive() {
  const el = track.value
  if (!el) return
  const centre = el.scrollLeft + el.clientWidth / 2
  let closest = 0
  let distance = Infinity
  Array.from(el.children).forEach((child, index) => {
    const childCentre = child.offsetLeft + child.offsetWidth / 2
    const delta = Math.abs(childCentre - centre)
    if (delta < distance) {
      distance = delta
      closest = index
    }
  })
  active.value = closest
}

function cardWidth() {
  const card = track.value?.querySelector('.spatial-rail-item')
  return card ? card.offsetWidth + 20 : 320
}

function step(direction) {
  track.value?.scrollBy({ left: direction * cardWidth(), behavior: 'smooth' })
}

function goTo(index) {
  const el = track.value
  const card = el?.children?.[index]
  if (!el || !card) return
  el.scrollTo({
    left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2,
    behavior: 'smooth',
  })
}

function onPointerDown(event) {
  if (event.pointerType === 'touch') return
  const el = track.value
  if (!el) return
  pointerDown = true
  startX = event.clientX
  startScroll = el.scrollLeft
  el.classList.add('is-dragging')
  el.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event) {
  if (!pointerDown) return
  const el = track.value
  if (!el) return
  el.scrollLeft = startScroll - (event.clientX - startX)
}

function onPointerUp(event) {
  if (!pointerDown) return
  pointerDown = false
  const el = track.value
  el?.classList.remove('is-dragging')
  el?.releasePointerCapture?.(event.pointerId)
}

onMounted(async () => {
  await nextTick()
  updateActive()
})

onBeforeUnmount(() => {
  if (activeFrame) cancelAnimationFrame(activeFrame)
})
</script>

<style scoped>
.spatial-rail-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.spatial-rail-kicker {
  display: block;
  margin-bottom: 7px;
  color: #b45f3e;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.spatial-rail-head h2 {
  margin: 0;
  color: #24352a;
  font-family: var(--font-display, Georgia, serif);
  font-size: clamp(24px, 3vw, 38px);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.spatial-rail-controls {
  display: flex;
  gap: 8px;
}

.spatial-rail-controls button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(36, 53, 42, 0.14);
  border-radius: 50%;
  background: #fff;
  color: #24352a;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease, transform 180ms ease, border-color 180ms ease;
}

.spatial-rail-controls button:hover {
  border-color: rgba(249, 172, 138, 0.5);
  background: #24352a;
  color: #c87958;
  transform: translateY(-2px);
}

.spatial-rail-track:focus-visible {
  outline: 2px solid rgba(249, 172, 138, 0.65);
  outline-offset: 4px;
  border-radius: 18px;
}

.rail-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.rail-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.rail-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(36, 53, 42, 0.07);
  color: #24352a;
}

.rail-icon.tone-gold {
  background: rgba(249, 172, 138, 0.16);
  color: #b45f3e;
}

.rail-icon.tone-blue {
  background: rgba(61, 104, 75, 0.14);
  color: #2b5f8f;
}

.rail-icon.tone-green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.rail-index {
  color: rgba(36, 53, 42, 0.2);
  font-family: var(--font-display, Georgia, serif);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.05em;
}

.rail-kicker {
  margin-bottom: 5px;
  color: #b45f3e;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.rail-card h3 {
  margin: 0;
  color: #24352a;
  font-family: var(--font-display, Georgia, serif);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.rail-card p {
  margin: 9px 0 20px;
  color: #718074;
  font-size: 11px;
  line-height: 1.6;
}

.rail-foot {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  color: #24352a;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.05em;
}

.rail-line {
  width: 18px;
  height: 1px;
  background: #c87958;
  transition: width 220ms ease;
}

.rail-card:hover .rail-line { width: 30px; }

.spatial-rail-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 2px;
}

.spatial-rail-dots button {
  width: 18px;
  height: 4px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(36, 53, 42, 0.16);
  cursor: pointer;
  transition: width 220ms ease, background 220ms ease;
}

.spatial-rail-dots button.active {
  width: 34px;
  background: #24352a;
}

@media (max-width: 640px) {
  .spatial-rail-head { align-items: flex-start; }
  .spatial-rail-controls { display: none; }
  .rail-card { padding: 17px; }
}
</style>
