import { query } from '../../lib/db.js'

const insightsStore = new Map()

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 }

function generateId() {
  return 'pi_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

export async function runProactiveCheck(userId) {
  const insights = []

  try {
    const [attRes, studyRes, quizRes, examRes, flashcardRes, podcastRes, streakRes] = await Promise.allSettled([
      query(`SELECT COALESCE(rate,0) as rate, COALESCE(streak,0) as streak FROM public.attendance_stats WHERE user_id=$1`, [userId]),
      query(`SELECT COUNT(*) as count FROM public.study_sessions WHERE user_id=$1 AND started_at > NOW() - INTERVAL '3 days'`, [userId]),
      query(`SELECT score FROM public.study_sessions WHERE user_id=$1 AND session_type='quiz' ORDER BY started_at DESC LIMIT 2`, [userId]),
      query(`SELECT c.title, t.time FROM public.timetable t JOIN public.courses c ON t.course = c.code WHERE t.user_id=$1 AND t.time IS NOT NULL ORDER BY t.day, t.time LIMIT 1`, [userId]),
      query(`SELECT COUNT(*) as total, COUNT(CASE WHEN fr.next_review <= NOW()::date THEN 1 END) as due FROM public.flashcards f LEFT JOIN public.flashcard_reviews fr ON fr.flashcard_id = f.id::text AND fr.user_id=$1 WHERE f.material_id IN (SELECT id FROM public.study_materials WHERE created_by=$1)`, [userId]),
      query(`SELECT COUNT(*) as count FROM public.study_materials WHERE created_by=$1 AND podcast_url IS NOT NULL AND podcast_url != ''`, [userId]),
      query(`SELECT COUNT(*) as streak FROM public.study_sessions WHERE user_id=$1 AND started_at >= CURRENT_DATE`, [userId]),
    ])

    const stats = attRes.status === 'fulfilled' ? attRes.value.rows[0] || {} : {}
    const currentRate = parseInt(stats.rate) || 0
    const streak = parseInt(stats.streak) || 0

    const oldAttRes = await query(
      `SELECT COALESCE(AVG(rate),0) as old_rate FROM public.attendance_history WHERE user_id=$1 AND recorded_at <= NOW() - INTERVAL '7 days'`,
      [userId]
    ).catch(() => ({ rows: [{ old_rate: currentRate }] }))
    const oldRate = parseInt(oldAttRes.rows[0]?.old_rate) || currentRate

    if (oldRate > 0 && (oldRate - currentRate) > 10) {
      insights.push({
        id: generateId(), type: 'attendance_drop', priority: 'high',
        text: `Your attendance has dropped ${oldRate - currentRate}%. Your next class is in 2 hours.`,
        createdAt: new Date().toISOString(), dismissed: false,
      })
    }

    if (streak === 0 && currentRate > 0) {
      insights.push({
        id: generateId(), type: 'streak_reset', priority: 'high',
        text: "You missed yesterday. One bad day doesn't define you.",
        createdAt: new Date().toISOString(), dismissed: false,
      })
    }

    const recentStudy = studyRes.status === 'fulfilled' ? parseInt(studyRes.value.rows[0]?.count) || 0 : 0
    if (recentStudy === 0) {
      insights.push({
        id: generateId(), type: 'study_reminder', priority: 'medium',
        text: 'Your flashcards are waiting.',
        createdAt: new Date().toISOString(), dismissed: false,
      })
    }

    if (quizRes.status === 'fulfilled' && quizRes.value.rows.length >= 2) {
      const latest = parseInt(quizRes.value.rows[0]?.score) || 0
      const prev = parseInt(quizRes.value.rows[1]?.score) || 0
      if (latest < prev && prev > 0) {
        insights.push({
          id: generateId(), type: 'quiz_drop', priority: 'medium',
          text: 'Your quiz scores dipped. Want to review weak areas?',
          createdAt: new Date().toISOString(), dismissed: false,
        })
      }
    }

    if (examRes.status === 'fulfilled' && examRes.value.rows.length > 0) {
      insights.push({
        id: generateId(), type: 'exam_approaching', priority: 'high',
        text: "Exam in 2 days! Here's a quick study plan.",
        createdAt: new Date().toISOString(), dismissed: false,
      })
    }

    // Flashcard due review
    if (flashcardRes.status === 'fulfilled') {
      const fc = flashcardRes.value.rows[0] || {}
      const dueCount = parseInt(fc.due) || 0
      const totalCount = parseInt(fc.total) || 0
      if (dueCount > 0) {
        insights.push({
          id: generateId(), type: 'flashcards_due', priority: dueCount > 20 ? 'high' : 'medium',
          text: `${dueCount} flashcard${dueCount > 1 ? 's' : ''} due for review. Spaced repetition works best when you review on time.`,
          createdAt: new Date().toISOString(), dismissed: false,
        })
      } else if (totalCount === 0) {
        insights.push({
          id: generateId(), type: 'no_flashcards', priority: 'low',
          text: "You haven't created any flashcards yet. Upload a note to auto-generate them!",
          createdAt: new Date().toISOString(), dismissed: false,
        })
      }
    }

    // Study session streak
    if (streakRes.status === 'fulfilled') {
      const todaySessions = parseInt(streakRes.value.rows[0]?.streak) || 0
      if (todaySessions === 0) {
        const dayOfWeek = new Date().getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          insights.push({
            id: generateId(), type: 'study_today', priority: 'medium',
            text: "You haven't studied today yet. Even 15 minutes of flashcard review counts!",
            createdAt: new Date().toISOString(), dismissed: false,
          })
        }
      } else if (todaySessions >= 3) {
        insights.push({
          id: generateId(), type: 'study_streak', priority: 'low',
          text: `${todaySessions} study sessions today! You're on fire. Take a break and come back fresh.`,
          createdAt: new Date().toISOString(), dismissed: false,
        })
      }
    }

    // Podcast reminder
    if (podcastRes.status === 'fulfilled') {
      const hasPodcasts = parseInt(podcastRes.value.rows[0]?.count) || 0
      if (hasPodcasts > 0) {
        insights.push({
          id: generateId(), type: 'podcast_available', priority: 'low',
          text: `You have ${hasPodcasts} study podcast${hasPodcasts > 1 ? 's' : ''}. Listen during your commute for passive learning.`,
          createdAt: new Date().toISOString(), dismissed: false,
        })
      }
    }

    const existing = insightsStore.get(userId) || []
    const dismissedIds = new Set(existing.filter(i => i.dismissed).map(i => i.id))
    const merged = [...insights.filter(i => !dismissedIds.has(i.id)), ...existing.filter(i => dismissedIds.has(i.id))]
    insightsStore.set(userId, merged)

    return merged
  } catch (err) {
    console.error('Proactive check error:', err.message)
    return insightsStore.get(userId) || []
  }
}

export async function getProactiveInsights(userId) {
  const allInsights = await runProactiveCheck(userId)
  return allInsights
    .filter(i => !i.dismissed)
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] || 0
      const pb = PRIORITY_ORDER[b.priority] || 0
      if (pa !== pb) return pb - pa
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
}

export async function dismissInsight(userId, insightId) {
  const insights = insightsStore.get(userId) || []
  const idx = insights.findIndex(i => i.id === insightId)
  if (idx !== -1) {
    insights[idx].dismissed = true
    insightsStore.set(userId, insights)
    return true
  }
  return false
}
