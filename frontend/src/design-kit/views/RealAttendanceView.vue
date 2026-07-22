<template>
  <AppShell>
    <template #nav>
      <nav class="dk-nav">
        <a v-for="item in navItems" :key="item.label" :href="item.href" class="dk-nav__item" :class="{ 'dk-nav__item--active': item.active }">
          <span class="dk-nav__icon" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </a>
      </nav>
    </template>

    <div class="ra-att">
      <div class="ra-att__top">
        <div>
          <h1 class="ra-att__title">Attendance Log</h1>
          <p class="ra-att__subtitle">Your check-in history this semester</p>
        </div>
        <div class="ra-att__stats">
          <div class="ra-att__stat">
            <span class="ra-att__stat-value">87<small>%</small></span>
            <span class="ra-att__stat-label">Overall</span>
          </div>
          <div class="ra-att__stat">
            <span class="ra-att__stat-value">21<small>/24</small></span>
            <span class="ra-att__stat-label">Classes</span>
          </div>
        </div>
      </div>

      <div class="ra-att__filters">
        <select v-model="courseFilter" class="ra-att__select">
          <option value="">All Courses</option>
          <option v-for="c in courses" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="statusFilter" class="ra-att__select">
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
        </select>
      </div>

      <BaseCard flush>
        <div v-if="filtered.length" class="ra-att__table">
          <div class="ra-att__thead">
            <span>Date</span>
            <span>Course</span>
            <span>Status</span>
            <span>Method</span>
          </div>
          <div v-for="r in filtered" :key="r.id" class="ra-att__row">
            <span class="ra-att__cell ra-att__date">{{ r.date }}</span>
            <span class="ra-att__cell ra-att__course">{{ r.course }}</span>
            <span class="ra-att__cell"><StatusBadge :status="r.status" /></span>
            <span class="ra-att__cell ra-att__method">{{ r.method }}</span>
          </div>
        </div>
        <div v-else class="ra-att__empty">No records match your filters</div>
      </BaseCard>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppShell from '../components/AppShell.vue'
import BaseCard from '../components/BaseCard.vue'
import StatusBadge from '../components/StatusBadge.vue'

const navItems = [
  { label: 'Dashboard', href: '#', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { label: 'Attendance', href: '#', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>', active: true },
  { label: 'Timetable', href: '#', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' },
  { label: 'Courses', href: '#', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' },
  { label: 'Chat', href: '#', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' },
]

const courseFilter = ref('')
const statusFilter = ref('')
const courses = ['CSC 201', 'CSC 203', 'MTH 201', 'GST 201', 'PHY 201', 'STA 201']

const records = [
  { id: 1, date: '21 Jul 2026', course: 'CSC 201', status: 'present', method: 'Face ID' },
  { id: 2, date: '21 Jul 2026', course: 'CSC 203', status: 'present', method: 'Face ID' },
  { id: 3, date: '20 Jul 2026', course: 'MTH 201', status: 'absent', method: '—' },
  { id: 4, date: '20 Jul 2026', course: 'GST 201', status: 'present', method: 'QR Code' },
  { id: 5, date: '19 Jul 2026', course: 'PHY 201', status: 'late', method: 'Manual' },
  { id: 6, date: '19 Jul 2026', course: 'STA 201', status: 'present', method: 'NFC Tap' },
  { id: 7, date: '18 Jul 2026', course: 'CSC 201', status: 'present', method: 'Face ID' },
  { id: 8, date: '18 Jul 2026', course: 'CSC 203', status: 'absent', method: '—' },
]

const filtered = computed(() => {
  return records.filter(r => {
    if (courseFilter.value && r.course !== courseFilter.value) return false
    if (statusFilter.value && r.status !== statusFilter.value) return false
    return true
  })
})
</script>

<style scoped>
.ra-att { max-width: 1000px; }
.ra-att__top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.ra-att__title { font-family: var(--font-display); font-size: 28px; margin: 0; color: var(--color-ink-900); }
.ra-att__subtitle { font-size: 14px; color: var(--color-ink-400); margin: 4px 0 0; }
.ra-att__stats { display: flex; gap: 16px; }
.ra-att__stat { text-align: center; background: var(--color-parchment-100); border: 1px solid var(--color-ink-100); border-radius: 10px; padding: 12px 20px; min-width: 100px; }
.ra-att__stat-value { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--color-ink-900); }
.ra-att__stat-value small { font-size: 13px; font-weight: 400; color: var(--color-ink-400); }
.ra-att__stat-label { display: block; font-size: 11px; color: var(--color-ink-400); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }
.ra-att__filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.ra-att__select {
  padding: 8px 14px; font-family: var(--font-sans); font-size: 14px;
  border: 1px solid var(--color-ink-200); border-radius: 8px;
  background: var(--color-parchment-100); color: var(--color-ink-900);
  cursor: pointer;
}
.ra-att__select:focus { outline: none; border-color: var(--color-brass); box-shadow: 0 0 0 3px var(--color-brass-soft); }
.ra-att__table { display: flex; flex-direction: column; }
.ra-att__thead { display: grid; grid-template-columns: 120px 1fr 120px 100px; gap: 12px; padding: 12px 20px; font-size: 12px; font-weight: 600; color: var(--color-ink-400); text-transform: uppercase; letter-spacing: 0.04em; background: var(--color-parchment-500); border-bottom: 1px solid var(--color-ink-100); }
.ra-att__row { display: grid; grid-template-columns: 120px 1fr 120px 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--color-ink-100); align-items: center; transition: background 0.15s; }
.ra-att__row:hover { background: var(--color-ink-50); }
.ra-att__row:last-child { border-bottom: none; }
.ra-att__cell { font-size: 14px; color: var(--color-ink-700); }
.ra-att__date { font-family: var(--font-mono); font-size: 13px; color: var(--color-ink-400); }
.ra-att__course { font-weight: 500; }
.ra-att__method { font-size: 13px; color: var(--color-ink-400); }
.ra-att__empty { text-align: center; padding: 60px 20px; color: var(--color-ink-400); font-size: 14px; }
</style>
