import { createHmac, timingSafeEqual } from 'crypto'

const CODE_PERIOD_MS = 30_000

function codeForStep(sessionId, key, step) {
  const digest = createHmac('sha256', key)
    .update(`${sessionId}:${step}`)
    .digest()
  const value = digest.readUInt32BE(0) & 0x7fffffff
  return String(value % 1_000_000).padStart(6, '0')
}

export function getCheckinKey(value = process.env.SESSION_CHECKIN_SECRET) {
  if (!value) return null
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error('SESSION_CHECKIN_SECRET must be a 32-byte hexadecimal value')
  }
  return Buffer.from(value, 'hex')
}

export function generateCheckinCode(sessionId, key, now = Date.now()) {
  const step = Math.floor(now / CODE_PERIOD_MS)
  return {
    code: codeForStep(sessionId, key, step),
    expiresAt: new Date((step + 1) * CODE_PERIOD_MS).toISOString(),
  }
}

export function verifyCheckinCode(sessionId, code, key, now = Date.now()) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return false
  const currentStep = Math.floor(now / CODE_PERIOD_MS)
  const submitted = Buffer.from(code)
  return [-1, 0, 1].some(offset => {
    const expected = Buffer.from(codeForStep(sessionId, key, currentStep + offset))
    return timingSafeEqual(submitted, expected)
  })
}
