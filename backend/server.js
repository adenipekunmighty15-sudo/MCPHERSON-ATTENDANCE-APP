import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { existsSync, mkdirSync } from 'fs'
import { query } from './lib/db.js'
import { getAvailableProviders } from './src/config/ai.js'

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason?.message || reason)
})

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

const uploadDir = join(__dirname, 'uploads')
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })

async function loadDbApiKeys() {
  try {
    const { rows } = await query('SELECT provider, api_key FROM public.ai_config')
    const keyMap = {
      openai: 'OPENAI_API_KEY', 'nemotron-nano': 'NVIDIA_NANO_KEY',
      'mistral-nemotron': 'MISTRAL_NEMOTRON_KEY', kimi: 'KIMI_KEY',
      'mistral-large': 'MISTRAL_LARGE_KEY', 'gemma-4': 'GEMMA4_KEY',
    }
    for (const row of rows) {
      const envKey = keyMap[row.provider] || `${row.provider.toUpperCase().replace(/-/g, '_')}_API_KEY`
      process.env[envKey] = row.api_key
    }
  } catch { /* table may not exist — fall back to .env */ }
}
await loadDbApiKeys()

const app = express()

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', 'https://mcpherson-attendance.vercel.app']

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) return next()
  console.warn(`CORS blocked origin: ${origin}`)
  return res.status(403).json({ error: `CORS: Origin '${origin}' is not allowed. Allowed: ${ALLOWED_ORIGINS.join(', ')}` })
})
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(compression())

// Rate limiters
import { applyLimiters } from './src/middleware/limiter.js'
applyLimiters(app)

// Serve production frontend
const frontendDist = join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(frontendDist, {
  maxAge: '7d',
  immutable: false,
  setHeaders(res, path) {
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache')
    if (path.match(/\.(js|css|woff2?)$/)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (path.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) res.setHeader('Cache-Control', 'public, max-age=86400')
  },
}))

// Cache-Control for API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// Routes
import authRoutes from './src/routes/auth.routes.js'
import complaintsRoutes from './src/routes/complaints.routes.js'
import coursesRoutes from './src/routes/courses.routes.js'
import timetableRoutes from './src/routes/timetable.routes.js'
import attendanceRoutes from './src/routes/attendance.routes.js'
import studyRoutes from './src/routes/study.routes.js'
import chatRoutes from './src/routes/chat.routes.js'
import generalChatRoutes from './src/routes/generalChat.routes.js'
import notificationsRoutes from './src/routes/notifications.routes.js'
import venuesRoutes from './src/routes/venues.routes.js'
import reportsRoutes from './src/routes/reports.routes.js'
import aiRoutes from './src/routes/ai.routes.js'

import predictorRoutes from './src/routes/predictor.routes.js'
import ragRoutes from './src/routes/rag.routes.js'
import externalRoutes from './src/routes/external.routes.js'
import walletRoutes from './src/routes/wallet.routes.js'
import gamificationRoutes from './src/routes/gamification.routes.js'
import proactiveRoutes from './src/routes/proactive.routes.js'
import voiceRoutes from './src/routes/voice.routes.js'
import libraryRoutes from './src/routes/library.routes.js'
import universityRoutes from './src/routes/university.routes.js'
import gemsRoutes from './src/routes/gems.routes.js'
import memoryRoutes from './src/routes/memory.routes.js'
import researchRoutes from './src/routes/research.routes.js'
import imageRoutes from './src/routes/image.routes.js'
import codeRoutes from './src/routes/code.routes.js'
import trackingRoutes from './src/routes/tracking.routes.js'

app.use(authRoutes)
app.use(complaintsRoutes)
app.use(coursesRoutes)
app.use(timetableRoutes)
app.use(attendanceRoutes)
app.use(studyRoutes)
app.use(chatRoutes)
app.use(generalChatRoutes)
app.use(notificationsRoutes)
app.use(venuesRoutes)
app.use(reportsRoutes)
app.use(aiRoutes)

app.use(predictorRoutes)
app.use(ragRoutes)
app.use(externalRoutes)
app.use(walletRoutes)
app.use(gamificationRoutes)
app.use(proactiveRoutes)
app.use(voiceRoutes)
app.use(libraryRoutes)
app.use(universityRoutes)
app.use(gemsRoutes)
app.use(memoryRoutes)
app.use(researchRoutes)
app.use(imageRoutes)
app.use(codeRoutes)
app.use(trackingRoutes)

// Serve uploads
app.use('/uploads', express.static(uploadDir))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
})

// Diagnostic endpoint for study hub
app.get('/api/study/diagnostic', async (req, res) => {
  const results = { timestamp: new Date().toISOString(), checks: {} }
  
  try {
    const start = Date.now()
    await query('SELECT 1')
    results.checks.database = { ok: true, latency: Date.now() - start + 'ms' }
  } catch (e) {
    results.checks.database = { ok: false, error: e.message }
  }

  try {
    const { rows } = await query('SELECT COUNT(*)::int as count FROM public.study_materials')
    results.checks.studyMaterials = { ok: true, count: rows[0].count }
  } catch (e) {
    results.checks.studyMaterials = { ok: false, error: e.message }
  }

  try {
    const { rows } = await query('SELECT COUNT(*)::int as count FROM public.flashcards')
    results.checks.flashcards = { ok: true, count: rows[0].count }
  } catch (e) {
    results.checks.flashcards = { ok: false, error: e.message }
  }

  try {
    const providers = getAvailableProviders()
    results.checks.ai = { ok: providers.length > 0, providers }
  } catch (e) {
    results.checks.ai = { ok: false, error: e.message }
  }

  results.allOk = Object.values(results.checks).every(c => c.ok)
  res.json(results)
})

// SPA fallback
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(join(frontendDist, 'index.html'), err => {
    if (err) res.status(404).json({ error: 'Not found' })
  })
})

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: 'Invalid request body' })
  }
  console.error('Unhandled error:', err?.message || err, err?.stack || '')
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`McPherson Backend running on http://localhost:${PORT}`)
})

export default app
