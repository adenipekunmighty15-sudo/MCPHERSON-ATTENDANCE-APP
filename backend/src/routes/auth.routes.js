import { Router } from 'express'
import { authenticate, isAllowedEmail } from '../middleware/auth.js'
import supabaseAdmin from '../config/supabase.js'
import { query } from '../../lib/db.js'
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'crypto'
import multer from 'multer'
import { uploadFile, getPublicUrl } from '../services/storage.js'

const router = Router()
const FACE_PREFIX = 'enc:v1:'

function getFaceEncryptionKey() {
  const value = process.env.FACE_ENCRYPTION_KEY
  if (!value) return null
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error('FACE_ENCRYPTION_KEY must be a 32-byte hexadecimal value')
  }
  return Buffer.from(value, 'hex')
}

function encryptFaceDescriptor(descriptor, key) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(descriptor, 'utf8'), cipher.final()])
  return `${FACE_PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`
}

function decryptFaceDescriptor(value, key) {
  const [ivValue, tagValue, encryptedValue] = value.slice(FACE_PREFIX.length).split(':')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivValue, 'base64'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

function isAlreadyRegisteredError(error) {
  const message = (error?.message || '').toLowerCase()
  return message.includes('already registered') || message.includes('already exists')
}

async function findAuthUserByEmail(email) {
  let page = 1
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const users = data?.users || []
    const match = users.find((user) => (user.email || '').toLowerCase() === email)
    if (match) return match
    if (users.length < 200) return null
    page++
  }
}

// Password proof prevents an unauthenticated caller from confirming somebody
// else's stale, unconfirmed account.
async function verifyPassword(email, password) {
  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return false
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) return false
  const data = await response.json().catch(() => null)
  return !!data?.access_token
}

// Self-service registration. The admin API creates an already-confirmed auth
// user, so the browser can immediately exchange the password for a session.
// Role is always student here — the client never chooses its own permissions.
router.post('/api/auth/register', async (req, res) => {
  const body = req.body || {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (!isAllowedEmail(email)) {
    return res.status(403).json({ error: 'Use an allowed email (@mcu.edu.ng / @undergraduate.mcu.edu.ng / @mcpherson.edu / @gmail.com)' })
  }
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (!supabaseAdmin) return res.status(503).json({ error: 'Portal registration is currently unavailable. Please try again shortly.' })

  const clean = (value) => (typeof value === 'string' && value.trim() ? value.trim() : '')
  const displayName = clean(body.name) || clean(body.full_name) || 'User'
  const department = clean(body.department) || 'Computer Science'
  const metadata = {
    name: displayName,
    full_name: clean(body.full_name) || displayName,
    matric: clean(body.matric),
    matric_number: clean(body.matric_number),
    matricNumber: clean(body.matricNumber),
    staff_id: clean(body.staff_id),
    department,
    role: 'student',
  }

  try {
    let userId
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (error) {
      if (!isAlreadyRegisteredError(error)) {
        console.error('Registration failed:', error.message)
        return res.status(500).json({ error: 'Could not create your account. Please try again.' })
      }

      // A previous signup may have left an auth user without confirming it.
      // Only finish that setup when the caller proves they know its password.
      const existing = await findAuthUserByEmail(email)
      if (!existing || existing.email_confirmed_at) {
        return res.status(409).json({ error: 'An account with this email already exists. Try signing in.' })
      }
      if (!(await verifyPassword(email, password))) {
        return res.status(409).json({ error: 'An account with this email is waiting for setup. Sign in with its password to finish.' })
      }

      const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        password,
        user_metadata: { ...(existing.user_metadata || {}), ...metadata },
      })
      if (updateError) throw updateError
      userId = updated?.user?.id || existing.id
    } else {
      userId = data?.user?.id
    }

    if (!userId) return res.status(500).json({ error: 'Could not create your account. Please try again.' })

    await query(
      `INSERT INTO public.users (id, email, name, role, department, provider)
       VALUES ($1, $2, $3, 'student', $4, 'email')
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         department = EXCLUDED.department,
         provider = EXCLUDED.provider`,
      [userId, email, displayName, department]
    )

    return res.status(201).json({ success: true, userId })
  } catch (e) {
    console.error('Registration error:', e.message)
    return res.status(500).json({ error: 'Could not create your account. Please try again.' })
  }
})

router.post('/api/auth/confirm-signup', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only admins can confirm signups' })
  }
  const { userId, email } = req.body
  if (!userId || !email) return res.status(400).json({ error: 'userId and email required' })
  if (!isAllowedEmail(email)) return res.status(403).json({ error: 'Email domain not allowed' })
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase admin not configured' })
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true })
    if (error) return res.status(500).json({ error: 'Failed to confirm signup' })
    res.status(200).json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to confirm signup' })
  }
})

router.post('/api/auth/create-user-profile', authenticate, async (req, res) => {
  const { name, department, provider } = req.body
  const profileName = typeof name === 'string' && name.trim() ? name.trim() : 'User'
  try {
    await query(`
      INSERT INTO public.users (id, email, name, role, department, provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(NULLIF($2, ''), public.users.email),
        name = COALESCE(NULLIF($3, ''), public.users.name),
        department = COALESCE(NULLIF($5, ''), public.users.department),
        provider = COALESCE(NULLIF($6, ''), public.users.provider)
    `, [
      req.user.id,
      req.user.email || '',
      profileName,
      'student',
      typeof department === 'string' && department.trim() ? department.trim() : 'Computer Science',
      typeof provider === 'string' && provider.trim() ? provider.trim() : 'email',
    ])
    res.status(200).json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user profile' })
  }
})

router.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.users WHERE id = $1', [req.user.id])
    if (!rows.length) return res.status(200).json({ id: req.user.id, email: req.user.email, role: req.user.role })
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Auth/me error:', err.message)
    res.status(500).json({ error: 'Failed to fetch user profile' })
  }
})

router.get('/api/auth/face', authenticate, async (req, res) => {
  try {
    const key = getFaceEncryptionKey()
    if (!key) return res.status(503).json({ error: 'Secure face storage is not configured' })
    const { rows } = await query(
      'SELECT face_descriptor, face_consent_at AS "consentAt" FROM public.users WHERE id = $1',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    const stored = rows[0].face_descriptor || ''
    if (stored && !stored.startsWith(FACE_PREFIX)) {
      return res.status(409).json({ error: 'Existing face data must be securely migrated or deleted' })
    }
    res.status(200).json({
      descriptor: stored ? decryptFaceDescriptor(stored, key) : '',
      consentAt: rows[0].consentAt,
    })
  } catch (err) {
    console.error('Auth/face error:', err.message)
    res.status(500).json({ error: 'Failed to fetch face data' })
  }
})

router.put('/api/auth/face', authenticate, async (req, res) => {
  try {
    const { descriptor, consentAccepted } = req.body
    if (consentAccepted !== true) {
      return res.status(400).json({ error: 'Explicit face-data consent is required' })
    }
    if (typeof descriptor !== 'string' || !descriptor || descriptor.length > 20000) {
      return res.status(400).json({ error: 'A valid face descriptor is required' })
    }
    const key = getFaceEncryptionKey()
    if (!key) return res.status(503).json({ error: 'Secure face storage is not configured' })
    const encryptedDescriptor = encryptFaceDescriptor(descriptor, key)
    await query(
      'UPDATE public.users SET face_descriptor = $1, face_consent_at = NOW() WHERE id = $2',
      [encryptedDescriptor, req.user.id]
    )
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Auth/face update error:', err.message)
    res.status(500).json({ error: 'Failed to update face data' })
  }
})

router.delete('/api/auth/face', authenticate, async (req, res) => {
  try {
    await query(
      "UPDATE public.users SET face_descriptor = '', face_consent_at = NULL WHERE id = $1",
      [req.user.id]
    )
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Auth/face delete error:', err.message)
    res.status(500).json({ error: 'Failed to delete face data' })
  }
})

router.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { name, department } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' })
    await query('UPDATE public.users SET name = $1, department = $2 WHERE id = $3', [name.trim(), department || 'Computer Science', req.user.id])
    const { rows } = await query('SELECT * FROM public.users WHERE id = $1', [req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.status(200).json(rows[0])
  } catch (err) {
    console.error('Auth/profile update error:', err.message)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

router.delete('/api/auth/me', authenticate, async (req, res) => {
  try {
    // Delete the auth user first. If that fails the profile stays intact and
    // the user can still sign in; the reverse order orphaned the auth account.
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(req.user.id)
    }
    await query('DELETE FROM public.users WHERE id = $1', [req.user.id])
    res.status(200).json({ success: true, message: 'Account deleted successfully' })
  } catch (err) {
    console.error('Account deletion error:', err.message)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

const profilePicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, GIF, and WebP images allowed'))
    }
    cb(null, true)
  },
})

router.post('/api/auth/profile-picture', authenticate, profilePicUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    // Extension comes strictly from the validated MIME type; the original
    // filename is never used, and the stored name is random (not user-derived).
    const ext = IMAGE_EXTENSIONS[req.file.mimetype]
    if (!ext) return res.status(400).json({ error: 'Unsupported image type' })
    const fileName = `profile-pictures/${randomUUID()}.${ext}`
    const { publicUrl } = await uploadFile(req.file.buffer, fileName, req.file.mimetype)
    await query('UPDATE public.users SET avatar_url = $1 WHERE id = $2', [publicUrl, req.user.id])
    res.status(200).json({ avatar: publicUrl })
  } catch (err) {
    console.error('Profile picture upload error:', err.message)
    res.status(500).json({ error: 'Failed to upload profile picture' })
  }
})

export default router
