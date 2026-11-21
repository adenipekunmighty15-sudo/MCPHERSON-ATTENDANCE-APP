// Single-tenant configuration and small browser-safe helpers shared by the
// portal shell. There is exactly one university: McPherson University.

export type UserRole = 'student' | 'lecturer' | 'admin' | 'super_admin' | (string & {})

export const UNIVERSITY = {
  id: 'mcp',
  name: 'McPherson University',
  shortCode: 'MCU',
  tagline: 'Citadel of Champions',
  allowedEmailDomains: [
    'mcu.edu.ng',
    'undergraduate.mcu.edu.ng',
    'mcpherson.edu',
    'gmail.com',
  ],
  defaultStudentDomain: 'undergraduate.mcu.edu.ng',
  idFormat: '3–24 letters, numbers, /, - or _',
} as const

export const ALLOWED_EMAIL_DOMAINS: string[] = [...UNIVERSITY.allowedEmailDomains]
export const DEFAULT_STUDENT_DOMAIN = UNIVERSITY.defaultStudentDomain
export const STUDENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/_-]{2,23}$/
export const ADMIN_ROLES: readonly string[] = ['admin', 'super_admin']

/** The signed-in destination. The root path is the public landing page. */
export const PORTAL_HOME_PATH = '/dashboard'

export const NETWORK_ERROR_MESSAGE = 'Network error — check your internet connection and try again.'
export const TIMEOUT_ERROR_MESSAGE = 'The request timed out. Check your connection and try again.'
export const SERVICE_UNAVAILABLE_MESSAGE = 'The portal service is temporarily unavailable. Please try again shortly.'
export const RATE_LIMIT_MESSAGE = 'That service is temporarily busy. Please try again shortly.'
export const AUTH_UNAVAILABLE_MESSAGE = 'Portal authentication is currently unavailable. Please try again shortly.'

export const DEPARTMENTS = [
  { code: 'CSC', name: 'Computer Science' },
  { code: 'SWE', name: 'Software Engineering' },
  { code: 'IFT', name: 'Information Technology' },
  { code: 'CYS', name: 'Cybersecurity' },
  { code: 'DTS', name: 'Data Science' },
  { code: 'NUR', name: 'Nursing Science' },
  { code: 'MLS', name: 'Medical Laboratory Science' },
  { code: 'PHT', name: 'Public Health' },
  { code: 'HIM', name: 'Health Information Management' },
  { code: 'BIO', name: 'Biological Sciences' },
  { code: 'MCB', name: 'Microbiology' },
  { code: 'BTE', name: 'Biotechnology' },
  { code: 'CHS', name: 'Chemical Sciences' },
  { code: 'BCH', name: 'Biochemistry & Molecular Biology' },
  { code: 'ICH', name: 'Industrial Chemistry' },
  { code: 'PMS', name: 'Physical & Mathematical Sciences' },
  { code: 'MTH', name: 'Industrial Mathematics' },
  { code: 'PHY', name: 'Physics with Electronics' },
  { code: 'MDP', name: 'Medical Physics' },
  { code: 'STA', name: 'Statistics' },
  { code: 'ACC', name: 'Accounting' },
  { code: 'BFN', name: 'Banking & Finance' },
  { code: 'BUS', name: 'Business Administration' },
  { code: 'MKT', name: 'Marketing' },
  { code: 'ECO', name: 'Economics' },
  { code: 'IR', name: 'International Relations' },
  { code: 'MAC', name: 'Mass Communication' },
  { code: 'HIS', name: 'History & International Studies' },
  { code: 'ENG', name: 'English and Literary Studies' },
  { code: 'RPS', name: 'Religion & Peace Studies' },
  { code: 'POL', name: 'Political Science' },
  { code: 'PSY', name: 'Psychology' },
  { code: 'SOC', name: 'Sociology' },
  { code: 'GNS', name: 'General Studies' },
  { code: 'LAW', name: 'Law' },
  { code: 'PGS', name: 'Postgraduate Studies' },
] as const

export function isAdminRole(role?: string | null): boolean {
  return typeof role === 'string' && ADMIN_ROLES.includes(role)
}

/** Same-origin /api by default; an absolute backend origin may override it. */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!configured) return '/api'
  return configured.replace(/\/+$/, '')
}

/** Base used when building absolute auth redirect URLs. */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path.replace(/\/+$/, '')
  return `${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`
}

/** A bare matric-style ID is treated as an undergraduate account. */
export function normalizeUniversityEmail(value: string): string {
  const candidate = String(value || '').trim()
  if (!candidate || candidate.includes('@')) return candidate
  return STUDENT_ID_PATTERN.test(candidate)
    ? `${candidate}@${DEFAULT_STUDENT_DOMAIN}`
    : candidate
}

export function isValidUniversityEmail(value: string): boolean {
  const candidate = String(value || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return false
  const domain = candidate.slice(candidate.lastIndexOf('@') + 1).toLowerCase()
  return ALLOWED_EMAIL_DOMAINS.includes(domain)
}

/**
 * Only same-origin, app-internal paths may be used as post-login redirects.
 * Protocol-relative, scheme-like, control-character and auth-page targets are
 * rejected so a crafted query string cannot bounce users off-site.
 */
export function sanitizeRedirect(raw: string | null | undefined, fallback = PORTAL_HOME_PATH): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback
  }
  if (/[\u0000-\u001F\u007F]/.test(raw)) return fallback
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw.slice(1))) return fallback

  try {
    const origin = getSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const parsed = new URL(raw, origin)
    if (parsed.origin !== origin) return fallback
    // Landing and auth pages are never valid post-login destinations.
    if (parsed.pathname === '/' || /^\/(login|signup|welcome)(\/|$)/i.test(parsed.pathname)) return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

/** Paths where a 401 is expected (auth screens must not redirect in a loop). */
export function isAuthFlowPath(pathname: string): boolean {
  return (
    /^\/(login|signup)(\/|$)/.test(pathname) ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/admin/portal/login') ||
    pathname.startsWith('/reset-password')
  )
}

export function friendlyAuthError(error: unknown): string {
  if (error instanceof TypeError) return NETWORK_ERROR_MESSAGE
  const err = error as {
    message?: string
    name?: string
    status?: number
    response?: { status?: number }
  } | null
  const message = String(err?.message || '').trim()
  const lower = message.toLowerCase()

  if (err?.name === 'AbortError' || err?.name === 'TimeoutError' || lower.includes('timeout') || lower.includes('timed out')) {
    return TIMEOUT_ERROR_MESSAGE
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('connect') || err?.status === 0) {
    return NETWORK_ERROR_MESSAGE
  }
  if (lower.includes('email not confirmed') || lower.includes('user-not-found') || lower.includes('wrong-password') || lower.includes('invalid-credential')) {
    return 'Invalid email or password. Please try again.'
  }
  if (lower.includes('user already registered') || lower.includes('email-already-in-use')) {
    return 'An account with this email already exists. Try signing in.'
  }
  if (lower.includes('too many requests') || lower.includes('over_email_send_rate_limit') || lower.includes('email rate limit exceeded') || err?.status === 429) {
    return RATE_LIMIT_MESSAGE
  }
  if (err?.status === 503 || lower.includes('temporarily busy') || lower.includes('unavailable')) {
    return SERVICE_UNAVAILABLE_MESSAGE
  }
  if (lower.includes('not configured')) return AUTH_UNAVAILABLE_MESSAGE
  return message || 'Authentication failed. Please try again.'
}
