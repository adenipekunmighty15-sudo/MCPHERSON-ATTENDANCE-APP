<template>
  <button
    :class="['dk-btn', `dk-btn--${variant}`, `dk-btn--${size}`, { 'dk-btn--loading': loading, 'dk-btn--block': block }]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="dk-btn__spinner" aria-hidden="true"></span>
    <span v-if="!loading && icon" class="dk-btn__icon" v-html="icon"></span>
    <span class="dk-btn__label"><slot /></span>
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary', validator: v => ['primary', 'secondary', 'ghost', 'danger'].includes(v) },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
  icon: String,
})
</script>

<style scoped>
.dk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
  text-decoration: none;
}
.dk-btn:focus-visible { outline: 2px solid var(--color-brass); outline-offset: 2px; }

.dk-btn--sm  { padding: 6px 14px; font-size: 13px; height: 32px; }
.dk-btn--md  { padding: 8px 20px; font-size: 14px; height: 40px; }
.dk-btn--lg  { padding: 10px 28px; font-size: 15px; height: 48px; }
.dk-btn--block { width: 100%; }

.dk-btn--primary {
  background: var(--color-ink-800);
  color: var(--color-parchment-100);
  box-shadow: 0 2px 8px rgba(11, 26, 51, 0.12);
}
.dk-btn--primary:hover:not(:disabled) { background: var(--color-ink-700); box-shadow: 0 4px 14px rgba(11, 26, 51, 0.18); transform: translateY(-1px); }
.dk-btn--primary:active:not(:disabled) { transform: translateY(0); }

.dk-btn--secondary {
  background: var(--color-parchment-300);
  color: var(--color-ink-800);
  border: 1px solid var(--color-ink-200);
}
.dk-btn--secondary:hover:not(:disabled) { background: var(--color-parchment-600); border-color: var(--color-ink-300); }

.dk-btn--ghost {
  background: transparent;
  color: var(--color-ink-700);
}
.dk-btn--ghost:hover:not(:disabled) { background: var(--color-ink-50); }

.dk-btn--danger {
  background: #C41E1E;
  color: white;
}
.dk-btn--danger:hover:not(:disabled) { background: #A01818; transform: translateY(-1px); }

.dk-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
.dk-btn--loading { pointer-events: none; }

.dk-btn__spinner {
  width: 16px; height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: dk-spin 0.6s linear infinite;
}
@keyframes dk-spin { to { transform: rotate(360deg); } }

.dk-btn__icon { display: flex; align-items: center; line-height: 0; }
</style>
