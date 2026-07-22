<template>
  <div class="metrics-row">
    <div v-for="(m, i) in metrics" :key="m.label" class="metric-card" :style="{ '--accent': m.color, '--delay': i * 0.08 + 's' }">
      <div class="metric-icon" :style="{ background: m.color + '14', color: m.color }">
        <component :is="m.icon" class="w-[18px] h-[18px]" />
      </div>
      <div class="metric-body">
        <span class="metric-value" :style="{ color: m.color }">
          <CountUp :to="m.value" :suffix="m.suffix" />
        </span>
        <span class="metric-label">{{ m.label }}</span>
      </div>
      <div v-if="m.trend" class="metric-trend">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        {{ m.trend }}
      </div>
    </div>
  </div>
</template>

<script setup>
import CountUp from '../CountUp.vue';

defineProps({
  metrics: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
/* ── METRICS ── */
.metrics-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9));
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  animation: metricIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay);
  box-shadow: 0 10px 24px rgba(30, 64, 175, 0.05);
}
[data-theme="dark"] .metric-card {
  background: linear-gradient(135deg, rgba(16, 35, 58, 0.95), rgba(22, 49, 77, 0.9));
}

@keyframes metricIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.metric-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-accent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
[data-theme="dark"] .metric-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.metric-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s var(--ease-spring);
}

.metric-card:hover .metric-icon {
  transform: scale(1.1) rotate(-5deg);
}

.metric-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-value {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.metric-label {
  font-size: 14px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 600;
  color: var(--color-success);
  position: absolute;
  top: 8px;
  right: 10px;
}

@media (max-width: 1440px) {
  .metric-card { padding: 28px; gap: 20px; }
  .metric-value { font-size: 34px; }
  .metric-icon { width: 54px; height: 54px; }
}

@media (max-width: 1280px) {
  .metric-card { padding: 24px; gap: 16px; border-radius: 20px; }
  .metric-value { font-size: 28px; }
  .metric-icon { width: 48px; height: 48px; border-radius: 14px; }
}

@media (max-width: 768px) {
  .metric-card {
    padding: 20px;
    gap: 14px;
  }

  .metric-value {
    font-size: 24px;
  }

  .metric-icon {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .metrics-row { gap: var(--space-2); }
  .metric-card { padding: 14px; gap: 12px; }
  .metric-value { font-size: 18px; }
  .metric-icon { width: 36px; height: 36px; }
}
</style>
