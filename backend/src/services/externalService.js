import axios from 'axios'

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1'

// Voices requested for multi-speaker study podcasts. NVIDIA accepts lowercase ids.
export const MAGPIE_TTS_VOICES = Object.freeze(['sofia', 'aria', 'john', 'jason', 'leo'])
const FALLBACK_MASTER_MODELS = Object.freeze([
  'nvidia/tts_en_fastpitch',
  'nvidia/tts_hifigan',
])

export function resolveTtsVoice(voice) {
  const value = String(voice || '').trim()
  if (!value) return 'angelo'
  const lower = value.toLowerCase()
  if (MAGPIE_TTS_VOICES.includes(lower)) return lower
  // Dedicated TTS providers use short voice ids; cap length to reject abuse.
  return value.slice(0, 40)
}

function normaliseVoice(voice) {
  return resolveTtsVoice(voice)
}

function ttsCandidates(voice) {
  const masterKey = process.env.NVIDIA_API_KEY || ''
  const nvidiaTtsKey = process.env.NVIDIA_TTS_KEY || ''
  const magpieKey = process.env.MAGPIE_TTS_KEY || ''
  const magpieModel = process.env.MAGPIE_TTS_MODEL || 'nvidia/magpie-tts-multilingual'
  const playAiModel = process.env.NVIDIA_TTS_MODEL || 'playai/tts-play-3.0'
  const candidates = []
  if (masterKey) {
    candidates.push(
      { key: masterKey, model: magpieModel, voice },
      { key: masterKey, model: 'nvidia/magpie-tts-multilingual-357m', voice },
      ...FALLBACK_MASTER_MODELS.map(model => ({ key: masterKey, model, voice: 'English' }))
    )
  }
  if (nvidiaTtsKey) candidates.push({ key: nvidiaTtsKey, model: playAiModel, voice })
  if (magpieKey) candidates.push({ key: magpieKey, model: magpieModel, voice })
  return candidates
}

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
      timeout: 60000,
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
      signal: AbortSignal.timeout(60000),
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

/**
 * Try the master key first so the requested NVIDIA TTS models work without a
 * second secret. The dedicated keys remain as fallbacks for accounts where the
 * master plan does not expose audio endpoints.
 */
export async function nvidiaTTS(text, voice = 'angelo') {
  const selectedVoice = normaliseVoice(voice)
  for (const candidate of ttsCandidates(selectedVoice)) {
    const result = await ttsRequest(text, candidate.voice, candidate.key, candidate.model)
    if (result) return result
  }
  return null
}

export async function getNvidiaTTSStream(text, voice = 'angelo') {
  const selectedVoice = normaliseVoice(voice)
  for (const candidate of ttsCandidates(selectedVoice)) {
    const result = await ttsStreamRequest(text, candidate.voice, candidate.key, candidate.model)
    if (result) return result
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
