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
            {{ remainingCount }} class{{ remainingCount !== 1 ? 'es' : '' }} remaining today &middot; streak: {{ streak }}d &#x1F525;
          </p>
        </div>
        <router-link to="/attendance" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 no-underline shrink-0" style="background: #2563EB; font-family: 'Inter', system-ui, sans-serif;" @mouseenter="$event.target.style.background = '#1D4ED8'" @mouseleave="$event.target.style.background = '#2563EB'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Check In
        </router-link>
      </div>

      <!-- ===== STAT CARDS (4 columns) ===== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="(stat, i) in stats" :key="i" class="rounded-xl p-5 relative" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <!-- LIVE pill -->
          <div class="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style="background: rgba(37,99,235,0.1); color: #2563EB; font-family: 'Inter', system-ui, sans-serif;">
            <span class="w-1.5 h-1.5 rounded-full" style="background: #2563EB;"></span>
            LIVE
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
            <div v-for="(item, i) in schedule" :key="i" class="flex gap-4">
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
          <div class="mx-6 mb-6 rounded-xl px-5 py-3.5 flex items-center gap-3" style="background: rgba(37,99,235,0.06);">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: rgba(37,99,235,0.12);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="text-xs font-medium" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">Next class ends in</div>
              <div class="text-sm font-bold" style="font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #2563EB;">{{ countdown }}</div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Student ID + Quick Actions -->
        <div class="space-y-5">
          <!-- Student ID Card (dark navy) -->
          <div class="rounded-xl p-6" style="background: #0F1E3D; box-shadow: 0 8px 24px rgba(15,30,61,0.15);">
            <div class="text-[10px] font-semibold mb-3 tracking-wider" style="color: rgba(255,255,255,0.5); font-family: 'Inter', system-ui, sans-serif;">{{ student.matricNo }}</div>
            <div class="flex items-center gap-4 mb-4">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold" style="background: #2563EB; color: #FFFFFF; font-family: 'Fraunces', Georgia, serif;">{{ initials }}</div>
              <div>
                <div class="text-base font-bold" style="color: #FFFFFF; font-family: 'Inter', system-ui, sans-serif;">{{ student.name }}</div>
                <div class="text-xs mt-0.5" style="color: rgba(255,255,255,0.6); font-family: 'Inter', system-ui, sans-serif;">{{ student.program }} &middot; {{ student.level }}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <span class="px-3 py-1 rounded-full text-[10px] font-semibold" style="background: rgba(34,197,94,0.15); color: #22C55E; font-family: 'Inter', system-ui, sans-serif;">Active</span>
              <span class="px-3 py-1 rounded-full text-[10px] font-semibold" style="background: rgba(37,99,235,0.15); color: #60A5FA; font-family: 'Inter', system-ui, sans-serif;">Eligible</span>
            </div>
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
          <div v-for="course in enrolledCourses" :key="course.code" class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold" style="font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #1A1A2E;">{{ course.code }}</span>
              <span class="text-lg font-bold" :style="courseStyle(course.attendance)">{{ course.attendance }}%</span>
            </div>
            <div class="text-sm font-medium mb-3" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">{{ course.name }}</div>
            <!-- Progress bar -->
            <div class="w-full h-2 rounded-full mb-2" style="background: #EDEDED;">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: course.attendance + '%', background: course.attendance >= 75 ? '#22C55E' : '#EF4444' }"></div>
            </div>
            <!-- Warning only for at-risk -->
            <div v-if="course.attendance < 75" class="flex items-center gap-1.5 text-[11px] font-semibold" style="color: #EF4444; font-family: 'Inter', system-ui, sans-serif;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Below 75%
            </div>
            <div v-else class="text-[11px]" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">&nbsp;</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ClipboardCheck, Trophy, TrendingUp, Clock, BookOpen, MessageSquare, Library, Calendar } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(true)

const now = new Date()
const todayDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'Student')

const timeGreeting = computed(() => {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

const streak = 3

const schedule = [
  { time: '08:00', end: '10:00', title: 'Programming Lab', location: 'CS Lab 3', status: 'done' },
  { time: '10:00', end: '12:00', title: 'Database Systems', location: 'LT 2', status: 'done' },
  { time: '13:00', end: '15:00', title: 'Linear Algebra', location: 'Room 204', status: 'current' },
  { time: '15:00', end: '17:00', title: 'Study Group', location: 'Library', status: 'upcoming' },
]

const remainingCount = computed(() => schedule.filter(s => s.status !== 'done').length)

const enrolledCourses = [
  { code: 'CSC 201', name: 'Introduction to Programming', attendance: 92 },
  { code: 'CSC 203', name: 'Database Systems', attendance: 68 },
  { code: 'MTH 201', name: 'Linear Algebra I', attendance: 88 },
  { code: 'STA 201', name: 'Probability & Statistics', attendance: 75 },
  { code: 'PHY 201', name: 'Physics for Computing', attendance: 55 },
  { code: 'GST 201', name: 'Use of English', attendance: 95 },
]

const student = computed(() => ({
  name: authStore.user?.name || 'Adeola Johnson',
  matricNo: authStore.user?.matricNo || '2023/0451',
  program: 'Computer Science',
  level: '200 Level',
}))

const initials = computed(() => {
  return student.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const stats = [
  { icon: ClipboardCheck, iconBg: 'rgba(37,99,235,0.1)', iconColor: '#2563EB', value: '87%', label: 'Overall Attendance', delta: 'of 24 classes', deltaColor: '#68758E' },
  { icon: TrendingUp, iconBg: 'rgba(234,179,8,0.1)', iconColor: '#EAB308', value: '3d', label: 'Streak', delta: '+1 this week', deltaColor: '#EAB308' },
  { icon: Trophy, iconBg: 'rgba(34,197,94,0.1)', iconColor: '#22C55E', value: '21', label: 'Attended', delta: 'Keep it up!', deltaColor: '#22C55E' },
  { icon: Clock, iconBg: 'rgba(239,68,68,0.1)', iconColor: '#EF4444', value: '3', label: 'Needs Attention', delta: 'needs +10%', deltaColor: '#EF4444' },
]

const quickActions = [
  { icon: ClipboardCheck, label: 'Check In', to: '/attendance' },
  { icon: MessageSquare, label: 'AI Chat', to: '/chat' },
  { icon: Library, label: 'Study Hub', to: '/study-hub' },
  { icon: Calendar, label: 'Timetable', to: '/timetable' },
]

function courseStyle(attendance) {
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

// Countdown
const countdown = ref('--:--:--')
let countdownInterval = null

function updateCountdown() {
  const now = new Date()
  const currentItem = schedule.find(s => s.status === 'current')
  let target = null

  if (currentItem) {
    const [h, m] = currentItem.end.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m, 0, 0)
    if (d > now) target = d
  }

  if (!target) {
    const next = schedule.find(s => s.status === 'upcoming')
    if (next) {
      const [h, m] = next.time.split(':').map(Number)
      const d = new Date()
      d.setHours(h, m, 0, 0)
      if (d < now) d.setDate(d.getDate() + 1)
      target = d
    }
  }

  if (!target) { countdown.value = '--:--:--'; return }

  const diff = target - now
  if (diff <= 0) { countdown.value = 'Starting now!'; return }

  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  countdown.value = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
  setTimeout(() => { loading.value = false }, 300)
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
