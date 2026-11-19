import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query, pool } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { haversineDistance } from '../services/haversine.js'
import { notifyDepartment } from '../services/notification.js'
import {
  generateCheckinCode,
  getCheckinKey,
  verifyCheckinCode,
} from '../services/checkinCode.js'

const router = Router()

const LATE_AFTER_MINUTES = Number.isFinite(Number(process.env.ATTENDANCE_LATE_AFTER_MINUTES))
  ? Math.max(0, Number(process.env.ATTENDANCE_LATE_AFTER_MINUTES))
  : 15
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function nigeriaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function configuredCheckinKey(res) {
  try {
    const key = getCheckinKey()
    if (key) return key
  } catch (err) {
    console.error('Invalid session check-in secret:', err.message)
  }
  res.status(503).json({ error: 'Secure session check-in is not configured' })
  return null
}

router.get('/api/sessions/active', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, timetable_id AS "timetableId", course_id AS "courseId",
        course_name AS "courseName", lecturer_id AS "lecturerId",
        lecturer_name AS "lecturerName", venue_id AS "venueId",
        room, started_at AS "startedAt", ended_at AS "endedAt", status
       FROM public.live_sessions WHERE status = 'active'
       ORDER BY started_at DESC`
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Active sessions error:', err.message)
    res.status(500).json({ error: 'Failed to fetch active sessions' })
  }
})

router.get('/api/sessions/:id/checkin-code', authenticate, async (req, res) => {
  if (!['lecturer', 'admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only lecturers and administrators can view session codes' })
  }
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid session ID' })
  const key = configuredCheckinKey(res)
  if (!key) return
  try {
    const { rows } = await query(
      'SELECT lecturer_id, status FROM public.live_sessions WHERE id = $1',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Session not found' })
    if (rows[0].status !== 'active') return res.status(409).json({ error: 'Session is no longer active' })
    if (
      req.user.role === 'lecturer' &&
      rows[0].lecturer_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'You can only view codes for your own sessions' })
    }
    res.status(200).json(generateCheckinCode(req.params.id, key))
  } catch (err) {
    console.error('Session check-in code error:', err.message)
    res.status(500).json({ error: 'Failed to generate session code' })
  }
})

router.post('/api/sessions/start', authenticate, async (req, res) => {
  try {
    if (!['lecturer', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only lecturers can start sessions' })
    }
    if (!configuredCheckinKey(res)) return
    const { timetableId, courseId, venueId, room } = req.body
    if (!UUID_PATTERN.test(courseId || '') || !UUID_PATTERN.test(timetableId || '')) {
      return res.status(400).json({ error: 'Valid course and timetable IDs are required' })
    }

    const { rows: courseRows } = await query(
      'SELECT title FROM public.courses WHERE id = $1',
      [courseId]
    )
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' })
    const { rows: timetableRows } = await query(
      'SELECT course_id, lecturer_id FROM public.timetable WHERE id = $1',
      [timetableId]
    )
    if (!timetableRows.length) return res.status(404).json({ error: 'Timetable entry not found' })
    if (timetableRows[0].course_id !== courseId) {
      return res.status(400).json({ error: 'Timetable entry does not belong to this course' })
    }
    if (req.user.role === 'lecturer') {
      const { rows: assignments } = await query(
        `SELECT 1 FROM public.courses WHERE id = $1 AND lecturer_id = $2
         UNION
         SELECT 1 FROM public.lecturer_courses
         WHERE course_id = $1 AND lecturer_id = $2 AND is_active = true
         LIMIT 1`,
        [courseId, req.user.id]
      )
      if (!assignments.length || timetableRows[0].lecturer_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only start sessions for your courses' })
      }
    }
    const sessionCourseName = courseRows[0].title

    let detectedVenueId = venueId || ''
    if (detectedVenueId && !UUID_PATTERN.test(detectedVenueId)) {
      return res.status(400).json({ error: 'Invalid venue ID' })
    }
    if (!detectedVenueId && room) {
      const { rows: venueRows } = await query(
        'SELECT id FROM public.venues WHERE room_code = $1',
        [room]
      )
      if (venueRows.length) detectedVenueId = venueRows[0].id
    }
    if (detectedVenueId) {
      const { rows: venueRows } = await query(
        'SELECT room_code FROM public.venues WHERE id = $1',
        [detectedVenueId]
      )
      if (!venueRows.length) return res.status(404).json({ error: 'Venue not found' })
      if (room && venueRows[0].room_code !== room) {
        return res.status(400).json({ error: 'Room does not match the selected venue' })
      }
    }

    const id = randomUUID()
    await query(
      `INSERT INTO public.live_sessions
        (id, timetable_id, course_id, course_name, lecturer_id, lecturer_name, venue_id, room, started_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),'active')`,
      [id, timetableId || '', courseId || '', sessionCourseName, req.user.id, req.user.email?.split('@')[0] || 'Lecturer', detectedVenueId, room || '']
    )
    const { rows } = await query(
      `SELECT id, timetable_id AS "timetableId", course_id AS "courseId",
        course_name AS "courseName", lecturer_id AS "lecturerId",
        lecturer_name AS "lecturerName", venue_id AS "venueId",
        room, started_at AS "startedAt", ended_at AS "endedAt", status
       FROM public.live_sessions WHERE id = $1`,
      [id]
    )
    const session = rows[0]

    if (courseId) {
      query('SELECT department FROM public.courses WHERE id = $1', [courseId]).then(({ rows }) => {
        const dept = rows[0]?.department
        if (dept) {
          notifyDepartment(dept, 'live_session', `${sessionCourseName} is now live`,
            `${req.user.email?.split('@')[0] || 'Your lecturer'} has started ${sessionCourseName} in ${room || 'class'}. Join now!`,
            '/timetable', { sessionId: id, courseId })
        }
      }).catch(() => {})
    }

    res.status(201).json(session)
  } catch (err) {
    console.error('Failed to start session:', err.message)
    res.status(500).json({ error: 'Failed to start session' })
  }
})

router.post('/api/sessions/end/:id', authenticate, async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid session ID' })
  let client
  let transactionStarted = false
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    transactionStarted = true
    const { rows } = await client.query(
      'SELECT * FROM public.live_sessions WHERE id = $1 FOR UPDATE',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Session not found' })
    if (rows[0].lecturer_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not your session' })
    }
    if (rows[0].status !== 'active') {
      return res.status(409).json({ error: 'Session is no longer active' })
    }
    await client.query(
      "UPDATE public.live_sessions SET status = 'ended', ended_at = NOW() WHERE id = $1",
      [req.params.id]
    )
    await client.query(
      `INSERT INTO public.attendance
        (id, user_id, course_id, course_name, live_session_id, timetable_id,
         status, method, date, timestamp, location, session_id)
       SELECT gen_random_uuid(), e.user_id, $1, $2, $3, $4,
         'absent', 'manual', $5::date, NOW(), 'Not checked in', $3
       FROM public.enrollments e
       WHERE e.course_id = $1 AND e.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM public.attendance a
           WHERE a.user_id = e.user_id AND a.course_id = $1 AND a.date = $5::date
         )
       ON CONFLICT (user_id, course_id, date)
         WHERE course_id IS NOT NULL AND course_id::text <> ''
       DO NOTHING`,
      [rows[0].course_id, rows[0].course_name, rows[0].id, rows[0].timetable_id, nigeriaDate()]
    )
    await client.query('COMMIT')
    transactionStarted = false
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to end session:', err.message)
    res.status(500).json({ error: 'Failed to end session' })
  } finally {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Failed to roll back session end:', rollbackError.message)
      }
    }
    if (client) client.release()
  }
})

router.get('/api/sessions/:id/attendees', authenticate, async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid session ID' })
  try {
    const { rows: sessionRows } = await query(
      'SELECT lecturer_id FROM public.live_sessions WHERE id = $1',
      [req.params.id]
    )
    if (!sessionRows.length) return res.status(404).json({ error: 'Session not found' })
    if (
      !['admin', 'super_admin'].includes(req.user.role) &&
      sessionRows[0].lecturer_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized to view this session' })
    }
    const { rows } = await query(
      `SELECT a.id, a.user_id AS "userId", a.course_id AS "courseId",
        a.status, a.method, a.timestamp, a.location_lat AS "locationLat",
        a.location_lng AS "locationLng", a.session_id AS "sessionId",
        u.name AS "studentName", u.email AS "studentEmail"
       FROM public.attendance a
       LEFT JOIN public.users u ON a.user_id = u.id
       WHERE a.session_id = $1
       ORDER BY a.timestamp ASC`,
      [req.params.id]
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to fetch session attendees:', err.message)
    res.status(500).json({ error: 'Failed to fetch session attendees' })
  }
})

router.post('/api/attendance', authenticate, async (req, res) => {
  let client
  let transactionStarted = false
  try {
    const { courseId, method, sessionId, locationLat, locationLng, accuracy, verificationCode } = req.body
    if (!UUID_PATTERN.test(sessionId || '')) {
      return res.status(400).json({ error: 'A valid active session ID is required for check-in' })
    }
    const checkinKey = configuredCheckinKey(res)
    if (!checkinKey) return

    const lat = typeof locationLat === 'number' && isFinite(locationLat) ? locationLat : null
    const lng = typeof locationLng === 'number' && isFinite(locationLng) ? locationLng : null
    if (method && method !== 'GPS') {
      return res.status(400).json({ error: 'Only GPS check-in is currently supported and verified' })
    }
    if (lat === null || lng === null) {
      return res.status(400).json({ error: 'Location data is required for check-in' })
    }
    if (lat !== null && (lat < -90 || lat > 90) || lng !== null && (lng < -180 || lng > 180)) {
      return res.status(400).json({ error: 'Invalid location coordinates' })
    }
    if (
      accuracy !== undefined &&
      (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy <= 0 || accuracy > 100)
    ) {
      return res.status(400).json({ error: 'GPS accuracy must be 100 meters or better' })
    }

    const { rows: sessionRows } = await query(
      `SELECT course_id, course_name, venue_id, timetable_id, started_at, status
       FROM public.live_sessions WHERE id = $1`,
      [sessionId]
    )
    if (!sessionRows.length) return res.status(404).json({ error: 'Session not found' })
    const session = sessionRows[0]
    if (session.status !== 'active') return res.status(400).json({ error: 'Session is no longer active' })
    if (!verifyCheckinCode(sessionId, verificationCode, checkinKey)) {
      return res.status(403).json({ error: 'The rotating session code is invalid or expired' })
    }
    if (courseId && session.course_id && courseId !== session.course_id) {
      return res.status(400).json({ error: 'Course does not match the active session' })
    }
    const sessionCourseId = session.course_id || ''
    const sessionCourseName = session.course_name || ''
    if (!sessionCourseId && !sessionCourseName) {
      return res.status(400).json({ error: 'The active session is missing its course' })
    }

    let venueLocation = 'GPS'
    if (session.venue_id) {
    const { rows: venueRows } = await query(
      'SELECT name, latitude, longitude, radius_meters FROM public.venues WHERE id = $1',
      [session.venue_id]
    )
    if (!venueRows.length || venueRows[0].latitude == null || venueRows[0].longitude == null) {
      return res.status(503).json({ error: 'Session venue is not configured for location check-in' })
    }
    const venue = venueRows[0]
    venueLocation = venue.name || 'GPS'
    if (!Number.isFinite(Number(venue.radius_meters)) || Number(venue.radius_meters) <= 0) {
      return res.status(503).json({ error: 'Session venue has an invalid geofence' })
    }
      const distance = haversineDistance(lat, lng, venue.latitude, venue.longitude)
      if (distance > Number(venue.radius_meters)) {
        return res.status(403).json({
          error: `You are outside the class geofence (${Math.round(distance)}m from venue, max ${venue.radius_meters}m)`
        })
      }
    }

    const today = nigeriaDate()
    const startedAt = new Date(session.started_at).getTime()
    if (!Number.isFinite(startedAt)) {
      return res.status(503).json({ error: 'Active session has an invalid start time' })
    }
    const validStatus = Date.now() - startedAt >
      LATE_AFTER_MINUTES * 60 * 1000 ? 'late' : 'present'
    const validMethod = 'geofence'

    client = await pool.connect()
    await client.query('BEGIN')
    transactionStarted = true

    const id = randomUUID()
    const { rows: inserted } = await client.query(
      `INSERT INTO public.attendance
        (id, course_id, course_name, live_session_id, timetable_id, status, method, date,
         user_id, timestamp, location, session_id, location_lat, location_lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10,$4,$11,$12)
       ON CONFLICT DO NOTHING
       RETURNING id, course_id AS "courseId", course_name AS "courseName",
         status, method, date, user_id AS "userId", timestamp, location,
         session_id AS "sessionId", location_lat AS "locationLat",
         location_lng AS "locationLng"`,
       [id, sessionCourseId, sessionCourseName, sessionId, session.timetable_id, validStatus,
        validMethod, today, req.user.id, venueLocation, lat, lng]
    )

    if (!inserted.length) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(409).json({ error: 'Already checked in for this course or session' })
    }
    await client.query('COMMIT')
    transactionStarted = false
    res.status(201).json(inserted[0])
  } catch (err) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Failed to roll back attendance transaction:', rollbackError.message)
      }
    }
    console.error('Failed to record attendance:', err.message)
    res.status(500).json({ error: 'Failed to record attendance' })
  } finally {
    if (client) client.release()
  }
})

router.get('/api/attendance', authenticate, async (req, res) => {
  try {
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role)
    const isLecturer = req.user.role === 'lecturer'
    const params = isAdmin ? [] : [req.user.id]
    const where = isAdmin
      ? ''
      : isLecturer
        ? `WHERE EXISTS (
            SELECT 1 FROM public.live_sessions ls
            WHERE ls.id::text = a.session_id::text AND ls.lecturer_id = $1
          )`
        : 'WHERE a.user_id = $1'
    const { rows } = await query(
      `SELECT id, course_id AS "courseId", course_name AS "courseName",
        status, method, date, a.user_id AS "userId", timestamp, location,
        session_id AS "sessionId", location_lat AS "locationLat",
        location_lng AS "locationLng"
       FROM public.attendance a ${where} ORDER BY timestamp ASC`,
      params
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load attendance:', err.message)
    res.status(500).json({ error: 'Failed to load attendance' })
  }
})

export default router
