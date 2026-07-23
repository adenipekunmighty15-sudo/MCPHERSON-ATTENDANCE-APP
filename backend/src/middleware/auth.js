import supabaseAdmin from '../config/supabase.js'
import { query } from '../../lib/db.js'

const ALLOWED_ROLES = ['student', 'lecturer', 'admin', 'super_admin']

const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || '@mcpherson.edu,@undergraduate.mcu.edu.ng').split(',').map(d => d.trim())

function isAllowedEmail(email) {
  if (!email || typeof email !== 'string') return false
  const atIndex = email.lastIndexOf('@')
  if (atIndex === -1) return false
  const domain = email.slice(atIndex)
  return ALLOWED_EMAIL_DOMAINS.some(d => domain === d)
}

function isValidRole(role) {
  return role && ALLOWED_ROLES.includes(role)
}

async function authenticate(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth

  if (!supabaseAdmin) {
    console.error('Supabase admin not configured — cannot verify tokens')
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }

  try {
    const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !supaUser) {
      console.error('Auth verification failed:', error?.message || 'No user returned')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    let role = 'student'
    try {
      const { rows } = await query('SELECT role FROM public.users WHERE id = $1', [supaUser.id])
      if (rows.length && isValidRole(rows[0].role)) {
        role = rows[0].role
      }
    } catch (e) {
      console.warn('Could not verify role from DB, defaulting to student:', e.message)
    }

    // Skip email domain check for admin/super_admin roles (they may use non-school emails)
    if (!['admin', 'super_admin'].includes(role) && !isAllowedEmail(supaUser.email)) {
      return res.status(403).json({ error: 'Use your school email (@mcpherson.edu / @undergraduate.mcu.edu.ng)' })
    }

    req.user = {
      id: supaUser.id,
      email: supaUser.email,
      role,
    }
    next()
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

const requireAuth = authenticate
export { authenticate, isAllowedEmail, isValidRole, requireAuth }
