<template>
  <figure class="spatial-image" :class="{ 'is-loaded': loaded }" v-tilt="{ max: 10 }" v-spotlight>
    <div class="spatial-image-frame">
      <img
        :src="src"
        :alt="alt"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        @load="loaded = true"
        @error="loaded = true"
      />
      <span class="spatial-image-skeleton" aria-hidden="true" />
      <span class="spatial-image-grid" aria-hidden="true" />
      <span class="spatial-image-sheen" aria-hidden="true" />
      <span class="spatial-image-vignette" aria-hidden="true" />

      <div class="spatial-image-top">
        <span class="spatial-image-eyebrow">{{ eyebrow }}</span>
        <span class="spatial-image-live"><i aria-hidden="true" /> {{ badge }}</span>
      </div>

      <div class="spatial-image-floats" aria-hidden="true">
        <span class="spatial-float float-one"><MapPin :size="13" /> {{ location }}</span>
        <span class="spatial-float float-two"><ShieldCheck :size="13" /> Verified portal</span>
      </div>

      <figcaption class="spatial-image-caption">
        <span class="caption-copy">
          <small>{{ kicker }}</small>
          <strong>{{ title }}</strong>
          <em>{{ caption }}</em>
        </span>
        <span class="caption-arrow" aria-hidden="true"><ArrowUpRight :size="18" /></span>
      </figcaption>
    </div>
  </figure>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowUpRight, MapPin, ShieldCheck } from 'lucide-vue-next'

const loaded = ref(false)

defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: 'McPherson University campus' },
  eyebrow: { type: String, default: 'MCU · CAMPUS' },
  badge: { type: String, default: 'LIVE' },
  location: { type: String, default: 'Seriki Sotayo' },
  kicker: { type: String, default: 'The Citadel of Champions' },
  title: { type: String, default: 'McPherson University' },
  caption: { type: String, default: 'Ogun State, Nigeria' },
})
</script>

<style scoped>
.spatial-image {
  margin: 0;
  width: 100%;
  perspective: 1200px;
}

.spatial-image-frame {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  border: 1px solid rgba(248, 250, 252, 0.18);
  border-radius: 26px;
  background: #010a2a;
  box-shadow:
    0 42px 90px rgba(1, 10, 42, 0.34),
    0 16px 34px rgba(1, 10, 42, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  transform-style: preserve-3d;
}

.spatial-image-frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.9) contrast(1.03);
  opacity: 0;
  transform: scale(1.07) translateZ(-24px);
  transition:
    transform 900ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 600ms ease,
    opacity 480ms ease;
}

.spatial-image.is-loaded .spatial-image-frame img {
  opacity: 1;
}

.spatial-image:hover .spatial-image-frame img {
  transform: scale(1.13) translateZ(-12px);
  filter: saturate(1.02) contrast(1.05);
}

.spatial-image-skeleton {
  position: absolute;
  inset: 0;
  z-index: 8;
  background-image: linear-gradient(100deg, #07133a 18%, #173566 40%, #0d2050 58%, #07133a 82%);
  background-size: 220% 100%;
  animation: spatialImageShimmer 1.35s linear infinite;
  transform: translateZ(90px);
  transition: opacity 480ms ease, visibility 480ms ease;
  pointer-events: none;
}

.spatial-image.is-loaded .spatial-image-skeleton {
  opacity: 0;
  visibility: hidden;
  animation: none;
}

@keyframes spatialImageShimmer {
  from { background-position: 120% 0; }
  to { background-position: -120% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .spatial-image-skeleton { animation: none; }
}

.spatial-image-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(248, 250, 252, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(248, 250, 252, 0.08) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), transparent 72%);
  opacity: 0.5;
  transform: translateZ(10px);
}

.spatial-image-sheen {
  position: absolute;
  top: -20%;
  bottom: -20%;
  left: -40%;
  width: 42%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.24), transparent);
  transform: translateX(-40%) skewX(-12deg);
  transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.spatial-image:hover .spatial-image-sheen { transform: translateX(360%) skewX(-12deg); }

.spatial-image-vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(1, 10, 42, 0.42) 0%, transparent 32%),
    linear-gradient(0deg, rgba(1, 10, 42, 0.92) 0%, rgba(1, 10, 42, 0.34) 34%, transparent 62%);
  transform: translateZ(18px);
}

.spatial-image-top {
  position: absolute;
  top: 18px;
  right: 18px;
  left: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transform: translateZ(46px);
}

.spatial-image-eyebrow {
  padding: 6px 10px;
  border: 1px solid rgba(248, 250, 252, 0.22);
  border-radius: 999px;
  background: rgba(1, 10, 42, 0.4);
  color: rgba(248, 250, 252, 0.88);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
  backdrop-filter: blur(10px);
}

.spatial-image-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.16);
  color: #a7f3d0;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.12em;
  backdrop-filter: blur(10px);
}

.spatial-image-live i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.18);
}

.spatial-image-floats {
  position: absolute;
  top: 24%;
  right: 16px;
  display: grid;
  gap: 8px;
  justify-items: end;
  transform: translateZ(62px);
}

.spatial-float {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid rgba(248, 250, 252, 0.16);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.1);
  color: rgba(248, 250, 252, 0.88);
  font-size: 9px;
  font-weight: 650;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 22px rgba(1, 10, 42, 0.16);
}

.spatial-image:hover .float-one { translate: -4px -2px; }
.spatial-image:hover .float-two { translate: 3px 2px; }

.spatial-float { transition: translate 600ms cubic-bezier(0.16, 1, 0.3, 1); }

.spatial-image-caption {
  position: absolute;
  right: 18px;
  bottom: 18px;
  left: 18px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  color: #f8fafc;
  transform: translateZ(52px);
}

.caption-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.caption-copy small {
  color: rgba(249, 172, 138, 0.85);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.caption-copy strong {
  font-family: var(--font-display, Georgia, serif);
  font-size: clamp(20px, 2vw, 26px);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.caption-copy em {
  overflow: hidden;
  color: rgba(226, 232, 240, 0.7);
  font-size: 9px;
  font-style: normal;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caption-arrow {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(248, 250, 252, 0.24);
  border-radius: 50%;
  background: rgba(248, 250, 252, 0.12);
  color: #f9ac8a;
  backdrop-filter: blur(10px);
  transition: background 220ms ease, transform 220ms ease;
}

.spatial-image:hover .caption-arrow {
  background: rgba(249, 172, 138, 0.28);
  transform: rotate(8deg);
}

@media (max-width: 1023px) {
  .spatial-image-frame { aspect-ratio: 16 / 11; }
}

@media (max-width: 560px) {
  .spatial-image-frame { aspect-ratio: 4 / 4.6; border-radius: 20px; }
  .spatial-image-floats { display: none; }
}
</style>
