import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  const timers = {}
  let nextId = 0

  function show(text, type = 'info', duration = 4000, options = {}) {
    const { action, onAction } = options || {}
    const id = nextId++
    toasts.value.push({ id, text, type, duration, action, onAction })
    if (duration > 0) timers[id] = setTimeout(() => dismiss(id), duration)
    return id
  }

  function dismiss(id) {
    if (timers[id]) { clearTimeout(timers[id]); delete timers[id] }
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function success(text, options) { return show(text, 'success', 4000, options) }
  function error(text, options) { return show(text, 'error', 6000, options) }
  function warning(text, options) { return show(text, 'warning', 4000, options) }
  function info(text, options) { return show(text, 'info', 4000, options) }

  return { toasts, show, dismiss, success, error, warning, info }
})
