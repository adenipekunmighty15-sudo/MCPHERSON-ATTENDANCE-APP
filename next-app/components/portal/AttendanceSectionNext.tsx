'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { api } from '@/lib/api'
import s from './attendanceNext.module.css'

type Row = Record<string, unknown>

type PortalUser = {
  id?: string
  name?: string
  role?: string
  matricNumber?: string
} | null

export type AttendanceRecord = Row & {
  id?: string
  courseId?: string
  course_id?: string
  courseName?: string
  course_name?: string
  studentName?: string
  studentId?: string
  status?: string
  timestamp?: string
  date?: string
  method?: string
  location?: string
  sessionId?: string
}

export type LiveSession = {
  id: string
  courseId?: string
  courseName?: string
  lecturerName?: string
  room?: string
  startedAt?: string
}

type Course = Row & { id?: string; title?: string; name?: string; code?: string }
type Venue = Row & { id?: string; room_code?: string; name?: string }

type RosterStudent = {
  userId: string
  studentName: string
  matricNumber: string
  status: string
  method: string
  timestamp: string
}

type CheckinResponse = { code?: string; expiresAt?: string }

type View = 'checkin' | 'teach'
type HistoryFilter = 'all' | 'attended' | 'missed'
type Status = 'present' | 'late' | 'absent' | 'excused' | 'left_early'

const STATUS_LABELS: Record<Status, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  excused: 'Excused',
  left_early: 'Left early',
}

function pick(row: Row, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value)
  }
  return ''
}

function asRows<T extends Row>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const wrapped = (value as { data?: unknown }).data
    if (Array.isArray(wrapped)) return wrapped as T[]
  }
  return []
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Something went wrong. Please try again.'
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function formatTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function nigeriaDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function courseId(course: Course): string {
  return pick(course as Row, ['id', 'courseId', 'course_id', 'code'])
}

function courseTitle(course: Course): string {
  return pick(course as Row, ['title', 'name', 'courseName', 'course_name']) || 'Untitled course'
}

function initials(name?: string): string {
  return (name || 'ST')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function statusKey(status?: string): Status | 'recorded' {
  const value = (status || '').toLowerCase().trim()
  return value in STATUS_LABELS ? (value as Status) : 'recorded'
}

function statusLabel(status?: string): string {
  const key = statusKey(status)
  return key === 'recorded' ? 'Recorded' : STATUS_LABELS[key]
}

function tone(status?: string): string {
  const key = statusKey(status)
  if (key === 'present') return s.toneGood
  if (key === 'late') return s.toneWarn
  if (key === 'absent') return s.toneBad
  return s.toneNeutral
}

function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const cell = (value: string) => `"${String(value || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((line) => line.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function AttendanceSectionNext({
  user,
  attendance,
  sessions,
  loading,
  error,
  onReload,
}: {
  user: PortalUser
  attendance: AttendanceRecord[]
  sessions: LiveSession[]
  loading: boolean
  error: string
  onReload: () => void
}) {
  const isStaff = Boolean(user && ['lecturer', 'admin', 'super_admin'].includes(user.role || ''))
  const [view, setView] = useState<View>(isStaff ? 'teach' : 'checkin')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [success, setSuccess] = useState<{ course: string; time: string; status: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [showAllHistory, setShowAllHistory] = useState(false)

  const [courses, setCourses] = useState<Course[]>([])
  const [timetableSlots, setTimetableSlots] = useState<Row[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [room, setRoom] = useState('')
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)

  const [checkinCode, setCheckinCode] = useState('')
  const expiresAtRef = useRef('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')

  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState('')
  const [markingUserId, setMarkingUserId] = useState('')

  useEffect(() => {
    setView(isStaff ? 'teach' : 'checkin')
  }, [isStaff])

  const activeSession = useMemo(() => {
    if (!sessions.length) return null
    return sessions.find((session) => session.id === selectedSessionId) || sessions[0]
  }, [sessions, selectedSessionId])

  const rows = useMemo(() => attendance.map((item) => ({
    id: pick(item, ['id']),
    courseId: pick(item, ['courseId', 'course_id']),
    course: pick(item, ['courseName', 'course_name', 'course', 'title']) || 'Attendance record',
    status: pick(item, ['status']),
    date: pick(item, ['date']) || formatDate(pick(item, ['timestamp'])),
    time: formatTime(pick(item, ['timestamp'])) || pick(item, ['timeIn', 'time_in']),
    method: pick(item, ['method']),
  })).sort((a, b) => {
    const aTime = new Date(a.date).getTime() || 0
    const bTime = new Date(b.date).getTime() || 0
    return bTime - aTime
  }), [attendance])

  const summary = useMemo(() => ({
    present: rows.filter((row) => statusKey(row.status) === 'present').length,
    late: rows.filter((row) => statusKey(row.status) === 'late').length,
    absent: rows.filter((row) => statusKey(row.status) === 'absent').length,
  }), [rows])

  const attendanceRate = useMemo(() => {
    if (!rows.length) return null
    return Math.round(((summary.present + summary.late * 0.5) / rows.length) * 100)
  }, [rows.length, summary.late, summary.present])

  const alreadyCheckedIn = useMemo(() => {
    if (!activeSession?.courseId || !rows.length) return false
    const today = nigeriaDate()
    return rows.some((row) => row.courseId === activeSession.courseId && row.date === today && statusKey(row.status) !== 'absent')
  }, [activeSession?.courseId, rows])

  const filteredHistory = useMemo(() => rows.filter((row) => {
    if (historyFilter === 'attended') return ['present', 'late', 'excused'].includes(statusKey(row.status) as string)
    if (historyFilter === 'missed') return statusKey(row.status) === 'absent'
    return true
  }), [historyFilter, rows])

  const visibleHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5)

  const matchingSlots = useMemo(() => timetableSlots.filter((slot) =>
    selectedCourseId && (
      pick(slot, ['course_id', 'courseId']) === selectedCourseId ||
      pick(slot, ['course', 'course_name', 'courseName']) === courses.find((course) => courseId(course) === selectedCourseId)?.title
    )
  ), [courses, selectedCourseId, timetableSlots])

  const filteredRoster = useMemo(() => {
    const query = rosterSearch.trim().toLowerCase()
    if (!query) return roster
    return roster.filter((student) => [student.studentName, student.matricNumber].some((value) => value.toLowerCase().includes(query)))
  }, [roster, rosterSearch])

  const rosterSummary = useMemo(() => ({
    present: roster.filter((student) => ['present', 'late'].includes(statusKey(student.status) as string)).length,
    absent: roster.filter((student) => statusKey(student.status) === 'absent').length,
  }), [roster])

  const loadOptions = useCallback(async () => {
    if (!isStaff) return
    setOptionsLoading(true)
    setOptionsError('')
    try {
      const [courseData, timetableData, venueData] = await Promise.all([
        api.get<unknown>('/courses/enrolled', { cache: false }),
        api.get<unknown>('/timetable', { cache: false }),
        api.get<unknown>('/venues', { cache: false }),
      ])
      setCourses(asRows<Course>(courseData))
      setTimetableSlots(asRows<Row>(timetableData))
      setVenues(asRows<Venue>(venueData))
    } catch (err) {
      setOptionsError(messageOf(err))
    } finally {
      setOptionsLoading(false)
    }
  }, [isStaff])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const loadCode = useCallback(async () => {
    if (!isStaff || !activeSession?.id) return
    setCodeLoading(true)
    setCodeError('')
    try {
      const response = await api.get<CheckinResponse>(`/sessions/${encodeURIComponent(activeSession.id)}/checkin-code`, { cache: false })
      setCheckinCode(response?.code || '')
      expiresAtRef.current = response?.expiresAt || ''
      if (response?.expiresAt) {
        setSecondsLeft(Math.max(0, Math.ceil((new Date(response.expiresAt).getTime() - Date.now()) / 1000)))
      }
    } catch (err) {
      setCodeError(messageOf(err))
      setCheckinCode('')
    } finally {
      setCodeLoading(false)
    }
  }, [activeSession?.id, isStaff])

  useEffect(() => {
    if (view !== 'teach' || !isStaff || !activeSession?.id) {
      setCheckinCode('')
      expiresAtRef.current = ''
      setSecondsLeft(0)
      return
    }
    void loadCode()
    const codeTimer = window.setInterval(() => void loadCode(), 20_000)
    const tickTimer = window.setInterval(() => {
      const expiresAt = expiresAtRef.current
      if (!expiresAt) return
      setSecondsLeft(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    }, 1_000)
    return () => {
      window.clearInterval(codeTimer)
      window.clearInterval(tickTimer)
    }
  }, [activeSession?.id, isStaff, loadCode, view])

  const loadRoster = useCallback(async () => {
    if (!isStaff || !activeSession?.id) return
    setRosterLoading(true)
    setRosterError('')
    try {
      const response = await api.get<unknown>(`/sessions/${encodeURIComponent(activeSession.id)}/roster`, { cache: false })
      setRoster(asRows<RosterStudent>(response).map((student) => ({
        userId: pick(student as Row, ['userId', 'user_id', 'id']),
        studentName: pick(student as Row, ['studentName', 'student_name', 'name']) || 'Student',
        matricNumber: pick(student as Row, ['matricNumber', 'admissionNumber', 'admission_number', 'studentEmail', 'email']),
        status: pick(student as Row, ['status']) || 'absent',
        method: pick(student as Row, ['method']),
        timestamp: pick(student as Row, ['timestamp']),
      })))
    } catch (err) {
      setRosterError(messageOf(err))
    } finally {
      setRosterLoading(false)
    }
  }, [activeSession?.id, isStaff])

  useEffect(() => {
    if (view === 'teach' && activeSession?.id) void loadRoster()
  }, [activeSession?.id, loadRoster, view])

  async function checkIn(event: FormEvent) {
    event.preventDefault()
    if (!activeSession) {
      setNotice('Wait for your lecturer to start a live class.')
      return
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setNotice('Enter the six-digit code shown by your lecturer.')
      return
    }
    if (!navigator.geolocation) {
      setNotice('This browser does not support location verification.')
      return
    }
    setBusy(true)
    setNotice('')
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await api.post<{ status?: string }>('/attendance', {
          sessionId: activeSession.id,
          courseId: activeSession.courseId,
          method: 'GPS',
          locationLat: position.coords.latitude,
          locationLng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          verificationCode: code.trim(),
        })
        setSuccess({
          course: activeSession.courseName || 'Live class',
          time: formatTime(new Date().toISOString()) || 'now',
          status: statusLabel(response?.status || 'present'),
        })
        setCode('')
        onReload()
      } catch (err) {
        setNotice(messageOf(err))
      } finally {
        setBusy(false)
      }
    }, (err) => {
      setNotice(err.message || 'Location permission was denied. Allow location access and try again.')
      setBusy(false)
    }, { enableHighAccuracy: true, timeout: 10_000 })
  }

  async function startSession() {
    if (!selectedCourseId || !selectedSlotId) {
      setNotice('Choose a course and class slot first.')
      return
    }
    setStarting(true)
    setNotice('')
    try {
      await api.post('/sessions/start', {
        courseId: selectedCourseId,
        timetableId: selectedSlotId,
        venueId: selectedVenueId || undefined,
        room: room.trim() || undefined,
      })
      setSelectedCourseId('')
      setSelectedSlotId('')
      setSelectedVenueId('')
      setRoom('')
      setNotice('Class is live. Project the code below so students can check in.')
      onReload()
    } catch (err) {
      setNotice(messageOf(err))
    } finally {
      setStarting(false)
    }
  }

  async function endSession() {
    if (!activeSession?.id) return
    setEnding(true)
    setNotice('')
    try {
      await api.post(`/sessions/end/${encodeURIComponent(activeSession.id)}`, {})
      setNotice('Class ended. Missing attendance was saved as absent.')
      onReload()
    } catch (err) {
      setNotice(messageOf(err))
    } finally {
      setEnding(false)
    }
  }

  async function markStudent(userId: string, status: Status) {
    if (!activeSession?.id) return
    setMarkingUserId(userId)
    setRosterError('')
    try {
      await api.post(`/sessions/${encodeURIComponent(activeSession.id)}/attendance`, { userId, status })
      setRoster((current) => current.map((student) => student.userId === userId
        ? { ...student, status, method: 'manual', timestamp: new Date().toISOString() }
        : student))
      onReload()
    } catch (err) {
      setRosterError(messageOf(err))
    } finally {
      setMarkingUserId('')
    }
  }

  function exportRoster() {
    downloadCsv('mcpherson-class-attendance.csv',
      ['Student', 'Matric number', 'Status', 'Method', 'Time'],
      filteredRoster.map((student) => [student.studentName, student.matricNumber, statusLabel(student.status), student.method || '—', formatTime(student.timestamp)]))
  }

  async function copyCode() {
    if (!checkinCode) return
    try {
      await navigator.clipboard.writeText(checkinCode)
      setNotice('Code copied to clipboard.')
    } catch {
      setNotice('Select the code and copy it manually.')
    }
  }

  return (
    <div className={s.wrap}>
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <span className={s.eyebrow}>Attendance workspace</span>
          <h2>{activeSession ? 'Your class is live' : 'Attendance, without the queue'}</h2>
          <p>
            {activeSession
              ? `${activeSession.courseName || 'Your class'} is in progress. ${isStaff ? 'Project the code and manage your roster here.' : 'Enter the code from your lecturer to check in.'}`
              : isStaff
                ? 'Start a class when you are ready. Students check in with your rotating code and verified location.'
                : 'When your lecturer starts a class, a live code appears here. Check in takes a few seconds.'}
          </p>
        </div>
        <div className={s.heroSide}>
          <span className={`${s.liveBadge} ${activeSession ? s.liveBadgeOn : ''}`}>
            <i aria-hidden="true" />
            {activeSession ? 'Live now' : 'No live class'}
          </span>
          {activeSession ? (
            <div className={s.heroMeta}>
              <strong>{activeSession.courseName || 'Live session'}</strong>
              <span>{[activeSession.lecturerName, activeSession.room].filter(Boolean).join(' · ') || 'venue shared in class'}</span>
              <span>Started {formatTime(activeSession.startedAt)}</span>
            </div>
          ) : null}
        </div>
      </section>

      {isStaff ? (
        <div className={s.modeTabs} role="tablist" aria-label="Attendance mode">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'teach'}
            className={`${s.modeTab} ${view === 'teach' ? s.modeTabActive : ''}`}
            onClick={() => setView('teach')}
          >
            Class session
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'checkin'}
            className={`${s.modeTab} ${view === 'checkin' ? s.modeTabActive : ''}`}
            onClick={() => setView('checkin')}
          >
            My attendance
          </button>
        </div>
      ) : null}

      {notice ? <p className={s.notice} role="status">{notice}</p> : null}
      {error ? <p className={s.noticeError} role="alert">{error}</p> : null}

      {view === 'checkin' ? (
        <>
          <section className={s.checkCard}>
            {success ? (
              <div className={s.successState} role="status">
                <span className={s.successIcon} aria-hidden="true">✓</span>
                <span className={s.eyebrow}>Checked in</span>
                <h3>{success.course}</h3>
                <p>{success.status} · recorded at {success.time}. Your attendance has been saved.</p>
                <button type="button" className={s.ghostButton} onClick={() => { setSuccess(null); onReload() }}>
                  Check in to another class
                </button>
              </div>
            ) : activeSession ? (
              <div className={s.checkGrid}>
                <form className={s.checkMain} onSubmit={(event) => void checkIn(event)}>
                  <span className={s.step}>Step 1 of 3</span>
                  <h3>Enter today’s class code</h3>
                  <p>Your lecturer will show a six-digit code. It changes every 30 seconds.</p>
                  <label className={s.codeLabel} htmlFor="attendance-code">Six-digit code</label>
                  <input
                    id="attendance-code"
                    className={s.codeInput}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    aria-describedby="code-help"
                  />
                  <span id="code-help" className={s.fieldHelp}>Codes are verified by the university server.</span>
                  {alreadyCheckedIn ? (
                    <div className={s.alreadyBox} role="status">
                      You are already marked for this course today. No need to check in again.
                    </div>
                  ) : null}
                  <button type="submit" className={s.primaryButton} disabled={busy || alreadyCheckedIn}>
                    {busy ? 'Verifying location…' : 'Verify and check in'}
                  </button>
                </form>
                <div className={s.checkAside}>
                  <span className={s.step}>How it works</span>
                  <div className={s.stepItem}>
                    <b>1</b>
                    <div><strong>Get the code</strong><span>Read the live code projected in class.</span></div>
                  </div>
                  <div className={s.stepItem}>
                    <b>2</b>
                    <div><strong>Allow location</strong><span>We confirm you are inside the class venue.</span></div>
                  </div>
                  <div className={s.stepItem}>
                    <b>3</b>
                    <div><strong>You are in</strong><span>Your record appears in your history instantly.</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={s.emptyState}>
                <img src="/illustrations/attendance-verification.svg" alt="" aria-hidden="true" />
                <div>
                  <h3>No live class right now</h3>
                  <p>Check-in opens automatically when your lecturer starts a session for a course you are enrolled in.</p>
                  <button type="button" className={s.ghostButton} onClick={onReload}>Refresh status</button>
                </div>
              </div>
            )}
          </section>

          {sessions.length > 1 && !success ? (
            <div className={s.sessionStrip} aria-label="Other live sessions">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={`${s.sessionChip} ${activeSession?.id === session.id ? s.sessionChipActive : ''}`}
                  onClick={() => { setSelectedSessionId(session.id); setSuccess(null) }}
                >
                  <strong>{session.courseName || 'Live class'}</strong>
                  <span>{formatTime(session.startedAt)}</span>
                </button>
              ))}
            </div>
          ) : null}

          <section className={s.overview}>
            <div className={s.rateCard}>
              <div
                className={s.rateRing}
                style={{ '--rate': `${attendanceRate ?? 0}%` } as CSSProperties}
                aria-label={attendanceRate === null ? 'No attendance records' : `${attendanceRate}% attendance`}
              >
                <span>{attendanceRate === null ? '—' : `${attendanceRate}%`}</span>
              </div>
              <div>
                <span className={s.eyebrow}>Overall attendance</span>
                <h3>{attendanceRate === null ? 'No records yet' : attendanceRate >= 75 ? 'On track' : 'Needs attention'}</h3>
                <p>{attendanceRate === null ? 'Your attendance will appear after your first check-in.' : attendanceRate >= 75 ? 'You are above the 75% requirement.' : 'You are below the 75% requirement. Speak with your lecturer.'}</p>
              </div>
            </div>
            <div className={s.miniStats}>
              <div><b>{summary.present}</b><span>Present</span></div>
              <div><b>{summary.late}</b><span>Late</span></div>
              <div><b>{summary.absent}</b><span>Absent</span></div>
            </div>
          </section>

          <section className={s.historyCard}>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>History</span>
                <h3>Your attendance record</h3>
              </div>
              <div className={s.historyFilters} role="group" aria-label="Filter attendance history">
                {([['all', 'All'], ['attended', 'Attended'], ['missed', 'Missed']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`${s.filterButton} ${historyFilter === id ? s.filterButtonActive : ''}`}
                    onClick={() => setHistoryFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <p className={s.state}>Loading your attendance…</p> : null}
            {!loading && !visibleHistory.length ? <p className={s.state}>No records in this view yet.</p> : null}
            {visibleHistory.length ? (
              <ul className={s.timeline}>
                {visibleHistory.map((row, index) => (
                  <li key={row.id || `${row.course}-${row.date}-${index}`}>
                    <span className={`${s.timelineDot} ${tone(row.status)}`} aria-hidden="true" />
                    <div className={s.timelineMain}>
                      <strong>{row.course}</strong>
                      <span>{row.date}{row.time ? ` · ${row.time}` : ''}</span>
                    </div>
                    <span className={`${s.historyStatus} ${tone(row.status)}`}>{statusLabel(row.status)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {filteredHistory.length > 5 ? (
              <button type="button" className={s.textButton} onClick={() => setShowAllHistory((value) => !value)}>
                {showAllHistory ? 'Show less' : `Show all ${filteredHistory.length} records`}
              </button>
            ) : null}
          </section>
        </>
      ) : (
        <>
          <section className={s.startCard}>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>Lecturer flow</span>
                <h3>Start a class session</h3>
                <p>Choose the course and timetable slot. We generate a secure rotating code automatically.</p>
              </div>
              <button type="button" className={s.ghostButton} onClick={() => void loadOptions()}>Refresh options</button>
            </div>
            {optionsError ? <p className={s.noticeError} role="alert">{optionsError}</p> : null}
            {optionsLoading ? <p className={s.state}>Loading your courses…</p> : null}
            <div className={s.formGrid}>
              <label className={s.field}>
                <span>Course</span>
                <select
                  value={selectedCourseId}
                  onChange={(event) => { setSelectedCourseId(event.target.value); setSelectedSlotId('') }}
                >
                  <option value="">Select a course</option>
                  {courses.map((course, index) => (
                    <option key={courseId(course) || index} value={courseId(course)}>{courseTitle(course)}</option>
                  ))}
                </select>
              </label>
              <label className={s.field}>
                <span>Class slot</span>
                <select value={selectedSlotId} onChange={(event) => setSelectedSlotId(event.target.value)} disabled={!matchingSlots.length}>
                  <option value="">{matchingSlots.length ? 'Select a slot' : 'No slot for this course'}</option>
                  {matchingSlots.map((slot, index) => (
                    <option key={pick(slot, ['id']) || index} value={pick(slot, ['id'])}>
                      {[pick(slot, ['day', 'day_of_week']), pick(slot, ['start_time', 'startTime']), pick(slot, ['end_time', 'endTime'])].filter(Boolean).join(' · ') || 'Class slot'}
                    </option>
                  ))}
                </select>
              </label>
              <label className={s.field}>
                <span>Venue</span>
                <select value={selectedVenueId} onChange={(event) => setSelectedVenueId(event.target.value)}>
                  <option value="">Choose a venue</option>
                  {venues.map((venue, index) => (
                    <option key={pick(venue as Row, ['id']) || index} value={pick(venue as Row, ['id'])}>
                      {pick(venue as Row, ['name', 'room_code', 'roomCode']) || 'Venue'}
                    </option>
                  ))}
                </select>
              </label>
              <label className={s.field}>
                <span>Room</span>
                <input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="e.g. LT 2" />
              </label>
            </div>
            <button type="button" className={s.primaryButton} disabled={starting || !selectedCourseId || !selectedSlotId} onClick={() => void startSession()}>
              {starting ? 'Starting class…' : 'Start class session'}
            </button>
          </section>

          {activeSession ? (
            <>
              <section className={s.projector}>
                <div className={s.projectorTop}>
                  <span className={s.eyebrow}>Live class code</span>
                  <span>Refreshes in {secondsLeft || '··'}s</span>
                </div>
                <div className={s.codeDisplay} aria-live="polite">
                  {codeLoading && !checkinCode ? '······' : checkinCode || '------'}
                </div>
                <div className={s.projectorBottom}>
                  <div>
                    <strong>{activeSession.courseName || 'Live session'}</strong>
                    <span>{[activeSession.room, activeSession.lecturerName].filter(Boolean).join(' · ') || 'Project this code to your class'}</span>
                  </div>
                  <div className={s.projectorActions}>
                    <button type="button" className={s.lightButton} onClick={() => void copyCode()} disabled={!checkinCode}>Copy code</button>
                    <button type="button" className={s.dangerButton} disabled={ending} onClick={() => void endSession()}>
                      {ending ? 'Ending…' : 'End class'}
                    </button>
                  </div>
                </div>
                {codeError ? <p className={s.projectorError} role="alert">{codeError}</p> : null}
              </section>

              <section className={s.rosterCard}>
                <div className={s.sectionHead}>
                  <div>
                    <span className={s.eyebrow}>Live roster</span>
                    <h3>{roster.length} enrolled student{roster.length === 1 ? '' : 's'}</h3>
                    <p>{rosterSummary.present} marked present · {rosterSummary.absent} absent</p>
                  </div>
                  <div className={s.rosterActions}>
                    <input
                      className={s.searchInput}
                      value={rosterSearch}
                      onChange={(event) => setRosterSearch(event.target.value)}
                      placeholder="Find a student"
                      aria-label="Find a student"
                    />
                    <button type="button" className={s.ghostButton} onClick={exportRoster} disabled={!filteredRoster.length}>Export</button>
                  </div>
                </div>
                {rosterError ? <p className={s.noticeError} role="alert">{rosterError}</p> : null}
                {rosterLoading ? <p className={s.state}>Loading roster…</p> : null}
                {!rosterLoading && !filteredRoster.length ? <p className={s.state}>No students match this search.</p> : null}
                {filteredRoster.length ? (
                  <ul className={s.rosterList}>
                    {filteredRoster.map((student) => (
                      <li key={student.userId}>
                        <span className={s.avatar} aria-hidden="true">{initials(student.studentName)}</span>
                        <div className={s.rosterInfo}>
                          <strong>{student.studentName}</strong>
                          <span>{student.matricNumber || 'No matric number'}</span>
                        </div>
                        <span className={`${s.historyStatus} ${tone(student.status)}`}>{statusLabel(student.status)}</span>
                        <div className={s.markButtons} role="group" aria-label={`Mark ${student.studentName}`}>
                          {(['present', 'late', 'absent'] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              className={`${s.markButton} ${statusKey(student.status) === status ? s.markButtonActive : ''}`}
                              disabled={markingUserId === student.userId}
                              onClick={() => void markStudent(student.userId, status)}
                              aria-label={`Mark ${status}`}
                            >
                              {status === 'present' ? 'P' : status === 'late' ? 'L' : 'A'}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </>
          ) : (
            <section className={s.emptyState}>
              <img src="/illustrations/attendance-verification.svg" alt="" aria-hidden="true" />
              <div>
                <h3>No active class session</h3>
                <p>Start a session above to generate a code and open the live roster.</p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
