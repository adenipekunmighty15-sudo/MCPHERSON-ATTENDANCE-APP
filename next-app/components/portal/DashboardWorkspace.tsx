'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import ShimmerImage from '@/components/ShimmerImage'
import AIChatWorkspace from '@/components/chat/AIChatWorkspace'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import AttendanceSectionNext from './AttendanceSectionNext'
import CoursesSectionNext from './CoursesSectionNext'
import StudentIdCard from './StudentIdCard'
import { Panel, StateBlock, Stat } from './SectionUI'
import { DASHBOARD_SECTIONS, type DashboardSection } from './sectionTypes'
import design from './dashboardDesign.module.css'
import styles from './dashboard.module.css'

type Row = Record<string, unknown>

type AttendanceRecord = Row & {
  id?: string
  courseName?: string
  course_name?: string
  studentName?: string
  studentId?: string
  status?: string
  timestamp?: string
  date?: string
  timeIn?: string
  timeOut?: string
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
  course_id?: string
  code?: string
  courseCode?: string
  course_code?: string
  title?: string
  name?: string
  courseName?: string
  course_name?: string
  lecturer?: string
  instructor?: string
  departmentId?: string
  department_id?: string
  departmentName?: string
  creditUnits?: string | number
  credit_units?: string | number
  credits?: string | number
  attendanceRate?: number | string | null
  attendance_rate?: number | string | null
  attendance?: number | string | null
  schedule?: string
  meetingTime?: string
  meeting_time?: string
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

function courseId(course: Course): string {
  return course.id || course.courseId || course.course_id || course.code || course.courseCode || ''
}

function courseTitle(course: Course): string {
  return course.title || course.name || course.courseName || course.course_name || 'Untitled course'
}

function courseCode(course: Course): string {
  return course.code || course.courseCode || course.course_code || 'COURSE'
}

function attendanceRate(course: Course): number | null {
  const value = course.attendanceRate ?? course.attendance_rate ?? course.attendance
  if (value === undefined || value === null || value === '') return null
  const rate = Number(value)
  return Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : null
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function longDate(): string {
  return new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()
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
  const coursesResource = useApiResource<unknown>('/student-courses')
  const timetableResource = useApiResource<unknown>('/timetable')
  const studyStatsResource = useApiResource<StudyStats>('/study-materials/stats')
  const studyMaterialsResource = useApiResource<unknown>('/study-materials')
  const complaintsResource = useApiResource<unknown>('/complaints')
  const conversationsResource = useApiResource<unknown>('/messages/conversations')

  const attendance = useMemo(() => asRows<AttendanceRecord>(attendanceResource.data), [attendanceResource.data])
  const sessions = useMemo(() => asRows<LiveSession>(sessionsResource.data), [sessionsResource.data])
  const courses = useMemo(() => {
    const data = coursesResource.data as { courses?: unknown[] } | unknown[] | null
    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { courses?: unknown[] }).courses)) {
      return asRows<Course>((data as { courses?: unknown[] }).courses)
    }
    return asRows<Course>(data)
  }, [coursesResource.data])
  const timetable = useMemo(() => asRows<TimetableEntry>(timetableResource.data), [timetableResource.data])
  const materials = useMemo(() => asRows<StudyMaterial>(studyMaterialsResource.data), [studyMaterialsResource.data])
  const complaints = useMemo(() => asRows<Complaint>(complaintsResource.data), [complaintsResource.data])
  const conversations = useMemo(() => asRows<Conversation>(conversationsResource.data), [conversationsResource.data])

  const studyStats = studyStatsResource.data || {}
  const openFeedback = complaints.filter((item) => (item.status || 'open') === 'open').length
  const unreadMessages = conversations.reduce((total, item) => total + (Number(item.unreadCount) || 0), 0)
  const activeSection = DASHBOARD_SECTIONS.find((item) => item.id === section) || DASHBOARD_SECTIONS[0]

  const refreshAll = useCallback(() => {
    attendanceResource.reload()
    sessionsResource.reload()
    coursesResource.reload()
    timetableResource.reload()
    studyStatsResource.reload()
    studyMaterialsResource.reload()
    complaintsResource.reload()
    conversationsResource.reload()
  }, [
    attendanceResource.reload,
    sessionsResource.reload,
    coursesResource.reload,
    timetableResource.reload,
    studyStatsResource.reload,
    studyMaterialsResource.reload,
    complaintsResource.reload,
    conversationsResource.reload,
  ])

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
              user={user}
              attendance={attendance}
              sessions={sessions}
              courses={courses}
              timetable={timetable}
              studyStats={studyStats}
              unreadMessages={unreadMessages}
              openFeedback={openFeedback}
              loading={attendanceResource.loading || sessionsResource.loading || coursesResource.loading}
              refreshing={attendanceResource.loading || sessionsResource.loading || coursesResource.loading || timetableResource.loading}
              onRefresh={refreshAll}
              onNavigate={goTo}
            />
          ) : null}

          {section === 'attendance' ? (
            <AttendanceSectionNext
              user={user}
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
            <CoursesSectionNext
              courses={courses}
              loading={coursesResource.loading}
              error={coursesResource.error}
              onReload={() => { coursesResource.reload() }}
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
  user,
  attendance,
  sessions,
  courses,
  timetable,
  studyStats,
  unreadMessages,
  openFeedback,
  loading,
  refreshing,
  onRefresh,
  onNavigate,
}: {
  user: ReturnType<typeof useAuth>['user']
  attendance: AttendanceRecord[]
  sessions: LiveSession[]
  courses: Course[]
  timetable: TimetableEntry[]
  studyStats: StudyStats
  unreadMessages: number
  openFeedback: number
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  onNavigate: (section: DashboardSection) => void
}) {
  const firstName = (user?.name || 'Student').trim().split(/\s+/)[0]
  const activeSession = sessions[0]
  const present = attendance.filter((item) => (item.status || '').toLowerCase() === 'present').length
  const schedule = timetable.slice(0, 5)
  const progressCourses = courses.slice(0, 3)

  return (
    <>
      <header className={design.dayHeader}>
        <div>
          <p className={design.dayEyebrow}>{longDate()}</p>
          <h2 className={design.dayTitle}>{greeting()}, <span>{firstName}</span></h2>
          <p className={design.dayCopy}>Your campus day, thoughtfully organized.</p>
        </div>
        <button type="button" className={design.refreshButton} disabled={refreshing} onClick={onRefresh}>
          {refreshing ? 'Refreshing…' : 'Refresh dashboard'}
        </button>
      </header>

      <section className={design.hero} aria-label="McPherson University">
        <ShimmerImage
          src="/mcu-campus.jpg"
          alt="McPherson University campus"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 70vw"
          tone="dark"
        />
        <span className={design.heroMask} aria-hidden="true" />
        <div className={design.heroCopy}>
          <span className={design.heroKicker}>MCU · Student portal</span>
          <h3 className={design.heroTitle}>Make room for<br /><em>what matters.</em></h3>
          <p>
            {timetable.length
              ? `${timetable.length} class${timetable.length === 1 ? '' : 'es'} on your schedule. Your attendance, courses, study tools and AI desk live in this one portal.`
              : 'Your attendance, courses, study tools and AI desk live in this one portal.'}
          </p>
          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => onNavigate('attendance')}>
            Open attendance
          </button>
        </div>
        <div className={design.heroArt} aria-hidden="true">
          <span className={`${design.heroOrbit} ${design.heroOrbitOuter}`} />
          <span className={`${design.heroOrbit} ${design.heroOrbitInner}`} />
          <span className={design.heroStamp}>MCU</span>
          <span className={`${design.heroSpark} ${design.sparkOne}`}>✳</span>
          <span className={`${design.heroSpark} ${design.sparkTwo}`}>✳</span>
        </div>
        <div className={design.heroFooter}>
          <span><i className={design.heroLiveDot} />Your day, in focus</span>
          <span>Citadel of Champions</span>
        </div>
      </section>

      <section className={design.activeSession} aria-label="Attendance check-in">
        <span className={design.sessionSymbol} aria-hidden="true">⌖</span>
        <div className={design.sessionCopy}>
          <span className={design.sessionKicker}>Attendance check-in</span>
          <h3>{activeSession ? activeSession.courseName || 'Active class session' : 'No live session right now'}</h3>
          <p>
            {activeSession
              ? `${[activeSession.room, activeSession.lecturerName].filter(Boolean).join(' · ') || 'Venue details are not available.'} Enter your lecturer’s current code and allow GPS on the attendance screen.`
              : 'When a lecturer starts a session, you can verify attendance with GPS and the current six-digit code.'}
          </p>
        </div>
        {activeSession ? <span className={design.liveBadge}><i />Live</span> : null}
        <button type="button" className={styles.button} onClick={() => onNavigate('attendance')}>
          Open check-in
        </button>
      </section>

      <section className={styles.grid} style={{ marginTop: 18 }}>
        <div className={styles.gridFour}>
          <Stat label="Courses" value={courses.length} detail="Active enrolments" />
          <Stat label="Attendance" value={loading ? '…' : `${present}/${attendance.length}`} detail="Verified records" />
          <Stat label="Study time" value={studyStats.studyMinutes || 0} detail="Minutes logged" />
          <Stat label="Live sessions" value={sessions.length} detail="Happening now" />
        </div>
      </section>

      <div className={design.dashboardColumns}>
        <Panel title="Today’s rhythm" copy="Your next scheduled academic commitments.">
          {schedule.length ? (
            <div className={design.timeline}>
              {schedule.map((item, index) => (
                <article key={item.id || index} className={design.timelineItem}>
                  <span className={design.timelineRail} aria-hidden="true">
                    <span className={design.timelineDot} />
                    {index < schedule.length - 1 ? <span className={design.timelineLine} /> : null}
                  </span>
                  <span className={design.timelineTime}>
                    {pick(item, ['start_time', 'startTime']) || pick(item, ['time']) || 'TBC'}
                  </span>
                  <div className={design.timelineCopy}>
                    <h4>{pick(item, ['course_name', 'courseName', 'title', 'course'])}</h4>
                    <p>{[pick(item, ['venue', 'room', 'location']), pick(item, ['lecturer', 'lecturer_name'])].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={design.timelineStatus}>{index === 0 ? 'Up next' : 'Scheduled'}</span>
                </article>
              ))}
            </div>
          ) : (
            <StateBlock loading={loading} error="" empty="No timetable entries yet." />
          )}
        </Panel>

        <aside className={design.sideStack}>
          <section className={design.identityPanel} aria-label="Digital campus identity">
            <div className={design.identityPanelHead}>
              <div>
                <span className={styles.eyebrow}>Campus identity</span>
                <h3>Your digital ID</h3>
              </div>
            </div>
            <div className={design.idCardSlot}>
              <StudentIdCard
                name={user?.name || 'Student'}
                matricNumber={user?.matricNumber || user?.email || 'MCU/—'}
                department={user?.department || 'Computer Science'}
                role={user?.role || 'student'}
                avatarUrl={user?.avatarUrl}
              />
            </div>
          </section>

          <Panel title="Shortcuts" copy="Get there faster.">
            <div className={design.shortcutList}>
              {DASHBOARD_SECTIONS.filter((item) => item.id !== 'overview').map((item) => (
                <button key={item.id} type="button" className={design.shortcut} onClick={() => onNavigate(item.id)}>
                  <span className={design.shortcutIcon} aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'messaging' && unreadMessages ? <small>{unreadMessages} unread</small> : null}
                  {item.id === 'feedback' && openFeedback ? <small>{openFeedback} open</small> : null}
                  <span className={design.shortcutArrow} aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </Panel>

          <button type="button" className={design.accountCard} onClick={() => onNavigate('settings')}>
            <span className={design.accountAvatar}>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            <span className={design.accountCopy}>
              <span>Your account</span>
              <strong>{user?.name || 'Student'}</strong>
              <small>{user?.email || 'Manage your profile'}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </button>
        </aside>
      </div>

      <Panel
        title="Course attendance"
        copy="Keep your momentum — attendance progress for your current courses."
        action={<button type="button" className={styles.button} onClick={() => onNavigate('courses')}>All courses</button>}
      >
        {progressCourses.length ? (
          <div className={design.courseProgressGrid}>
            {progressCourses.map((item, index) => {
              const rate = attendanceRate(item)
              const low = rate !== null && rate < 75
              return (
                <article key={courseId(item) || index} className={design.courseProgressCard}>
                  <div className={design.courseCardTop}>
                    <span className={design.courseCode}>{courseCode(item)}</span>
                    <span className={`${design.coursePercent} ${rate === null ? '' : low ? design.coursePercentLow : design.coursePercentGood}`}>
                      {rate === null ? '—' : `${rate}%`}
                    </span>
                  </div>
                  <h4>{courseTitle(item)}</h4>
                  <div
                    className={design.courseProgressTrack}
                    role="progressbar"
                    aria-label={`${courseTitle(item)} attendance`}
                    aria-valuenow={rate ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span
                      className={`${design.courseProgressFill} ${low ? design.courseProgressFillLow : ''}`}
                      style={{ width: `${rate ?? 0}%` }}
                    />
                  </div>
                  <div className={design.courseFoot}>
                    <span>{rate === null ? 'No attendance records yet' : low ? 'Below 75% target' : 'On track'}</span>
                    {rate === null ? null : <span className={`${design.courseFootDot} ${low ? design.courseFootDotLow : ''}`} />}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <StateBlock loading={loading} error="" empty="Your enrolled courses will appear here." />
        )}
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
  const [selected, setSelected] = useState<TimetableEntry | null>(null)
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const days = useMemo(() => {
    const normalizeDay = (value: string) => {
      const text = value.trim().toLowerCase()
      return weekdays.find((day) => text === day.toLowerCase() || text.startsWith(day.slice(0, 3).toLowerCase())) || 'Other days'
    }
    const timeOf = (entry: TimetableEntry) => pick(entry, ['start_time', 'startTime', 'time'])
    const grouped = new Map<string, TimetableEntry[]>()
    for (const entry of entries) {
      const day = normalizeDay(pick(entry, ['day', 'day_of_week']) || 'Other days')
      grouped.set(day, [...(grouped.get(day) || []), entry])
    }
    return [...weekdays, 'Other days']
      .map((day) => ({
        day,
        items: (grouped.get(day) || []).slice().sort((a, b) => timeOf(a).localeCompare(timeOf(b))),
      }))
      .filter((group) => group.items.length)
  }, [entries])

  useEffect(() => {
    if (!selected) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [selected])

  const entryTime = (entry: TimetableEntry) => {
    const start = pick(entry, ['start_time', 'startTime', 'time'])
    const end = pick(entry, ['end_time', 'endTime'])
    return [start, end].filter(Boolean).join(' – ') || 'Time not specified'
  }

  return (
    <>
      <Panel title="Timetable" copy="Your weekly schedule, directly from the university timetable." action={<button type="button" className={styles.button} onClick={onReload}>Refresh</button>}>
        <StateBlock loading={loading} error={error} empty={entries.length ? undefined : 'No timetable entries have been published.'} onRetry={onReload} />
        {days.length ? (
          <div className={design.timetableBoard}>
            {days.map((group) => (
              <section key={group.day} className={design.dayColumn} aria-label={`${group.day} classes`}>
                <header className={design.dayHeading}>
                  <h3>{group.day}</h3>
                  <span>{group.items.length}</span>
                </header>
                {group.items.map((item, index) => (
                  <button key={pick(item, ['id']) || index} type="button" className={design.classCard} onClick={() => setSelected(item)}>
                    <span className={design.classTime}>{entryTime(item)}</span>
                    <strong>{pick(item, ['course_name', 'courseName', 'title', 'course', 'course_code']) || 'Class'}</strong>
                    <span className={design.classDetail}>{[pick(item, ['venue', 'room', 'location'])].filter(Boolean).join('') || 'Venue TBC'}</span>
                    <span className={design.classDetail}>{pick(item, ['lecturer', 'lecturer_name'])}</span>
                    {pick(item, ['type', 'class_type']) ? <span className={design.classType}>{pick(item, ['type', 'class_type'])}</span> : null}
                  </button>
                ))}
              </section>
            ))}
          </div>
        ) : null}
      </Panel>

      {selected ? (
        <div className={design.modalBackdrop} onClick={() => setSelected(null)}>
          <section className={design.detailsModal} role="dialog" aria-modal="true" aria-labelledby="class-details-title" onClick={(event) => event.stopPropagation()}>
            <header className={design.modalHeader}>
              <div>
                <span className={styles.eyebrow}>{pick(selected, ['day', 'day_of_week']) || 'Class details'}</span>
                <h3 id="class-details-title">{pick(selected, ['course_name', 'courseName', 'title', 'course', 'course_code']) || 'Class'}</h3>
              </div>
              <button type="button" className={design.closeButton} aria-label="Close details" onClick={() => setSelected(null)}>×</button>
            </header>
            <dl className={design.detailGrid}>
              <div><dt>Time</dt><dd>{entryTime(selected)}</dd></div>
              <div><dt>Room</dt><dd>{[pick(selected, ['venue', 'room', 'location'])].filter(Boolean).join('') || 'Not specified'}</dd></div>
              <div><dt>Lecturer</dt><dd>{pick(selected, ['lecturer', 'lecturer_name']) || 'Not specified'}</dd></div>
              <div><dt>Type</dt><dd>{pick(selected, ['type', 'class_type']) || 'Not specified'}</dd></div>
            </dl>
            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => setSelected(null)}>Close</button>
          </section>
        </div>
      ) : null}
    </>
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
  const [conversationSearch, setConversationSearch] = useState('')
  const [messageFilter, setMessageFilter] = useState<'All' | 'Unread'>('All')

  const selected = conversations.find((item) => item.id === selectedId) || null

  const visibleConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase()
    return conversations.filter((item) => {
      if (messageFilter === 'Unread' && !(Number(item.unreadCount) || 0)) return false
      if (!query) return true
      return [item.partner?.name, item.lastMessage?.content, item.partner?.department]
        .some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [conversationSearch, conversations, messageFilter])

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
      <section className={styles.waApp} aria-label="Messages">
        <aside className={styles.waSidebar}>
          <header className={styles.waSidebarHead}>
            <div>
              <h3>Chats</h3>
              <p>McPherson messaging</p>
            </div>
            <button type="button" className={styles.waIconBtn} onClick={() => void openContacts()} aria-label="New chat">+</button>
          </header>
          <div className={styles.waSearch}>
            <input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search or start new chat" aria-label="Search conversations" />
          </div>
          <div className={styles.waFilters}>
            {(['All', 'Unread'] as const).map((filter) => (
              <button key={filter} type="button" className={`${styles.waFilter} ${messageFilter === filter ? styles.waFilterActive : ''}`} onClick={() => setMessageFilter(filter)}>{filter}</button>
            ))}
          </div>
          <StateBlock loading={loading} error={error} empty={conversations.length ? undefined : 'No conversations yet.'} onRetry={onReload} />
          <div className={styles.waChatList}>
            {visibleConversations.map((item) => (
              <button key={item.id} type="button" className={`${styles.waChatItem} ${selectedId === item.id ? styles.waChatItemActive : ''}`} onClick={() => setSelectedId(item.id)}>
                <span className={styles.waAvatar}>{(item.partner?.name || 'C').slice(0, 1).toUpperCase()}</span>
                <span className={styles.waChatBody}>
                  <span className={styles.waChatTop}>
                    <strong>{item.partner?.name || 'Conversation'}</strong>
                    <time>{formatTime(item.lastMessage?.timestamp || item.updatedAt)}</time>
                  </span>
                  <span className={styles.waChatBottom}>
                    <small>{item.lastMessage?.content || 'No messages yet'}</small>
                    {item.unreadCount ? <span className={styles.waUnread}>{item.unreadCount}</span> : null}
                  </span>
                </span>
              </button>
            ))}
            {!loading && !visibleConversations.length ? <p className={styles.waEmptySide}>No chats match this filter.</p> : null}
          </div>
        </aside>

        <main className={styles.waMain}>
          {showContacts ? (
            <div className={styles.waContacts}>
              <div className={styles.waMainHead}><div><strong>New chat</strong><p>Select a person to start messaging</p></div><button type="button" className={styles.button} onClick={() => setShowContacts(false)}>Close</button></div>
              <div className={styles.waContactList}>
                {contacts.length ? contacts.map((contact) => (
                  <button key={contact.id} type="button" className={styles.waContact} onClick={() => void startConversation(contact.id)}>
                    <span className={styles.waAvatar}>{(contact.name || 'U').slice(0, 1).toUpperCase()}</span>
                    <span><strong>{contact.name || 'User'}</strong><small>{[contact.role, contact.department].filter(Boolean).join(' · ')}</small></span>
                  </button>
                )) : <StateBlock loading={false} error="" empty="No contacts available." />}
              </div>
            </div>
          ) : selected ? (
            <>
              <header className={styles.waMainHead}>
                <div className={styles.waMainUser}>
                  <span className={styles.waAvatar}>{(selected.partner?.name || 'C').slice(0, 1).toUpperCase()}</span>
                  <div><strong>{selected.partner?.name || 'Conversation'}</strong><p>{[selected.partner?.role, selected.partner?.department].filter(Boolean).join(' · ') || 'Direct message'}</p></div>
                </div>
              </header>
              <div className={styles.waThread} role="log" aria-live="polite">
                <StateBlock loading={threadLoading} error="" empty={thread.length ? undefined : 'No messages yet. Say hello.'} />
                {thread.map((message, index) => (
                  <div key={message.id || index} className={`${styles.waRow} ${message.senderId === 'me' ? styles.waRowMine : ''}`}>
                    <article className={`${styles.waBubble} ${message.senderId === 'me' ? styles.waBubbleMine : ''}`}>
                      <span>{message.content}</span>
                      <time className={styles.waTime}>
                        {formatTime(message.timestamp)}
                        {message.senderId === 'me' ? <span className={styles.waTicks} aria-label={message.status === 'read' ? 'Read' : 'Sent'}>{message.status === 'read' ? '✓✓' : '✓'}</span> : null}
                      </time>
                    </article>
                  </div>
                ))}
              </div>
              <form className={styles.waComposer} onSubmit={(event) => void send(event)}>
                <textarea className={styles.waInput} maxLength={5000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Type a message" aria-label="Write a message" />
                <button type="submit" className={styles.waSend} disabled={!text.trim()} aria-label="Send message">Send</button>
              </form>
            </>
          ) : (
            <div className={styles.waWelcome}><div className={styles.waWelcomeMark}>MCU</div><h3>McPherson Messages</h3><p>Send and receive messages with students and lecturers. Choose a chat or start a new conversation.</p></div>
          )}
          {notice ? <p className={styles.waNotice} role="status">{notice}</p> : null}
        </main>
      </section>
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
