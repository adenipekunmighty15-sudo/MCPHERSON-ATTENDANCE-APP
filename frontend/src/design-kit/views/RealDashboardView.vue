<template>
  <AppShell :navItems="navItems">
    <div class="dash-head">
      <div>
        <p class="dash-head__eyebrow font-mono">{{ dayLabel }}</p>
        <h1 class="font-display">{{ greeting }}, {{ name }}</h1>
        <p class="dash-head__sub">{{ subline }}</p>
      </div>
      <div class="dash-head__actions">
        <span class="pill font-mono">Copy invite link</span>
        <BaseButton variant="primary">Check in</BaseButton>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <p class="stat-card__value">87<span>%</span></p>
        <p class="stat-card__label">Attendance</p>
      </div>
      <div class="stat-card stat-card--brass">
        <p class="stat-card__value">{{ streak }}<span>d</span></p>
        <p class="stat-card__label">Streak</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__value">21</p>
        <p class="stat-card__label">Badges earned</p>
      </div>
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        <BaseCard flush>
          <template #header>
            <h2 class="font-display" style="font-size: var(--text-xl); margin:0;">Today's Session</h2>
            <StatusBadge status="present" :label="`${presentCount} / ${roster.length} marked`" />
          </template>
          <ul class="ledger" role="list">
            <li v-for="s in roster" :key="s.name" class="ledger__row">
              <div class="ledger__who">
                <span class="ledger__avatar">{{ s.initials }}</span>
                <span class="ledger__name">{{ s.name }}</span>
              </div>
              <StatusBadge :status="s.status" />
            </li>
          </ul>
        </BaseCard>

        <div class="promo-row">
          <div class="promo-card">
            <p class="promo-card__eyebrow font-mono">Opportunity</p>
            <h3 class="font-display">Mighty Scholarship</h3>
            <p>Applications close soon — check eligibility.</p>
          </div>
          <BaseCard>
            <p class="live-eyebrow font-mono">● Live now</p>
            <h3 class="font-display" style="margin: var(--space-2) 0;">Linear Algebra</h3>
            <p class="live-sub">Room 306</p>
            <BaseButton variant="primary" style="margin-top: var(--space-3); width: 100%;">Join session</BaseButton>
          </BaseCard>
        </div>

        <div v-if="showSeal" class="seal-banner">
          <AttendanceSeal time="10:32 AM" />
          <div>
            <p class="seal-banner__title">You're marked present</p>
            <p class="seal-banner__sub">CSC 402 · verified within venue geofence</p>
          </div>
        </div>
      </div>

      <div class="dash-col">
        <BaseCard>
          <template #header>
            <h2 class="font-display" style="font-size: var(--text-xl); margin:0;">My Courses</h2>
            <a href="#" class="link-sm">View all</a>
          </template>
          <ul class="course-list" role="list">
            <li v-for="c in courses" :key="c.code" class="course-list__row">
              <div>
                <p class="course-list__code font-mono">{{ c.code }}</p>
                <p class="course-list__name">{{ c.name }}</p>
              </div>
              <div class="progress">
                <div class="progress__bar" :style="{ width: c.progress + '%' }" />
              </div>
              <span class="progress__pct font-mono">{{ c.progress }}%</span>
            </li>
          </ul>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h2 class="font-display" style="font-size: var(--text-xl); margin:0;">Today</h2>
            <span class="link-sm font-mono">{{ dayLabel }}</span>
          </template>
          <ul class="agenda" role="list">
            <li v-for="a in agenda" :key="a.time" class="agenda__row">
              <span class="agenda__time font-mono">{{ a.time }}</span>
              <div>
                <p class="agenda__title">{{ a.title }}</p>
                <p class="agenda__loc">{{ a.location }}</p>
              </div>
            </li>
          </ul>
        </BaseCard>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'
import AppShell from '../components/AppShell.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseCard from '../components/BaseCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import AttendanceSeal from '../components/AttendanceSeal.vue'

const name = 'Mighty'
const showSeal = true
const streak = 3

const hour = new Date().getHours()
const greeting = computed(() => {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})
const subline = computed(() =>
  hour < 17 ? "You're on track — keep the streak going." : 'Time to wrap up strong.'
)
const dayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

const roster = [
  { name: 'Adenipekun Mighty', initials: 'AM', status: 'present' },
  { name: 'Bola Adewale', initials: 'BA', status: 'present' },
  { name: 'Chidera Okafor', initials: 'CO', status: 'pending' },
  { name: 'Femi Salako', initials: 'FS', status: 'absent' },
]
const presentCount = computed(() => roster.filter(s => s.status === 'present').length)

const courses = [
  { code: 'CSC 201', name: 'Introduction to Programming', progress: 82 },
  { code: 'CSC 305', name: 'Database Systems', progress: 90 },
  { code: 'MTH 201', name: 'Linear Algebra I', progress: 76 },
  { code: 'BOT 301', name: 'General Botany', progress: 88 },
  { code: 'PHY 201', name: 'Practical Computing', progress: 65 },
  { code: 'STA 301', name: 'Probability & Statistics', progress: 91 },
]

const agenda = [
  { time: '08:00', title: 'Programming Lab', location: 'CS Lab 2' },
  { time: '10:00', title: 'Database Systems', location: 'LT 2' },
  { time: '13:00', title: 'Linear Algebra', location: 'Room 306' },
  { time: '16:00', title: 'Study Group', location: 'Library' },
]

const navItems = [
  { label: 'Dashboard', href: '#', active: true },
  { label: 'Attendance', href: '#' },
  { label: 'Timetable', href: '#' },
  { label: 'Courses', href: '#' },
  { label: 'Chat', href: '#' },
  { label: 'Study Hub', href: '#' },
]
</script>

<style scoped>
.dash-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}
.dash-head__eyebrow {
  font-size: var(--text-xs);
  color: var(--color-ink-500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 var(--space-2);
}
.dash-head h1 {
  font-size: var(--text-3xl);
  margin: 0 0 var(--space-2);
}
.dash-head__sub {
  color: var(--color-ink-300);
  margin: 0;
}
.dash-head__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.pill {
  font-size: var(--text-xs);
  color: var(--color-ink-500);
  background: var(--color-parchment-50);
  border: 1px solid var(--color-ink-100);
  border-radius: 999px;
  padding: var(--space-2) var(--space-4);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.stat-card {
  background: var(--color-parchment-50);
  border: 1px solid var(--color-ink-100);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  box-shadow: var(--shadow-sm);
}
.stat-card__value {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--color-ink-900);
  margin: 0;
  line-height: 1;
}
.stat-card__value span {
  font-size: var(--text-xl);
  color: var(--color-ink-300);
}
.stat-card--brass .stat-card__value { color: var(--color-brass); }
.stat-card__label {
  margin: var(--space-2) 0 0;
  color: var(--color-ink-300);
  font-size: var(--text-sm);
}

.dash-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: var(--space-5);
  align-items: start;
}
.dash-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.ledger { list-style: none; margin: 0; padding: 0; }
.ledger__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-ink-100);
}
.ledger__row:last-child { border-bottom: none; }
.ledger__who { display: flex; align-items: center; gap: var(--space-3); }
.ledger__avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--color-ink-700); color: var(--color-parchment-50);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xs); font-weight: 600;
}
.ledger__name { font-weight: 500; }

.promo-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--space-4);
}
.promo-card {
  background: var(--color-ink-700);
  background-image: radial-gradient(circle at 80% 20%, rgba(184,134,11,0.18), transparent 55%);
  color: var(--color-parchment-50);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
.promo-card__eyebrow {
  color: var(--color-brass);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 var(--space-2);
}
.promo-card h3 { color: var(--color-parchment-50); margin: 0 0 var(--space-2); }
.promo-card p { color: var(--color-ink-100); margin: 0; font-size: var(--text-sm); }

.live-eyebrow { color: var(--color-brass); font-size: var(--text-xs); margin: 0; }
.live-sub { color: var(--color-ink-300); font-size: var(--text-sm); margin: 0; }

.seal-banner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  background: rgba(27,122,61,0.08);
  border: 1px solid #1B7A3D;
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
}
.seal-banner__title { font-weight: 600; margin: 0 0 var(--space-1); color: var(--color-ink-900); }
.seal-banner__sub { font-size: var(--text-sm); color: var(--color-ink-400); margin: 0; }

.course-list, .agenda { list-style: none; margin: 0; padding: 0; }
.course-list__row {
  display: grid;
  grid-template-columns: 1fr 90px 40px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-ink-100);
}
.course-list__row:last-child { border-bottom: none; }
.course-list__code { font-size: var(--text-xs); color: var(--color-ink-300); margin: 0; }
.course-list__name { margin: 0; font-weight: 500; font-size: var(--text-sm); }

.progress {
  height: 6px;
  background: var(--color-ink-100);
  border-radius: 999px;
  overflow: hidden;
}
.progress__bar {
  height: 100%;
  background: var(--color-brass);
  border-radius: 999px;
}
.progress__pct { font-size: var(--text-xs); color: var(--color-ink-300); text-align: right; }

.agenda__row {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-ink-100);
}
.agenda__row:last-child { border-bottom: none; }
.agenda__time { color: var(--color-ink-500); font-size: var(--text-sm); flex-shrink: 0; width: 52px; }
.agenda__title { margin: 0; font-weight: 500; font-size: var(--text-sm); }
.agenda__loc { margin: 0; color: var(--color-ink-300); font-size: var(--text-xs); }

.link-sm { font-size: var(--text-sm); color: var(--color-ink-500); text-decoration: none; }
.link-sm:hover { color: var(--color-ink-700); }

@media (max-width: 860px) {
  .dash-grid, .promo-row, .stat-grid { grid-template-columns: 1fr; }
}
</style>
