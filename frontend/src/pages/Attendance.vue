<template>
  <div class="attendance-page" style="background: #F5F1EA; min-height: 100dvh;">
    <div class="max-w-7xl mx-auto px-6 py-8 lg:px-8">
      <!-- Header -->
      <div class="flex items-start justify-between mb-8 gap-4">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-[1.5px] mb-1.5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Attendance records</div>
          <h1 class="text-3xl lg:text-4xl font-bold leading-tight" style="font-family: 'Fraunces', Georgia, serif; color: #1A1A2E;">Attendance Log</h1>
        </div>
        <button
          v-if="!isLecturer"
          @click="checkIn"
          :disabled="checkingIn || !activeSession || !/^\d{6}$/.test(checkinCode)"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          style="background: #2563EB; font-family: 'Inter', system-ui, sans-serif;"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          {{ checkingIn ? 'Checking in…' : 'Check In with GPS' }}
        </button>
      </div>

      <!-- Active session / feedback -->
      <div v-if="sessionsLoading" class="mb-6 rounded-xl p-4 text-sm" style="background: #FFFFFF; color: #68758E; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        Loading active sessions…
      </div>
      <div v-else-if="sessions.length" class="mb-6 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div>
          <label for="active-session" class="block text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: #96A0B5;">Active session</label>
          <select id="active-session" v-model="selectedSessionId" class="text-sm rounded-lg px-3 py-2 border" style="border-color: #E2E6ED; color: #1A1A2E; background: #FFFFFF;">
            <option v-for="session in sessions" :key="session.id" :value="session.id">{{ session.label }}</option>
          </select>
          <p v-if="activeSession?.room || activeSession?.startedAt" class="text-xs mt-2" style="color: #68758E;">
            {{ [activeSession?.room, formatTime(activeSession?.startedAt)].filter(Boolean).join(' · ') }}
          </p>
        </div>
        <p class="text-xs max-w-md" style="color: #68758E;">
          Check-in uses your device GPS and is verified against the session venue. QR, NFC and face check-in are not enabled.
        </p>
      </div>
      <div v-else class="mb-6 rounded-xl p-4 text-sm" style="background: #FFFFFF; color: #68758E; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        {{ isLecturer ? 'No active sessions are currently available. Start one using the lecturer controls below.' : 'No active sessions are currently available. Check in when your lecturer starts a session.' }}
      </div>

      <section v-if="isLecturer" class="mb-6 rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <h2 class="text-base font-bold mb-4" style="color: #1A1A2E;">Lecturer session controls</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label class="text-xs font-semibold" style="color: #68758E;">
            Course
            <select v-model="selectedCourseId" class="mt-1 w-full text-sm rounded-lg px-3 py-2 border" style="border-color: #E2E6ED; color: #1A1A2E; background: #FFFFFF;" :disabled="lecturerOptionsLoading || !lecturerCourses.length">
              <option value="" disabled>Select a course</option>
              <option v-for="course in lecturerCourses" :key="course.id" :value="course.id">{{ course.label }}</option>
            </select>
          </label>
          <label class="text-xs font-semibold" style="color: #68758E;">
            Timetable slot
            <select v-model="selectedTimetableId" class="mt-1 w-full text-sm rounded-lg px-3 py-2 border" style="border-color: #E2E6ED; color: #1A1A2E; background: #FFFFFF;" :disabled="lecturerOptionsLoading || !matchingTimetableSlots.length">
              <option value="" disabled>Select a slot</option>
              <option v-for="slot in matchingTimetableSlots" :key="slot.id" :value="slot.id">{{ slot.label }}</option>
            </select>
          </label>
          <label class="text-xs font-semibold" style="color: #68758E;">
            Venue (optional)
            <select v-model="selectedVenueId" class="mt-1 w-full text-sm rounded-lg px-3 py-2 border" style="border-color: #E2E6ED; color: #1A1A2E; background: #FFFFFF;" :disabled="lecturerOptionsLoading">
              <option value="">No venue selected</option>
              <option v-for="venue in venues" :key="venue.id" :value="venue.id">{{ venue.label }}</option>
            </select>
            <span v-if="selectedVenue" class="mt-1 block text-[10px] font-medium" style="color: #68758E;">
              {{ selectedVenue.radiusMeters == null ? 'This venue has no GPS radius configured.' : `GPS geofence: ${selectedVenue.radiusMeters} m` }}
            </span>
          </label>
          <label class="text-xs font-semibold" style="color: #68758E;">
            Room (optional)
            <input v-model="sessionRoom" type="text" class="mt-1 w-full text-sm rounded-lg px-3 py-2 border" style="border-color: #E2E6ED; color: #1A1A2E; background: #FFFFFF;" placeholder="Room name or number" />
          </label>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button @click="startSession" :disabled="startingSession || !selectedCourseId || !selectedTimetableId" class="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50" style="background: #2563EB;">
            {{ startingSession ? 'Starting…' : 'Start session' }}
          </button>
          <span v-if="lecturerOptionsLoading" class="text-xs" style="color: #68758E;">Loading courses, timetable, and venues…</span>
          <span v-else-if="selectedCourseId && !matchingTimetableSlots.length" class="text-xs" style="color: #B91C1C;">No timetable slots are available for this course.</span>
          <span v-if="lecturerOptionsError" class="text-xs" role="alert" style="color: #B91C1C;">{{ lecturerOptionsError }}</span>
          <span v-if="sessionControlError" class="text-xs" role="alert" style="color: #B91C1C;">{{ sessionControlError }}</span>
        </div>
      </section>

      <section v-if="isLecturer && activeSession" class="mb-6 rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[9px] font-bold uppercase tracking-[0.16em] mb-1" style="color: #D97706;">Active session projector</div>
            <h2 class="text-base font-bold" style="color: #1A1A2E;">Rotating check-in code</h2>
            <p class="text-xs mt-1" style="color: #68758E;">Share this code with students in the selected session.</p>
          </div>
          <div class="flex gap-2">
            <button @click="fetchCheckinCode" :disabled="codeLoading" class="rounded-lg px-3 py-2 text-xs font-semibold border disabled:opacity-50" style="border-color: #E2E6ED; color: #1A1A2E; background: #FFFFFF;">
              {{ codeLoading ? 'Refreshing…' : 'Refresh code' }}
            </button>
            <button @click="endSession" :disabled="endingSession" class="rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" style="background: #B91C1C;">
              {{ endingSession ? 'Ending…' : 'End session' }}
            </button>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-end gap-4">
          <div class="projector-code">
            <div class="projector-countdown" :aria-label="`Code refreshes in ${codeSecondsRemaining} seconds`">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle class="projector-track" cx="50" cy="50" r="42" />
                <circle class="projector-progress" cx="50" cy="50" r="42" :stroke-dasharray="projectorCircumference" :stroke-dashoffset="projectorRingOffset" />
              </svg>
              <strong>{{ codeSecondsRemaining }}</strong>
              <small>SEC</small>
            </div>
            <div class="projector-digits" aria-live="polite">{{ currentCheckinCode || '------' }}</div>
            <p>Rotates every 30 seconds</p>
          </div>
          <p v-if="codeExpiresAt" class="text-xs projector-expiry">Next code at {{ formatExpiry(codeExpiresAt) }}</p>
          <p v-else-if="codeLoading" class="text-xs" style="color: #68758E;">Loading current code…</p>
        </div>
        <p v-if="codeError" class="mt-3 text-sm" role="alert" style="color: #B91C1C;">{{ codeError }}</p>
      </section>

      <div v-if="activeSession && !isLecturer" class="mb-6 rounded-xl p-4 flex flex-col gap-2 sm:flex-row sm:items-center" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <label for="checkin-code" class="text-xs font-semibold whitespace-nowrap" style="color: #1A1A2E;">Six-digit check-in code</label>
        <input id="checkin-code" v-model="checkinCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" class="w-36 text-lg font-mono tracking-widest rounded-lg px-3 py-2 border" style="border-color: #E2E6ED; color: #1A1A2E;" />
      </div>

      <div v-if="loadError" class="mb-6 rounded-xl p-4 text-sm" role="alert" style="background: rgba(239,68,68,0.08); color: #B91C1C;">
        {{ loadError }}
      </div>
      <div v-if="checkInError" class="mb-6 rounded-xl p-4 text-sm" role="alert" style="background: rgba(239,68,68,0.08); color: #B91C1C;">
        {{ checkInError }}
      </div>
      <div v-if="checkInSuccess" class="mb-6 rounded-xl p-4 text-sm" role="status" style="background: rgba(34,197,94,0.08); color: #15803D;">
        {{ checkInSuccess }}
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="text-3xl font-bold" style="color: #2563EB; font-family: 'Fraunces', Georgia, serif;">{{ overallRate == null ? '—' : `${overallRate}%` }}</div>
          <div class="text-sm font-semibold mt-0.5" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">Overall Attendance</div>
          <div class="text-[11px] font-medium mt-1" :style="{ color: examEligible == null ? '#68758E' : examEligible ? '#22C55E' : '#EF4444' }" style="font-family: 'Inter', system-ui, sans-serif;">{{ examEligible == null ? 'No attendance records' : examEligible ? 'Exam eligible' : 'Below eligibility threshold' }}</div>
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
          <input v-model="globalFilter" type="text" placeholder="Search course or date..." class="w-full text-sm rounded-xl py-2.5 pl-9 pr-4 border-0 outline-none" style="background: #F5F1EA; color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;" />
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button v-for="f in filters" :key="f" @click="filterStatus = f" class="px-4 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer transition-all" :style="filterStatus === f ? { background: '#2563EB', color: '#FFFFFF' } : { background: 'transparent', color: '#68758E' }">{{ f }}</button>
        </div>
        <button
          v-if="isLecturer"
          type="button"
          @click="exportAttendance"
          :disabled="!filteredRows.length"
          class="ml-auto rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50"
          style="background: #1E3A8A; color: #FFFFFF;"
        >Export CSV</button>
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
              <tr v-for="row in filteredRows" :key="row.id" style="border-bottom: 1px solid #E2E6ED;">
                <td v-for="col in columns" :key="col.key" class="p-4 text-sm whitespace-nowrap" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">
                  <span v-if="col.key === 'status' && row.status" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" :style="statusStyle(row.status)">
                    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: statusDot(row.status) }"></span>
                    {{ row.status }}
                  </span>
                  <span v-else-if="col.key === 'status'">—</span>
                  <span v-else-if="col.key === 'student'" class="font-mono text-xs">{{ row.studentId }}</span>
                  <span v-else-if="row.status === 'Absent' && ['timeIn','timeOut','method','location'].includes(col.key)">&mdash;</span>
                  <span v-else-if="col.key === 'location'" style="color: #2563EB;">{{ row[col.key] }}</span>
                  <span v-else-if="['timeIn','timeOut'].includes(col.key)" style="font-family: 'JetBrains Mono', 'Fira Code', monospace;">{{ row[col.key] }}</span>
                  <span v-else>{{ row[col.key] || '—' }}</span>
                </td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td :colspan="columns.length" class="p-12 text-center text-sm" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">No attendance records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-4 flex items-center justify-between" style="border-top: 1px solid #E2E6ED;">
          <div class="text-xs" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ filteredRows.length }} records</div>
          <div class="flex items-center gap-2">
            <button @click="page = Math.max(0, page - 1)" :disabled="page === 0" class="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all text-xs" style="background: #F5F1EA; color: #1A1A2E;" :style="page === 0 ? 'opacity:0.3;cursor:not-allowed' : ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span class="text-xs font-medium" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">Page {{ page + 1 }} of {{ totalPages }}</span>
            <button @click="page = Math.min(totalPages - 1, page + 1)" :disabled="page >= totalPages - 1" class="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all text-xs" style="background: #F5F1EA; color: #1A1A2E;" :style="page >= totalPages - 1 ? 'opacity:0.3;cursor:not-allowed' : ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6 6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import api from '../lib/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isLecturer = computed(() => authStore.user?.role === 'lecturer')
const data = ref([])
const sessions = ref([])
const selectedSessionId = ref('')
const sessionsLoading = ref(true)
const checkingIn = ref(false)
const checkinCode = ref('')
const checkInError = ref('')
const checkInSuccess = ref('')
const loadError = ref('')
const lecturerCourses = ref([])
const timetableSlots = ref([])
const venues = ref([])
const selectedCourseId = ref('')
const selectedTimetableId = ref('')
const selectedVenueId = ref('')
const sessionRoom = ref('')
const lecturerOptionsLoading = ref(false)
const lecturerOptionsError = ref('')
const startingSession = ref(false)
const endingSession = ref(false)
const sessionControlError = ref('')
const codeLoading = ref(false)
const codeError = ref('')
const currentCheckinCode = ref('')
const codeExpiresAt = ref('')
const globalFilter = ref('')
const filterStatus = ref('All')
const page = ref(0)
const pageSize = 8
let codeRefreshTimer = null

const filters = ['All', 'Present', 'Late', 'Absent']

const baseColumns = [
  { key: 'course', label: 'Course' },
  { key: 'date', label: 'Date' },
  { key: 'timeIn', label: 'Time In' },
  { key: 'timeOut', label: 'Time Out' },
  { key: 'method', label: 'Method' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
]
const columns = computed(() => isLecturer.value
  ? [{ key: 'student', label: 'Student ID' }, ...baseColumns]
  : baseColumns)

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

async function fetchAttendance() {
  try {
    const { data: records } = await api.get('/attendance')
    const items = Array.isArray(records) ? records : Array.isArray(records?.records) ? records.records : Array.isArray(records?.items) ? records.items : Array.isArray(records?.data) ? records.data : []
    data.value = items.map((r, idx) => ({
      id: r.id || `${r.timestamp || r.createdAt || 'record'}-${idx}`,
      studentId: r.userId || r.user_id || '—',
      course: r.courseName || r.course_name || r.courseId || r.course_id || '—',
      date: r.date || r.timestamp?.slice(0, 10) || r.createdAt?.slice(0, 10) || r.created_at?.slice(0, 10) || '—',
      timeIn: formatTime(r.timeIn || r.time_in || r.timestamp || r.createdAt || r.created_at),
      timeOut: formatTime(r.timeOut || r.time_out),
      method: r.method || '—',
      location: typeof r.location === 'string' ? r.location : r.location?.name || '—',
      status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '',
    }))
  } catch (err) {
    loadError.value = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Unable to load attendance records.'
  }
}

async function fetchSessions() {
  sessionsLoading.value = true
  try {
    const { data: result } = await api.get('/sessions/active')
    const payload = result?.data && !Array.isArray(result) ? result.data : result
    const items = Array.isArray(payload) ? payload : payload?.sessions || (payload ? [payload] : [])
    sessions.value = items.map(normalizeSession).filter(Boolean)
    if (!sessions.value.some(session => session.id === selectedSessionId.value)) {
      selectedSessionId.value = sessions.value[0]?.id || ''
    }
  } catch (err) {
    loadError.value = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Unable to load active sessions.'
  } finally {
    sessionsLoading.value = false
  }
}

const activeSession = computed(() => sessions.value.find(session => session.id === selectedSessionId.value) || null)
const selectedVenue = computed(() => venues.value.find(venue => venue.id === selectedVenueId.value) || null)
const matchingTimetableSlots = computed(() => timetableSlots.value.filter(slot => slot.courseKey === selectedCourseId.value))

function normalizeSession(session) {
  const id = session.id || session.sessionId || session.session_id
  if (!id) return null
  const courseName = session.courseName || session.course_name || session.course?.name || session.course?.code || session.courseId || session.course_id
  return {
    id: String(id),
    courseId: String(session.courseId || session.course_id || session.course?.id || ''),
    courseName: session.courseName || session.course_name || session.course?.name || session.course?.code || '',
    timetableId: String(session.timetableId || session.timetable_id || ''),
    room: session.room || session.venueName || session.venue_name || '',
    startedAt: session.startedAt || session.started_at,
    label: [courseName, session.room || session.venueName].filter(Boolean).join(' — ') || `Session ${id}`,
  }
}

function unwrapList(value, keys) {
  let payload = value?.data && !Array.isArray(value) ? value.data : value
  if (Array.isArray(payload)) return payload
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }
  return []
}

function courseIdOf(course) {
  const id = course.id || course.courseId || course.course_id || course.course?.id
  return id == null ? '' : String(id)
}

function courseNameOf(course) {
  return course.title || course.name || course.courseName || course.course_name || course.course?.name || ''
}

function courseKeyOf(item) {
  const id = item.courseId || item.course_id || item.course?.id
  return id == null ? '' : String(id)
}

function serverError(err, fallback) {
  return err?.response?.data?.error?.message ||
    (typeof err?.response?.data?.error === 'string' ? err.response.data.error : '') ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
}

async function fetchLecturerOptions() {
  lecturerOptionsLoading.value = true
  lecturerOptionsError.value = ''
  const results = await Promise.allSettled([
    api.get('/courses/enrolled'),
    api.get('/timetable'),
    api.get('/venues'),
  ])
  const errors = []

  if (results[0].status === 'fulfilled') {
    lecturerCourses.value = unwrapList(results[0].value.data, ['courses', 'items'])
      .map(course => {
        const id = courseIdOf(course)
        const name = courseNameOf(course)
        const code = course.code || course.courseCode || course.course_code || ''
        return id ? { id, label: [code, name].filter(Boolean).join(' — ') || id } : null
      }).filter(Boolean)
    selectedCourseId.value = lecturerCourses.value[0]?.id || ''
  } else {
    errors.push(`Courses: ${serverError(results[0].reason, 'unable to load')}`)
  }

  if (results[1].status === 'fulfilled') {
    timetableSlots.value = unwrapList(results[1].value.data, ['timetable', 'items'])
      .map(slot => {
        const id = slot.id || slot.timetableId || slot.timetable_id
        if (!id) return null
        const courseKey = courseKeyOf(slot)
        const courseLabel = slot.courseName || slot.course_name || slot.course?.name || slot.course?.code || slot.courseId || slot.course_id
        const day = slot.day || slot.weekday || ''
        const time = slot.startTime || slot.start_time || slot.start || slot.time || ''
        const room = slot.room || slot.venueName || slot.venue_name || ''
        return {
          id: String(id),
          courseKey,
          label: [courseLabel, day, time, room].filter(Boolean).join(' · ') || `Timetable ${id}`,
        }
      }).filter(Boolean)
    if (!lecturerCourses.value.length) {
      const byId = new Map()
      timetableSlots.value.forEach(slot => {
        if (slot.courseKey && !byId.has(slot.courseKey)) {
          byId.set(slot.courseKey, { id: slot.courseKey, label: slot.label.split(' · ').slice(0, 2).join(' · ') || slot.courseKey })
        }
      })
      lecturerCourses.value = [...byId.values()]
      selectedCourseId.value = lecturerCourses.value[0]?.id || ''
    }
  } else {
    errors.push(`Timetable: ${serverError(results[1].reason, 'unable to load')}`)
  }

  if (results[2].status === 'fulfilled') {
    venues.value = unwrapList(results[2].value.data, ['venues', 'items'])
      .map(venue => {
        const id = venue.id || venue.venueId || venue.venue_id
        return id == null ? null : {
          id: String(id),
          label: venue.name || venue.room || venue.code || String(id),
          radiusMeters: venue.radiusMeters ?? venue.radius_meters ?? null,
        }
      }).filter(Boolean)
  } else {
    errors.push(`Venues: ${serverError(results[2].reason, 'unable to load')}`)
  }

  lecturerOptionsError.value = errors.join(' · ')
  lecturerOptionsLoading.value = false
}

watch(selectedCourseId, courseId => {
  const next = timetableSlots.value.find(slot => slot.courseKey === courseId)
  selectedTimetableId.value = next?.id || ''
})

function clearCodeRefreshTimer() {
  if (codeRefreshTimer) clearTimeout(codeRefreshTimer)
  codeRefreshTimer = null
}

function scheduleCodeRefresh() {
  clearCodeRefreshTimer()
  if (!isLecturer.value || !selectedSessionId.value) return
  const expiry = Date.parse(codeExpiresAt.value)
  const untilExpiry = Number.isFinite(expiry) ? expiry - Date.now() + 250 : 15000
  codeRefreshTimer = setTimeout(fetchCheckinCode, Math.max(1000, Math.min(untilExpiry, 15000)))
}

watch([selectedSessionId, isLecturer], ([sessionId, lecturer]) => {
  clearCodeRefreshTimer()
  checkinCode.value = ''
  currentCheckinCode.value = ''
  codeExpiresAt.value = ''
  codeError.value = ''
  if (sessionId && lecturer) fetchCheckinCode()
})

async function fetchCheckinCode() {
  const sessionId = selectedSessionId.value
  if (!sessionId || !isLecturer.value) return
  clearCodeRefreshTimer()
  codeLoading.value = true
  codeError.value = ''
  try {
    const { data: result } = await api.get(`/sessions/${encodeURIComponent(sessionId)}/checkin-code`)
    const payload = result?.data && !Array.isArray(result) ? result.data : result
    const code = String(payload?.code || '')
    if (!/^\d{6}$/.test(code)) throw new Error('The server did not return a valid six-digit check-in code.')
    if (selectedSessionId.value !== sessionId) return
    currentCheckinCode.value = code
    codeExpiresAt.value = payload.expiresAt || payload.expires_at || ''
  } catch (err) {
    if (selectedSessionId.value === sessionId) {
      currentCheckinCode.value = ''
      codeError.value = serverError(err, 'Unable to load the check-in code.')
    }
  } finally {
    codeLoading.value = false
    if (selectedSessionId.value === sessionId) scheduleCodeRefresh()
  }
}

async function startSession() {
  sessionControlError.value = ''
  if (!selectedCourseId.value || !selectedTimetableId.value) {
    sessionControlError.value = 'Select a course and its timetable slot before starting a session.'
    return
  }
  startingSession.value = true
  const payload = {
    courseId: selectedCourseId.value,
    timetableId: selectedTimetableId.value,
  }
  if (selectedVenueId.value) payload.venueId = selectedVenueId.value
  if (sessionRoom.value.trim()) payload.room = sessionRoom.value.trim()

  try {
    const { data: result } = await api.post('/sessions/start', payload)
    const response = result?.data && !Array.isArray(result) ? result.data : result
    const started = response?.session || response
    let sessionId = started?.id || started?.sessionId || started?.session_id
    await fetchSessions()
    if (!sessionId) {
      const matchingSessions = sessions.value.filter(session =>
        session.courseId === selectedCourseId.value && session.timetableId === selectedTimetableId.value
      )
      if (matchingSessions.length === 1) sessionId = matchingSessions[0].id
    }
    if (!sessionId) {
      sessionControlError.value = 'The server started the session but did not return its ID. Refresh active sessions to continue.'
      return
    }
    const normalized = normalizeSession({
      ...started,
      id: sessionId,
      courseId: started.courseId || started.course_id || selectedCourseId.value,
      timetableId: started.timetableId || started.timetable_id || selectedTimetableId.value,
      room: started.room || payload.room || '',
      courseName: started.courseName || started.course_name || lecturerCourses.value.find(course => course.id === selectedCourseId.value)?.label,
    })
    if (!sessions.value.some(session => session.id === normalized.id)) sessions.value.unshift(normalized)
    selectedSessionId.value = normalized.id
    sessionControlError.value = ''
  } catch (err) {
    sessionControlError.value = serverError(err, 'Unable to start the session.')
  } finally {
    startingSession.value = false
  }
}

async function endSession() {
  if (!activeSession.value || endingSession.value) return
  endingSession.value = true
  sessionControlError.value = ''
  try {
    await api.post(`/sessions/end/${encodeURIComponent(activeSession.value.id)}`, {})
    sessions.value = sessions.value.filter(session => session.id !== activeSession.value?.id)
    selectedSessionId.value = sessions.value[0]?.id || ''
    currentCheckinCode.value = ''
    codeExpiresAt.value = ''
    clearCodeRefreshTimer()
    await fetchSessions()
  } catch (err) {
    sessionControlError.value = serverError(err, 'Unable to end the session.')
  } finally {
    endingSession.value = false
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location access is not available in this browser. Check-in requires your current location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      err => reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access and try again.'
          : err.code === err.TIMEOUT
            ? 'Unable to get your location in time. Please try again.'
            : 'Unable to determine your current location. Please try again.'
      )),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

async function checkIn() {
  checkInError.value = ''
  checkInSuccess.value = ''
  if (!activeSession.value) {
    checkInError.value = 'Select an active session before checking in.'
    return
  }
  if (!/^\d{6}$/.test(checkinCode.value.trim())) {
    checkInError.value = 'Enter the six-digit check-in code shown by your lecturer.'
    return
  }
  checkingIn.value = true
  try {
    const position = await getCurrentPosition()
    const { latitude, longitude, accuracy } = position.coords
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Your location could not be determined. Please try again.')
    }
    if (!Number.isFinite(accuracy) || accuracy > 100) {
      throw new Error(`Location accuracy is too low (${Math.round(accuracy)}m). Move closer to a window or outdoors and try again.`)
    }
    const { data: record } = await api.post('/attendance', {
      sessionId: activeSession.value.id,
      courseId: activeSession.value.courseId || undefined,
      courseName: activeSession.value.courseName || undefined,
      verificationCode: checkinCode.value.trim(),
      method: 'GPS',
      locationLat: latitude,
      locationLng: longitude,
      accuracy,
    })
    checkInSuccess.value = `Checked in successfully: ${record?.status || 'recorded'}.`
    await Promise.all([fetchAttendance(), fetchSessions()])
  } catch (err) {
    checkInError.value = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Check-in failed. Please try again.'
  } finally {
    checkingIn.value = false
  }
}

function formatExpiry(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const summary = computed(() => {
  const p = data.value.filter(r => r.status.toLowerCase() === 'present').length
  const l = data.value.filter(r => r.status.toLowerCase() === 'late').length
  const a = data.value.filter(r => r.status.toLowerCase() === 'absent').length
  return { present: p, late: l, absent: a, total: data.value.length }
})

const overallRate = computed(() => {
  const { present, late, total } = summary.value
  if (total === 0) return null
  return Math.round(((present + late * 0.5) / total) * 100)
})

const examEligible = computed(() => overallRate.value == null ? null : overallRate.value >= 75)

const filteredRows = computed(() => {
  let rows = data.value
  if (filterStatus.value !== 'All') rows = rows.filter(r => r.status === filterStatus.value)
  if (globalFilter.value) {
    const q = globalFilter.value.toLowerCase()
    rows = rows.filter(r =>
      (r.course || '').toLowerCase().includes(q) ||
      (r.date || '').includes(q) ||
      (r.method || '').toLowerCase().includes(q)
    )
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

function exportAttendance() {
  const headers = columns.value
  const rows = [
    headers.map(column => column.label),
    ...filteredRows.value.map(row => headers.map(column => row[column.key] ?? '')),
  ]
  const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mcu-attendance-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function csvCell(value) {
  const text = String(value).replace(/[\r\n]+/g, ' ')
  const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

const codeNow = ref(Date.now())
const projectorCircumference = 2 * Math.PI * 42
const codeSecondsRemaining = computed(() => {
  const expiry = Date.parse(codeExpiresAt.value)
  return Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - codeNow.value) / 1000)) : 0
})
const projectorRingOffset = computed(() => projectorCircumference * (1 - codeSecondsRemaining.value / 30))
let codeClockTimer = null

onMounted(() => {
  fetchAttendance()
  fetchSessions()
  if (isLecturer.value) fetchLecturerOptions()
  codeClockTimer = setInterval(() => { codeNow.value = Date.now() }, 1000)
})

onUnmounted(() => {
  clearCodeRefreshTimer()
  if (codeClockTimer) clearInterval(codeClockTimer)
})
</script>

<style>
.attendance-page {
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100dvh;
  background: var(--color-bg) !important;
  color: var(--color-text-primary);
}

.projector-code {
  display: flex;
  width: 100%;
  min-height: 132px;
  align-items: center;
  gap: clamp(18px, 4vw, 44px);
  padding: 18px 22px;
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 14px;
  background: linear-gradient(110deg, #0f172a, #172554);
  color: #f8fafc;
}

.projector-countdown {
  position: relative;
  width: 86px;
  height: 86px;
  display: grid;
  flex: 0 0 auto;
  place-content: center;
  text-align: center;
}

.projector-countdown svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.projector-track,
.projector-progress {
  fill: none;
  stroke-width: 4;
}

.projector-track {
  stroke: rgba(226, 232, 240, 0.16);
}

.projector-progress {
  stroke: #f59e0b;
  stroke-linecap: round;
  transition: stroke-dashoffset 500ms linear;
}

.projector-countdown strong {
  z-index: 1;
  font-family: var(--font-mono);
  font-size: 22px;
  line-height: 1;
}

.projector-countdown small {
  z-index: 1;
  margin-top: 4px;
  color: #cbd5e1;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.projector-digits {
  color: #fbbf24;
  font-family: var(--font-mono);
  font-size: clamp(34px, 6vw, 54px);
  font-weight: 750;
  letter-spacing: 0.2em;
  line-height: 1;
}

.projector-code p {
  margin: 8px 0 0;
  color: #cbd5e1;
  font-size: 10px;
}

.projector-expiry {
  color: var(--color-text-tertiary);
}

.attendance-page .rounded-xl:not(button):not(input) {
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm) !important;
}

.attendance-page [style*="background: rgb(245, 241, 234)"] {
  background-color: var(--color-bg-alt) !important;
}

.attendance-page [style*="background: rgb(255, 255, 255)"] {
  background-color: var(--color-surface) !important;
}

.attendance-page [style*="background: rgb(237, 237, 237)"] {
  background-color: var(--color-surface-elevated) !important;
}

.attendance-page [style*="background: rgb(37, 99, 235)"] {
  background-color: var(--color-primary) !important;
}

.attendance-page button[style*="background: rgb(37, 99, 235)"] {
  color: #fff !important;
}

.attendance-page [style*="color: rgb(26, 26, 46)"] {
  color: var(--color-text-primary) !important;
}

.attendance-page [style*="color: rgb(104, 117, 142)"],
.attendance-page [style*="color: rgb(150, 160, 181)"] {
  color: var(--color-text-tertiary) !important;
}

.attendance-page [style*="color: rgb(37, 99, 235)"] {
  color: var(--color-primary) !important;
}

.attendance-page [style*="color: rgb(185, 28, 28)"] {
  color: var(--color-error) !important;
}

.attendance-page [style*="border-color: rgb(226, 230, 237)"],
.attendance-page [style*="border-bottom: 1px solid rgb(226, 230, 237)"],
.attendance-page [style*="border-top: 1px solid rgb(226, 230, 237)"] {
  border-color: var(--color-border) !important;
}

.attendance-page svg[stroke="#96A0B5"] {
  stroke: var(--color-text-tertiary);
}

@media (max-width: 640px) {
  .projector-code {
    gap: 16px;
    padding: 14px;
  }

  .projector-countdown {
    width: 68px;
    height: 68px;
  }

  .projector-digits {
    font-size: clamp(26px, 8vw, 38px);
    letter-spacing: 0.12em;
  }
}
</style>
