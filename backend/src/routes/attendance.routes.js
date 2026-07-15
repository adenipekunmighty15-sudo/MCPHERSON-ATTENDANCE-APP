import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query, pool } from '../../lib/db.js'
import { randomUUID } from 'crypto'
import { haversineDistance } from '../services/haversine.js'
import { notifyDepartment } from '../services/notification.js'

const router = Router()

const VALID_STATUSES = ['present', 'late', 'absent']
const VALID_METHODS = ['Face ID', 'NFC Tap', 'QR Code', 'Manual', 'GPS']

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

router.post('/api/sessions/start', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only lecturers can start sessions' })
    }
    const { timetableId, courseId, courseName, venueId, room } = req.body
    if (!courseName) return res.status(400).json({ error: 'Course name required' })

    let detectedVenueId = venueId || ''
    if (!detectedVenueId && room) {
      const { rows: venueRows } = await query(
        'SELECT id FROM public.venues WHERE room_code = $1',
        [room]
      )
      if (venueRows.length) detectedVenueId = venueRows[0].id
    }

    const id = randomUUID()
    await query(
      `INSERT INTO public.live_sessions
        (id, timetable_id, course_id, course_name, lecturer_id, lecturer_name, venue_id, room, started_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),'active')`,
      [id, timetableId || '', courseId || '', courseName, req.user.id, req.user.email.split('@')[0] || 'Lecturer', detectedVenueId, room || '']
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
          notifyDepartment(dept, 'live_session', `${courseName} is now live`,
            `${req.user.email?.split('@')[0] || 'Your lecturer'} has started ${courseName} in ${room || 'class'}. Join now!`,
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
  try {
    const { rows } = await query('SELECT * FROM public.live_sessions WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Session not found' })
    if (rows[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your session' })
    }
    await query(
      "UPDATE public.live_sessions SET status = 'ended', ended_at = NOW() WHERE id = $1",
      [req.params.id]
    )
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to end session:', err.message)
    res.status(500).json({ error: 'Failed to end session' })
  }
})

router.get('/api/sessions/:id/attendees', authenticate, async (req, res) => {
  try {
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
  try {
    const { courseId, courseName, status, method, location, sessionId, locationLat, locationLng } = req.body
    if (!courseId && !courseName) return res.status(400).json({ error: 'Course identifier required' })

    const validStatus = status && VALID_STATUSES.includes(status.toLowerCase()) ? status.toLowerCase() : 'present'
    const validMethod = method && VALID_METHODS.includes(method) ? method : 'manual'
    const lat = typeof locationLat === 'number' && isFinite(locationLat) ? locationLat : null
    const lng = typeof locationLng === 'number' && isFinite(locationLng) ? locationLng : null

    if (sessionId) {
      const { rows: sessionRows } = await query(
        'SELECT * FROM public.live_sessions WHERE id = $1',
        [sessionId]
      )
      if (!sessionRows.length) return res.status(404).json({ error: 'Session not found' })
      if (sessionRows[0].status !== 'active') return res.status(400).json({ error: 'Session is no longer active' })

      if (sessionRows[0].venue_id) {
        if (lat === null || lng === null) {
          return res.status(400).json({ error: 'Location data required for geofenced check-in' })
        }
        const { rows: venueRows } = await query(
          'SELECT * FROM public.venues WHERE id = $1',
          [sessionRows[0].venue_id]
        )
        if (venueRows.length) {
          const venue = venueRows[0]
          if (venue.latitude != null && venue.longitude != null) {
            const distance = haversineDistance(lat, lng, venue.latitude, venue.longitude)
            if (distance > venue.radius_meters) {
              return res.status(403).json({
                error: `You are outside the class geofence (${Math.round(distance)}m from venue, max ${venue.radius_meters}m)`
              })
            }
          }
        }
      }
    }

    const today = new Date().toISOString().split('T')[0]

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      if (courseId) {
        const { rows: dup } = await client.query(
          "SELECT id FROM public.attendance WHERE user_id=$1 AND course_id=$2 AND date=$3 AND status IN ('present','late')",
          [req.user.id, courseId, today]
        )
        if (dup.length) {
          await client.query('ROLLBACK')
          client.release()
          return res.status(409).json({ error: 'Already checked in for this course today' })
        }
      }

      const id = randomUUID()
      const { rows: inserted } = await client.query(
        `INSERT INTO public.attendance
          (id, course_id, course_name, status, method, date, user_id, timestamp, location, session_id, location_lat, location_lng)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9,$10,$11)
         RETURNING id, course_id AS "courseId", course_name AS "courseName",
           status, method, date, user_id AS "userId", timestamp, location,
           session_id AS "sessionId", location_lat AS "locationLat",
           location_lng AS "locationLng"`,
         [id, courseId || '', courseName || '', validStatus, validMethod, today, req.user.id,
          location || '', sessionId || '', lat ?? 0, lng ?? 0]
      )

      await client.query('COMMIT')
      client.release()
      res.status(201).json(inserted[0])
    } catch (err) {
      await client.query('ROLLBACK')
      client.release()
      throw err
    }
  } catch (err) {
    console.error('Failed to record attendance:', err.message)
    res.status(500).json({ error: 'Failed to record attendance' })
  }
})

router.get('/api/attendance', authenticate, async (req, res) => {
  try {
    const canViewAll = ['admin', 'super_admin', 'lecturer'].includes(req.user.role)
    const params = canViewAll ? [] : [req.user.id]
    const where = canViewAll ? '' : 'WHERE user_id = $1'
    const { rows } = await query(
      `SELECT id, course_id AS "courseId", course_name AS "courseName",
        status, method, date, user_id AS "userId", timestamp, location,
        session_id AS "sessionId", location_lat AS "locationLat",
        location_lng AS "locationLng"
       FROM public.attendance ${where} ORDER BY timestamp ASC`,
      params
    )
    res.status(200).json(rows)
  } catch (err) {
    console.error('Failed to load attendance:', err.message)
    res.status(500).json({ error: 'Failed to load attendance' })
  }
})

export default router
