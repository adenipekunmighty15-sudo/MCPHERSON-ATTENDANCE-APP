<template>
  <div class="admin-dashboard">
    <header class="dash-header">
      <div>
        <h1 class="dash-title">Admin Console</h1>
        <p class="dash-subtitle">Monitor attendance thresholds across the university</p>
      </div>
      <button class="export-btn" @click="exportCSV">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export CSV
      </button>
    </header>

    <div v-if="loading" class="loading-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card"></div>
    </div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">Total Students</p><p class="stat-value">{{ stats.users || '—' }}</p></div>
            <div class="stat-icon blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">Total Courses</p><p class="stat-value">{{ stats.courses || '—' }}</p></div>
            <div class="stat-icon green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">Department Count</p><p class="stat-value">{{ stats.departments || '—' }}</p></div>
            <div class="stat-icon gold"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">At Risk</p><p class="stat-value">{{ summary.atRiskStudents || 0 }}</p></div>
            <div class="stat-icon red"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          </div>
          <div class="stat-bar"><div class="stat-bar-fill red" :style="{ width: atRiskPercent + '%' }"></div></div>
        </div>
      </div>

      <div class="insight-grid">
        <div class="insight-card"><p class="insight-label">Attendance Records</p><p class="insight-value">{{ summary.records || 0 }}</p></div>
        <div class="insight-card"><p class="insight-label">Overall Rate</p><p class="insight-value">{{ summary.attendanceRate || 0 }}%</p></div>
        <div class="insight-card"><p class="insight-label">Present</p><p class="insight-value green">{{ summary.present || 0 }}</p></div>
        <div class="insight-card"><p class="insight-label">Absent</p><p class="insight-value red">{{ summary.absent || 0 }}</p></div>
      </div>

      <div class="at-risk-section">
        <div class="section-header">
          <h2>At-Risk Students</h2>
          <div class="search-wrap"><svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input v-model="search" type="text" placeholder="Search name or ID..." class="search-input" /></div>
        </div>
        <div class="table-wrap">
          <table class="risk-table">
            <thead><tr><th>Student ID</th><th>Name</th><th>Records</th><th>Attended</th><th>Rate</th><th>Action</th></tr></thead>
            <tbody>
              <tr v-for="s in filteredAtRisk" :key="s.studentId">
                <td class="mono">{{ s.studentId }}</td>
                <td class="bold">{{ s.studentName }}</td>
                <td>{{ s.records }}</td>
                <td>{{ s.present }}</td>
                <td><span class="rate-pill" :class="{ low: s.attendanceRate < 60, mid: s.attendanceRate >= 60 }">{{ s.attendanceRate }}%</span></td>
                <td><button class="notify-btn">Notify</button></td>
              </tr>
              <tr v-if="filteredAtRisk.length === 0"><td colspan="6" class="empty">No at-risk students found</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../lib/api'

const loading = ref(true)
const stats = ref({})
const summary = ref({})
const atRiskStudents = ref([])
const search = ref('')
const error = ref(null)

const atRiskPercent = computed(() => {
  if (!stats.value.users) return 0
  return Math.round((summary.value.atRiskStudents || 0) / stats.value.users * 100)
})

const filteredAtRisk = computed(() => {
  if (!search.value) return atRiskStudents.value
  const q = search.value.toLowerCase()
  return atRiskStudents.value.filter(s =>
    s.studentName.toLowerCase().includes(q) ||
    s.studentId.toLowerCase().includes(q)
  )
})

async function fetchData() {
  try {
    const [statsRes, insightsRes] = await Promise.all([
      api.get('/stats'),
      api.get('/insights')
    ])
    stats.value = statsRes.data || {}
    if (insightsRes.data) {
      summary.value = insightsRes.data.summary || {}
      atRiskStudents.value = insightsRes.data.atRiskStudents || []
    }
  } catch (err) {
    console.error('Failed to load admin dashboard:', err)
    error.value = 'Could not load data from server. Showing sample data.'
    stats.value = { users: 1250, courses: 48, departments: 12 }
    summary.value = { records: 28400, attendanceRate: 89, present: 25276, absent: 3124, atRiskStudents: 42 }
    atRiskStudents.value = [
      { studentId: 'MCU/26/0142', studentName: 'Oluwaseun Adebayo', records: 28, present: 19, attendanceRate: 68 },
      { studentId: 'MCU/26/0281', studentName: 'Ngozi Okafor', records: 32, present: 23, attendanceRate: 72 },
      { studentId: 'MCU/26/0093', studentName: 'Ibrahim Musa', records: 22, present: 12, attendanceRate: 55 },
      { studentId: 'MCU/26/0410', studentName: 'Chinedu Eze', records: 35, present: 26, attendanceRate: 74 },
      { studentId: 'MCU/26/0112', studentName: 'Aisha Bello', records: 30, present: 18, attendanceRate: 60 },
    ]
  } finally {
    loading.value = false
  }
}

function exportCSV() {
  const headers = 'Student ID,Name,Records,Attended,Rate\n'
  const rows = atRiskStudents.value.map(s => `${s.studentId},"${s.studentName}",${s.records},${s.present},${s.attendanceRate}%`).join('\n')
  const blob = new Blob([headers + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'at-risk-students.csv'; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

onMounted(fetchData)
</script>

<style scoped>
.admin-dashboard { font-family: 'Inter', system-ui, sans-serif; }
.dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.dash-title { font-size: 24px; font-weight: 800; color: var(--color-text-primary); margin: 0; font-family: 'Fraunces', Georgia, serif; }
.dash-subtitle { font-size: 14px; color: var(--color-text-tertiary); margin: 4px 0 0; }
.export-btn { display: flex; align-items: center; gap: 8px; background: var(--color-primary); color: #fff; border: none; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.export-btn:hover { background: var(--color-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px var(--color-primary-glow); }

.loading-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.skeleton-card { height: 100px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
.stat-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 20px; }
.stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.stat-label { font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
.stat-value { font-size: 28px; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.stat-icon.blue { background: var(--color-primary-soft); color: var(--color-primary); }
.stat-icon.green { background: rgba(34,197,94,0.12); color: #22C55E; }
.stat-icon.gold { background: rgba(201,144,43,0.12); color: var(--color-gold); }
.stat-icon.red { background: rgba(239,68,68,0.12); color: #EF4444; }
.stat-bar { height: 4px; background: var(--color-surface-elevated); border-radius: 4px; overflow: hidden; }
.stat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.stat-bar-fill.red { background: #EF4444; }

.insight-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
.insight-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; }
.insight-label { font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); text-transform: uppercase; margin: 0 0 4px; }
.insight-value { font-size: 22px; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.insight-value.green { color: #22C55E; }
.insight-value.red { color: #EF4444; }

.at-risk-section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; overflow: hidden; }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; gap: 12px; }
.section-header h2 { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); }
.search-input { padding: 8px 12px 8px 36px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text-primary); font-size: 13px; width: 220px; outline: none; font-family: inherit; }
.search-input:focus { border-color: var(--color-primary); }

.table-wrap { overflow-x: auto; }
.risk-table { width: 100%; border-collapse: collapse; }
.risk-table th { padding: 12px 20px; font-size: 11px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; text-align: left; background: var(--color-bg); border-bottom: 1px solid var(--color-border); }
.risk-table td { padding: 12px 20px; font-size: 13px; color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); }
.risk-table tr:last-child td { border-bottom: none; }
.risk-table tr:hover td { background: var(--color-surface-elevated); }
.risk-table .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--color-text-secondary); }
.risk-table .bold { font-weight: 600; }
.risk-table .empty { text-align: center; color: var(--color-text-tertiary); padding: 32px; }
.rate-pill { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
.rate-pill.low { background: rgba(239,68,68,0.12); color: #EF4444; }
.rate-pill.mid { background: rgba(251,191,36,0.12); color: #F59E0B; }
.notify-btn { padding: 4px 14px; border-radius: 8px; border: none; background: var(--color-primary-soft); color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.notify-btn:hover { background: var(--color-primary); color: #fff; }
</style>