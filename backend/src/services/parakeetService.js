import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROTO_PATH = join(__dirname, '..', '..', 'protos', 'riva_asr.proto')
const FUNCTION_ID = 'd3fe9151-442b-4204-a70d-5fcc597fd610'
const TARGET = 'grpc.nvcf.nvidia.com:443'
const LINEAR_PCM = 1
const FLAC = 2
const OGGOPUS = 4

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const riva = grpc.loadPackageDefinition(packageDefinition).nvidia.riva.asr

let client = null

function getClient() {
  if (!client) client = new riva.RivaSpeechRecognition(TARGET, grpc.credentials.createSsl())
  return client
}

function readWavePcm16(buffer) {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null
  }

  let offset = 12
  let fmt = null
  let data = null
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4)
    const size = buffer.readUInt32LE(offset + 4)
    const body = offset + 8
    if (id === 'fmt ' && body + 16 <= buffer.length) {
      fmt = {
        audioFormat: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        bitsPerSample: buffer.readUInt16LE(body + 14),
      }
    }
    if (id === 'data') {
      data = { offset: body, size: Math.max(0, Math.min(size, buffer.length - body)) }
    }
    offset = body + size + (size % 2)
  }

  if (!fmt || !data || fmt.audioFormat !== 1 || fmt.bitsPerSample !== 16 || fmt.channels < 1) return null

  const frames = Math.floor(data.size / 2 / fmt.channels)
  if (!frames) return null
  const samples = new Int16Array(frames * fmt.channels)
  for (let i = 0; i < samples.length; i++) {
    samples[i] = buffer.readInt16LE(data.offset + i * 2)
  }
  return { samples, sampleRate: fmt.sampleRate, channels: fmt.channels }
}

function resampleTo16kMono(samples, sampleRate, channels) {
  const frames = Math.floor(samples.length / channels)
  if (sampleRate === 16000 && channels === 1) {
    return Buffer.from(samples.buffer, samples.byteOffset, frames * 2)
  }

  const mono = new Float32Array(frames)
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0
    for (let channel = 0; channel < channels; channel++) {
      sum += samples[frame * channels + channel]
    }
    mono[frame] = sum / channels / 32768
  }

  const targetFrames = Math.max(1, Math.floor(frames * 16000 / sampleRate))
  const output = Buffer.alloc(targetFrames * 2)
  for (let i = 0; i < targetFrames; i++) {
    const position = i * sampleRate / 16000
    const left = Math.floor(position)
    const right = Math.min(frames - 1, left + 1)
    const fraction = position - left
    const value = mono[left] * (1 - fraction) + mono[right] * fraction
    output.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(value * 32767))), i * 2)
  }
  return output
}

function normalizeAudio(buffer, mimeType = '') {
  const type = mimeType.toLowerCase()

  if (type.includes('flac')) {
    return { audio: buffer, encoding: FLAC }
  }
  if (type.includes('ogg') || type.includes('opus')) {
    return { audio: buffer, encoding: OGGOPUS }
  }

  const wave = readWavePcm16(buffer)
  if (!wave || wave.sampleRate < 8000) return null
  return { audio: resampleTo16kMono(wave.samples, wave.sampleRate, wave.channels), encoding: LINEAR_PCM }
}

/**
 * Transcribe lecture audio with the hosted NVIDIA Parakeet TDT model.
 * Returns null when the key is absent or the input cannot be normalized.
 */
export function transcribeWithParakeet(buffer, mimeType = '') {
  const key = process.env.NVIDIA_PARAKEET_KEY
  if (!buffer || !key) return Promise.resolve(null)

  const normalized = normalizeAudio(buffer, mimeType)
  if (!normalized) return Promise.resolve(null)

  const metadata = new grpc.Metadata()
  metadata.set('function-id', FUNCTION_ID)
  metadata.set('authorization', `Bearer ${key}`)

  const request = {
    config: {
      encoding: normalized.encoding,
      sample_rate_hertz: 16000,
      language_code: 'en-US',
      max_alternatives: 1,
      audio_channel_count: 1,
      enable_automatic_punctuation: true,
      verbatim_transcripts: false,
    },
    audio: normalized.audio,
  }

  return new Promise((resolve, reject) => {
    getClient().Recognize(request, metadata, { deadline: Date.now() + 45000 }, (err, response) => {
      if (err) return reject(err)
      const raw = response?.results?.[0]?.alternatives?.[0]?.transcript || ''
      // Riva emits <unk> markers for silence/noise; they are not study content.
      const transcript = String(raw).replace(/<unk>/gi, ' ').replace(/\s+/g, ' ').trim()
      resolve(transcript || null)
    })
  })
}

export default transcribeWithParakeet
