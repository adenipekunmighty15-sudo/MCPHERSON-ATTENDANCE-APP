<template>
  <PageContent class="dash-root">
    <div class="dash-particles" aria-hidden="true">
      <div class="particle p1"></div>
      <div class="particle p2"></div>
      <div class="particle p3"></div>
      <div class="particle p4"></div>
      <div class="particle p5"></div>
    </div>
    <DashboardHeader :streak="streak" :todayDate="todayDate" />

    <template v-if="loading">
      <div class="grid grid-cols-1 gap-6">
        <SkeletonLoader v-for="n in 6" :key="n" class="h-24" />
      </div>
    </template>

    <template v-else>
      <MetricsRow :metrics="metrics" />

      <SessionAttendance v-if="showSession" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-1">
        <div class="lg:col-span-1">
          <StudentIdCard />
        </div>
        
        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card v-if="currentClass" class="bg-primary-soft border-primary-muted card-lift-soft">
            <template #header>
              <Badge variant="primary" class="live-badge">
                <span class="live-dot"></span>
                Live Now
              </Badge>
            </template>
            <h3 class="text-lg font-bold">{{ currentClass.title }}</h3>
            <p class="text-sm text-gray-500 flex items-center gap-2">
              <MapPin class="w-4 h-4" />
              {{ currentClass.location }}
            </p>
            <template #footer>
              <Button as="router-link" to="/attendance" variant="primary">Check In</Button>
            </template>
          </Card>

          <Card v-else class="card-lift-soft">
             <template #header>
                <Badge>
                    <Calendar class="w-4 h-4" />
                    Next Class
                </Badge>
            </template>
            <h3 class="text-lg font-bold">{{ nextClass?.title || 'No classes today' }}</h3>
            <p v-if="nextClass" class="text-sm text-gray-500 flex items-center gap-2">
              <MapPin class="w-4 h-4" />
              {{ nextClass.location }}
              <span class="w-1 h-1 bg-gray-400 rounded-full"></span>
              {{ nextClass.time }}
            </p>
          </Card>
        </div>
      </div>
      
      <div class="grid grid-cols-1 gap-4 stagger-2">
        <Card class="card-lift-soft">
            <template #header>
                <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold">Enrolled Courses</span>
                    <Button as="router-link" to="/courses" variant="ghost">View All</Button>
                </div>
            </template>
            <div class="flex flex-wrap gap-2">
                <Badge v-for="c in enrolledCourses" :key="c.code" variant="soft" as="router-link" to="/courses">
                    {{ c.code }} {{ c.attendance }}%
                </Badge>
            </div>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 stagger-3">
        <div class="lg:col-span-3">
          <Card class="card-lift-soft">
            <template #header>
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-bold">My Courses</h2>
                    <Button as="router-link" to="/courses" variant="ghost">
                        View All <ArrowRight class="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </template>
            <div class="flex flex-col gap-4">
                <div v-for="c in enrolledCourses" :key="c.code" class="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer my-course-item" @click="$router.push('/courses')">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" :style="{ backgroundColor: c.color + '14', color: c.color }">
                        <BookOpen class="w-6 h-6" />
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold">{{ c.code }}</span>
                            <span class="font-semibold" :style="{ color: c.color }">{{ c.attendance }}%</span>
                        </div>
                        <p class="text-sm text-gray-500">{{ c.name }}</p>
                        <Progress :value="c.attendance" :color="c.color" class="h-1.5 mt-1" />
                    </div>
                </div>
            </div>
          </Card>
        </div>

        <div class="lg:col-span-2">
            <Card class="card-lift-soft">
                <template #header>
                    <div class="flex justify-between items-center">
                        <h2 class="text-lg font-bold flex items-center gap-2">
                            <Calendar class="w-5 h-5" /> Today
                        </h2>
                        <div class="flex items-center gap-3">
                            <div v-if="countdown && nextUpcoming" class="countdown-chip" :title="'Next: ' + nextUpcoming.label">
                                <Timer class="w-3.5 h-3.5" />
                                <span class="countdown-value">{{ countdown }}</span>
                            </div>
                            <span class="text-sm text-gray-500">{{ todayDate }}</span>
                        </div>
                    </div>
                </template>

                <div v-if="schedule.length" class="flex flex-col gap-4">
                    <div v-for="(item, i) in schedule" :key="i" class="flex gap-4">
                        <div class="text-sm text-gray-500">{{ item.time }}</div>
                        <div class="flex flex-col items-center">
                            <div class="w-3 h-3 rounded-full" :class="getTimelineDotClass(item.status)"></div>
                            <div v-if="i < schedule.length - 1" class="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div class="flex-1 -mt-1">
                             <div class="p-3 rounded-lg" :class="item.status === 'current' ? 'bg-primary-soft' : ''">
                                <div class="flex justify-between items-center">
                                    <span class="font-semibold">{{ item.title }}</span>
                                    <Badge v-if="item.status === 'current'" variant="primary" size="sm" class="now-badge">Now</Badge>
                                    <CheckCircle v-else-if="item.status === 'done'" class="w-5 h-5 text-success" />
                                </div>
                                <p class="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin class="w-3 h-3" />
                                    {{ item.location }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-8">
                    <Calendar class="w-12 h-12 mx-auto text-gray-400" />
                    <p class="mt-2 text-gray-500">No classes today</p>
                </div>
                
                <div class="grid grid-cols-4 gap-2 mt-4">
                    <Button as="router-link" to="/attendance" variant="ghost" class="flex flex-col h-auto quick-action-btn">
                        <MapPin class="w-6 h-6" />
                        <span class="text-xs mt-1">Check In</span>
                    </Button>
                    <Button as="router-link" to="/chat" variant="ghost" class="flex flex-col h-auto quick-action-btn">
                        <MessageSquare class="w-6 h-6" />
                        <span class="text-xs mt-1">AI Chat</span>
                    </Button>
                    <Button as="router-link" to="/study-hub" variant="ghost" class="flex flex-col h-auto quick-action-btn">
                        <Library class="w-6 h-6" />
                        <span class="text-xs mt-1">Study</span>
                    </Button>
                    <Button as="router-link" to="/timetable" variant="ghost" class="flex flex-col h-auto quick-action-btn">
                        <Calendar class="w-6 h-6" />
                        <span class="text-xs mt-1">Schedule</span>
                    </Button>
                </div>
            </Card>
        </div>
      </div>
    </template>


  </PageContent>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ClipboardCheck, BookOpen, Trophy, MapPin, Calendar, MessageSquare, CheckCircle, TrendingUp, ArrowRight, Library, Sun, Cloud, Moon, Star, Timer } from 'lucide-vue-next'
import StudentIdCard from '../components/dashboard/StudentIdCard.vue'
import DashboardHeader from '../components/dashboard/DashboardHeader.vue'
import MetricsRow from '../components/dashboard/MetricsRow.vue'
import SessionAttendance from '../components/dashboard/SessionAttendance.vue'

import PageContent from '@/components/layout/PageContent.vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Progress from '@/components/ui/Progress.vue'

const authStore = useAuthStore()
const loading = ref(true)

/* ── DATE / TIME ── */
const now = new Date()
const todayDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })


/* ── STATS ── */
const streak = 3
const attendancePct = 87
const attendedClasses = 21

const metrics = [
  { label: 'Attendance', value: attendancePct, suffix: '%', icon: ClipboardCheck, color: 'var(--color-primary)', trend: '' },
  { label: 'Streak', value: streak, suffix: 'd', icon: TrendingUp, color: 'var(--color-accent)', trend: '+1 this week' },
  { label: 'Attended', value: attendedClasses, suffix: '', icon: Trophy, color: 'var(--color-primary)', trend: '' },
]

const currentClass = computed(() => schedule.find(s => s.status === 'current') || null)
const nextClass = computed(() => schedule.find(s => s.status === 'upcoming') || schedule.find(s => s.status === 'current') || null)
const showSession = computed(() => true)


/* ── COURSES / SCHEDULE ── */
const enrolledCourses = [
  { code: 'CSC 201', name: 'Introduction to Programming', attendance: 92, color: '#1E40AF' },
  { code: 'CSC 203', name: 'Database Systems', attendance: 88, color: '#3B82F6' },
  { code: 'MTH 201', name: 'Linear Algebra I', attendance: 75, color: '#0D518C' },
  { code: 'GST 201', name: 'Use of English', attendance: 95, color: '#1E3A8A' },
  { code: 'PHY 201', name: 'Physics for Computing', attendance: 68, color: '#5C6795' },
  { code: 'STA 201', name: 'Probability & Statistics', attendance: 81, color: '#D97706' },
]

const schedule = [
  { time: '08:00', title: 'Programming Lab', location: 'CS Lab 3', status: 'done' },
  { time: '10:00', title: 'Database Systems', location: 'LT 2', status: 'done' },
  { time: '13:00', title: 'Linear Algebra', location: 'Room 204', status: 'current' },
  { time: '15:00', title: 'Study Group', location: 'Library', status: 'upcoming' },
]

const getTimelineDotClass = (status) => {
    switch (status) {
        case 'done': return 'bg-success';
        case 'current': return 'bg-primary ring-2 ring-primary-muted';
        case 'upcoming': return 'bg-gray-400';
        default: return 'bg-gray-300';
    }
}

/* ── LIVE COUNTDOWN TIMER ── */
const countdown = ref('')
const nextUpcoming = computed(() => {
  const upcoming = schedule.find(s => s.status === 'upcoming')
  if (!upcoming) return null
  const [h, m] = upcoming.time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  if (d < new Date()) d.setDate(d.getDate() + 1)
  return { label: upcoming.title, time: upcoming.time, target: d }
})

let countdownInterval = null
function updateCountdown() {
  if (!nextUpcoming.value) { countdown.value = ''; return }
  const diff = nextUpcoming.value.target - new Date()
  if (diff <= 0) { countdown.value = 'Starting now!'; return }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  countdown.value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
  setTimeout(() => {
    loading.value = false
  }, 500)
})

onBeforeUnmount(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<style scoped>
.live-badge {
    animation: pulse 2s ease-in-out infinite;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.8); opacity: 0.5; }
}

/* Course list item hover enhancement */
.my-course-item {
  transition: all 0.2s var(--ease-out);
}
.my-course-item:hover {
  transform: translateX(4px);
  background: var(--color-primary-soft) !important;
}

/* Quick action hover lift */
.quick-action-btn {
  transition: all 0.2s var(--ease-spring);
}
.quick-action-btn:hover {
  transform: translateY(-3px) scale(1.03);
  background: var(--color-primary-soft) !important;
  color: var(--color-primary) !important;
}

/* Now badge enhanced glow */
.now-badge {
  animation: nowGlow 2s ease-in-out infinite;
}
@keyframes nowGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 12px 4px rgba(59, 130, 246, 0.2); }
}

/* Stagger coordination — reset parent's flex to allow animations */
.stagger-1, .stagger-2, .stagger-3 {
  animation: none;
}
.stagger-1 > *,
.stagger-2 > *,
.stagger-3 > * {
  animation: fadeInUp 0.4s var(--ease-out) both;
}

/* ── FLOATING PARTICLES ── */
.dash-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat 8s ease-in-out infinite;
}
.p1 { left: 10%; top: 20%; width: 8px; height: 8px; background: var(--color-primary-soft); animation-delay: 0s; }
.p2 { left: 25%; top: 60%; width: 5px; height: 5px; background: var(--color-accent-soft); animation-delay: 1.5s; }
.p3 { left: 70%; top: 30%; width: 7px; height: 7px; background: var(--color-primary-soft); animation-delay: 3s; }
.p4 { left: 85%; top: 70%; width: 4px; height: 4px; background: var(--color-accent-soft); animation-delay: 4.5s; }
.p5 { left: 50%; top: 10%; width: 6px; height: 6px; background: var(--color-primary-soft); animation-delay: 6s; }
@keyframes particleFloat {
  0% { opacity: 0; transform: translateY(0) scale(0); }
  20% { opacity: 0.6; transform: translateY(-20px) scale(1); }
  80% { opacity: 0.4; transform: translateY(-60px) scale(0.8); }
  100% { opacity: 0; transform: translateY(-80px) scale(0); }
}

/* ── COUNTDOWN CHIP ── */
.countdown-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--color-primary-soft), var(--color-accent-soft));
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  animation: countPulse 2s ease-in-out infinite;
  letter-spacing: 0.3px;
}
.countdown-value {
  font-family: var(--font-mono);
  min-width: 55px;
  text-align: center;
}
@keyframes countPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(15, 30, 61, 0.1); }
  50% { box-shadow: 0 0 8px 2px rgba(15, 30, 61, 0.06); }
}

/* ── ATTENDANCE ARC GLOW ── */
.attendance-arc {
  filter: drop-shadow(0 0 6px var(--color-primary-glow));
  animation: arcFadeIn 1s var(--ease-out) both;
}
@keyframes arcFadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* ── SMALLER CARDS ── */
.stagger-2 > * {
  padding: var(--card-padding-sm) !important;
}
.stagger-2 .text-4xl {
  font-size: var(--text-2xl) !important;
}
.stagger-2 svg[width="100"] {
  transform: scale(0.7);
}
.stagger-2 .badge {
  font-size: 10px;
  padding: 1px 6px;
}
.stagger-2 .flex-wrap {
  gap: 4px;
}
</style>
