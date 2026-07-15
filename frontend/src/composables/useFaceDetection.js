import { ref } from 'vue'
import { loadFaceDetectionModels } from '../lib/face'

export function useFaceDetection() {
  const modelsLoaded = ref(false)
  const faceDetected = ref(false)
  const error = ref(null)

  async function init() {
    try {
      await loadFaceDetectionModels()
      modelsLoaded.value = true
    } catch (err) {
      error.value = err.message
    }
  }

  return { modelsLoaded, faceDetected, error, init }
}
