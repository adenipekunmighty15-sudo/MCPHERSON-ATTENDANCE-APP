<template>
  <PageContent>
    <PageHeader :streak="streak" :todayDate="todayDate" />

    <template v-if="loading">
      <div class="grid grid-cols-1 gap-6">
        <SkeletonLoader v-for="n in 6" :key="n" class="h-24" />
      </div>
    </template>

    <template v-else>
      <MetricsRow :metrics="metrics" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <StudentIdCard />
        </div>
        
        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card v-if="currentClass" class="bg-primary-soft border-primary-muted">
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

          <Card v-else>
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
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
            <template #header>
                <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold">Attendance Rate</span>
                    <span class="text-lg font-bold text-primary">{{ attendancePct }}%</span>
                </div>
            </template>
            <div class="flex items-center justify-center">
                <svg width="100" height="56" viewBox="0 0 100 56">
                    <path d="M6 50 A44 44 0 0 1 94 50" fill="none" stroke="var(--color-border)" stroke-width="6" stroke-linecap="round"/>
                    <path d="M6 50 A44 44 0 0 1 94 50" fill="none" stroke="url(#arcGrad)" stroke-width="6" stroke-linecap="round"
                        stroke-dasharray="138" :stroke-dashoffset="138 * (1 - attendancePct / 100)" />
                </svg>
            </div>
            <template #footer>
                <div class="flex justify-between text-sm">
                    <span>Streak: <strong>{{ streak }}d</strong></span>
                    <span>Missed: <strong>{{ missedClasses }}</strong></span>
                </div>
            </template>
        </Card>

        <Card>
            <template #header>
                <span class="text-sm font-semibold">This Semester</span>
            </template>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <CountUp :to="totalClasses" class="text-4xl font-bold" />
                    <span class="text-xs text-gray-500">Classes</span>
                </div>
                <div>
                    <CountUp :to="attendedClasses" class="text-4xl font-bold text-success" />
                    <span class="text-xs text-gray-500">Attended</span>
                </div>
                <div>
                    <CountUp :to="gpa" :decimals="2" class="text-4xl font-bold text-primary" />
                    <span class="text-xs text-gray-500">GPA</span>
                </div>
            </div>
        </Card>

        <Card>
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

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div class="lg:col-span-3">
          <Card>
            <template #header>
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-bold">My Courses</h2>
                    <Button as="router-link" to="/courses" variant="ghost">
                        View All <ArrowRight class="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </template>
            <div class="flex flex-col gap-4">
                <div v-for="c in enrolledCourses" :key="c.code" class="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" @click="$router.push('/courses')">
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
            <Card>
                <template #header>
                    <div class="flex justify-between items-center">
                        <h2 class="text-lg font-bold flex items-center gap-2">
                            <Calendar class="w-5 h-5" /> Today
                        </h2>
                        <span class="text-sm text-gray-500">{{ todayDate }}</span>
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
                                    <Badge v-if="item.status === 'current'" variant="primary" size="sm">Now</Badge>
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
                    <Button as="router-link" to="/attendance" variant="ghost" class="flex flex-col h-auto">
                        <MapPin class="w-6 h-6" />
                        <span class="text-xs mt-1">Check In</span>
                    </Button>
                    <Button as="router-link" to="/chat" variant="ghost" class="flex flex-col h-auto">
                        <MessageSquare class="w-6 h-6" />
                        <span class="text-xs mt-1">AI Chat</span>
                    </Button>
                    <Button as="router-link" to="/study-hub" variant="ghost" class="flex flex-col h-auto">
                        <Library class="w-6 h-6" />
                        <span class="text-xs mt-1">Study</span>
                    </Button>
                    <Button as="router-link" to="/timetable" variant="ghost" class="flex flex-col h-auto">
                        <Calendar class="w-6 h-6" />
                        <span class="text-xs mt-1">Schedule</span>
                    </Button>
                </div>
            </Card>
        </div>
      </div>
    </template>

    <svg width="0" height="0" class="hidden">
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1E40AF" />
          <stop offset="50%" stop-color="#3B82F6" />
          <stop offset="100%" stop-color="#93C5FD" />
        </linearGradient>
      </defs>
    </svg>
  </PageContent>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ClipboardCheck, BookOpen, Trophy, MapPin, Calendar, MessageSquare, CheckCircle, TrendingUp, ArrowRight, Library, Sun, Cloud, Moon, Star } from 'lucide-vue-next'
import CountUp from '../components/CountUp.vue'
import StudentIdCard from '../components/dashboard/StudentIdCard.vue'
import DashboardHeader from '../components/dashboard/DashboardHeader.vue'
import MetricsRow from '../components/dashboard/MetricsRow.vue'

import PageContent from '@/components/layout/PageContent.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
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
const missedClasses = 2
const totalClasses = 24
const attendedClasses = 21
const gpa = 3.72

const metrics = [
  { label: 'Attendance', value: attendancePct, suffix: '%', icon: ClipboardCheck, color: 'var(--color-primary)', trend: '' },
  { label: 'Streak', value: streak, suffix: 'd', icon: TrendingUp, color: 'var(--color-accent)', trend: '+1 this week' },
  { label: 'Attended', value: attendedClasses, suffix: '', icon: Trophy, color: 'var(--color-primary)', trend: '' },
  { label: 'GPA', value: gpa, suffix: '', icon: BookOpen, color: 'var(--color-muted)', trend: '' },
]

const currentClass = computed(() => schedule.find(s => s.status === 'current') || null)
const nextClass = computed(() => schedule.find(s => s.status === 'upcoming') || schedule.find(s => s.status === 'current') || null)


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

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 500)
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
</style>
