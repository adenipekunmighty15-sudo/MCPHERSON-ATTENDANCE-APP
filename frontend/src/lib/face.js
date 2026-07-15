let modelsLoaded = false
let faceapi = null

export async function loadFaceModels() {
  if (modelsLoaded) return true
  try {
    faceapi = await import('@vladmandic/face-api')
    const MODEL_URL = '/models'
    await faceapi.loadFaceDetectionModel(MODEL_URL)
    await faceapi.loadFaceLandmarkModel(MODEL_URL)
    await faceapi.loadFaceRecognitionModel(MODEL_URL)
    modelsLoaded = true
    return true
  } catch (err) {
    console.error('Face model load error:', err.message)
    return false
  }
}

export async function captureFaceDescriptor(videoEl) {
  if (!faceapi) return null
  const detections = await faceapi.detectSingleFace(videoEl).withFaceLandmarks().withFaceDescriptor()
  if (!detections) return null
  return Array.from(detections.descriptor)
}

export async function verifyFace(videoEl, storedDescriptor) {
  if (!faceapi) throw new Error('Face recognition models not loaded')
  if (!storedDescriptor) throw new Error('No stored face profile found')
  const desc = await captureFaceDescriptor(videoEl)
  if (!desc) return { match: false, distance: 1 }
  const stored = new Float32Array(storedDescriptor)
  const live = new Float32Array(desc)
  const distance = faceapi.euclideanDistance(stored, live)
  return { match: distance < 0.5, distance }
}
