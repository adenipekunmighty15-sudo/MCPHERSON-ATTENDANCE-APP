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
  try {
    const { amount, reason } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    // Check last study date to update streaks
    const { rows: currentRows } = await query(`
      SELECT xp, current_streak, longest_streak, last_study_date
      FROM public.gamification_profiles
      WHERE user_id = $1
    `, [req.user.id])

    const profile = currentRows[0]
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let newStreak = profile.current_streak
    let longestStreak = profile.longest_streak

    if (profile.last_study_date) {
      const lastStudy = new Date(profile.last_study_date)
      lastStudy.setHours(0, 0, 0, 0)
      
      const diffTime = Math.abs(today - lastStudy)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        newStreak += 1 // Consecutive day
      } else if (diffDays > 1) {
        newStreak = 1 // Streak broken
      }
    } else {
      newStreak = 1 // First time studying
    }

    if (newStreak > longestStreak) {
      longestStreak = newStreak
    }

    const newXp = profile.xp + amount

    // Update profile
    await query(`
      UPDATE public.gamification_profiles
      SET xp = $1, current_streak = $2, longest_streak = $3, last_study_date = CURRENT_TIMESTAMP
      WHERE user_id = $4
    `, [newXp, newStreak, longestStreak, req.user.id])

    // Logic for awarding badges (Simulated threshold)
    const newBadges = []
    const checkBadge = async (badgeId, threshold) => {
      if (newXp >= threshold) {
        try {
          await query(`
            INSERT INTO public.gamification_badges (user_id, badge_id)
            VALUES ($1, $2)
          `, [req.user.id, badgeId])
          newBadges.push(badgeId)
        } catch (e) {
          // Unique constraint violation means they already have it
        }
      }
    }

    await checkBadge('first_steps', 100)
    await checkBadge('study_scholar', 500)
    await checkBadge('master_mind', 2000)

    res.json({
      success: true,
      xpAdded: amount,
      totalXp: newXp,
      streak: newStreak,
      newBadges
    })
  } catch (err) {
    console.error('Error awarding XP:', err)
    res.status(500).json({ error: 'Failed to award XP' })
  }
})

export default router
