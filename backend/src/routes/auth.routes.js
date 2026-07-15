import { Router } from 'express'
import { authenticate, isAllowedEmail, isValidRole } from '../middleware/auth.js'
import supabaseAdmin from '../config/supabase.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import multer from 'multer'
import { uploadFile, getPublicUrl } from '../services/storage.js'

const router = Router()

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
  const { userId, email, name, role, department, provider } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })
  const userRole = isValidRole(role) ? role : 'student'
  if (role && !isValidRole(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }
  try {
    await query(`
      INSERT INTO public.users (id, email, name, role, department, provider)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(NULLIF($2, ''), public.users.email),
        name = COALESCE(NULLIF($3, ''), public.users.name),
        department = COALESCE(NULLIF($5, ''), public.users.department),
        provider = COALESCE(NULLIF($6, ''), public.users.provider)
    `, [userId, email || '', name || 'User', userRole, department || 'Computer Science', provider || 'email'])
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
    const { rows } = await query('SELECT face_descriptor FROM public.users WHERE id = $1', [req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.status(200).json({ descriptor: rows[0].face_descriptor || '' })
  } catch (err) {
    console.error('Auth/face error:', err.message)
    res.status(500).json({ error: 'Failed to fetch face data' })
  }
})

router.put('/api/auth/face', authenticate, async (req, res) => {
  try {
    const { descriptor } = req.body
    if (!descriptor) return res.status(400).json({ error: 'Descriptor required' })
    await query('UPDATE public.users SET face_descriptor = $1 WHERE id = $2', [descriptor, req.user.id])
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Auth/face update error:', err.message)
    res.status(500).json({ error: 'Failed to update face data' })
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
    await query('DELETE FROM public.users WHERE id = $1', [req.user.id])
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(req.user.id)
    }
    res.status(200).json({ success: true, message: 'Account deleted successfully' })
  } catch (err) {
    console.error('Account deletion error:', err.message)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

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
    const ext = req.file.originalname?.split('.').pop() || 'jpg'
    const fileName = `profile-pictures/${req.user.id}.${ext}`
    const { publicUrl } = await uploadFile(req.file.buffer, fileName, req.file.mimetype)
    await query('UPDATE public.users SET avatar_url = $1 WHERE id = $2', [publicUrl, req.user.id])
    res.status(200).json({ avatar: publicUrl })
  } catch (err) {
    console.error('Profile picture upload error:', err.message)
    res.status(500).json({ error: 'Failed to upload profile picture' })
  }
})

export default router
