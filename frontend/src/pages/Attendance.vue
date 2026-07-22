<template>
  <div class="attendance-page" style="background: #F5F1EA; min-height: 100dvh;">
    <div class="max-w-7xl mx-auto px-6 py-8 lg:px-8">
      <!-- Header -->
      <div class="flex items-start justify-between mb-8">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-[1.5px] mb-1.5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">2023/2024 &mdash; Semester 2</div>
          <h1 class="text-3xl lg:text-4xl font-bold leading-tight" style="font-family: 'Fraunces', Georgia, serif; color: #1A1A2E;">Attendance Log</h1>
        </div>
        <div class="relative">
          <button @click="showCheckInMenu = !showCheckInMenu" ref="checkinBtnRef" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 border-0 cursor-pointer" style="background: #2563EB; font-family: 'Inter', system-ui, sans-serif;" @mouseenter="$event.target.style.background = '#1D4ED8'" @mouseleave="$event.target.style.background = '#2563EB'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Check In</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showCheckInMenu" class="absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-50 overflow-hidden" style="background: #FFFFFF; border: 1px solid #E2E6ED;">
              <button @click="checkIn('QR Code')" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-0 cursor-pointer" style="color: #1A1A2E; background: transparent;" @mouseenter="$event.target.style.background = '#F5F1EA'" @mouseleave="$event.target.style.background = 'transparent'">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: #2563EB;">QR</span>
                QR Code
              </button>
              <button @click="checkIn('NFC Tap')" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-0 cursor-pointer" style="border-top: 1px solid #E2E6ED; color: #1A1A2E; background: transparent;" @mouseenter="$event.target.style.background = '#F5F1EA'" @mouseleave="$event.target.style.background = 'transparent'">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: #0F1E3D;">NFC</span>
                NFC Tap
              </button>
              <button @click="checkIn('Face ID')" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-0 cursor-pointer" style="border-top: 1px solid #E2E6ED; color: #1A1A2E; background: transparent;" @mouseenter="$event.target.style.background = '#F5F1EA'" @mouseleave="$event.target.style.background = 'transparent'">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: #C9902B;">FD</span>
                Face ID
              </button>
              <button @click="checkIn('Manual')" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-0 cursor-pointer" style="border-top: 1px solid #E2E6ED; color: #1A1A2E; background: transparent;" @mouseenter="$event.target.style.background = '#F5F1EA'" @mouseleave="$event.target.style.background = 'transparent'">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: #96A0B5;">M</span>
                Manual Entry
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="text-3xl font-bold" style="color: #2563EB; font-family: 'Fraunces', Georgia, serif;">{{ overallRate }}%</div>
          <div class="text-sm font-semibold mt-0.5" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">Overall Attendance</div>
          <div class="text-[11px] font-medium mt-1" style="color: #22C55E; font-family: 'Inter', system-ui, sans-serif;">&checkmark; Exam eligible</div>
        </div>
        <div class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="text-3xl font-bold" style="color: #22C55E; font-family: 'Fraunces', Georgia, serif;">{{ summary.present }}</div>
          <div class="text-sm font-semibold mt-0.5" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">Present</div>
          <div class="text-[11px] font-medium mt-1" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">classes attended</div>
        </div>
        <div class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="text-3xl font-bold" style="color: #EAB308; font-family: 'Fraunces', Georgia, serif;">{{ summary.late }}</div>
          <div class="text-sm font-semibold mt-0.5" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">Late</div>
          <div class="text-[11px] font-medium mt-1" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">weighted &times;0.5</div>
        </div>
        <div class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="text-3xl font-bold" style="color: #EF4444; font-family: 'Fraunces', Georgia, serif;">{{ summary.absent }}</div>
          <div class="text-sm font-semibold mt-0.5" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">Absent</div>
          <div class="text-[11px] font-medium mt-1" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">classes missed</div>
        </div>
      </div>

      <!-- Search + Filter -->
      <div class="rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div class="relative w-full sm:w-72">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96A0B5" stroke-width="2" class="absolute left-3.5 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="globalFilter" type="text" placeholder="Search course or date..." class="w-full text-sm rounded-xl py-2.5 pl-9 pr-4 border-0 outline-none" style="background: #F5F1EA; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;" @focus="$el.style.boxShadow = '0 0 0 2px #2563EB'" @blur="$el.style.boxShadow = 'none'" />
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button v-for="f in filters" :key="f" @click="filterStatus = f" class="px-4 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer transition-all" :style="filterStatus === f ? { background: '#2563EB', color: '#FFFFFF' } : { background: 'transparent', color: '#68758E' }" @mouseenter="filterStatus !== f && ($event.target.style.color = '#1A1A2E')" @mouseleave="filterStatus !== f && ($event.target.style.color = '#68758E')">{{ f }}</button>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-xl overflow-hidden" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr style="border-bottom: 1px solid #E2E6ED;">
                <th v-for="col in columns" :key="col.key" class="p-4 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredRows" :key="row.id" style="border-bottom: 1px solid #E2E6ED; transition: background 0.15s ease;" @mouseenter="$event.currentTarget.style.background = '#F5F1EA'" @mouseleave="$event.currentTarget.style.background = 'transparent'">
                <td v-for="col in columns" :key="col.key" class="p-4 text-sm whitespace-nowrap" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">
                  <!-- Status pill -->
                  <span v-if="col.key === 'status'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" :style="statusStyle(row.status)">
                    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: statusDot(row.status) }"></span>
                    {{ row.status }}
                  </span>
                  <!-- Location in blue -->
                  <span v-else-if="col.key === 'location'" style="color: #2563EB;">{{ row[col.key] }}</span>
                  <!-- Absent rows show dash -->
                  <span v-else-if="row.status === 'Absent' && ['timeIn','timeOut','method','location'].includes(col.key)">&mdash;</span>
                  <!-- Mono for time/method -->
                  <span v-else-if="['timeIn','timeOut'].includes(col.key)" style="font-family: 'JetBrains Mono', 'Fira Code', monospace;">{{ row[col.key] }}</span>
                  <span v-else>{{ row[col.key] }}</span>
                </td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td :colspan="columns.length" class="p-12 text-center text-sm" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">No attendance records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="p-4 flex items-center justify-between" style="border-top: 1px solid #E2E6ED;">
          <div class="text-xs" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ filteredRows.length }} records</div>
          <div class="flex items-center gap-2">
            <button @click="page = Math.max(0, page - 1)" :disabled="page === 0" class="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all text-xs" style="background: #F5F1EA; color: #1A1A2E;" :style="page === 0 ? 'opacity:0.3;cursor:not-allowed' : ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span class="text-xs font-medium" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">Page {{ page + 1 }} of {{ totalPages }}</span>
            <button @click="page = Math.min(totalPages - 1, page + 1)" :disabled="page >= totalPages - 1" class="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all text-xs" style="background: #F5F1EA; color: #1A1A2E;" :style="page >= totalPages - 1 ? 'opacity:0.3;cursor:not-allowed' : ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../lib/api'

const data = ref([])
const loading = ref(true)
const globalFilter = ref('')
const filterStatus = ref('All')
const showCheckInMenu = ref(false)
const checkinBtnRef = ref(null)
const page = ref(0)
const pageSize = 8

const filters = ['All', 'Present', 'Late', 'Absent']

const columns = [
  { key: 'course', label: 'Course' },
  { key: 'date', label: 'Date' },
  { key: 'timeIn', label: 'Time In' },
  { key: 'timeOut', label: 'Time Out' },
  { key: 'method', label: 'Method' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
]

async function fetchAttendance() {
  loading.value = true
  try {
    const { data: records } = await api.get('/attendance')
    data.value = (records || []).map((r, idx) => ({
      id: r.id || idx,
      course: r.courseName || r.courseId || 'Unknown',
      date: r.date || r.timestamp?.slice(0, 10) || '-',
      timeIn: r.timestamp ? new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      timeOut: '-',
      method: r.method || '-',
      location: r.location || 'Main Campus',
      status: (r.status || 'Present').charAt(0).toUpperCase() + (r.status || 'Present').slice(1),
    }))
  } catch { /* ignore */ }
  loading.value = false
}
onMounted(fetchAttendance)

const summary = computed(() => {
  const p = data.value.filter(r => r.status === 'Present').length
  const l = data.value.filter(r => r.status === 'Late').length
  const a = data.value.filter(r => r.status === 'Absent').length
  return { present: p, late: l, absent: a, total: data.value.length }
})

const overallRate = computed(() => {
  const { present, late, total } = summary.value
  if (total === 0) return 0
  return Math.round(((present + late * 0.5) / total) * 100)
})

const examEligible = computed(() => overallRate.value >= 75)

const filteredRows = computed(() => {
  let rows = data.value
  if (filterStatus.value !== 'All') rows = rows.filter(r => r.status === filterStatus.value)
  if (globalFilter.value) {
    const q = globalFilter.value.toLowerCase()
    rows = rows.filter(r => r.course.toLowerCase().includes(q) || r.date.includes(q) || r.method.toLowerCase().includes(q))
  }
  return rows
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))

function statusStyle(status) {
  switch (status) {
    case 'Present': return { background: 'rgba(34,197,94,0.1)', color: '#22C55E' }
    case 'Late': return { background: 'rgba(234,179,8,0.1)', color: '#EAB308' }
    case 'Absent': return { background: 'rgba(239,68,68,0.1)', color: '#EF4444' }
    default: return { background: '#EDEDED', color: '#68758E' }
  }
}

function statusDot(status) {
  switch (status) {
    case 'Present': return '#22C55E'
    case 'Late': return '#EAB308'
    case 'Absent': return '#EF4444'
    default: return '#96A0B5'
  }
}

function checkIn(method) {
  showCheckInMenu.value = false
  const now = new Date()
  data.value.unshift({
    id: Date.now(),
    course: 'PHY101',
    date: now.toISOString().slice(0, 10),
    timeIn: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    timeOut: '-',
    method,
    location: 'Main Campus',
    status: 'Present',
  })
  api.post('/attendance', { courseId: 'PHY101', courseName: 'PHY101', status: 'Present', method }).catch(() => {})
}

function onClickOutside(e) {
  if (showCheckInMenu.value && checkinBtnRef.value && !checkinBtnRef.value.contains(e.target) && !e.target.closest('.dropdown-enter-active')) showCheckInMenu.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style>
.attendance-page {
  font-family: 'Inter', system-ui, sans-serif;
}
.dropdown-enter-active { animation: dropIn 0.15s ease-out; }
.dropdown-leave-active { animation: dropOut 0.1s ease-in; }
@keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dropOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-4px); } }
</style>
