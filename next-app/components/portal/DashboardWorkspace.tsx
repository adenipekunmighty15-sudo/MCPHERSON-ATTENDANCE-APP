'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import ShimmerImage from '@/components/ShimmerImage'
import AIChatWorkspace from '@/components/chat/AIChatWorkspace'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import { Panel, StateBlock, Stat } from './SectionUI'
import { DASHBOARD_SECTIONS, type DashboardSection } from './sectionTypes'
import styles from './dashboard.module.css'

type Row = Record<string, unknown>

type AttendanceRecord = {
  id?: string
  courseName?: string
  status?: string
  timestamp?: string
  date?: string
  method?: string
  location?: string
}

type LiveSession = {
  id: string
  courseName?: string
  lecturerName?: string
  room?: string
  startedAt?: string
}

type Course = {
  id?: string
  courseId?: string
  code?: string
  title?: string
  courseName?: string
  lecturer?: string
  departmentName?: string
  creditUnits?: string | number
  status?: string
}

type TimetableEntry = Row & { id?: string }

type StudyMaterial = {
  id?: string
  title?: string
  courseId?: string
  createdAt?: string
  created_at?: string
  status?: string
}

type StudyStats = {
  cardsMastered?: number
  quizzesTaken?: number
  studyMinutes?: number
  weakAreas?: { name?: string; score?: number }[]
}

type Complaint = {
  id?: string
  area?: string
  title?: string
  message?: string
  priority?: string
  status?: string
  createdAt?: string
  adminResponse?: string
}

type Conversation = {
  id: string
  partner?: { id?: string; name?: string; department?: string; role?: string }
  lastMessage?: { content?: string; timestamp?: string; senderId?: string }
  unreadCount?: number
  updatedAt?: string
}

type DirectMessage = {
  id?: string
  senderId?: string
  content?: string
  timestamp?: string
  status?: string
}

type Contact = { id: string; name?: string; department?: string; role?: string }

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Something went wrong. Please try again.'
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

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function statusClass(status?: string): string {
  const value = (status || '').toLowerCase()
  if (['present', 'active', 'resolved', 'online', 'approved'].includes(value)) return `${styles.pill} ${styles.pillGood}`
  if (['late', 'open', 'in_progress', 'pending', 'warn'].includes(value)) return `${styles.pill} ${styles.pillWarn}`
  return styles.pill
}

function useApiResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(Boolean(path))
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!path) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setData(await api.get<T>(path, { cache: false }))
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    void load()
  }, [load])

  const reload = useCallback(() => {
    void load()
  }, [load])

  return { data, loading, error, reload }
}

export default function DashboardWorkspace() {
  const { user, logout, syncProfile } = useAuth()
  const [section, setSection] = useState<DashboardSection>('overview')

  const attendanceResource = useApiResource<unknown>('/attendance')
  const sessionsResource = useApiResource<unknown>('/sessions/active')
  const coursesResource = useApiResource<unknown>('/courses/enrolled')
  const timetableResource = useApiResource<unknown>('/timetable')
  const studyStatsResource = useApiResource<StudyStats>('/study-materials/stats')
  const studyMaterialsResource = useApiResource<unknown>('/study-materials')
  const complaintsResource = useApiResource<unknown>('/complaints')
  const conversationsResource = useApiResource<unknown>('/messages/conversations')

  const attendance = useMemo(() => asRows<AttendanceRecord>(attendanceResource.data), [attendanceResource.data])
  const sessions = useMemo(() => asRows<LiveSession>(sessionsResource.data), [sessionsResource.data])
  const courses = useMemo(() => asRows<Course>(coursesResource.data), [coursesResource.data])
  const timetable = useMemo(() => asRows<TimetableEntry>(timetableResource.data), [timetableResource.data])
  const materials = useMemo(() => asRows<StudyMaterial>(studyMaterialsResource.data), [studyMaterialsResource.data])
  const complaints = useMemo(() => asRows<Complaint>(complaintsResource.data), [complaintsResource.data])
  const conversations = useMemo(() => asRows<Conversation>(conversationsResource.data), [conversationsResource.data])

  const studyStats = studyStatsResource.data || {}
  const openFeedback = complaints.filter((item) => (item.status || 'open') === 'open').length
  const unreadMessages = conversations.reduce((total, item) => total + (Number(item.unreadCount) || 0), 0)
  const activeSection = DASHBOARD_SECTIONS.find((item) => item.id === section) || DASHBOARD_SECTIONS[0]

  const goTo = useCallback((next: DashboardSection) => {
    setSection(next)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>M</span>
          <span className={styles.brandText}>
            <strong>McPherson</strong>
            <small>University portal</small>
          </span>
        </div>

        <p className={styles.sectionLabel}>Workspace</p>
        <nav className={styles.nav} aria-label="Dashboard sections">
          {DASHBOARD_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${section === item.id ? styles.navItemActive : ''}`.trim()}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => goTo(item.id)}
            >
              <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <p>{user?.name || 'Student'}<br />{user?.matricNumber || user?.email || ''}</p>
          <button type="button" className={styles.signOut} onClick={() => void logout()}>Sign out</button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1>{activeSection.label}</h1>
            <p>{activeSection.copy}</p>
          </div>
          <span className={styles.topBadge}>McPherson University</span>
          <div className={styles.mobileBar}>
            <select
              aria-label="Dashboard section"
              value={section}
              onChange={(event) => goTo(event.target.value as DashboardSection)}
            >
              {DASHBOARD_SECTIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
        </header>

        <div className={`${styles.content} ${section === 'aichat' ? styles.chatContent : ''}`.trim()}>
          {section === 'overview' ? (
            <OverviewSection
              attendance={attendance}
              sessions={sessions}
              courses={courses}
              timetable={timetable}
              studyStats={studyStats}
              unreadMessages={unreadMessages}
              openFeedback={openFeedback}
              loading={attendanceResource.loading || sessionsResource.loading || coursesResource.loading}
              onNavigate={goTo}
            />
          ) : null}

          {section === 'attendance' ? (
            <AttendanceSection
              attendance={attendance}
              sessions={sessions}
              loading={attendanceResource.loading || sessionsResource.loading}
              error={attendanceResource.error || sessionsResource.error}
              onReload={() => {
                attendanceResource.reload()
                sessionsResource.reload()
              }}
            />
          ) : null}

          {section === 'courses' ? (
            <CoursesSection
              courses={courses}
              loading={coursesResource.loading}
              error={coursesResource.error}
              onReload={coursesResource.reload}
            />
          ) : null}

          {section === 'timetable' ? (
            <TimetableSection
              entries={timetable}
              loading={timetableResource.loading}
              error={timetableResource.error}
              onReload={timetableResource.reload}
            />
          ) : null}

          {section === 'studyhub' ? (
            <StudyHubSection
              materials={materials}
              stats={studyStats}
              courses={courses}
              loading={studyMaterialsResource.loading || studyStatsResource.loading}
              error={studyMaterialsResource.error || studyStatsResource.error}
              onReload={() => {
                studyMaterialsResource.reload()
                studyStatsResource.reload()
              }}
            />
          ) : null}

          {section === 'aichat' ? (
            <div className={styles.chatFrame}>
              <AIChatWorkspace embedded />
            </div>
          ) : null}

          {section === 'messaging' ? (
            <MessagingSection
              conversations={conversations}
              loading={conversationsResource.loading}
              error={conversationsResource.error}
              onReload={conversationsResource.reload}
            />
          ) : null}

          {section === 'feedback' ? (
            <FeedbackSection
              complaints={complaints}
              loading={complaintsResource.loading}
              error={complaintsResource.error}
              onReload={complaintsResource.reload}
            />
          ) : null}

          {section === 'settings' ? (
            <SettingsSection
              user={user}
              onSaved={() => void syncProfile()}
              onSignOut={() => void logout()}
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}

function OverviewSection({
  attendance,
  sessions,
  courses,
  timetable,
  studyStats,
  unreadMessages,
  openFeedback,
  loading,
  onNavigate,
}: {
  attendance: AttendanceRecord[]
  sessions: LiveSession[]
  courses: Course[]
  timetable: TimetableEntry[]
  studyStats: StudyStats
  unreadMessages: number
  openFeedback: number
  loading: boolean
  onNavigate: (section: DashboardSection) => void
}) {
  const nextClass = timetable[0]
  const present = attendance.filter((item) => (item.status || '').toLowerCase() === 'present').length

  return (
    <>
      <section className={styles.campusBanner} aria-label="McPherson University">
        <ShimmerImage
          src="/mcu-campus.jpg"
          alt="McPherson University campus"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 70vw"
          tone="dark"
        />
        <span className={styles.campusBannerMask} aria-hidden="true" />
        <div className={styles.campusBannerCopy}>
          <p className={styles.eyebrow}>Citadel of Champions</p>
          <h2>McPherson University</h2>
          <p>Your attendance, courses, timetable, study tools, AI desk and campus life now live in this one portal.</p>
        </div>
      </section>

      <section className={styles.grid} style={{ marginTop: 18 }}>
        <div className={styles.gridFour}>
          <Stat label="Courses" value={courses.length} detail="Active enrolments" />
          <Stat label="Attendance" value={loading ? '…' : `${present}/${attendance.length}`} detail="Verified records" />
          <Stat label="Study time" value={studyStats.studyMinutes || 0} detail="Minutes logged" />
          <Stat label="Live sessions" value={sessions.length} detail="Happening now" />
        </div>
      </section>

      <Panel title="Jump back in" copy="Everything is inside this dashboard — choose where you want to continue.">
        <div className={styles.quickGrid}>
          {DASHBOARD_SECTIONS.filter((item) => item.id !== 'overview').map((item) => (
            <button key={item.id} type="button" className={styles.quickCard} onClick={() => onNavigate(item.id)}>
              <strong>{item.icon} {item.label}</strong>
              <small>{item.copy}</small>
              {item.id === 'messaging' && unreadMessages ? <small>{unreadMessages} unread</small> : null}
              {item.id === 'feedback' && openFeedback ? <small>{openFeedback} open</small> : null}
            </button>
          ))}
        </div>
      </Panel>

      <div className={`${styles.grid} ${styles.gridTwo}`}>
        <Panel title="Next on your timetable" copy="Your next scheduled academic commitment.">
          {nextClass ? (
            <article className={styles.card}>
              <div className={styles.cardRow}>
                <h3 className={styles.cardTitle}>{pick(nextClass, ['course_name', 'courseName', 'title', 'course'])}</h3>
                <span className={statusClass('active')}>Scheduled</span>
              </div>
              <p className={styles.cardMeta}>
                {[pick(nextClass, ['day', 'day_of_week']), pick(nextClass, ['start_time', 'startTime']), pick(nextClass, ['end_time', 'endTime'])].filter(Boolean).join(' · ')}
              </p>
              <p className={styles.cardMeta}>{[pick(nextClass, ['lecturer', 'lecturer_name']), pick(nextClass, ['venue', 'room', 'location'])].filter(Boolean).join(' · ')}</p>
            </article>
          ) : (
            <StateBlock loading={loading} error="" empty="No timetable entries yet." />
          )}
        </Panel>

        <Panel title="Live sessions" copy="Sessions currently open for your courses.">
          {sessions.length ? (
            <div className={styles.list}>
              {sessions.slice(0, 4).map((item) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardRow}>
                    <h3 className={styles.cardTitle}>{item.courseName || 'Live class'}</h3>
                    <span className={statusClass('active')}>Live</span>
                  </div>
                  <p className={styles.cardMeta}>{[item.lecturerName, item.room].filter(Boolean).join(' · ')}</p>
                </article>
              ))}
            </div>
          ) : (
            <StateBlock loading={loading} error="" empty="No live sessions right now." />
          )}
        </Panel>
      </div>
    </>
  )
}

function AttendanceSection({
  attendance,
  sessions,
  loading,
  error,
  onReload,
}: {
  attendance: AttendanceRecord[]
  sessions: LiveSession[]
  loading: boolean
  error: string
  onReload: () => void
}) {
  const [active, setActive] = useState<LiveSession | null>(null)
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function checkIn() {
    if (!active) {
      setNotice('Choose a live session first.')
      return
    }
    if (!code.trim()) {
      setNotice('Enter the class code given by your lecturer.')
      return
    }
    if (!navigator.geolocation) {
      setNotice('Location services are not available in this browser.')
      return
    }
    setBusy(true)
    setNotice('Checking your location…')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.post('/attendance', {
            sessionId: active.id,
            method: 'GPS',
            locationLat: position.coords.latitude,
            locationLng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            verificationCode: code.trim(),
          })
          setNotice('Attendance verified and recorded.')
          setCode('')
          setActive(null)
          onReload()
        } catch (err) {
          setNotice(messageOf(err))
        } finally {
          setBusy(false)
        }
      },
      (err) => {
        setNotice(err.message || 'Location permission was denied.')
        setBusy(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <>
      <Panel title="Check in to a live class" copy="Your location and the active class code are verified by the university server.">
        {sessions.length ? (
          <>
            <div className={styles.gridThree}>
              {sessions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.quickCard}
                  aria-pressed={active?.id === item.id}
                  onClick={() => {
                    setActive(item)
                    setNotice('')
                  }}
                >
                  <strong>{item.courseName || 'Live session'}</strong>
                  <small>{[item.lecturerName, item.room].filter(Boolean).join(' · ')}</small>
                  <small>Started {formatTime(item.startedAt)}</small>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, maxWidth: 420 }}>
              <label className={styles.field}>
                <span>Class code</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setCode(event.target.value)}
                  placeholder="Enter the code from your lecturer"
                />
              </label>
              <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} disabled={busy} onClick={() => void checkIn()}>
                {busy ? 'Verifying…' : 'Verify attendance'}
              </button>
              {notice ? <p className={styles.cardMeta} role="status">{notice}</p> : null}
            </div>
          </>
        ) : (
          <StateBlock loading={loading} error={error} empty="There are no active classes for your courses right now." onRetry={onReload} />
        )}
      </Panel>

      <Panel title="Attendance record" copy="Every verified check-in saved to your account.">
        <StateBlock loading={loading} error={error} empty={attendance.length ? undefined : 'No attendance records yet.'} onRetry={onReload} />
        {attendance.length ? (
          <div className={styles.list}>
            {attendance.map((item) => (
              <article key={item.id || `${item.timestamp}-${item.courseName}`} className={styles.card}>
                <div className={styles.cardRow}>
                  <h3 className={styles.cardTitle}>{item.courseName || 'Attendance record'}</h3>
                  <span className={statusClass(item.status)}>{item.status || 'recorded'}</span>
                </div>
                <p className={styles.cardMeta}>
                  {formatDate(item.timestamp || item.date)}{item.method ? ` · ${item.method}` : ''}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </Panel>
    </>
  )
}

function CoursesSection({
  courses,
  loading,
  error,
  onReload,
}: {
  courses: Course[]
  loading: boolean
  error: string
  onReload: () => void
}) {
  return (
    <Panel title="My courses" copy="Courses and enrolments linked to your McPherson account.">
      <StateBlock loading={loading} error={error} empty={courses.length ? undefined : 'You are not enrolled in any courses yet.'} onRetry={onReload} />
      {courses.length ? (
        <div className={styles.gridThree}>
          {courses.map((item, index) => (
            <article key={item.id || item.courseId || index} className={styles.card}>
              <div className={styles.cardRow}>
                <span className={styles.pill}>{item.code || 'COURSE'}</span>
                <span className={statusClass(item.status)}>{item.status || 'active'}</span>
              </div>
              <h3 className={styles.cardTitle} style={{ marginTop: 12 }}>{item.title || item.courseName || 'Untitled course'}</h3>
              <p className={styles.cardMeta}>{[item.lecturer, item.departmentName, item.creditUnits ? `${item.creditUnits} units` : ''].filter(Boolean).join(' · ')}</p>
            </article>
          ))}
        </div>
      ) : null}
    </Panel>
  )
}

function TimetableSection({
  entries,
  loading,
  error,
  onReload,
}: {
  entries: TimetableEntry[]
  loading: boolean
  error: string
  onReload: () => void
}) {
  const days = useMemo(() => {
    const grouped = new Map<string, TimetableEntry[]>()
    for (const entry of entries) {
      const day = pick(entry, ['day', 'day_of_week']) || 'Unscheduled'
      grouped.set(day, [...(grouped.get(day) || []), entry])
    }
    return Array.from(grouped.entries())
  }, [entries])

  return (
    <Panel title="Timetable" copy="Your weekly schedule, directly from the university timetable.">
      <StateBlock loading={loading} error={error} empty={entries.length ? undefined : 'No timetable entries have been published.'} onRetry={onReload} />
      {days.map(([day, items]) => (
        <section key={day} style={{ marginBottom: 18 }}>
          <h3 className={styles.cardTitle}>{day}</h3>
          <div className={styles.list} style={{ marginTop: 10 }}>
            {items.map((item, index) => (
              <article key={item.id || index} className={styles.card}>
                <div className={styles.cardRow}>
                  <div>
                    <h4 className={styles.cardTitle}>{pick(item, ['course_name', 'courseName', 'title', 'course'])}</h4>
                    <p className={styles.cardMeta}>
                      {[pick(item, ['start_time', 'startTime']), pick(item, ['end_time', 'endTime'])].filter(Boolean).join(' – ')}
                    </p>
                  </div>
                  <span className={styles.pill}>{[pick(item, ['venue', 'room', 'location'])].filter(Boolean).join('') || 'Venue TBC'}</span>
                </div>
                <p className={styles.cardMeta}>{pick(item, ['lecturer', 'lecturer_name'])}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </Panel>
  )
}

function StudyHubSection({
  materials,
  stats,
  courses,
  loading,
  error,
  onReload,
}: {
  materials: StudyMaterial[]
  stats: StudyStats
  courses: Course[]
  loading: boolean
  error: string
  onReload: () => void
}) {
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!timerStart) return
    const tick = () => setElapsed(Math.floor((Date.now() - timerStart) / 1000))
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [timerStart])

  async function uploadPack(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || (!file && !sourceText.trim())) {
      setNotice('Add a title and either a document or pasted study text.')
      return
    }
    setBusy(true)
    setNotice('Creating your study pack…')
    try {
      const form = new FormData()
      form.append('title', title.trim())
      if (courseId) form.append('courseId', courseId)
      if (file) form.append('document', file)
      if (sourceText.trim()) form.append('sourceText', sourceText.trim())
      await api.upload('/study-materials/upload', form, { timeout: 180000 })
      setNotice('Study pack created from your material.')
      setTitle('')
      setCourseId('')
      setFile(null)
      setSourceText('')
      onReload()
    } catch (err) {
      setNotice(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  async function stopTimer() {
    if (!timerStart) return
    const startedAt = new Date(timerStart).toISOString()
    const endedAt = new Date().toISOString()
    setTimerStart(null)
    setElapsed(0)
    try {
      await api.post('/study-sessions', { startedAt, endedAt, sessionType: 'review' })
      setNotice('Study time saved to your account.')
      onReload()
    } catch (err) {
      setNotice(messageOf(err))
    }
  }

  return (
    <>
      <div className={styles.gridFour}>
        <Stat label="Study time" value={stats.studyMinutes || 0} detail="Minutes saved" />
        <Stat label="Cards mastered" value={stats.cardsMastered || 0} detail="Spaced repetition" />
        <Stat label="Quizzes taken" value={stats.quizzesTaken || 0} detail="Practice checks" />
        <Stat label="Study packs" value={materials.length} detail="Saved materials" />
      </div>

      <Panel title="Study timer" copy="Only time you actually spend studying is saved when you stop the timer.">
        <div className={styles.cardRow}>
          <strong className={styles.statValue}>
            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
          </strong>
          {timerStart ? (
            <button type="button" className={styles.button} onClick={() => void stopTimer()}>Stop &amp; save</button>
          ) : (
            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => setTimerStart(Date.now())}>Start studying</button>
          )}
        </div>
      </Panel>

      <Panel title="Create a study pack" copy="Upload a document or paste notes. The backend creates real flashcards and a quiz from your material.">
        <form onSubmit={(event) => void uploadPack(event)}>
          <label className={styles.field}>
            <span>Title</span>
            <input className={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Chapter 4 — Database design" />
          </label>
          <label className={styles.field}>
            <span>Course (optional)</span>
            <select className={styles.select} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="">No course</option>
              {courses.map((course, index) => (
                <option key={course.id || index} value={course.id || ''}>{course.title || course.courseName || course.code || 'Course'}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Document</span>
            <input className={styles.input} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <label className={styles.field}>
            <span>Or paste study text</span>
            <textarea className={styles.textarea} value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste at least a few lines of notes…" />
          </label>
          <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={busy}>{busy ? 'Creating…' : 'Create study pack'}</button>
          {notice ? <p className={styles.cardMeta} role="status">{notice}</p> : null}
        </form>
      </Panel>

      <Panel title="Saved study packs" copy="Materials generated from your uploads and notes.">
        <StateBlock loading={loading} error={error} empty={materials.length ? undefined : 'No study packs yet.'} onRetry={onReload} />
        {materials.length ? (
          <div className={styles.gridThree}>
            {materials.map((item, index) => (
              <article key={item.id || index} className={styles.card}>
                <h3 className={styles.cardTitle}>{item.title || 'Untitled study pack'}</h3>
                <p className={styles.cardMeta}>Created {formatDate(item.createdAt || item.created_at)}</p>
                <span className={statusClass(item.status)}>{item.status || 'ready'}</span>
              </article>
            ))}
          </div>
        ) : null}
      </Panel>
    </>
  )
}

function MessagingSection({
  conversations,
  loading,
  error,
  onReload,
}: {
  conversations: Conversation[]
  loading: boolean
  error: string
  onReload: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<DirectMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showContacts, setShowContacts] = useState(false)

  const selected = conversations.find((item) => item.id === selectedId) || null

  const loadThread = useCallback(async (id: string) => {
    setThreadLoading(true)
    setNotice('')
    try {
      const response = await api.get<unknown>(`/messages/conversations/${id}/messages`, { cache: false })
      setThread(asRows<DirectMessage>(response))
    } catch (err) {
      setNotice(messageOf(err))
    } finally {
      setThreadLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedId || !conversations.some((item) => item.id === selectedId)) return
    void loadThread(selectedId)
  }, [selectedId, conversations, loadThread])

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !text.trim()) return
    try {
      const response = await api.post<{ data?: DirectMessage }>(`/messages/conversations/${selectedId}/messages`, { content: text.trim() })
      const sent = response.data
      if (sent) setThread((current) => [...current, sent])
      setText('')
      onReload()
    } catch (err) {
      setNotice(messageOf(err))
    }
  }

  async function openContacts() {
    setShowContacts(true)
    setNotice('')
    try {
      const response = await api.get<unknown>('/messages/contacts', { cache: false })
      setContacts(asRows<Contact>(response))
    } catch (err) {
      setNotice(messageOf(err))
    }
  }

  async function startConversation(contactId: string) {
    try {
      const response = await api.post<{ data?: { id?: string } }>('/messages/conversations', { recipientId: contactId })
      setShowContacts(false)
      onReload()
      if (response.data?.id) {
        setSelectedId(response.data.id)
        void loadThread(response.data.id)
      }
    } catch (err) {
      setNotice(messageOf(err))
    }
  }

  return (
    <>
      <Panel title="Messages" copy="Direct conversations with students and lecturers, stored on the university server.">
        <StateBlock loading={loading} error={error} empty={conversations.length ? undefined : 'No conversations yet.'} onRetry={onReload} />
        <div className={`${styles.grid} ${styles.gridTwo}`}>
          <div className={styles.list}>
            {conversations.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.quickCard}
                aria-pressed={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
              >
                <div className={styles.cardRow}>
                  <strong>{item.partner?.name || 'Conversation'}</strong>
                  {item.unreadCount ? <span className={styles.pill}>{item.unreadCount} new</span> : null}
                </div>
                <small>{item.lastMessage?.content || 'No messages yet'}</small>
                <small>{formatTime(item.lastMessage?.timestamp || item.updatedAt)}</small>
              </button>
            ))}
            <button type="button" className={styles.button} onClick={() => void openContacts()}>New conversation</button>
          </div>

          <div>
            {showContacts ? (
              <div className={styles.list}>
                <h3 className={styles.cardTitle}>Choose a person</h3>
                {contacts.length ? contacts.map((contact) => (
                  <button key={contact.id} type="button" className={styles.quickCard} onClick={() => void startConversation(contact.id)}>
                    <strong>{contact.name || 'User'}</strong>
                    <small>{[contact.role, contact.department].filter(Boolean).join(' · ')}</small>
                  </button>
                )) : <StateBlock loading={false} error="" empty="No contacts available." />}
                <button type="button" className={styles.button} onClick={() => setShowContacts(false)}>Cancel</button>
              </div>
            ) : selected ? (
              <>
                <h3 className={styles.cardTitle}>{selected.partner?.name || 'Conversation'}</h3>
                <p className={styles.cardMeta}>{[selected.partner?.role, selected.partner?.department].filter(Boolean).join(' · ')}</p>
                <div className={styles.messageThread} role="log" aria-live="polite">
                  <StateBlock loading={threadLoading} error="" empty={thread.length ? undefined : 'No messages yet. Say hello.'} />
                  {thread.map((message, index) => (
                    <article key={message.id || index} className={`${styles.messageBubble} ${message.senderId === 'me' ? styles.messageMine : ''}`}>
                      {message.content}
                      <time className={styles.messageTime}>
                        {formatTime(message.timestamp)}
                        {message.senderId === 'me' ? (
                          <span className={styles.messageTicks} aria-label={message.status === 'read' ? 'Read' : 'Sent'}>
                            {message.status === 'read' ? '✓✓' : '✓'}
                          </span>
                        ) : null}
                      </time>
                    </article>
                  ))}
                </div>
                <form onSubmit={(event) => void send(event)} style={{ marginTop: 12 }}>
                  <label className={styles.field}>
                    <span>Write a message</span>
                    <textarea className={styles.textarea} maxLength={5000} value={text} onChange={(event) => setText(event.target.value)} />
                  </label>
                  <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={!text.trim()}>Send message</button>
                </form>
              </>
            ) : (
              <StateBlock loading={false} error="" empty="Choose a conversation or start a new one." />
            )}
            {notice ? <p className={styles.cardMeta} role="status">{notice}</p> : null}
          </div>
        </div>
      </Panel>
    </>
  )
}

function FeedbackSection({
  complaints,
  loading,
  error,
  onReload,
}: {
  complaints: Complaint[]
  loading: boolean
  error: string
  onReload: () => void
}) {
  const [area, setArea] = useState('academic')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!message.trim()) {
      setNotice('Write your feedback before sending.')
      return
    }
    setBusy(true)
    setNotice('')
    try {
      await api.post('/complaints', { area, title: title.trim(), message: message.trim(), priority })
      setNotice('Feedback sent. You can track the response below.')
      setTitle('')
      setMessage('')
      onReload()
    } catch (err) {
      setNotice(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Panel title="Send feedback" copy="Report an issue or share feedback with the university. Your submissions stay tied to your account.">
        <form onSubmit={(event) => void submit(event)}>
          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span>Area</span>
              <select className={styles.select} value={area} onChange={(event) => setArea(event.target.value)}>
                <option value="academic">Academic</option>
                <option value="attendance">Attendance</option>
                <option value="technology">Technology</option>
                <option value="facilities">Facilities</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Priority</span>
              <select className={styles.select} value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span>Title (optional)</span>
            <input className={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Message</span>
            <textarea className={styles.textarea} value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={busy}>{busy ? 'Sending…' : 'Send feedback'}</button>
          {notice ? <p className={styles.cardMeta} role="status">{notice}</p> : null}
        </form>
      </Panel>

      <Panel title="My feedback" copy="Your submitted feedback and any response from the university.">
        <StateBlock loading={loading} error={error} empty={complaints.length ? undefined : 'You have not sent any feedback yet.'} onRetry={onReload} />
        {complaints.length ? (
          <div className={styles.list}>
            {complaints.map((item, index) => (
              <article key={item.id || index} className={styles.card}>
                <div className={styles.cardRow}>
                  <h3 className={styles.cardTitle}>{item.title || item.area || 'Feedback'}</h3>
                  <span className={statusClass(item.status)}>{item.status || 'open'}</span>
                </div>
                <p className={styles.cardMeta}>{item.message}</p>
                <p className={styles.cardMeta}>{formatDate(item.createdAt)} · {item.priority || 'medium'} priority</p>
                {item.adminResponse ? <p className={styles.cardMeta}><strong>Response:</strong> {item.adminResponse}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </Panel>
    </>
  )
}

function SettingsSection({
  user,
  onSaved,
  onSignOut,
}: {
  user: ReturnType<typeof useAuth>['user']
  onSaved: () => void
  onSignOut: () => void
}) {
  const [name, setName] = useState(user?.name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(user?.name || '')
    setDepartment(user?.department || '')
  }, [user?.name, user?.department])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setNotice('Name is required.')
      return
    }
    setBusy(true)
    setNotice('')
    try {
      await api.put('/auth/profile', { name: name.trim(), department: department.trim() || 'Computer Science' })
      onSaved()
      setNotice('Profile updated.')
    } catch (err) {
      setNotice(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Settings" copy="Your McPherson account details and active session.">
      <div className={styles.gridTwo}>
        <form onSubmit={(event) => void save(event)}>
          <label className={styles.field}>
            <span>Full name</span>
            <input className={styles.input} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Department</span>
            <input className={styles.input} value={department} onChange={(event) => setDepartment(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input className={styles.input} value={user?.email || ''} readOnly aria-readonly="true" />
          </label>
          <label className={styles.field}>
            <span>Matric / staff number</span>
            <input className={styles.input} value={user?.matricNumber || ''} readOnly aria-readonly="true" />
          </label>
          <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          {notice ? <p className={styles.cardMeta} role="status">{notice}</p> : null}
        </form>

        <div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Account</h3>
            <p className={styles.cardMeta}>Role: {user?.role || 'student'}</p>
            <p className={styles.cardMeta}>Provider: {user?.provider || 'email'}</p>
            <p className={styles.cardMeta}>McPherson University · one portal, one account.</p>
          </div>
          <button type="button" className={`${styles.button} ${styles.buttonDanger}`} style={{ marginTop: 14 }} onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </Panel>
  )
}
