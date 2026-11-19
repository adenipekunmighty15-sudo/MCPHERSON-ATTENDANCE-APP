<template>
  <div class="dash-page" style="background: #F5F1EA; min-height: 100dvh;">
    <div class="max-w-7xl mx-auto px-6 py-8 lg:px-8">
      <!-- ===== HEADER ROW ===== -->
      <div class="flex items-start justify-between mb-8">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-[1.5px] mb-2" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ formattedDate }}</div>
          <h1 class="text-4xl lg:text-5xl font-bold leading-tight" style="font-family: 'Fraunces', Georgia, serif; color: #1A1A2E;">
            {{ timeGreeting }}, <span style="color: #C9902B;">{{ firstName }}</span>
          </h1>
          <p class="text-sm mt-1.5" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">
          {{ remainingCount }} scheduled class{{ remainingCount !== 1 ? 'es' : '' }} remaining today
          </p>
        </div>
        <router-link to="/attendance" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 no-underline shrink-0" style="background: #2563EB; font-family: 'Inter', system-ui, sans-serif;" @mouseenter="$event.target.style.background = '#1D4ED8'" @mouseleave="$event.target.style.background = '#2563EB'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Check In
        </router-link>
      </div>

      <div v-if="loadError" class="mb-6 rounded-xl p-4 text-sm" role="alert" style="background: rgba(239,68,68,0.08); color: #B91C1C;">
        {{ loadError }}
      </div>

      <!-- ===== STAT CARDS (4 columns) ===== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="(stat, i) in stats" :key="i" class="rounded-xl p-5 relative" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <!-- LIVE pill -->
          <div class="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style="background: rgba(37,99,235,0.1); color: #2563EB; font-family: 'Inter', system-ui, sans-serif;">
            <span class="w-1.5 h-1.5 rounded-full" style="background: #2563EB;"></span>
            API
          </div>
          <!-- Icon box -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" :style="{ background: stat.iconBg }">
            <component :is="stat.icon" class="w-5 h-5" :style="{ color: stat.iconColor }" />
          </div>
          <!-- Number -->
          <div class="text-3xl font-bold mb-0.5" style="color: #1A1A2E; font-family: 'Fraunces', Georgia, serif;">{{ stat.value }}</div>
          <!-- Label -->
          <div class="text-xs font-medium mb-1" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">{{ stat.label }}</div>
          <!-- Context line -->
          <div class="text-[11px] font-semibold" :style="{ color: stat.deltaColor }">{{ stat.delta }}</div>
        </div>
      </div>

      <!-- ===== TWO-COLUMN BODY ===== -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- LEFT: Today's Schedule -->
        <div class="lg:col-span-2 rounded-xl overflow-hidden" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="p-6 pb-0">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-bold" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">Today&apos;s Schedule</h2>
              <div class="text-xs font-medium" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ todayDate }}</div>
            </div>

            <!-- Timeline -->
            <p v-if="schedule.length === 0" class="pb-6 text-sm" style="color: #96A0B5;">No scheduled classes for today.</p>
            <div v-for="(item, i) in schedule" :key="item.id" class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-2.5 h-2.5 rounded-full mt-1.5" :class="getDotClass(item.status)" :style="getDotStyle(item.status)"></div>
                <div v-if="i < schedule.length - 1" class="w-0.5 flex-1" style="background: #E2E6ED;"></div>
              </div>
              <div class="flex-1 pb-6">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="text-xs font-medium mb-0.5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ item.time }}</div>
                    <div :class="item.status === 'done' ? 'line-through' : ''" class="text-sm font-semibold" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">{{ item.title }}</div>
                    <div class="text-xs mt-0.5" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">{{ item.location }}</div>
                  </div>
                  <div v-if="item.status === 'current'" class="px-3 py-1 rounded-full text-[10px] font-bold" style="background: rgba(37,99,235,0.12); color: #2563EB; font-family: 'Inter', system-ui, sans-serif;">NOW</div>
                  <svg v-else-if="item.status === 'done'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Countdown banner -->
          <div v-if="countdownTarget" class="mx-6 mb-6 rounded-xl px-5 py-3.5 flex items-center gap-3" style="background: rgba(37,99,235,0.06);">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: rgba(37,99,235,0.12);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="text-xs font-medium" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">Next class {{ countdownLabel }} in</div>
              <div class="text-sm font-bold" style="font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #2563EB;">{{ countdown }}</div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Student ID + Quick Actions -->
        <div class="space-y-5">
          <div class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <h3 class="text-[11px] font-semibold uppercase tracking-wider mb-3" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Signed-in account</h3>
            <p class="text-sm font-bold" style="color: #1A1A2E;">{{ authStore.user?.name || '—' }}</p>
            <p class="text-xs mt-1" style="color: #68758E;">{{ authStore.user?.email || '—' }}</p>
          </div>

          <!-- Quick Actions -->
          <div class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <h3 class="text-[11px] font-semibold uppercase tracking-wider mb-4" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-3">
              <router-link v-for="action in quickActions" :key="action.label" :to="action.to" class="flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl text-center no-underline transition-all duration-200" style="background: #F5F1EA; color: #1A1A2E;" @mouseenter="$event.target.style.background = '#EDEDED'" @mouseleave="$event.target.style.background = '#F5F1EA'">
                <component :is="action.icon" class="w-5 h-5" />
                <span class="text-[11px] font-semibold" style="font-family: 'Inter', system-ui, sans-serif;">{{ action.label }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== COURSE ATTENDANCE GRID (3 columns) ===== -->
      <div>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">Course Attendance</h2>
          <router-link to="/courses" class="text-xs font-semibold no-underline transition-colors" style="color: #2563EB; font-family: 'Inter', system-ui, sans-serif;">View All</router-link>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="course in courses" :key="course.id" class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold" style="font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #1A1A2E;">{{ course.code }}</span>
              <span class="text-lg font-bold" :style="courseStyle(course.attendance)">{{ course.attendance == null ? '—' : `${course.attendance}%` }}</span>
            </div>
            <div class="text-sm font-medium mb-3" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">{{ course.name }}</div>
            <!-- Progress bar -->
            <div class="w-full h-2 rounded-full mb-2" style="background: #EDEDED;">
              <div v-if="course.attendance != null" class="h-full rounded-full transition-all duration-500" :style="{ width: course.attendance + '%', background: course.attendance >= 75 ? '#22C55E' : '#EF4444' }"></div>
            </div>
            <!-- Warning only for at-risk -->
            <div v-if="course.attendance != null && course.attendance < 75" class="flex items-center gap-1.5 text-[11px] font-semibold" style="color: #EF4444; font-family: 'Inter', system-ui, sans-serif;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Below 75%
            </div>
            <div v-else class="text-[11px]" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ course.attendance == null ? 'No attendance data' : '' }}</div>
          </div>
        </div>
        <p v-if="enrolledCourses.length === 0" class="rounded-xl p-6 text-center text-sm" style="background: #FFFFFF; color: #68758E;">
          No enrolled courses are available.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../lib/api'
import { ClipboardCheck, Trophy, TrendingUp, Clock, MessageSquare, Library, Calendar } from 'lucide-vue-next'

const authStore = useAuthStore()
const attendanceRecords = ref([])
const timetableItems = ref([])
const enrolledCourses = ref([])
const loadError = ref('')
const clockNow = ref(Date.now())

const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'Student')

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
    const status = endMinutes && currentMinutes >= endMinutes ? 'done' : startMinutes && currentMinutes >= startMinutes && (!endMinutes || currentMinutes < endMinutes) ? 'current' : 'upcoming'
    return {
      id: item.id || item.sessionId || item.session_id || `${title}-${time}-${index}`,
      time: formatClock(time),
      end: formatClock(end),
      title,
      location: item.location || item.venue || item.room || '',
      status,
    }
  }).filter(Boolean).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
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
  { icon: ClipboardCheck, iconBg: 'rgba(37,99,235,0.1)', iconColor: '#2563EB', value: attendanceSummary.value.rate == null ? '—' : `${attendanceSummary.value.rate}%`, label: 'Overall Attendance', delta: `${attendanceSummary.value.total} recorded classes`, deltaColor: '#68758E' },
  { icon: TrendingUp, iconBg: 'rgba(234,179,8,0.1)', iconColor: '#EAB308', value: '—', label: 'Streak', delta: 'Not available', deltaColor: '#68758E' },
  { icon: Trophy, iconBg: 'rgba(34,197,94,0.1)', iconColor: '#22C55E', value: attendanceSummary.value.present, label: 'Attended', delta: 'Based on attendance records', deltaColor: '#22C55E' },
  { icon: Clock, iconBg: 'rgba(239,68,68,0.1)', iconColor: '#EF4444', value: courses.value.length ? courses.value.filter(course => course.attendance != null && course.attendance < 75).length : '—', label: 'Needs Attention', delta: courses.value.length ? 'Courses below 75%' : 'No course data', deltaColor: '#EF4444' },
])

const quickActions = [
  { icon: ClipboardCheck, label: 'Check In', to: '/attendance' },
  { icon: MessageSquare, label: 'AI Chat', to: '/chat' },
  { icon: Library, label: 'Study Hub', to: '/study-hub' },
  { icon: Calendar, label: 'Timetable', to: '/timetable' },
]

function courseStyle(attendance) {
  if (attendance == null) return { color: '#96A0B5', fontFamily: "'Fraunces', Georgia, serif" }
  return { color: attendance >= 75 ? '#22C55E' : '#EF4444', fontFamily: "'Fraunces', Georgia, serif" }
}

function getDotClass(status) {
  switch (status) {
    case 'done': return ''
    case 'current': return 'pulse-dot'
    case 'upcoming': return ''
    default: return ''
  }
}

function getDotStyle(status) {
  switch (status) {
    case 'done': return { background: '#22C55E' }
    case 'current': return { background: '#2563EB', boxShadow: '0 0 0 4px rgba(37,99,235,0.15)' }
    case 'upcoming': return { background: '#C8CED9' }
    default: return { background: '#C8CED9' }
  }
}

const countdown = ref('--:--:--')
const countdownTarget = ref(false)
const countdownLabel = ref('starts')
let countdownInterval = null

function timeToMinutes(value) {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})/)
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0
}

function formatClock(value) {
  if (!value) return ''
  const match = String(value).match(/(\d{1,2}):(\d{2})/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : String(value)
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
  const [h, m] = (currentItem ? item.end : item.time).split(':').map(Number)
  target.setHours(h, m, 0, 0)

  const diff = target - now
  if (diff <= 0) { countdown.value = 'Starting now!'; return }

  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  countdown.value = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  Promise.all([
    api.get('/attendance').then(({ data }) => { attendanceRecords.value = unwrapItems(data) }),
    api.get('/timetable').then(({ data }) => { timetableItems.value = unwrapItems(data) }),
    api.get('/courses/enrolled').then(({ data }) => { enrolledCourses.value = unwrapItems(data) }),
  ]).catch(err => {
    loadError.value = err?.response?.data?.message || err?.message || 'Some dashboard data could not be loaded.'
  })
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
})

onBeforeUnmount(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<style>
.dash-page {
  font-family: 'Inter', system-ui, sans-serif;
}

.dash-page .pulse-dot {
  animation: dashPulse 2s ease-in-out infinite;
}

@keyframes dashPulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15); }
  50% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.05); }
}

@media (max-width: 768px) {
  .dash-page .max-w-7xl {
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 20px;
  }
}
</style>
