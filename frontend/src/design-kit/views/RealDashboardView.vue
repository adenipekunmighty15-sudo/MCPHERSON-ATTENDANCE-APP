<template>
  <AppShell :navItems="navItems">
    <div class="rd-dash">
      <div class="rd-dash__top">
        <div>
          <p class="rd-dash__greeting">{{ greeting }}, Mighty</p>
          <h1 class="rd-dash__title">Dashboard</h1>
        </div>
        <div class="rd-dash__meta">
          <span class="rd-dash__date">{{ date }}</span>
          <span class="rd-dash__streak">{{ streak }}d streak</span>
        </div>
      </div>

      <div class="rd-dash__stats">
        <div v-for="s in stats" :key="s.label" class="rd-stat">
          <p class="rd-stat__value">{{ s.value }}<span v-if="s.suffix" class="rd-stat__suffix">{{ s.suffix }}</span></p>
          <p class="rd-stat__label">{{ s.label }}</p>
        </div>
      </div>

      <div class="rd-dash__grid">
        <BaseCard class="rd-dash__session">
          <template #header>
            <div class="rd-dash__session-header">
              <span class="rd-dash__live-dot"></span>
              <span class="rd-dash__live-label">Live Session</span>
              <span style="margin-left:auto;font-size:13px;color:var(--color-ink-400)">CSC 402</span>
            </div>
          </template>
          <p class="rd-dash__session-title">Software Engineering</p>
          <p class="rd-dash__session-location">Room 204 · Dr. Adebayo</p>
          <template #footer>
            <BaseButton variant="primary" @click="showSeal = !showSeal">
              {{ showSeal ? 'Checked In ✓' : 'Mark Attendance' }}
            </BaseButton>
          </template>
        </BaseCard>

        <BaseCard>
          <template #header>Today's Agenda</template>
          <div v-for="(item, i) in agenda" :key="i" class="rd-agenda__item">
            <div class="rd-agenda__time">{{ item.time }}</div>
            <div class="rd-agenda__info">
              <p class="rd-agenda__title">{{ item.title }}</p>
              <p class="rd-agenda__loc">{{ item.location }}</p>
            </div>
            <span class="rd-agenda__badge" :class="`rd-agenda__badge--${item.status}`">{{ item.status }}</span>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>My Courses</template>
          <div v-for="c in courses" :key="c.code" class="rd-course__row">
            <div class="rd-course__info">
              <p class="rd-course__code">{{ c.code }}</p>
              <p class="rd-course__name">{{ c.name }}</p>
            </div>
            <div class="rd-course__pct">{{ c.attendance }}%</div>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>Notifications</template>
          <p class="rd-dash__empty" v-if="!notifications.length">No new notifications</p>
          <div v-for="n in notifications" :key="n.id" class="rd-notif__row">
            <p class="rd-notif__text">{{ n.text }}</p>
            <span class="rd-notif__time">{{ n.time }}</span>
          </div>
        </BaseCard>
      </div>

      <div v-if="showSeal" class="rd-dash__seal-wrap">
        <AttendanceSeal time="10:32 AM" />
        <div>
          <p class="rd-dash__seal-title">You're marked present</p>
          <p class="rd-dash__seal-sub">CSC 402 · verified within venue geofence</p>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import AttendanceSeal from '../components/AttendanceSeal.vue'

const showSeal = ref(false)
const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const streak = 3

const navItems = [
  { label: 'Dashboard', href: '#', active: true },
  { label: 'Attendance', href: '#' },
  { label: 'Timetable', href: '#' },
  { label: 'Courses', href: '#' },
  { label: 'Chat', href: '#' },
  { label: 'Study Hub', href: '#' },
]

const stats = [
  { label: 'Attendance Rate', value: '87', suffix: '%' },
  { label: 'Classes Attended', value: '21' },
  { label: 'Current Streak', value: '3', suffix: 'd' },
  { label: 'Courses', value: '6' },
]

const agenda = [
  { time: '08:00', title: 'Programming Lab', location: 'CS Lab 3', status: 'done' },
  { time: '10:00', title: 'Database Systems', location: 'LT 2', status: 'done' },
  { time: '13:00', title: 'Software Engineering', location: 'Room 204', status: 'current' },
  { time: '15:00', title: 'Study Group', location: 'Library', status: 'upcoming' },
]

const courses = [
  { code: 'CSC 201', name: 'Intro to Programming', attendance: 92 },
  { code: 'CSC 203', name: 'Database Systems', attendance: 88 },
  { code: 'MTH 201', name: 'Linear Algebra I', attendance: 75 },
  { code: 'GST 201', name: 'Use of English', attendance: 95 },
  { code: 'PHY 201', name: 'Physics for Computing', attendance: 68 },
  { code: 'STA 201', name: 'Probability & Statistics', attendance: 81 },
]

const notifications = []
</script>

<style scoped>
.rd-dash { max-width: 1100px; }
.rd-dash__top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
.rd-dash__greeting { font-size: 14px; color: var(--color-ink-400); margin: 0; }
.rd-dash__title { font-family: var(--font-display); font-size: 28px; margin: 0; color: var(--color-ink-900); }
.rd-dash__meta { display: flex; gap: 12px; font-size: 13px; color: var(--color-ink-400); }
.rd-dash__streak { color: var(--color-brass); font-weight: 600; }

.rd-dash__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 28px; }
.rd-stat { background: var(--color-parchment-100); border: 1px solid var(--color-ink-100); border-radius: 12px; padding: 20px; }
.rd-stat__value { font-family: var(--font-display); font-size: 28px; font-weight: 700; margin: 0; color: var(--color-ink-900); }
.rd-stat__suffix { font-size: 16px; color: var(--color-ink-400); font-weight: 400; }
.rd-stat__label { font-size: 13px; color: var(--color-ink-400); margin: 4px 0 0; }

.rd-dash__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.rd-dash__session-header { display: flex; align-items: center; gap: 8px; }
.rd-dash__live-dot { width: 8px; height: 8px; border-radius: 50%; background: #1B7A3D; animation: rd-pulse 2s infinite; }
@keyframes rd-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(27,122,61,0.4); } 50% { box-shadow: 0 0 0 8px rgba(27,122,61,0); } }
.rd-dash__live-label { font-size: 13px; color: #1B7A3D; font-weight: 600; }
.rd-dash__session-title { font-family: var(--font-display); font-size: 20px; margin: 0 0 4px; color: var(--color-ink-900); }
.rd-dash__session-location { font-size: 14px; color: var(--color-ink-400); margin: 0; }

.rd-agenda__item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--color-ink-100); }
.rd-agenda__item:last-child { border-bottom: none; }
.rd-agenda__time { font-family: var(--font-mono); font-size: 13px; color: var(--color-ink-400); width: 50px; flex-shrink: 0; }
.rd-agenda__info { flex: 1; }
.rd-agenda__title { margin: 0; font-weight: 500; font-size: 14px; color: var(--color-ink-900); }
.rd-agenda__loc { margin: 0; font-size: 12px; color: var(--color-ink-400); }
.rd-agenda__badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; text-transform: capitalize; }
.rd-agenda__badge--done { background: rgba(27,122,61,0.1); color: #1B7A3D; }
.rd-agenda__badge--current { background: rgba(15,30,61,0.08); color: #0F1E3D; }
.rd-agenda__badge--upcoming { background: var(--color-ink-100); color: var(--color-ink-400); }

.rd-course__row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-ink-100); }
.rd-course__row:last-child { border-bottom: none; }
.rd-course__code { margin: 0; font-weight: 600; font-size: 14px; color: var(--color-ink-900); }
.rd-course__name { margin: 0; font-size: 12px; color: var(--color-ink-400); }
.rd-course__pct { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--color-ink-800); }

.rd-notif__row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-ink-100); }
.rd-notif__row:last-child { border-bottom: none; }
.rd-notif__text { margin: 0; font-size: 14px; color: var(--color-ink-700); }
.rd-notif__time { font-size: 12px; color: var(--color-ink-400); flex-shrink: 0; }

.rd-dash__empty { text-align: center; font-size: 14px; color: var(--color-ink-400); padding: 20px 0; margin: 0; }
.rd-dash__seal-wrap { display: flex; align-items: center; gap: 20px; margin-top: 24px; background: rgba(27,122,61,0.08); border: 1px solid #1B7A3D; border-radius: 12px; padding: 20px 24px; }
.rd-dash__seal-title { font-weight: 600; margin: 0 0 4px; color: var(--color-ink-900); }
.rd-dash__seal-sub { font-size: 13px; color: var(--color-ink-400); margin: 0; }

@media (max-width: 768px) {
  .rd-dash__grid { grid-template-columns: 1fr; }
  .rd-dash__stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
