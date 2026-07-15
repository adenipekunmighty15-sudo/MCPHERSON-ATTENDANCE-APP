import supabaseAdmin from '../config/supabase.js'

const ALLOWED_ROLES = ['student', 'lecturer', 'admin', 'super_admin']

function isAllowedEmail(email) {
  if (!email || typeof email !== 'string') return false
  const atIndex = email.lastIndexOf('@')
  if (atIndex === -1) return false
  const domain = email.slice(atIndex)
  return domain === '@mcpherson.edu' || domain === '@undergraduate.mcu.edu.ng' || domain === '@gmail.com'
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
    if (!isAllowedEmail(supaUser.email)) {
      return res.status(403).json({ error: 'Use your school email (@mcpherson.edu / @undergraduate.mcu.edu.ng) or Gmail' })
    }
    req.user = {
      id: supaUser.id,
      email: supaUser.email,
      role: supaUser.user_metadata?.role || 'student',
    }
    next()
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

const requireAuth = authenticate
export { authenticate, isAllowedEmail, isValidRole, requireAuth }
