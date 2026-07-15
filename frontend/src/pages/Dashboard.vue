<template>
  <div class="dashboard" ref="dashRef">
    <!-- Header -->
    <div class="dash-header">
      <div class="dash-header-left">
        <div class="dash-greeting">
          <span class="greeting-time">{{ timeGreeting }}</span>
          <h1 class="greeting-name">{{ authStore.user?.name?.split(' ')[0] || 'Student' }}</h1>
        </div>
        <div class="dash-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          {{ todayDate }}
        </div>
      </div>
      <router-link to="/attendance" class="dash-checkin-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <span>Check In</span>
      </router-link>
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="dash-skeleton">
        <div v-for="n in 6" :key="n" class="sk-item" :style="{ animationDelay: n * 0.05 + 's' }">
          <div class="sk-bar" style="width: 40%"></div>
          <div class="sk-bar" style="width: 70%"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Metrics Row -->
      <div class="metrics-row">
        <div v-for="(m, i) in metrics" :key="m.label" class="metric-card" :style="{ '--accent': m.color, '--delay': i * 0.08 + 's' }">
          <div class="metric-icon" :style="{ background: m.color + '14', color: m.color }">
            <component :is="m.icon" class="w-[18px] h-[18px]" />
          </div>
          <div class="metric-body">
            <span class="metric-value" :style="{ color: m.color }">
              <CountUp :to="m.value" :suffix="m.suffix" />
            </span>
            <span class="metric-label">{{ m.label }}</span>
          </div>
          <div v-if="m.trend" class="metric-trend">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            {{ m.trend }}
          </div>
        </div>
      </div>

      <!-- ID Card + Next Class -->
      <div class="spotlight-row">
        <div class="id-card-wrap" ref="cardRef" @click="flipped = !flipped"
          @mousemove="!flipped && onCardMove($event)" @mouseleave="onCardLeave">
          <div class="id-tilt" :style="tiltStyle">
            <div class="id-flipper" :class="{ flipped }">
              <div class="id-front">
                <div class="id-shine" :style="shineStyle"></div>
                <div class="id-stripe"></div>
                <div class="id-top">
                  <div class="id-top-left">
                    <GraduationCap class="w-[14px] h-[14px]" />
                    <span>McPherson University</span>
                  </div>
                  <span class="id-year">{{ currentYear }}</span>
                </div>
                <div class="id-body">
                  <div class="id-photo">
                    <div class="id-avatar" :style="{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }">
                      <span v-if="!avatarUrl">{{ avatarLetter }}</span>
                    </div>
                  </div>
                  <div class="id-info">
                    <div class="id-name">{{ fullName }}</div>
                    <div class="id-student-id">{{ studentId }}</div>
                    <div class="id-row"><span>Programme</span><span>{{ department }}</span></div>
                    <div class="id-row"><span>Level</span><span>{{ level }}00</span></div>
                    <div class="id-row"><span>Expires</span><span>{{ expiryYear }}</span></div>
                  </div>
                </div>
                <div class="id-footer">
                  <span>Student ID Card</span>
                  <span>MCU</span>
                </div>
              </div>
              <div class="id-back">
                <div class="id-back-stripe"></div>
                <div class="id-back-body">
                  <div class="id-back-top">
                    <GraduationCap class="w-[14px] h-[14px]" />
                    <span>McPherson University</span>
                  </div>
                  <div class="id-back-main">
                    <div class="id-qr">
                      <div class="id-qr-grid">
                        <div v-for="n in 121" :key="n" class="id-qr-cell" :class="qrPattern[n-1] ? 'active' : ''"></div>
                      </div>
                      <span class="id-qr-label">{{ studentId }}</span>
                    </div>
                    <div class="id-back-details">
                      <div class="id-holo">
                        <div class="id-holo-shine"></div>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                      <div class="id-signature">
                        <span>Authorised Signature</span>
                        <div class="id-sig-line"></div>
                      </div>
                    </div>
                  </div>
                  <div class="id-barcode">
                    <div v-for="n in 40" :key="n" class="id-bar" :style="{ width: (Math.sin(n*2.3)*0.3+0.7)*2+'px' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="spotlight-cards">
          <div v-if="currentClass" class="spot-card live-card">
            <div class="spot-card-bg"></div>
            <div class="spot-card-content">
              <div class="spot-badge live-badge">
                <span class="live-dot"></span>
                Live Now
              </div>
              <h3 class="spot-title">{{ currentClass.title }}</h3>
              <p class="spot-location">
                <MapPin class="w-[14px] h-[14px]" />
                {{ currentClass.location }}
              </p>
              <router-link to="/attendance" class="spot-btn">Check In</router-link>
            </div>
          </div>
          <div v-else class="spot-card next-card">
            <div class="spot-card-content">
              <div class="spot-badge">
                <Calendar class="w-[14px] h-[14px]" />
                Next Class
              </div>
              <h3 class="spot-title">{{ nextClass?.title || 'No classes today' }}</h3>
              <p v-if="nextClass" class="spot-location">
                <MapPin class="w-[14px] h-[14px]" />
                {{ nextClass.location }}
                <span class="spot-dot"></span>
                {{ nextClass.time }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Attendance Rate</span>
            <span class="stat-pct">{{ attendancePct }}%</span>
          </div>
          <div class="stat-ring">
            <svg width="100" height="56" viewBox="0 0 100 56">
              <path d="M6 50 A44 44 0 0 1 94 50" fill="none" stroke="var(--color-border)" stroke-width="6" stroke-linecap="round"/>
              <path d="M6 50 A44 44 0 0 1 94 50" fill="none" stroke="url(#arcGrad)" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="138" :stroke-dashoffset="138 * (1 - attendancePct / 100)" style="filter: drop-shadow(0 0 6px var(--color-primary-glow))" />
            </svg>
            <div class="stat-ring-value">{{ attendancePct }}%</div>
          </div>
          <div class="stat-footer">
            <span>Streak: <strong>{{ streak }}d</strong></span>
            <span>Missed: <strong>{{ missedClasses }}</strong></span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">This Semester</span>
          </div>
          <div class="stat-numbers">
            <div class="stat-number">
              <CountUp :to="totalClasses" class="stat-num-value" />
              <span class="stat-num-label">Classes</span>
            </div>
            <div class="stat-number">
              <CountUp :to="attendedClasses" class="stat-num-value" :style="{ color: 'var(--color-success)' }" />
              <span class="stat-num-label">Attended</span>
            </div>
            <div class="stat-number">
              <CountUp :to="gpa" :decimals="2" class="stat-num-value" :style="{ color: 'var(--color-primary)' }" />
              <span class="stat-num-label">GPA</span>
            </div>
          </div>
        </div>

        <div class="stat-card course-tags-card">
          <div class="stat-header">
            <span class="stat-label">Enrolled Courses</span>
            <router-link to="/courses" class="stat-link">View All</router-link>
          </div>
          <div class="course-tags">
            <router-link v-for="c in enrolledCourses" :key="c.code" to="/courses" class="course-tag" :style="{ background: c.color + '14', color: c.color, '--tag-color': c.color }">
              <span class="course-tag-dot" :style="{ background: c.color }"></span>
              <span class="course-tag-code">{{ c.code }}</span>
              <span class="course-tag-pct">{{ c.attendance }}%</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Bottom Grid -->
      <div class="bottom-grid">
        <div class="bottom-left">
          <div class="section-header">
            <h2 class="section-title">My Courses</h2>
            <router-link to="/courses" class="section-link">
              View All
              <ArrowRight class="w-[14px] h-[14px]" />
            </router-link>
          </div>
          <div class="courses-list">
            <div v-for="c in enrolledCourses" :key="c.code" class="course-item" @click="$router.push('/courses')">
              <div class="course-icon" :style="{ background: c.color + '14', color: c.color }">
                <BookOpen class="w-[16px] h-[16px]" />
              </div>
              <div class="course-meta">
                <div class="course-top">
                  <span class="course-code">{{ c.code }}</span>
                  <span class="course-pct" :style="{ color: c.color }">{{ c.attendance }}%</span>
                </div>
                <span class="course-name">{{ c.name }}</span>
                <div class="course-bar">
                  <div class="course-bar-fill" :style="{ width: c.attendance + '%', background: c.color }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-right">
          <div class="section-header">
            <h2 class="section-title">
              <Calendar class="w-[16px] h-[16px]" />
              Today
            </h2>
            <span class="section-date">{{ todayDate }}</span>
          </div>

          <div v-if="schedule.length" class="timeline">
            <div v-for="(item, i) in schedule" :key="i" class="tl-item">
              <div class="tl-time">{{ item.time }}</div>
              <div class="tl-line">
                <div class="tl-dot" :class="item.status"></div>
                <div v-if="i < schedule.length - 1" class="tl-connector"></div>
              </div>
              <div class="tl-card" :class="item.status">
                <div class="tl-card-top">
                  <span class="tl-title">{{ item.title }}</span>
                  <span v-if="item.status === 'current'" class="tl-badge">Now</span>
                  <CheckCircle v-else-if="item.status === 'done'" class="w-[16px] h-[16px] text-[var(--color-success)]" />
                </div>
                <p class="tl-location">
                  <MapPin class="w-[12px] h-[12px]" />
                  {{ item.location }}
                </p>
              </div>
            </div>
          </div>

          <div v-else class="tl-empty">
            <Calendar class="w-[40px] h-[40px]" />
            <p>No classes today</p>
          </div>

          <div class="quick-actions">
            <router-link to="/attendance" class="qa-item">
              <div class="qa-icon" style="background: rgba(59,130,246,0.12); color: #3B82F6">
                <MapPin class="w-[20px] h-[20px]" />
              </div>
              <span>Check In</span>
            </router-link>
            <router-link to="/chat" class="qa-item">
              <div class="qa-icon" style="background: rgba(96,165,250,0.12); color: #60A5FA">
                <MessageSquare class="w-[20px] h-[20px]" />
              </div>
              <span>AI Chat</span>
            </router-link>
            <router-link to="/study-hub" class="qa-item">
              <div class="qa-icon" style="background: rgba(139,92,246,0.12); color: #8B5CF6">
                <Library class="w-[20px] h-[20px]" />
              </div>
              <span>Study</span>
            </router-link>
            <router-link to="/timetable" class="qa-item">
              <div class="qa-icon" style="background: rgba(147,197,253,0.12); color: #93C5FD">
                <Calendar class="w-[20px] h-[20px]" />
              </div>
              <span>Schedule</span>
            </router-link>
          </div>
        </div>
      </div>
    </template>

    <svg width="0" height="0" class="hidden">
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3B82F6" />
          <stop offset="50%" stop-color="#60A5FA" />
          <stop offset="100%" stop-color="#93C5FD" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ClipboardCheck, BookOpen, Trophy, MapPin, Calendar, MessageSquare, CheckCircle, GraduationCap, TrendingUp, ArrowRight, Library } from 'lucide-vue-next'
import CountUp from '../components/CountUp.vue'

const authStore = useAuthStore()
const loading = ref(true)
const flipped = ref(false)
const cardRef = ref(null)
const dashRef = ref(null)
const scrollSpinDeg = ref(0)

const fullName = computed(() => authStore.user?.name || 'Student Name')
const department = computed(() => authStore.user?.department || 'Computer Science')
const studentId = computed(() => {
  const id = authStore.user?.id || ''
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : 'MCU' + id.slice(0, 5)
})
const avatarLetter = computed(() => (authStore.user?.name?.charAt(0) || 'S').toUpperCase())
const avatarUrl = computed(() => '')
const level = computed(() => 3)

const now = new Date()
const currentYear = now.getFullYear()
const expiryYear = currentYear + 4
const todayDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const timeGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

const streak = 3
const attendancePct = 87
const missedClasses = 2
const totalClasses = 24
const attendedClasses = 21
const gpa = 3.72

const metrics = [
  { label: 'Attendance', value: attendancePct, suffix: '%', icon: ClipboardCheck, color: 'var(--color-primary)', trend: '' },
  { label: 'Streak', value: streak, suffix: 'd', icon: TrendingUp, color: '#60A5FA', trend: '+1 this week' },
  { label: 'Attended', value: attendedClasses, suffix: '', icon: Trophy, color: '#3B82F6', trend: '' },
  { label: 'GPA', value: gpa, suffix: '', icon: BookOpen, color: '#93C5FD', trend: '' },
]

const currentClass = computed(() => schedule.find(s => s.status === 'current') || null)
const nextClass = computed(() => schedule.find(s => s.status === 'upcoming') || schedule.find(s => s.status === 'current') || null)

const qrPattern = ref([])
function generateQR() {
  const seed = studentId.value.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const arr = []
  for (let i = 0; i < 121; i++) {
    arr.push(Math.sin(seed + i * 1.7) * 0.5 + 0.5 > 0.5)
  }
  qrPattern.value = arr
}
generateQR()

const enrolledCourses = [
  { code: 'CSC 201', name: 'Introduction to Programming', attendance: 92, color: '#3B82F6' },
  { code: 'CSC 203', name: 'Database Systems', attendance: 88, color: '#60A5FA' },
  { code: 'MTH 201', name: 'Linear Algebra I', attendance: 75, color: '#93C5FD' },
  { code: 'GST 201', name: 'Use of English', attendance: 95, color: '#2563EB' },
  { code: 'PHY 201', name: 'Physics for Computing', attendance: 68, color: '#1D4ED8' },
  { code: 'STA 201', name: 'Probability & Statistics', attendance: 81, color: '#3B82F6' },
]

const schedule = [
  { time: '08:00', title: 'Programming Lab', location: 'CS Lab 3', status: 'done' },
  { time: '10:00', title: 'Database Systems', location: 'LT 2', status: 'done' },
  { time: '13:00', title: 'Linear Algebra', location: 'Room 204', status: 'current' },
  { time: '15:00', title: 'Study Group', location: 'Library', status: 'upcoming' },
]

const shinePos = ref({ x: 50, y: 50 })
const shineStyle = computed(() => ({
  background: `radial-gradient(circle at ${shinePos.value.x}% ${shinePos.value.y}%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`
}))
const tiltPos = ref({ x: 50, y: 50 })
const tiltStyle = computed(() => {
  const rx = ((50 - tiltPos.value.y) / 50) * 12
  const ry = ((tiltPos.value.x - 50) / 50) * 12
  return { transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }
})

function onCardMove(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  shinePos.value = { x, y }
  tiltPos.value = { x, y }
}

function onCardLeave() {
  shinePos.value = { x: 50, y: 50 }
  tiltPos.value = { x: 50, y: 50 }
}

onMounted(() => {
  setTimeout(() => { loading.value = false }, 500)
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: dashIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dashIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── HEADER ── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dash-header-left {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.dash-greeting {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.greeting-time {
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.greeting-name {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.dash-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-quaternary);
  padding: 6px 12px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  white-space: nowrap;
}

.dash-checkin-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 10px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dash-checkin-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

/* ── SKELETON ── */
.dash-skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.sk-item {
  padding: 20px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: skPulse 1.5s ease-in-out infinite;
}

@keyframes skPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.sk-bar {
  height: 12px;
  border-radius: 6px;
  background: var(--color-surface-elevated);
}

/* ── METRICS ── */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  animation: metricIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--delay);
}

@keyframes metricIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.metric-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-accent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .metric-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s var(--ease-spring);
}

.metric-card:hover .metric-icon {
  transform: scale(1.1) rotate(-5deg);
}

.metric-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-value {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.metric-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 600;
  color: var(--color-success);
  position: absolute;
  top: 8px;
  right: 10px;
}

/* ── SPOTLIGHT ROW ── */
.spotlight-row {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

/* ID Card */
.id-card-wrap {
  width: 320px;
  min-width: 320px;
  height: 190px;
  border-radius: 14px;
  cursor: pointer;
  perspective: 1000px;
  flex-shrink: 0;
}

.id-tilt {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.id-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.id-flipper.flipped {
  transform: rotateY(180deg) !important;
}

.id-front, .id-back {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  backface-visibility: hidden;
  overflow: hidden;
}

.id-front {
  background: linear-gradient(160deg, #1a2744, #14203d 50%, #0e1a35);
  border: 1px solid rgba(96,165,250,0.15);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(29,78,216,0.08) inset;
  display: flex;
  flex-direction: column;
}

.id-back {
  background: linear-gradient(160deg, #0e1a35, #14203d 50%, #0c162e);
  border: 1px solid rgba(96,165,250,0.12);
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
}

.id-shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  mix-blend-mode: overlay;
}

.id-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 5px;
  background: linear-gradient(90deg, transparent, rgba(96,165,250,0.15), transparent);
  z-index: 3;
}

.id-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(96,165,250,0.06);
  position: relative;
  z-index: 1;
  margin-top: 5px;
}

.id-top-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  font-weight: 600;
  color: rgba(96,165,250,0.7);
  letter-spacing: 0.5px;
}

.id-year {
  font-size: 8px;
  font-weight: 500;
  color: rgba(96,165,250,0.35);
}

.id-body {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.id-photo {
  flex-shrink: 0;
}

.id-avatar {
  width: 52px;
  height: 62px;
  border-radius: 8px;
  background: rgba(96,165,250,0.06);
  border: 1px solid rgba(96,165,250,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: rgba(96,165,250,0.25);
  background-size: cover;
  background-position: center 20%;
}

.id-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.id-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
  margin-bottom: 1px;
}

.id-student-id {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: 600;
  color: rgba(96,165,250,0.7);
  letter-spacing: 1.5px;
  margin-bottom: 3px;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  line-height: 1.4;
}

.id-row span:first-child {
  font-weight: 500;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 50px;
  flex-shrink: 0;
}

.id-row span:last-child {
  font-weight: 500;
  color: rgba(255,255,255,0.6);
}

.id-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 14px 6px;
  border-top: 1px solid rgba(96,165,250,0.06);
  font-size: 7px;
  color: rgba(255,255,255,0.15);
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
}

/* Back */
.id-back-stripe {
  height: 8px;
  background: linear-gradient(90deg, #1a1a2e, #2a2a4e 20%, #1a1a2e 40%, #2a2a4e 60%, #1a1a2e 80%, #2a2a4e);
  flex-shrink: 0;
  border-bottom: 1px solid rgba(96,165,250,0.06);
}

.id-back-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  gap: 6px;
}

.id-back-top {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
  font-weight: 600;
  color: rgba(96,165,250,0.5);
  letter-spacing: 0.5px;
}

.id-back-main {
  flex: 1;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.id-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.id-qr-grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 0.5px;
  width: 68px;
  height: 68px;
  background: #fff;
  border-radius: 6px;
  padding: 4px;
}

.id-qr-cell {
  border-radius: 0.3px;
}

.id-qr-cell.active {
  background: #1a1a2e;
}

.id-qr-label {
  font-size: 6px;
  font-family: 'Courier New', monospace;
  color: rgba(96,165,250,0.35);
  letter-spacing: 1px;
}

.id-back-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.id-holo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.08), rgba(255,255,255,0.1));
  border: 1px solid rgba(96,165,250,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  align-self: flex-end;
}

.id-holo-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  animation: holoShift 3s ease-in-out infinite;
}

@keyframes holoShift {
  0%, 100% { transform: translateX(-30px) rotate(-20deg); }
  50% { transform: translateX(30px) rotate(-20deg); }
}

.id-signature {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
}

.id-signature span {
  font-size: 5px;
  font-weight: 600;
  color: rgba(96,165,250,0.25);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.id-sig-line {
  height: 10px;
  background: repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgba(96,165,250,0.15) 2px, rgba(96,165,250,0.15) 4px, transparent 4px, transparent 6px, rgba(96,165,250,0.2) 6px, rgba(96,165,250,0.2) 8px);
  border-radius: 1px;
  mask-image: linear-gradient(90deg, transparent 2%, black 10%, black 90%, transparent 98%);
  -webkit-mask-image: linear-gradient(90deg, transparent 2%, black 10%, black 90%, transparent 98%);
}

.id-barcode {
  display: flex;
  align-items: center;
  gap: 1px;
  height: 18px;
  padding: 0 4px;
  background: rgba(96,165,250,0.03);
  border-radius: 3px;
}

.id-bar {
  height: 12px;
  background: rgba(96,165,250,0.4);
  border-radius: 0.5px;
  flex-shrink: 0;
}

/* Side Cards */
.spotlight-cards {
  flex: 1;
  display: flex;
  gap: 12px;
  min-width: 0;
}

.spot-card {
  flex: 1;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.spot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

[data-theme="dark"] .spot-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}

.live-card {
  background: linear-gradient(135deg, rgba(29,78,216,0.12), rgba(29,78,216,0.03));
  border-color: rgba(96,165,250,0.18);
}

.spot-card-bg {
  position: absolute;
  bottom: -24px;
  right: -24px;
  width: 140px;
  height: 140px;
  background: var(--color-primary);
  filter: blur(60px);
  opacity: 0.08;
  pointer-events: none;
}

.spot-card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spot-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-tertiary);
}

.live-badge {
  color: var(--color-primary);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.8); opacity: 0.5; }
}

.spot-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.spot-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.spot-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
}

.spot-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
  align-self: flex-start;
  transition: all 0.2s ease;
}

.spot-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ── STATS ROW ── */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--color-border-accent);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-tertiary);
}

.stat-pct {
  font-size: 14px;
  font-weight: 800;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}

.stat-link {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}

.stat-link:hover {
  text-decoration: underline;
}

.stat-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-ring svg {
  overflow: visible;
}

.stat-ring-value {
  display: none;
}

.stat-footer {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.stat-footer strong {
  color: var(--color-text-primary);
}

.stat-numbers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-number {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--color-surface-elevated);
  border-radius: 10px;
}

.stat-num-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stat-num-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.course-tags-card {
  gap: 12px;
}

.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.course-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.course-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 0 1px var(--tag-color);
}

.course-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.course-tag-code {
  font-weight: 700;
}

.course-tag-pct {
  font-size: 10px;
  opacity: 0.8;
}

/* ── BOTTOM GRID ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.section-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}

.section-link:hover {
  text-decoration: underline;
}

.section-date {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Courses List */
.courses-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.course-item:hover {
  transform: translateX(4px);
  border-color: var(--color-border-accent);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

[data-theme="dark"] .course-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.course-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.course-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.course-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-code {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.course-pct {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.course-name {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-bar {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  overflow: hidden;
}

.course-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.tl-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.tl-time {
  width: 44px;
  flex-shrink: 0;
  text-align: right;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  padding-top: 10px;
  font-variant-numeric: tabular-nums;
}

.tl-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
  padding-top: 10px;
}

.tl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
}

.tl-dot.done {
  background: var(--color-success);
}

.tl-dot.current {
  background: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-muted);
}

.tl-dot.upcoming {
  background: var(--color-border-strong);
}

.tl-connector {
  width: 2px;
  flex: 1;
  background: var(--color-border);
  border-radius: 999px;
  margin: 4px 0;
}

.tl-card {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.tl-card:hover {
  transform: translateX(3px);
}

.tl-card.current {
  background: var(--color-primary-soft);
  border-color: var(--color-border-accent);
}

.tl-card.done {
  opacity: 0.6;
}

.tl-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.tl-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tl-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-primary-muted);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tl-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin: 0;
}

.tl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: var(--color-text-quaternary);
  font-size: 13px;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 16px;
}

.qa-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.qa-item:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-accent);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

[data-theme="dark"] .qa-item:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.qa-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s var(--ease-spring);
}

.qa-item:hover .qa-icon {
  transform: scale(1.1);
}

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }

  .stats-row > :last-child {
    grid-column: span 2;
  }

  .course-tags {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .dash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .dash-header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .greeting-name {
    font-size: 20px;
  }

  .metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .spotlight-row {
    flex-direction: column;
  }

  .id-card-wrap {
    width: 100%;
    min-width: 0;
    height: 180px;
  }

  .spotlight-cards {
    flex-direction: column;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .stats-row > :last-child {
    grid-column: span 1;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .stat-numbers {
    grid-template-columns: repeat(3, 1fr);
  }

  .metric-value {
    font-size: 17px;
  }

  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
  }

  .qa-item {
    padding: 12px 8px;
  }

  .qa-icon {
    width: 36px;
    height: 36px;
  }

  .qa-icon svg {
    width: 16px;
    height: 16px;
  }
}
</style>
