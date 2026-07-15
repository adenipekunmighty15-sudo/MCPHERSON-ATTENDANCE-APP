import { ref, onMounted, onUnmounted } from 'vue'

export function useIdleTimer(timeout = 300000) {
  const isIdle = ref(false)
  let idleTimer = null

  function resetTimer() {
    isIdle.value = false
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { isIdle.value = true }, timeout)
  }

  function handleActivity() {
    resetTimer()
  }

  onMounted(() => {
    resetTimer()
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('touchstart', handleActivity)
  })

  onUnmounted(() => {
    if (idleTimer) clearTimeout(idleTimer)
    window.removeEventListener('mousemove', handleActivity)
    window.removeEventListener('keydown', handleActivity)
    window.removeEventListener('click', handleActivity)
    window.removeEventListener('touchstart', handleActivity)
  })

  return { isIdle }
}
