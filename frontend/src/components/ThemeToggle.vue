<template>
  <button
    :style="buttonStyle"
    :class="{ toggled }"
    @click="handleToggle"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <svg
      v-if="isDark"
      width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      class="sun-icon"
    >
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <svg
      v-else
      width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      class="moon-icon"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDark, toggle } = useTheme()
const toggled = ref(false)

const buttonStyle = computed(() => ({
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--color-border-accent)',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
  background: isDark.value
    ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
    : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
  color: '#FFFFFF',
  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: isDark.value
    ? '0 4px 20px var(--color-primary-glow), inset 0 1px 0 rgba(255,255,255,0.1)'
    : '0 4px 20px var(--color-primary-glow), inset 0 1px 0 rgba(255,255,255,0.1)',
  outline: 'none',
}))

function handleToggle() {
  toggle()
  toggled.value = true
  setTimeout(() => { toggled.value = false }, 400)
}
</script>

<style scoped>
.toggled {
  transform: rotateY(180deg) scale(1.1);
}
.sun-icon,
.moon-icon {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
</style>
