import axios from 'axios'

const NVIDIA_TTS_KEY = process.env.NVIDIA_TTS_KEY || ''
const MAGPIE_TTS_KEY = process.env.MAGPIE_TTS_KEY || ''
const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1'

async function ttsRequest(text, voice, key, model) {
  try {
    const { data } = await axios.post(`${NVIDIA_BASE}/audio/speech`, {
      model,
      input: text,
      voice,
      response_format: 'mp3',
      speed: 1.0,
    }, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    })
    return Buffer.from(data)
  } catch (err) {
    const status = err?.response?.status || 0
    const detail = err?.response?.data?.toString() || err.message
    console.error(`${model} TTS error (${status}):`, detail)
    return null
  }
}

async function ttsStreamRequest(text, voice, key, model) {
  try {
    const resp = await fetch(`${NVIDIA_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    })
    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`${model} TTS error ${resp.status}: ${errText}`)
    }
    return resp
  } catch (err) {
    console.error(`${model} TTS stream error:`, err.message)
    return null
  }
}

// Tries playai first, falls back to magpie-tts-multilingual
export async function nvidiaTTS(text, voice = 'angelo') {
  if (NVIDIA_TTS_KEY) {
    const result = await ttsRequest(text, voice, NVIDIA_TTS_KEY, 'playai/tts-play-3.0')
    if (result) return result
  }
  if (MAGPIE_TTS_KEY) {
    return ttsRequest(text, voice, MAGPIE_TTS_KEY, 'magpie/tts-multilingual')
  }
  return null
}

export async function getNvidiaTTSStream(text, voice = 'angelo') {
  if (NVIDIA_TTS_KEY) {
    const result = await ttsStreamRequest(text, voice, NVIDIA_TTS_KEY, 'playai/tts-play-3.0')
    if (result) return result
  }
  if (MAGPIE_TTS_KEY) {
    return ttsStreamRequest(text, voice, MAGPIE_TTS_KEY, 'magpie/tts-multilingual')
  }
  return null
}

// All other integrations removed
export const getWeather = () => null
export const searchYouTube = () => []
export const queryWolfram = () => null
export const getStudyPlaylists = () => []
export const sendWhatsAppMessage = () => null
export const getCampusNews = () => []
export const getDirections = () => null
export const sendDiscordWebhook = () => null
export const sendDiscordEmbed = () => null
export const getGitHubProfile = () => null
export const getGitHubRepos = () => []
export const getGitHubCommits = () => []
export const getGoogleAuthUrl = () => null
export const exchangeGoogleCode = () => null
export const listCalendarEvents = () => []
export const createCalendarEvent = () => null
