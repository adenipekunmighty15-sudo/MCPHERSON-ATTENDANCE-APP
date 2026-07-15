<template>
  <div class="toast-container">
    <TransitionGroup name="toast-3d">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
      >
        <div class="toast__border" />
        <div class="toast__body">
          <span class="toast__icon">
            <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </span>
          <span class="toast__message">{{ toast.text }}</span>
          <button class="toast__close" @click="toastStore.dismiss(toast.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  transform-style: preserve-3d;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08);
}

.toast--success { background: rgba(34, 197, 94, 0.06); }
.toast--error { background: rgba(239, 68, 68, 0.06); }
.toast--info { background: var(--color-primary-soft); }

.toast__border {
  width: 4px;
  flex-shrink: 0;
}

.toast--success .toast__border { background: var(--color-success); }
.toast--error .toast__border { background: var(--color-error); }
.toast--info .toast__border { background: var(--color-primary); }

.toast__body {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  min-width: 280px;
  max-width: 420px;
}

.toast__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.toast__message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.toast__close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-text-primary);
}

.toast-3d-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.toast-3d-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s ease;
}

.toast-3d-enter-from {
  transform: translateX(120%) translateZ(-20px);
  opacity: 0;
}

.toast-3d-leave-to {
  transform: translateX(120%) translateZ(-20px);
  opacity: 0;
}
</style>
