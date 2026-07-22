<template>
  <div :class="['dk-card', { 'dk-card--flush': flush }]">
    <div v-if="$slots.header" class="dk-card__header"><slot name="header" /></div>
    <div class="dk-card__body"><slot /></div>
    <div v-if="$slots.footer" class="dk-card__footer"><slot name="footer" /></div>
  </div>
</template>

<script setup>
defineProps({ flush: Boolean })
</script>

<style scoped>
.dk-card {
  background: var(--color-parchment-100);
  border: 1px solid var(--color-ink-100);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(11, 26, 51, 0.04);
  overflow: hidden;
}
.dk-card--flush { border-radius: 0; border-left: none; border-right: none; }

.dk-card__header {
  padding: 20px 24px 0;
  font-weight: 600;
}
.dk-card__body  { padding: 20px 24px; }
.dk-card__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-ink-100);
  background: var(--color-parchment-500);
}
.dk-card--flush .dk-card__header { padding-left: 0; padding-right: 0; }
.dk-card--flush .dk-card__body   { padding-left: 0; padding-right: 0; }
.dk-card--flush .dk-card__footer { padding-left: 0; padding-right: 0; }
</style>
