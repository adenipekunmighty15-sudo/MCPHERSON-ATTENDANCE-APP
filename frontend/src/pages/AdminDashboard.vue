<template>
  <div class="admin-dashboard">
    <header class="dash-header">
      <div>
        <h1 class="dash-title">Admin Console</h1>
        <p class="dash-subtitle">Monitor attendance thresholds across the university</p>
      </div>
      <button class="export-btn" :disabled="!filteredAtRisk.length" @click="exportCSV">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export CSV
      </button>
    </header>

    <div v-if="loading" class="loading-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card"></div>
    </div>

    <p v-if="notice" role="status" style="color: var(--color-success); font-size: 13px; margin: 0 0 12px;">{{ notice }}</p>
    <p v-if="error && !loading" role="alert" style="color: var(--color-error); font-size: 13px; margin: 0 0 12px;">
      {{ error }}
      <button class="text-button" type="button" @click="fetchData">Retry</button>
    </p>

    <template v-else-if="!loading">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">Registered accounts</p><p class="stat-value">{{ stats.users ?? '—' }}</p></div>
            <div class="stat-icon blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">Courses</p><p class="stat-value">{{ stats.courses ?? '—' }}</p></div>
            <div class="stat-icon green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">Departments</p><p class="stat-value">{{ stats.departments ?? '—' }}</p></div>
            <div class="stat-icon gold"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-top">
            <div><p class="stat-label">Campus attendance rate</p><p class="stat-value">{{ summary.records ? `${summary.attendanceRate}%` : '—' }}</p></div>
            <div class="stat-icon gold"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></svg></div>
          </div>
        </div>
      </div>

      <div class="insight-grid">
        <div class="insight-card"><p class="insight-label">Attendance records</p><p class="insight-value">{{ summary.records ?? '—' }}</p></div>
        <div class="insight-card"><p class="insight-label">At-risk students</p><p class="insight-value red">{{ summary.atRiskStudents ?? '—' }}</p></div>
        <div class="insight-card"><p class="insight-label">Present</p><p class="insight-value green">{{ summary.present ?? '—' }}</p></div>
        <div class="insight-card"><p class="insight-label">Absent</p><p class="insight-value red">{{ summary.absent ?? '—' }}</p></div>
      </div>

      <section v-if="summary.records" class="department-section" aria-labelledby="department-chart-title">
        <header class="department-heading">
          <div>
            <h2 id="department-chart-title">Attendance by department</h2>
            <p>Share of recorded sessions marked present.</p>
          </div>
          <span>{{ departmentBreakdown.length }} departments</span>
        </header>
        <div v-if="departmentBreakdown.length" class="department-chart">
          <div v-for="department in departmentBreakdown" :key="department.department" class="department-row">
            <div class="department-label">
              <strong>{{ department.department }}</strong>
              <span>{{ department.attendanceRate }}% · {{ department.records }} records</span>
            </div>
            <div
              class="department-track"
              role="progressbar"
              :aria-label="`${department.department} attendance rate`"
              :aria-valuenow="department.attendanceRate"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span :style="{ width: `${department.attendanceRate}%` }"></span>
            </div>
          </div>
        </div>
        <p v-else class="department-empty" role="status">No department-linked attendance records are available yet.</p>
      </section>

      <div class="at-risk-section">
        <div class="section-header">
          <div>
            <h2>At-risk students</h2>
            <p class="section-note">Below 75% attendance with at least two sessions; the report shows up to 10 highest-risk students.</p>
          </div>
          <div class="table-filters">
            <label class="department-filter">
              <span class="sr-only">Filter by department</span>
              <select v-model="departmentFilter" :disabled="!departments.length && !hasUnassignedDepartment">
                <option value="">All departments</option>
                <option v-for="department in departments" :key="department" :value="department">{{ department }}</option>
                <option v-if="hasUnassignedDepartment" value="__unassigned__">Department unavailable</option>
              </select>
            </label>
            <div class="search-wrap"><svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input v-model="search" type="text" placeholder="Search name or ID..." class="search-input" /></div>
          </div>
        </div>
        <p v-if="!departments.length && hasUnassignedDepartment" class="department-notice" role="status">Department assignments are unavailable for the listed student records.</p>
        <div class="table-wrap">
          <table class="risk-table">
            <thead><tr><th>Student ID</th><th>Name</th><th>Department</th><th>Records</th><th>Attended</th><th>Rate</th><th>Action</th></tr></thead>
            <tbody>
              <tr v-for="s in filteredAtRisk" :key="s.studentId">
                <td class="mono">{{ s.studentId }}</td>
                <td class="bold">{{ s.studentName }}</td>
                <td>{{ s.department || '—' }}</td>
                <td>{{ s.records }}</td>
                <td>{{ s.present }}</td>
                <td><span class="rate-pill" :class="{ low: s.attendanceRate < 60, mid: s.attendanceRate >= 60 }">{{ s.attendanceRate }}%</span></td>
                <td><button class="notify-btn" :disabled="notifyingId === s.studentId" @click="notifyStudent(s)">{{ notifyingId === s.studentId ? 'Sending...' : 'Notify' }}</button></td>
              </tr>
              <tr v-if="filteredAtRisk.length === 0"><td colspan="7" class="empty">No at-risk students found</td></tr>
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
const departmentBreakdown = ref([])
const search = ref('')
const departmentFilter = ref('')
const error = ref(null)
const notifyingId = ref(null)
const notice = ref('')

const hasUnassignedDepartment = computed(() => atRiskStudents.value.some(student => !student.department))
const departments = computed(() => [...new Set(atRiskStudents.value.map(student => student.department).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b)))

const filteredAtRisk = computed(() => {
  const q = search.value.toLowerCase()
  return atRiskStudents.value.filter(student => {
    const matchesSearch = !q ||
      String(student.studentName || '').toLowerCase().includes(q) ||
      String(student.studentId || '').toLowerCase().includes(q)
    const matchesDepartment = !departmentFilter.value ||
      (departmentFilter.value === '__unassigned__' ? !student.department : student.department === departmentFilter.value)
    return matchesSearch && matchesDepartment
  })
})

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const [statsRes, insightsRes] = await Promise.all([
      api.get('/stats'),
      api.get('/insights'),
    ])
    stats.value = statsRes.data || {}
    if (insightsRes.data) {
      summary.value = insightsRes.data.summary || {}
      departmentBreakdown.value = Array.isArray(insightsRes.data.departmentBreakdown)
        ? insightsRes.data.departmentBreakdown
        : []
      atRiskStudents.value = (Array.isArray(insightsRes.data.atRiskStudents) ? insightsRes.data.atRiskStudents : [])
        .map(student => ({ ...student, department: student.department || '' }))
    }
  } catch (err) {
    console.error('Failed to load admin dashboard:', err)
    error.value = 'Could not load admin data. Please retry.'
  } finally {
    loading.value = false
  }
}

async function notifyStudent(student) {
  if (!student?.studentId) return
  notifyingId.value = student.studentId
  notice.value = ''
  try {
    await api.post('/admin/notifications/student', { userId: student.studentId })
    notice.value = `Reminder sent to ${student.studentName}.`
    setTimeout(() => { notice.value = '' }, 4000)
  } catch (err) {
    error.value = err?.response?.data?.error || 'Could not send the reminder.'
  } finally {
    notifyingId.value = null
  }
}

function exportCSV() {
  const headers = ['Student ID', 'Name', 'Department', 'Records', 'Attended', 'Rate']
  const rows = filteredAtRisk.value.map(student => [
    student.studentId,
    student.studentName,
    student.department,
    student.records,
    student.present,
    `${student.attendanceRate}%`,
  ])
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'at-risk-students.csv'; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

function csvCell(value) {
  const text = String(value ?? '').replace(/[\r\n]+/g, ' ')
  const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
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

.department-section { margin: 0 0 24px; padding: 18px 20px; border: 1px solid var(--color-border); border-radius: 16px; background: var(--color-surface); }
.department-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.department-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 15px; font-weight: 750; }
.department-heading p { margin: 4px 0 0; color: var(--color-text-tertiary); font-size: 11px; }
.department-heading > span { color: var(--color-text-tertiary); font-size: 10px; white-space: nowrap; }
.department-chart { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 28px; }
.department-row { min-width: 0; }
.department-label { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 7px; }
.department-label strong { overflow: hidden; color: var(--color-text-primary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.department-label span { flex: 0 0 auto; color: var(--color-text-tertiary); font-size: 10px; }
.department-track { height: 7px; overflow: hidden; border-radius: 999px; background: var(--color-muted); }
.department-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); transition: width 350ms ease; }
.department-empty { margin: 0; color: var(--color-text-tertiary); font-size: 12px; }

.at-risk-section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; overflow: hidden; }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; gap: 12px; }
.section-header h2 { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.section-note { margin: 4px 0 0; color: var(--color-text-tertiary); font-size: 11px; }
.table-filters { display: flex; align-items: center; gap: 10px; }
.department-filter select { min-height: 36px; max-width: 190px; padding: 7px 10px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-bg); color: var(--color-text-primary); font: inherit; font-size: 11px; }
.department-filter select:disabled { opacity: 0.6; cursor: not-allowed; }
.department-notice { margin: 12px 20px 0; color: var(--color-warning); font-size: 11px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
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
.rate-pill.mid { background: rgba(251,191,36,0.12); color: #b96445; }
.notify-btn { padding: 4px 14px; border-radius: 8px; border: none; background: var(--color-primary-soft); color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.notify-btn:hover { background: var(--color-primary); color: #fff; }
.export-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
@media (max-width: 640px) {
  .department-chart { grid-template-columns: 1fr; }
  .department-label { align-items: flex-start; }
  .table-filters { width: 100%; align-items: stretch; flex-direction: column; }
  .department-filter select, .search-input { width: 100%; max-width: none; }
  .search-wrap { width: 100%; }
}
</style>