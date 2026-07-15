import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const isAppReady = ref(false)
  const modelsLoaded = ref(false)
  const progress = ref(0)
  const message = ref('Initializing...')

  function setProgress(val, msg) {
    progress.value = Math.min(100, Math.max(0, val))
    if (msg) message.value = msg
  }

  function markModelsReady() { modelsLoaded.value = true; progress.value = 100; message.value = 'Ready' }
  function markAppReady() { isAppReady.value = true }

  return { isAppReady, modelsLoaded, progress, message, setProgress, markModelsReady, markAppReady }
})
