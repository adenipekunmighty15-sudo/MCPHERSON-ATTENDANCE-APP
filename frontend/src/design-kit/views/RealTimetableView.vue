<template>
  <AppShell :navItems="navItems">
    <div class="rt-tt">
      <div class="rt-tt__top">
        <div>
          <h1 class="rt-tt__title">Timetable</h1>
          <p class="rt-tt__subtitle">{{ semester }}</p>
        </div>
        <div class="rt-tt__filters">
          <select v-model="day" class="rt-tt__select">
            <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
      </div>

      <BaseCard>
        <template #header>{{ day }}</template>
        <div v-if="filtered.length" class="rt-tt__list">
          <div v-for="slot in filtered" :key="slot.time" class="rt-tt__slot">
            <div class="rt-tt__time">{{ slot.time }}</div>
            <div class="rt-tt__bar"></div>
            <div class="rt-tt__info">
              <p class="rt-tt__course">{{ slot.course }}</p>
              <p class="rt-tt__detail">{{ slot.type }} · {{ slot.venue }} · {{ slot.lecturer }}</p>
            </div>
          </div>
        </div>
        <div v-else class="rt-tt__empty">No classes scheduled for {{ day }}</div>
      </BaseCard>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppShell from '../components/AppShell.vue'
import BaseCard from '../components/BaseCard.vue'

const navItems = [
  { label: 'Dashboard', href: '#' },
  { label: 'Attendance', href: '#' },
  { label: 'Timetable', href: '#', active: true },
  { label: 'Courses', href: '#' },
  { label: 'Chat', href: '#' },
]

const semester = '2025/2026 · Harmattan Semester'
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const day = ref('Monday')

const timetable = {
  Monday: [
    { time: '08:00 – 10:00', course: 'CSC 201 – Introduction to Programming', type: 'Lab', venue: 'CS Lab 3', lecturer: 'Dr. Okafor' },
    { time: '10:00 – 12:00', course: 'CSC 203 – Database Systems', type: 'Lecture', venue: 'LT 2', lecturer: 'Prof. Adebayo' },
    { time: '13:00 – 15:00', course: 'MTH 201 – Linear Algebra I', type: 'Tutorial', venue: 'Room 204', lecturer: 'Dr. Bello' },
  ],
  Tuesday: [
    { time: '09:00 – 11:00', course: 'GST 201 – Use of English', type: 'Lecture', venue: 'HLT 1', lecturer: 'Mr. Eze' },
    { time: '12:00 – 14:00', course: 'PHY 201 – Physics for Computing', type: 'Lab', venue: 'Physics Lab', lecturer: 'Dr. Nwosu' },
  ],
  Wednesday: [
    { time: '08:00 – 10:00', course: 'CSC 201 – Introduction to Programming', type: 'Lecture', venue: 'LT 1', lecturer: 'Dr. Okafor' },
    { time: '10:00 – 12:00', course: 'STA 201 – Probability & Statistics', type: 'Lecture', venue: 'LT 2', lecturer: 'Dr. Yusuf' },
    { time: '14:00 – 16:00', course: 'CSC 203 – Database Systems', type: 'Lab', venue: 'CS Lab 1', lecturer: 'Prof. Adebayo' },
  ],
  Thursday: [
    { time: '09:00 – 11:00', course: 'MTH 201 – Linear Algebra I', type: 'Lecture', venue: 'Room 204', lecturer: 'Dr. Bello' },
    { time: '13:00 – 15:00', course: 'GST 201 – Use of English', type: 'Tutorial', venue: 'Room 105', lecturer: 'Mr. Eze' },
  ],
  Friday: [
    { time: '08:00 – 10:00', course: 'STA 201 – Probability & Statistics', type: 'Tutorial', venue: 'Room 106', lecturer: 'Dr. Yusuf' },
    { time: '10:00 – 12:00', course: 'PHY 201 – Physics for Computing', type: 'Lecture', venue: 'LT 2', lecturer: 'Dr. Nwosu' },
  ],
}

const filtered = computed(() => timetable[day.value] || [])
</script>

<style scoped>
.rt-tt { max-width: 900px; }
.rt-tt__top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.rt-tt__title { font-family: var(--font-display); font-size: 28px; margin: 0; color: var(--color-ink-900); }
.rt-tt__subtitle { font-size: 14px; color: var(--color-ink-400); margin: 4px 0 0; }
.rt-tt__filters { display: flex; gap: 8px; }
.rt-tt__select {
  padding: 8px 14px; font-family: var(--font-sans); font-size: 14px;
  border: 1px solid var(--color-ink-200); border-radius: 8px;
  background: var(--color-parchment-100); color: var(--color-ink-900);
  cursor: pointer;
}
.rt-tt__select:focus { outline: none; border-color: var(--color-brass); box-shadow: 0 0 0 3px var(--color-brass-soft); }
.rt-tt__list { display: flex; flex-direction: column; gap: 0; }
.rt-tt__slot { display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--color-ink-100); }
.rt-tt__slot:last-child { border-bottom: none; }
.rt-tt__time { font-family: var(--font-mono); font-size: 13px; color: var(--color-ink-400); width: 120px; flex-shrink: 0; padding-top: 2px; }
.rt-tt__bar { width: 3px; min-height: 48px; border-radius: 2px; background: var(--color-brass); flex-shrink: 0; }
.rt-tt__info { flex: 1; }
.rt-tt__course { margin: 0; font-weight: 600; color: var(--color-ink-900); }
.rt-tt__detail { margin: 2px 0 0; font-size: 13px; color: var(--color-ink-400); }
.rt-tt__empty { text-align: center; padding: 40px 0; color: var(--color-ink-400); font-size: 14px; }
</style>
