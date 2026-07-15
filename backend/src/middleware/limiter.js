import rateLimit from 'express-rate-limit'

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth requests from this IP, please try again later.' },
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'AI rate limit exceeded. Please wait a minute before requesting more AI generations.' },
})

function applyLimiters(app) {
  app.use(globalLimiter)
  app.use('/api/auth/confirm-signup', authLimiter)
  app.use('/api/auth/create-user-profile', authLimiter)
  app.use('/api/study-materials/chat', aiLimiter)
  app.use('/api/study-materials/generate', aiLimiter)
  app.use('/api/generate-image', aiLimiter)
  app.use('/api/mind/chat', aiLimiter)
  app.use('/api/ai/chat', aiLimiter)
  app.use('/api/ai/chat/stream', aiLimiter)
  app.use('/api/ai/research', aiLimiter)
  app.use('/api/rag/chat', aiLimiter)
}

export { globalLimiter, authLimiter, aiLimiter, applyLimiters }
