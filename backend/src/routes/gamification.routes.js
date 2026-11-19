import express from 'express'
import { query } from '../../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Get gamification profile
router.get('/api/gamification/profile', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT xp, current_streak, longest_streak, last_study_date
      FROM public.gamification_profiles
      WHERE user_id = $1
    `, [req.user.id])
    
    const profile = rows[0] || { xp: 0, current_streak: 0, longest_streak: 0 }
    
    // Fetch badges
    const { rows: badgeRows } = await query(`
      SELECT badge_id, earned_at
      FROM public.gamification_badges
      WHERE user_id = $1
      ORDER BY earned_at DESC
    `, [req.user.id])
    
    res.json({ ...profile, badges: badgeRows })
  } catch (err) {
    console.error('Error fetching gamification profile:', err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Get campus leaderboard
router.get('/api/gamification/leaderboard', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        u.id, u.name, g.xp, g.current_streak
      FROM public.gamification_profiles g
      JOIN public.users u ON g.user_id = u.id
      ORDER BY g.xp DESC
      LIMIT 10
    `)
    
    res.json(rows)
  } catch (err) {
    console.error('Error fetching leaderboard:', err)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

// Award XP & Update Streaks
router.post('/api/gamification/award-xp', requireAuth, async (req, res) => {
  res.status(410).json({ error: 'XP awards are disabled until they can be issued from verified server-side activity' })
})

export default router
