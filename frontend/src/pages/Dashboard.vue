<template>
  <div class="dash-page">
    <div class="dashboard-wrap">
      <header class="dash-header" v-reveal:down>
        <div>
          <div class="dash-eyebrow"><span class="eyebrow-mark"></span>{{ formattedDate }}</div>
          <h1>{{ timeGreeting }}, <span>{{ firstName }}</span></h1>
          <p>Your campus day, thoughtfully organized.</p>
        </div>
        <button class="refresh-button ux-touch-target" type="button" aria-label="Refresh dashboard" :disabled="loading" @click="loadDashboard" v-ripple v-squash v-origin v-instant>
          <svg :class="{ spinning: loading }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/></svg>
        </button>
      </header>

      <section class="campus-hero" v-reveal="{ delay: 60 }">
        <div class="hero-copy">
          <span class="hero-kicker">MCU · STUDENT PORTAL</span>
          <h2>Make room for<br /><em>what matters.</em></h2>
          <p v-if="scheduleLoaded && schedule.length">
            {{ remainingCount }} class{{ remainingCount === 1 ? '' : 'es' }} left on your schedule today.
            {{ countdownTarget ? `Your next class ${countdownLabel} in ${countdown}.` : '' }}
          </p>
          <p v-else-if="scheduleLoaded">A little space in your day. Check your timetable for what’s next.</p>
          <p v-else>Your academic essentials, all in one place.</p>
          <router-link to="/attendance" class="hero-action ux-touch-target ux-primary-action ux-solid" v-magnetic="0.14" v-ripple v-squash v-anticipate v-origin v-instant>
            <ClipboardCheck :size="17" />
            Open attendance
            <ArrowUpRight :size="16" />
          </router-link>
        </div>
        <div class="hero-art" aria-hidden="true">
          <SpatialScene class="hero-spatial" variant="orb" :intensity="0.9" />
          <div class="hero-orbit orbit-outer"></div>
          <div class="hero-orbit orbit-inner"></div>
          <Logo :size="96" class="hero-stamp" />
          <span class="hero-spark spark-one">✳</span>
          <span class="hero-spark spark-two">✳</span>
        </div>
        <div class="hero-footer">
          <span><span class="hero-live-dot"></span>YOUR DAY, IN FOCUS</span>
          <span>{{ todayDate }}</span>
        </div>
      </section>

      <section class="active-session-card ux-solid" aria-label="Attendance check-in" v-reveal="{ delay: 120 }" v-peak>
        <div class="session-symbol"><MapPin :size="19" /></div>
        <div class="session-card-copy">
          <span class="section-kicker">ATTENDANCE CHECK-IN</span>
          <template v-if="!sessionsLoaded">
            <h2>Checking for a live session</h2>
            <p>Session availability will appear here when it is confirmed.</p>
          </template>
          <template v-else-if="activeSession">
            <h2>{{ activeSession.courseName || activeSession.courseCode || 'Active class session' }}</h2>
            <p>{{ [activeSession.room, activeSession.venueName].filter(Boolean).join(' · ') || 'Venue details are not available.' }} · Enter your lecturer’s current code and allow GPS on the attendance screen.</p>
          </template>
          <template v-else>
            <h2>No live session right now</h2>
            <p>When a lecturer starts a session, you can verify your attendance with GPS and the current six-digit code.</p>
          </template>
        </div>
        <span v-if="activeSession" class="session-live-badge"><i></i> LIVE</span>
        <router-link to="/attendance" class="session-action ux-touch-target ux-primary-action" v-magnetic="0.12" v-ripple v-squash v-anticipate v-origin v-instant>
          {{ authStore.user?.role === 'lecturer' ? 'Manage sessions' : 'Open check-in' }}
          <ArrowUpRight :size="16" />
        </router-link>
      </section>

      <div v-if="loadError" class="dashboard-alert" role="alert">
        <span>{{ loadError }}</span>
        <button type="button" @click="loadDashboard">Try again</button>
      </div>

      <section class="stats-grid" aria-label="Academic overview" v-stagger="{ step: 70, variant: 'scale' }">
        <article
          v-for="stat in stats"
          :key="stat.label"
          class="stat-card"
          v-tilt="{ max: 5 }"
          v-spotlight
          v-ripple
        >
          <div class="stat-topline">
            <span class="stat-icon" :class="`tone-${stat.tone}`"><component :is="stat.icon" :size="18" /></span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
          <div v-if="loading" class="stat-skeleton"></div>
          <template v-else>
            <strong class="stat-value">{{ stat.value }}</strong>
            <span class="stat-detail">{{ stat.detail }}</span>
          </template>
        </article>
      </section>

      <div class="dashboard-columns">
        <section class="surface-card schedule-card">
          <div class="section-heading">
            <div>
              <span class="section-kicker">PLAN AHEAD</span>
              <h2>Today&apos;s rhythm</h2>
            </div>
            <router-link to="/timetable" class="text-link">Full timetable <ArrowUpRight :size="15" /></router-link>
          </div>

          <div v-if="loading && !scheduleLoaded" class="schedule-loading" aria-label="Loading schedule">
            <div v-for="index in 3" :key="index" class="schedule-placeholder"><span></span><i></i><b></b></div>
          </div>
          <div v-else-if="schedule.length" class="schedule-list" v-stagger="{ step: 70, variant: 'left' }">
            <article v-for="(item, index) in schedule" :key="item.id" class="schedule-item" :class="`schedule-${item.status}`">
              <div class="timeline-rail">
                <span class="timeline-dot"><Check v-if="item.status === 'done'" :size="12" /></span>
                <span v-if="index < schedule.length - 1" class="timeline-line"></span>
              </div>
              <div class="schedule-time">{{ item.time }}</div>
              <div class="schedule-copy">
                <h3>{{ item.title }}</h3>
                <p v-if="item.location"><MapPin :size="13" />{{ item.location }}</p>
              </div>
              <span v-if="item.status === 'current'" class="status-pill status-current">IN PROGRESS</span>
              <span v-else-if="item.status === 'done'" class="status-pill status-done">COMPLETE</span>
              <span v-else class="status-pill status-upcoming">UP NEXT</span>
            </article>
          </div>
          <div v-else-if="scheduleLoaded" class="schedule-empty">
            <div class="empty-icon"><CalendarDays :size="20" /></div>
            <div><h3>No classes on today&apos;s schedule</h3><p>Your timetable will show here when classes are added.</p></div>
          </div>
          <div v-else class="schedule-empty">
            <div class="empty-icon"><CalendarDays :size="20" /></div>
            <div><h3>Schedule unavailable</h3><p>Refresh to try loading your timetable again.</p></div>
          </div>
        </section>

        <aside class="side-stack">
          <section class="identity-panel" aria-label="Digital campus identity">
            <div class="identity-panel-head">
              <div>
                <span class="section-kicker">CAMPUS IDENTITY</span>
                <h2>Your digital ID</h2>
              </div>
              <router-link to="/profile" class="identity-panel-link" aria-label="Open profile">
                <ArrowUpRight :size="16" />
              </router-link>
            </div>
            <div class="id-card-slot">
              <StudentIDCard :student="idCardStudent" />
            </div>
          </section>

          <section class="surface-card shortcuts-card">
            <div class="section-heading">
              <div>
                <span class="section-kicker">GET THERE FASTER</span>
                <h2>Shortcuts</h2>
              </div>
            </div>
            <router-link v-for="action in quickActions" :key="action.label" :to="action.to" class="shortcut-link">
              <span class="shortcut-icon"><component :is="action.icon" :size="17" /></span>
              <span>{{ action.label }}</span>
              <ArrowUpRight :size="15" class="shortcut-arrow" />
            </router-link>
          </section>

          <router-link to="/profile" class="account-card">
            <div class="account-avatar">{{ authStore.user?.name?.charAt(0) || 'U' }}</div>
            <div class="account-copy">
              <span>YOUR ACCOUNT</span>
              <strong>{{ authStore.user?.name || 'Student' }}</strong>
              <small>{{ authStore.user?.email || 'Manage your profile' }}</small>
            </div>
            <ArrowUpRight :size="16" />
          </router-link>
        </aside>
      </div>

      <section class="courses-section">
        <div class="section-heading courses-heading">
          <div>
            <span class="section-kicker">KEEP YOUR MOMENTUM</span>
            <h2>Course attendance</h2>
          </div>
          <router-link to="/courses" class="text-link">All courses <ArrowUpRight :size="15" /></router-link>
        </div>

        <div v-if="loading && !coursesLoaded" class="course-grid">
          <div v-for="index in 3" :key="index" class="course-skeleton"><span></span><i></i><b></b></div>
        </div>
        <div v-else-if="courses.length" class="course-grid" v-stagger="{ step: 80, variant: 'up' }">
          <article v-for="course in courses" :key="course.id" class="course-card">
            <div class="course-card-top">
              <span class="course-code">{{ course.code }}</span>
              <span class="course-percent" :class="course.attendance != null && course.attendance < 75 ? 'below-target' : ''">
                {{ course.attendance == null ? '—' : `${course.attendance}%` }}
              </span>
            </div>
            <h3>{{ course.name }}</h3>
            <div class="course-progress" role="progressbar" :aria-label="`${course.name} attendance`" :aria-valuenow="course.attendance ?? 0" aria-valuemin="0" aria-valuemax="100">
              <span :style="{ width: `${course.attendance ?? 0}%` }" :class="{ 'progress-low': course.attendance != null && course.attendance < 75 }"></span>
            </div>
            <div class="course-card-foot">
              <span>{{ course.attendance == null ? 'No attendance records yet' : course.attendance < 75 ? 'Below 75% target' : 'On track' }}</span>
              <span v-if="course.attendance != null" class="course-foot-dot" :class="{ 'dot-low': course.attendance < 75 }"></span>
            </div>
          </article>
        </div>
        <div v-else class="courses-empty">
          <BookOpen :size="21" />
          <p>{{ coursesLoaded ? 'Your enrolled courses will appear here.' : 'Course information is unavailable right now.' }}</p>
          <router-link to="/courses">Visit courses <ArrowUpRight :size="14" /></router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Logo from '../components/Logo.vue'
import StudentIDCard from '../components/StudentIDCard.vue'
import SpatialScene from '../components/premium/SpatialScene.vue'
import { useAuthStore } from '../stores/auth'
import api from '../lib/api'
import { ArrowUpRight, BookOpen, Calendar, CalendarDays, Check, ClipboardCheck, Library, MapPin, MessageSquare, Trophy } from 'lucide-vue-next'

const authStore = useAuthStore()
const attendanceRecords = ref([])
const timetableItems = ref([])
const enrolledCourses = ref([])
const activeSessions = ref([])
const loadError = ref('')
const loading = ref(true)
const attendanceLoaded = ref(false)
const scheduleLoaded = ref(false)
const coursesLoaded = ref(false)
const sessionsLoaded = ref(false)
const clockNow = ref(Date.now())

const todayDate = new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })
const formattedDate = new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'Student')

const idCardStudent = computed(() => ({
  name: authStore.user?.name || 'Student',
  matricNo: authStore.user?.matricNumber || authStore.user?.matric || authStore.user?.staffId || authStore.user?.id?.slice(0, 10).toUpperCase() || 'MCU/—',
  department: authStore.user?.department || 'Computer Science',
  level: authStore.user?.level || '300 Level',
  validUntil: `${new Date().getFullYear() + 4}/08/31`,
  role: authStore.user?.role || 'student',
  avatarUrl: authStore.user?.avatarUrl || '',
}))
const activeSession = computed(() => {
  const userId = String(authStore.user?.id || '')
  if (authStore.user?.role === 'lecturer') {
    return activeSessions.value.find(session => String(session.lecturerId || session.lecturer_id || '') === userId) || null
  }
  const enrolledIds = new Set(enrolledCourses.value
    .map(course => course.id || course.courseId || course.course_id)
    .filter(Boolean)
    .map(String))
  return activeSessions.value.find(session => enrolledIds.has(String(session.courseId || session.course_id || ''))) || null
})

const timeGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

function unwrapItems(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result?.items)) return result.items
  if (Array.isArray(result?.records)) return result.records
  return []
}

function getCourseKey(row) {
  return String(row.courseId || row.course_id || row.course?.id || row.courseCode || row.course_code || row.code || row.courseName || row.course_name || row.course?.code || row.course?.name || '').toLowerCase()
}

function getAttendanceRate(course) {
  const explicit = course.attendanceRate ?? course.attendance_rate ?? course.attendance
  if (Number.isFinite(Number(explicit)) && explicit !== '' && explicit != null) return Math.round(Number(explicit))
  const code = getCourseKey(course)
  const records = attendanceRecords.value.filter(record => getCourseKey(record) === code)
  if (!records.length) return null
  const present = records.filter(record => ['present', 'late'].includes(String(record.status || '').toLowerCase())).length
  return Math.round((present / records.length) * 100)
}

const schedule = computed(() => {
  const now = new Date(clockNow.value)
  const todayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return timetableItems.value.map((item, index) => {
    const date = item.date || item.sessionDate || item.session_date || ''
    const day = String(item.day || item.weekday || '').toLowerCase()
    if (date && date.slice(0, 10) !== todayIso) return null
    if (!date && day && day !== todayName) return null
    if (!date && !day) return null
    const time = item.startTime || item.start_time || item.start || item.time || ''
    const end = item.endTime || item.end_time || item.end || ''
    const title = item.courseName || item.course_name || item.course?.name || item.title || item.name || item.courseCode || item.course_code || item.code
    if (!time || !title) return null
    const startMinutes = timeToMinutes(time)
    const endMinutes = timeToMinutes(end)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const status = endMinutes > 0 && currentMinutes >= endMinutes ? 'done' : startMinutes > 0 && currentMinutes >= startMinutes && (!endMinutes || currentMinutes < endMinutes) ? 'current' : 'upcoming'
    return {
      id: item.id || item.sessionId || item.session_id || `${title}-${time}-${index}`,
      time: formatClock(time),
      end: formatClock(end),
      startMinutes,
      endMinutes,
      title,
      location: item.location || item.venue || item.room || '',
      status,
    }
  }).filter(Boolean).sort((a, b) => a.startMinutes - b.startMinutes)
})

const remainingCount = computed(() => schedule.value.filter(s => s.status !== 'done').length)

const courses = computed(() => enrolledCourses.value.map((course, index) => ({
  code: course.code || course.courseCode || course.course_code || '—',
  name: course.title || course.name || course.courseName || course.course_name || '—',
  attendance: getAttendanceRate(course),
  id: course.id || course.courseId || course.course_id || index,
})))

const attendanceSummary = computed(() => {
  const valid = attendanceRecords.value.filter(record => record.status)
  const present = valid.filter(record => ['present', 'late'].includes(String(record.status).toLowerCase())).length
  const total = valid.length
  return { total, present, rate: total ? Math.round((present / total) * 100) : null }
})

const stats = computed(() => [
  {
    icon: ClipboardCheck,
    tone: 'green',
    value: attendanceLoaded.value && attendanceSummary.value.rate != null ? `${attendanceSummary.value.rate}%` : '—',
    label: 'Attendance rate',
    detail: attendanceLoaded.value ? `${attendanceSummary.value.total} recorded classes` : 'Awaiting records',
  },
  {
    icon: Trophy,
    tone: 'gold',
    value: attendanceLoaded.value ? attendanceSummary.value.present : '—',
    label: 'Classes attended',
    detail: attendanceLoaded.value ? 'Present or late' : 'Awaiting records',
  },
  {
    icon: BookOpen,
    tone: 'blue',
    value: coursesLoaded.value ? courses.value.length : '—',
    label: 'Enrolled courses',
    detail: coursesLoaded.value ? 'From your course list' : 'Awaiting courses',
  },
  {
    icon: Calendar,
    tone: 'coral',
    value: scheduleLoaded.value ? schedule.value.length : '—',
    label: 'Classes today',
    detail: scheduleLoaded.value ? `${remainingCount.value} still to come` : 'Awaiting timetable',
  },
])

const quickActions = [
  { icon: ClipboardCheck, label: 'Check In', to: '/attendance' },
  { icon: MessageSquare, label: 'AI Chat', to: '/chat' },
  { icon: Library, label: 'Study Hub', to: '/study-hub' },
  { icon: Calendar, label: 'Timetable', to: '/timetable' },
]

const countdown = ref('--:--:--')
const countdownTarget = ref(false)
const countdownLabel = ref('starts')
let countdownInterval = null

function timeToMinutes(value) {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return 0
  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (match[3]) {
    hours %= 12
    if (match[3].toUpperCase() === 'PM') hours += 12
  }
  return hours * 60 + minutes
}

function formatClock(value) {
  if (!value) return ''
  const minutes = timeToMinutes(value)
  if (!minutes && !/^0?0:00/.test(String(value))) return String(value)
  const hour = Math.floor(minutes / 60) % 24
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

function updateCountdown() {
  clockNow.value = Date.now()
  const now = new Date(clockNow.value)
  const currentItem = schedule.value.find(item => item.status === 'current')
  const nextItem = schedule.value.find(item => item.status === 'upcoming')
  const item = currentItem || nextItem
  countdownTarget.value = !!item
  if (!item) { countdown.value = '--:--:--'; return }
  countdownLabel.value = currentItem ? 'ends' : 'starts'
  const target = new Date()
  const targetMinutes = currentItem && item.endMinutes ? item.endMinutes : item.startMinutes
  target.setHours(Math.floor(targetMinutes / 60), targetMinutes % 60, 0, 0)

  const diff = target - now
  if (diff <= 0) { countdown.value = 'Starting now!'; return }

  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  countdown.value = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

async function loadDashboard() {
  loading.value = true
  loadError.value = ''
  const results = await Promise.allSettled([
    api.get('/attendance'),
    api.get('/timetable'),
    api.get('/courses/enrolled'),
    api.get('/sessions/active'),
  ])
  const failures = []
  if (results[0].status === 'fulfilled') {
    attendanceRecords.value = unwrapItems(results[0].value.data)
    attendanceLoaded.value = true
  } else failures.push('attendance')
  if (results[1].status === 'fulfilled') {
    timetableItems.value = unwrapItems(results[1].value.data)
    scheduleLoaded.value = true
  } else failures.push('timetable')
  if (results[2].status === 'fulfilled') {
    enrolledCourses.value = unwrapItems(results[2].value.data)
    coursesLoaded.value = true
  } else failures.push('courses')
  if (results[3].status === 'fulfilled') {
    activeSessions.value = unwrapItems(results[3].value.data)
    sessionsLoaded.value = true
  } else failures.push('live sessions')
  if (failures.length) loadError.value = `Could not load ${failures.join(', ')}. Your other dashboard information is still available.`
  loading.value = false
}

onMounted(() => {
  loadDashboard()
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
})

onBeforeUnmount(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<style>
.dash-page {
  min-height: 100%;
  color: var(--color-text-primary);
}

.dashboard-wrap {
  width: min(100%, 1320px);
  margin: 0 auto;
  padding: clamp(8px, 1.4vw, 20px) 0 36px;
}

.dash-header,
.section-heading,
.stat-topline,
.course-card-top,
.course-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dash-header {
  margin-bottom: 22px;
}

.dash-eyebrow,
.hero-kicker,
.section-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.dash-eyebrow,
.section-kicker {
  color: var(--color-text-tertiary);
}

.eyebrow-mark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #b96445;
  box-shadow: 0 0 0 4px rgba(217, 119, 87, 0.14);
}

.dash-header h1 {
  margin: 7px 0 2px;
  font-family: var(--font-display);
  font-size: clamp(30px, 3.8vw, 44px);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.dash-header h1 span {
  color: var(--color-primary-light);
}

.dash-header p {
  margin: 8px 0 0;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.refresh-button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, color 180ms ease;
}

.refresh-button:hover:not(:disabled) {
  transform: rotate(-12deg);
  border-color: var(--color-border-accent);
  color: var(--color-primary);
}

.refresh-button:disabled {
  cursor: wait;
}

.spinning {
  animation: dashboardSpin 1s linear infinite;
}

@keyframes dashboardSpin {
  to { transform: rotate(360deg); }
}

.campus-hero {
  position: relative;
  display: flex;
  min-height: 255px;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  padding: 34px clamp(24px, 4vw, 54px) 58px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 26px;
  background:
    radial-gradient(ellipse at 82% 40%, rgba(249, 172, 138, 0.24), transparent 34%),
    linear-gradient(115deg, #24352a 5%, #31543b 58%, #3d684b 100%);
  box-shadow: 0 24px 54px rgba(36, 53, 42, 0.22);
  color: #faf7ef;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.hero-kicker {
  color: rgba(226, 232, 240, 0.72);
}

.hero-copy h2 {
  margin: 15px 0 10px;
  font-family: var(--font-display);
  font-size: clamp(36px, 4.5vw, 56px);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 0.99;
}

.hero-copy h2 em {
  color: #c87958;
  font-weight: 500;
}

.hero-copy p {
  max-width: 430px;
  margin: 0;
  color: rgba(248, 250, 252, 0.76);
  font-size: 13px;
  line-height: 1.65;
}

.hero-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 0 15px;
  border-radius: 12px;
  background: #c87958;
  color: #24352a;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  transition: transform 180ms ease, background 180ms ease;
}

.hero-action:hover {
  transform: translateY(-2px);
  background: #ffc4ad;
  color: #24352a;
}

.hero-action svg:last-child {
  margin-left: 8px;
}

.hero-art {
  position: absolute;
  top: 50%;
  right: clamp(30px, 9vw, 140px);
  width: 230px;
  height: 230px;
  transform: translateY(-50%);
}

.hero-spatial {
  inset: -56px -46px;
  opacity: 0.96;
}

.hero-art > :not(.hero-spatial) {
  z-index: 1;
}

.hero-orbit {
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(249, 172, 138, 0.3);
  border-radius: 50%;
}

.orbit-outer {
  transform: rotate(-28deg) scaleX(0.75);
}

.orbit-inner {
  inset: 35px;
  border-color: rgba(249, 172, 138, 0.4);
  transform: rotate(32deg) scaleX(0.75);
}

.hero-stamp {
  position: absolute;
  top: 50%;
  left: 50%;
  opacity: 0.94;
  transform: translate(-50%, -50%) rotate(-8deg);
}

.hero-spark {
  position: absolute;
  color: #c87958;
  font-size: 20px;
}

.spark-one {
  top: 18px;
  right: 40px;
}

.spark-two {
  bottom: 23px;
  left: 36px;
  color: rgba(249, 172, 138, 0.72);
  font-size: 12px;
}

.hero-footer {
  position: absolute;
  right: 26px;
  bottom: 0;
  left: 26px;
  display: flex;
  justify-content: space-between;
  padding: 13px 0;
  border-top: 1px solid rgba(226, 232, 240, 0.16);
  color: rgba(248, 250, 252, 0.62);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.hero-footer > span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hero-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c87958;
  box-shadow: 0 0 0 4px rgba(249, 172, 138, 0.2);
}

.active-session-card {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 16px;
  padding: 18px 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.session-symbol {
  width: 42px;
  height: 42px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.session-card-copy {
  min-width: 0;
  flex: 1;
}

.session-card-copy .section-kicker {
  color: var(--color-text-tertiary);
}

.session-card-copy h2 {
  margin: 4px 0;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 700;
}

.session-card-copy p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 11px;
  line-height: 1.5;
}

.session-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.session-live-badge i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.session-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 750;
  text-decoration: none;
}

.session-action:hover {
  color: var(--color-primary-hover);
}

.dashboard-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 18px;
  padding: 13px 16px;
  border: 1px solid var(--color-error-soft);
  border-radius: 13px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
}

.dashboard-alert button {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 24px;
}

.stat-card,
.surface-card,
.course-card,
.courses-empty {
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.stat-card {
  min-height: 142px;
  padding: 17px 18px;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.stat-card:hover,
.course-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-accent);
  box-shadow: var(--shadow-md);
}

.stat-topline {
  justify-content: flex-start;
  gap: 10px;
}

.stat-icon,
.shortcut-icon,
.empty-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.stat-icon {
  width: 35px;
  height: 35px;
  border-radius: 11px;
}

.tone-green {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.tone-gold {
  background: var(--color-gold-soft);
  color: var(--color-gold);
}

.tone-blue {
  background: var(--color-info-soft);
  color: var(--color-info);
}

.tone-coral {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.stat-label {
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 650;
}

.stat-value {
  display: block;
  margin-top: 13px;
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
}

.stat-detail {
  display: block;
  margin-top: 7px;
  color: var(--color-text-quaternary);
  font-size: 10px;
}

.stat-skeleton,
.course-skeleton {
  background: linear-gradient(90deg, var(--color-surface-elevated), var(--color-border), var(--color-surface-elevated));
  background-size: 200% 100%;
  animation: dashboardShimmer 1.4s ease-in-out infinite;
}

.stat-skeleton {
  width: 76px;
  height: 31px;
  margin-top: 17px;
  border-radius: 7px;
}

@keyframes dashboardShimmer {
  to { background-position: -200% 0; }
}

.dashboard-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(260px, 0.85fr);
  align-items: start;
  gap: 18px;
}

.surface-card {
  padding: 22px;
}

.section-heading {
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 15px;
}

.section-kicker {
  display: block;
  font-size: 9px;
}

.section-heading h2 {
  margin: 5px 0 0;
  font-family: var(--font-display);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.text-link:hover {
  color: var(--color-primary-hover);
}

.schedule-list {
  display: flex;
  flex-direction: column;
}

.schedule-item {
  display: grid;
  grid-template-columns: 19px 72px minmax(0, 1fr) auto;
  align-items: start;
  gap: 11px;
  min-height: 68px;
}

.timeline-rail {
  position: relative;
  display: flex;
  height: 100%;
  justify-content: center;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  display: grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-success);
}

.schedule-current .timeline-dot {
  border: 5px solid var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.schedule-done .timeline-dot {
  border: 0;
  background: var(--color-success-soft);
}

.timeline-line {
  position: absolute;
  top: 19px;
  bottom: -1px;
  width: 1px;
  background: var(--color-border);
}

.schedule-time {
  padding-top: 2px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.schedule-copy {
  min-width: 0;
  padding-bottom: 18px;
}

.schedule-copy h3 {
  overflow: hidden;
  margin: 0;
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-done .schedule-copy h3 {
  color: var(--color-text-tertiary);
  font-weight: 550;
}

.schedule-copy p {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 5px 0 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.status-pill {
  margin-top: 1px;
  padding: 5px 7px;
  border-radius: 6px;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.status-current {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.status-done {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.status-upcoming {
  background: var(--color-surface-elevated);
  color: var(--color-text-quaternary);
}

.schedule-empty {
  display: flex;
  min-height: 128px;
  align-items: center;
  gap: 13px;
  color: var(--color-text-secondary);
}

.empty-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.schedule-empty h3 {
  margin: 0;
  font-size: 12px;
}

.schedule-empty p {
  margin: 4px 0 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.schedule-loading {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 0;
}

.schedule-placeholder {
  display: grid;
  grid-template-columns: 18px 64px 1fr;
  align-items: center;
  gap: 12px;
}

.schedule-placeholder span,
.schedule-placeholder i,
.schedule-placeholder b,
.course-skeleton span,
.course-skeleton i,
.course-skeleton b {
  display: block;
  height: 10px;
  border-radius: 8px;
  background: var(--color-surface-elevated);
}

.schedule-placeholder span {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.schedule-placeholder i {
  width: 48px;
}

.schedule-placeholder b {
  width: 72%;
}

.side-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.identity-panel {
  padding: 13px;
  border: 1px solid var(--color-border);
  border-radius: 21px;
  background: var(--color-surface);
}

.identity-panel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 3px 8px;
}

/* The card renders with a resting lift inside its layout slot. Reserve a
   little room here so the raised card never collides with the panel heading. */
.id-card-slot {
  padding-top: 10px;
}

.identity-panel-head h2 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.identity-panel-link {
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  color: var(--color-text-secondary);
  transition: color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.identity-panel-link:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-accent);
  color: var(--color-primary);
}

.shortcuts-card {
  padding: 21px;
}

.shortcuts-card .section-heading {
  margin-bottom: 11px;
}

.shortcut-link {
  display: flex;
  min-height: 49px;
  align-items: center;
  gap: 11px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 650;
  text-decoration: none;
  transition: color 160ms ease, padding 160ms ease;
}

.shortcut-link:hover {
  padding-left: 3px;
  color: var(--color-primary);
}

.shortcut-icon {
  width: 31px;
  height: 31px;
  border-radius: 10px;
  background: var(--color-surface-elevated);
  color: var(--color-primary);
}

.shortcut-arrow {
  margin-left: auto;
  color: var(--color-text-quaternary);
}

.account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border: 1px solid var(--color-border);
  border-radius: 17px;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: border-color 160ms ease, transform 160ms ease;
}

.account-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-accent);
  color: var(--color-text-primary);
}

.account-avatar {
  display: grid;
  width: 41px;
  height: 41px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 13px;
  background: var(--color-accent);
  color: #24352a;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 650;
}

.account-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.account-copy > span {
  color: var(--color-text-tertiary);
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.account-copy strong,
.account-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-copy strong {
  font-size: 11px;
}

.account-copy small {
  color: var(--color-text-tertiary);
  font-size: 9px;
}

.account-card > svg {
  margin-left: auto;
  color: var(--color-text-tertiary);
}

.courses-section {
  margin-top: 28px;
}

.courses-heading {
  margin-bottom: 14px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.course-card {
  min-width: 0;
  padding: 18px;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.course-code {
  padding: 5px 8px;
  border-radius: 7px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
}

.course-percent {
  color: var(--color-success);
  font-family: var(--font-display);
  font-size: 25px;
  font-weight: 600;
}

.course-percent.below-target {
  color: var(--color-error);
}

.course-card h3 {
  overflow: hidden;
  min-height: 36px;
  margin: 16px 0 14px;
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
  text-overflow: ellipsis;
}

.course-progress {
  height: 6px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--color-muted);
}

.course-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-success);
  transition: width 350ms ease;
}

.course-progress span.progress-low {
  background: var(--color-error);
}

.course-card-foot {
  margin-top: 9px;
  color: var(--color-text-tertiary);
  font-size: 9px;
}

.course-foot-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
}

.course-foot-dot.dot-low {
  background: var(--color-error);
}

.course-skeleton {
  display: flex;
  min-height: 155px;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
}

.course-skeleton span {
  width: 30%;
  height: 18px;
}

.course-skeleton i {
  width: 65%;
  height: 12px;
}

.course-skeleton b {
  width: 100%;
  height: 6px;
}

.courses-empty {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.courses-empty > svg {
  color: var(--color-primary-light);
}

.courses-empty p {
  margin: 0;
}

.courses-empty a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .dashboard-columns {
    grid-template-columns: minmax(0, 1.35fr) minmax(230px, 0.85fr);
  }

  .hero-art {
    right: 4vw;
    opacity: 0.8;
  }
}

@media (max-width: 850px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-columns {
    grid-template-columns: 1fr;
  }

  .side-stack {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }

  .course-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .dashboard-wrap {
    padding-top: 0;
    padding-bottom: 20px;
  }

  .dash-header {
    margin-bottom: 16px;
  }

  .dash-header h1 {
    font-size: 32px;
  }

  .dash-header p {
    font-size: 11px;
  }

  .campus-hero {
    min-height: 263px;
    padding: 28px 20px 58px;
    border-radius: 21px;
  }

  .active-session-card {
    flex-wrap: wrap;
    gap: 10px 12px;
    padding: 14px;
  }

  .session-card-copy {
    flex-basis: calc(100% - 58px);
  }

  .session-live-badge {
    margin-left: 54px;
  }

  .session-action {
    margin-left: auto;
  }

  .hero-copy {
    max-width: 78%;
  }

  .hero-copy h2 {
    font-size: 39px;
  }

  .hero-copy p {
    font-size: 11px;
  }

  .hero-art {
    right: -91px;
    width: 210px;
    height: 210px;
    opacity: 0.45;
  }

  .hero-footer {
    right: 19px;
    left: 19px;
    font-size: 8px;
  }

  .stats-grid {
    gap: 9px;
    margin-top: 13px;
  }

  .stat-card {
    min-height: 125px;
    padding: 13px;
    border-radius: 15px;
  }

  .stat-icon {
    width: 31px;
    height: 31px;
  }

  .stat-label {
    font-size: 10px;
  }

  .stat-value {
    margin-top: 12px;
    font-size: 28px;
  }

  .stat-detail {
    font-size: 9px;
  }

  .surface-card {
    padding: 17px 14px;
  }

  .section-heading h2 {
    font-size: 22px;
  }

  .section-kicker {
    font-size: 8px;
  }

  .schedule-item {
    grid-template-columns: 19px 60px minmax(0, 1fr);
    gap: 8px;
  }

  .schedule-time {
    font-size: 9px;
  }

  .status-pill {
    display: none;
  }

  .side-stack {
    grid-template-columns: 1fr;
  }

  .account-card {
    order: -1;
  }

  .course-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .course-card {
    padding: 15px;
  }

  .course-card h3 {
    min-height: auto;
    margin: 11px 0;
  }

  .courses-empty {
    flex-wrap: wrap;
    padding: 20px;
    text-align: center;
  }
}
</style>
