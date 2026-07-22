<template>
  <span :class="['dk-badge', `dk-badge--${status}`]" :aria-label="`Status: ${label || status}`">
    {{ label || status }}
  </span>
</template>

<script setup>
defineProps({
  status: { type: String, default: 'pending', validator: v => ['present', 'absent', 'pending', 'admin'].includes(v) },
  label: { type: String, default: '' },
})
</script>

<style scoped>
.dk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  text-transform: capitalize;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.dk-badge::before {
  content: '';
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.dk-badge--present { background: rgba(27, 122, 61, 0.1); color: #1B7A3D; }
.dk-badge--absent  { background: rgba(196, 30, 30, 0.1);  color: #C41E1E; }
.dk-badge--pending { background: rgba(184, 134, 11, 0.1); color: #B8860B; }
.dk-badge--admin   { background: rgba(15, 30, 61, 0.08);  color: #0F1E3D; }
</style>
