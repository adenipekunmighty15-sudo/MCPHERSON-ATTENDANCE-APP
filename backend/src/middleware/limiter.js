import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import supabaseAdmin from '../config/supabase.js'

function ipKey(req) {
  const address = req.ip || req.socket?.remoteAddress || 'unknown'
  return `ip:${ipKeyGenerator(address)}`
}

function requestKey(req) {
  if (typeof req.rateLimitUserId === 'string' && req.rateLimitUserId) {
    return `user:${req.rateLimitUserId}`
  }
  return ipKey(req)
}

async function attachVerifiedUser(req, _res, next) {
  const auth = req.headers.authorization
  if (!auth || !supabaseAdmin) return next()

  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (!token) return next()

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && user?.id) req.rateLimitUserId = user.id
  } catch {
    // Invalid or unavailable authentication falls back to the IP key.
  }
  next()
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: requestKey,
  message: { error: 'Too many requests, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: ipKey,
  message: { error: 'Too many auth requests from this IP, please try again later.' },
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: requestKey,
  message: { error: 'AI rate limit exceeded. Please wait a minute before requesting more AI generations.' },
})

function applyLimiters(app) {
  app.use(attachVerifiedUser)
  app.use(globalLimiter)
  app.use('/api/auth/confirm-signup', authLimiter)
  app.use('/api/auth/create-user-profile', authLimiter)
  app.use('/api/study-materials/chat', aiLimiter)
  app.use('/api/study-materials/upload', aiLimiter)
  app.use('/api/study-materials/:id/chat', aiLimiter)
  app.use('/api/study-materials/:id/podcast', aiLimiter)
  app.use('/api/study-materials/:id/enhanced-flashcards', aiLimiter)
  app.use('/api/generate-image', aiLimiter)
  app.use('/api/ai/generate-image', aiLimiter)
  app.use('/api/voice/stt', aiLimiter)
  app.use('/api/voice/chat', aiLimiter)
  app.use('/api/voice/tts', aiLimiter)
  app.use('/api/tts', aiLimiter)
  app.use('/api/mind/chat', aiLimiter)
  app.use('/api/ai/web-search', aiLimiter)
  app.use('/api/ai/image-search', aiLimiter)
  app.use('/api/ai/fetch-page', aiLimiter)
  app.use('/api/ai/chat', aiLimiter)
  app.use('/api/ai/chat/stream', aiLimiter)
  app.use('/api/ai/research', aiLimiter)
  app.use('/api/rag/chat', aiLimiter)
}

export { globalLimiter, authLimiter, aiLimiter, applyLimiters }
