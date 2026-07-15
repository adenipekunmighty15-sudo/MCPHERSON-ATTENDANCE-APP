import { query } from '../../lib/db.js'

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

export async function buildFeatureVector(userId) {
  const [statsRes, attendanceRes, studyRes, cardsRes, sessionsRes] = await Promise.allSettled([
    query('SELECT COALESCE(MAX(rate),0) as rate, COALESCE(MAX(streak),0) as streak, COALESCE(MAX(total),0) as total FROM public.attendance_stats WHERE user_id=$1', [userId]),
    query("SELECT COUNT(*) FILTER (WHERE status='late') as late_count, COUNT(*) FILTER (WHERE status='absent') as absent_count FROM public.attendance WHERE user_id=$1", [userId]),
    query("SELECT COUNT(*) as count FROM public.study_sessions WHERE user_id=$1 AND created_at > NOW() - INTERVAL '7 days'", [userId]),
    query('SELECT COUNT(*) as count FROM public.flashcard_reviews WHERE user_id=$1 AND repetitions >= 3', [userId]),
    query("SELECT date, status FROM public.attendance WHERE user_id=$1 AND date > NOW() - INTERVAL '30 days' ORDER BY date", [userId]),
  ])

  const stats = statsRes.status === 'fulfilled' ? statsRes.value.rows[0] || {} : {}
  const attendanceRows = attendanceRes.status === 'fulfilled' ? attendanceRes.value.rows[0] || {} : {}
  const studyCount = studyRes.status === 'fulfilled' ? parseInt(studyRes.value.rows[0]?.count) || 0 : 0
  const cardsMastered = cardsRes.status === 'fulfilled' ? parseInt(cardsRes.value.rows[0]?.count) || 0 : 0
  const recentAttendance = sessionsRes.status === 'fulfilled' ? sessionsRes.value.rows || [] : []

  const attendanceRate = parseFloat(stats.rate) || 0
  const streakLength = parseInt(stats.streak) || 0
  const lateCount = parseInt(attendanceRows.late_count) || 0
  const absentCount = parseInt(attendanceRows.absent_count) || 0
  const total = parseInt(stats.total) || 1

  const dayCounts = {}
  for (const row of recentAttendance) {
    if (row.date) {
      const d = new Date(row.date)
      const dayKey = d.toISOString().slice(0, 10)
      if (!dayCounts[dayKey]) dayCounts[dayKey] = { present: 0, total: 0 }
      dayCounts[dayKey].total++
      if (row.status === 'present') dayCounts[dayKey].present++
    }
  }

  const dailyRates = Object.values(dayCounts).map(d => d.present / d.total)
  const meanRate = dailyRates.length ? dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length : 0
  const variance = dailyRates.length
    ? dailyRates.reduce((sum, r) => sum + (r - meanRate) ** 2, 0) / dailyRates.length
    : 0
  const classConsistencyScore = Math.round((1 - Math.min(variance, 1)) * 100)

  const quizzesTaken7d = studyCount

  return {
    attendance_rate: attendanceRate,
    streak_length: streakLength,
    late_count: lateCount,
    absent_count: absentCount,
    study_sessions_7d: studyCount,
    quizzes_taken_7d: quizzesTaken7d,
    cards_mastered: cardsMastered,
    class_consistency_score: classConsistencyScore,
  }
}

export async function predictAttendanceRisk(userId) {
  const featureVector = await buildFeatureVector(userId)

  const baseRisk = (1 - featureVector.attendance_rate / 100) * 50
  const streakPenalty = featureVector.streak_length < 3 ? (3 - featureVector.streak_length) * 5 : 0
  const latePenalty = featureVector.late_count * 3
  const studyBoost = featureVector.study_sessions_7d * -2
  const consistencyFactor = (100 - featureVector.class_consistency_score) * 0.3

  const rawScore = baseRisk + streakPenalty + latePenalty + studyBoost + consistencyFactor
  const riskScore = clamp(Math.round(rawScore))

  const factors = []
  if (featureVector.attendance_rate < 75) factors.push({ factor: 'low_attendance_rate', impact: 'negative', detail: `Attendance rate is ${featureVector.attendance_rate}%` })
  if (featureVector.streak_length < 3) factors.push({ factor: 'short_streak', impact: 'negative', detail: `Current streak is only ${featureVector.streak_length} days` })
  if (featureVector.late_count > 3) factors.push({ factor: 'frequent_lateness', impact: 'negative', detail: `${featureVector.late_count} late arrivals recorded` })
  if (featureVector.study_sessions_7d === 0) factors.push({ factor: 'no_recent_study', impact: 'negative', detail: 'No study sessions in the last 7 days' })
  if (featureVector.study_sessions_7d >= 5) factors.push({ factor: 'strong_study_habit', impact: 'positive', detail: `${featureVector.study_sessions_7d} study sessions this week` })
  if (featureVector.class_consistency_score < 60) factors.push({ factor: 'inconsistent_attendance', impact: 'negative', detail: `Class consistency is low (${featureVector.class_consistency_score}%)` })

  const nextAbsenceProbability = clamp(Math.round((rawScore + 10) / 1.5))

  return {
    risk_score: riskScore,
    predicted_next_absence_probability: nextAbsenceProbability,
    factors,
    feature_vector: featureVector,
  }
}

export async function predictAcademicRisk(userId) {
  const [attendanceRisk, quizRes, sentimentRes] = await Promise.allSettled([
    predictAttendanceRisk(userId),
    query("SELECT COALESCE(AVG(score),0) as avg_score FROM public.study_sessions WHERE user_id=$1 AND session_type='quiz'", [userId]),
    query("SELECT cm.content FROM public.chat_messages cm JOIN public.chat_conversations cc ON cm.conversation_id = cc.id WHERE cc.user_id=$1 ORDER BY cm.created_at DESC LIMIT 20", [userId]),
  ])

  const risk = attendanceRisk.status === 'fulfilled' ? attendanceRisk.value : { risk_score: 50, feature_vector: {} }
  const avgQuizScore = quizRes.status === 'fulfilled' ? parseFloat(quizRes.value.rows[0]?.avg_score) || 0 : 0
  const recentMessages = sentimentRes.status === 'fulfilled' ? sentimentRes.value.rows || [] : []

  const negativeWords = ['stressed', 'tired', 'struggling', 'difficult', 'overwhelmed', 'failing', 'behind', 'confused']
  const sentimentScore = recentMessages.length
    ? Math.round((recentMessages.filter(m => negativeWords.some(w => (m.content || '').toLowerCase().includes(w))).length / recentMessages.length) * 100)
    : 0

  const attendanceComponent = risk.risk_score * 0.5
  const quizComponent = (100 - avgQuizScore) * 0.3
  const sentimentComponent = sentimentScore * 0.2

  const academicRiskScore = clamp(Math.round(attendanceComponent + quizComponent + sentimentComponent))

  return {
    academic_risk_score: academicRiskScore,
    attendance_risk: risk.risk_score,
    avg_quiz_score: Math.round(avgQuizScore),
    sentiment_score: sentimentScore,
    components: {
      attendance: Math.round(attendanceComponent),
      quiz_performance: Math.round(quizComponent),
      sentiment: Math.round(sentimentComponent),
    },
  }
}

export async function getAtRiskStudents() {
  const { rows: students } = await query("SELECT id, name, email, department FROM public.users WHERE role='student'")
  const results = []

  for (const student of students) {
    try {
      const risk = await predictAttendanceRisk(student.id)
      if (risk.risk_score > 60) {
        results.push({
          user_id: student.id,
          name: student.name,
          email: student.email,
          department: student.department,
          ...risk,
        })
      }
    } catch {}
  }

  return results.sort((a, b) => b.risk_score - a.risk_score)
}

export async function generateInsights(userId) {
  const featureVector = await buildFeatureVector(userId)
  const risk = await predictAttendanceRisk(userId)
  const insights = []

  if (featureVector.streak_length >= 5) {
    insights.push({ type: 'attendance', severity: -2, text: `You're on a ${featureVector.streak_length}-day attendance streak! Keep it up!` })
  } else if (featureVector.streak_length === 0) {
    insights.push({ type: 'warning', severity: 3, text: "You haven't attended any classes recently. Your streak is at risk." })
  }

  const { rows: recentAttendance } = await query(
    "SELECT c.title, a.date, a.status FROM public.attendance a JOIN public.courses c ON a.course_id = c.id WHERE a.user_id=$1 AND a.date > NOW() - INTERVAL '14 days' ORDER BY a.date DESC",
    [userId]
  )

  const dayPattern = {}
  for (const row of recentAttendance) {
    if (row.date) {
      const dayName = new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' })
      if (!dayPattern[dayName]) dayPattern[dayName] = { total: 0, missed: 0 }
      dayPattern[dayName].total++
      if (row.status !== 'present') dayPattern[dayName].missed++
    }
  }

  for (const [day, data] of Object.entries(dayPattern)) {
    if (data.missed >= 2 && data.total >= 3) {
      insights.push({ type: 'pattern', severity: 2, text: `You've missed ${data.missed} of the last ${data.total} ${day} classes.` })
    }
  }

  if (featureVector.study_sessions_7d === 0) {
    insights.push({ type: 'study', severity: 2, text: 'No study sessions logged this week. Try to study for at least 30 minutes daily.' })
  } else if (featureVector.study_sessions_7d >= 5) {
    insights.push({ type: 'study', severity: -1, text: `Great study consistency! You've studied ${featureVector.study_sessions_7d} times this week.` })
  }

  if (featureVector.late_count > 5) {
    insights.push({ type: 'warning', severity: 2, text: `You've been late ${featureVector.late_count} times. Try arriving 5 minutes earlier.` })
  }

  if (risk.risk_score > 60) {
    insights.push({ type: 'warning', severity: 3, text: `Your attendance risk score is ${risk.risk_score}/100. Please speak with your academic advisor.` })
  }

  if (risk.risk_score < 30 && featureVector.study_sessions_7d >= 3) {
    insights.push({ type: 'attendance', severity: -3, text: 'You are on track! Excellent attendance and study habits.' })
  }

  if (featureVector.cards_mastered > 20) {
    insights.push({ type: 'study', severity: -1, text: `You've mastered ${featureVector.cards_mastered} flashcards. Keep reviewing to retain knowledge.` })
  }

  return insights.slice(0, 6)
}

export async function predictNextWeekAttendance(userId) {
  const featureVector = await buildFeatureVector(userId)
  const baseProb = featureVector.attendance_rate / 100

  const { rows: classes } = await query(
    "SELECT t.id, t.course, t.day, t.time, t.room, t.lecturer, t.type FROM public.timetable t WHERE t.department = (SELECT department FROM public.users WHERE id=$1) ORDER BY t.day, t.time",
    [userId]
  )

  const { rows: history } = await query(
    "SELECT c.title, a.status, a.date FROM public.attendance a JOIN public.courses c ON a.course_id = c.id WHERE a.user_id=$1 ORDER BY a.date DESC LIMIT 100",
    [userId]
  )

  const courseHistory = {}
  for (const row of history) {
    if (row.title) {
      if (!courseHistory[row.title]) courseHistory[row.title] = { total: 0, present: 0 }
      courseHistory[row.title].total++
      if (row.status === 'present') courseHistory[row.title].present++
    }
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayIndex = new Date().getDay()

  return classes.map(c => {
    const courseSpecificRate = courseHistory[c.course]
      ? courseHistory[c.course].present / courseHistory[c.course].total
      : baseProb

    const dayIndex = days.indexOf(c.day?.toLowerCase())
    const daysAway = dayIndex >= todayIndex ? dayIndex - todayIndex : dayIndex + 7 - todayIndex
    const recencyFactor = Math.max(0.8, 1 - daysAway * 0.03)

    const adjustedProb = clamp(Math.round(courseSpecificRate * recencyFactor * 100 + (featureVector.streak_length * 1.5)), 0, 100)

    return {
      course_name: c.course,
      day: c.day,
      time: c.time,
      room: c.room,
      lecturer: c.lecturer,
      type: c.type,
      day_index: dayIndex,
      days_away: daysAway,
      attendance_probability: adjustedProb,
      predicted_status: adjustedProb >= 70 ? 'likely_present' : adjustedProb >= 40 ? 'uncertain' : 'likely_absent',
    }
  })
}
