import { isAllowedEmail } from '../middleware/auth.js'

export const STUDENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/_-]{2,23}$/
const DEFAULT_STUDENT_DOMAIN = '@undergraduate.mcu.edu.ng'
const PASSWORD_MAX = 128

// Remove control characters, collapse whitespace and cap length. This keeps
// profile fields predictable and prevents log/HTML injection via odd bytes.
export function cleanText(value, maxLength = 100) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

// A matric-like identifier is completed with the university student domain.
// Full email addresses are simply normalized.
export function normalizeAccountIdentifier(value) {
  const candidate = cleanText(value, 160)
  if (!candidate) return ''
  if (candidate.includes('@')) return candidate.toLowerCase()
  if (!STUDENT_ID_PATTERN.test(candidate)) return ''
  return `${candidate.toLowerCase()}${DEFAULT_STUDENT_DOMAIN}`
}

// GoTrue's real duplicate-email message is "A user with this email address has
// already been registered". The word "been" breaks a naive "already
// registered" match, so cover every observed variant plus the error code.
export function isDuplicateAccountError(error) {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()
  return code === 'email_exists' ||
    message.includes('already been registered') ||
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('email address has already')
}

export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be 8–128 characters with uppercase, lowercase, number and symbol.' }
  }
  const valid = password.length >= 8 &&
    password.length <= PASSWORD_MAX &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)

  return {
    valid,
    error: valid ? '' : 'Password must be 8–128 characters with uppercase, lowercase, number and symbol.',
  }
}

export function pickStudentIdentifier(body = {}) {
  const raw = body.matric ?? body.matric_number ?? body.matricNumber ?? body.staff_id ?? body.staffId
  const value = cleanText(raw, 24)
  return STUDENT_ID_PATTERN.test(value) ? value.toUpperCase() : ''
}

export function validateRegistration(body = {}) {
  const email = normalizeAccountIdentifier(body.email ?? body.identifier)
  if (!email || !isAllowedEmail(email)) {
    return {
      error: 'Use an allowed email (@mcu.edu.ng / @undergraduate.mcu.edu.ng / @mcpherson.edu / @gmail.com)',
      status: email ? 403 : 400,
    }
  }

  const password = validatePassword(body.password)
  if (!password.valid) return { error: password.error, status: 400 }

  const fullName = cleanText(body.name ?? body.full_name, 100)
  if (fullName.length < 2) return { error: 'Enter your full name.', status: 400 }

  const identifier = pickStudentIdentifier(body)
  if (!identifier && (body.matric || body.matric_number || body.matricNumber || body.staff_id || body.staffId)) {
    return { error: 'Use 3–24 letters, numbers, /, - or _ for your ID.', status: 400 }
  }

  const department = cleanText(body.department, 100)
  if (department.length < 2) return { error: 'Choose a department.', status: 400 }

  return {
    value: {
      email,
      password: body.password,
      fullName,
      identifier,
      department,
      metadata: {
        name: fullName,
        full_name: fullName,
        matric: identifier,
        matric_number: identifier,
        matricNumber: identifier,
        staff_id: identifier,
        department,
        role: 'student',
      },
    },
  }
}

// A copied redirect must be a same-origin path. Reject protocol-relative,
// backslash and scheme-like values before they reach router.push().
export function isSafeRedirect(value) {
  if (typeof value !== 'string') return false
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return false
  if (/[\u0000-\u001F\u007F]/.test(value)) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(value.slice(1))) return false
  return !/^\/(login|signup|welcome)(\/|\?|$)/i.test(value)
}
