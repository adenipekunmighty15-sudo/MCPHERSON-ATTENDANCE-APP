import axios from 'axios'

// ─── ElevenLabs TTS (only external API — all others removed) ───
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'

export async function elevenLabsTTS(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
  if (!ELEVENLABS_API_KEY) return null
  try {
    const { data } = await axios.post(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.2 },
    }, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      responseType: 'arraybuffer',
      timeout: 15000,
    })
    return Buffer.from(data)
  } catch (err) {
    console.error('ElevenLabs TTS error:', err?.response?.data?.toString() || err.message)
    return null
  }
}

export async function getElevenLabsVoices() {
  if (!ELEVENLABS_API_KEY) return []
  try {
    const { data } = await axios.get(`${ELEVENLABS_BASE}/voices`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      timeout: 5000,
    })
    return data.voices || []
  } catch { return [] }
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
