import api from './api'

export async function checkExternalStatus() {
  try {
    const { data } = await api.get('/external/status')
    return data
  } catch {
    return { tts: false, configured: false }
  }
}

export async function getTTSAudio(text, voiceId) {
  try {
    const { data } = await api.post('/tts', { text, voiceId }, { responseType: 'blob' })
    return data
  } catch {
    return null
  }
}

export async function getVoices() {
  try {
    const { data } = await api.get('/tts/voices')
    return data.voices || []
  } catch {
    return []
  }
}
