<template>
  <div class="courses-page" style="background: var(--color-bg); min-height: 100dvh;">
    <div class="max-w-7xl mx-auto px-6 py-8 lg:px-8">
      <!-- Header -->
      <div class="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-tertiary)]">Enrolled courses</div>
          <h1 class="text-3xl lg:text-4xl font-bold leading-tight text-[var(--color-text-primary)]">My Courses</h1>
          <p class="mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">Your courses, progress, and class context in one place.</p>
        </div>

        <div class="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <label class="course-search">
            <Search class="size-4 shrink-0" aria-hidden="true" />
            <input v-model="searchQuery" type="search" placeholder="Search your courses" aria-label="Search your courses" />
          </label>

        <!-- Department filter -->
        <div class="relative group">
          <button type="button"
            @click="toggleDepartmentFilter"
            class="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            aria-haspopup="listbox"
            :aria-expanded="departmentMenuOpen"
            aria-controls="department-options"
            aria-label="Filter by department">
            <span>{{ selectedDepartmentName || 'All departments' }}</span>
            <ChevronDown class="size-4 opacity-50 transition-transform group-open:rotate-180" />
          </button>

          <!-- Department dropdown -->
          <Transition name="slide" mode="out-in">
            <div v-if="departmentMenuOpen" id="department-options" role="listbox"
              @keydown.esc="closeDepartmentFilter"
              @click.self="closeDepartmentFilter"
              class="absolute right-0 mt-2 w-64 max-h-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-lg z-50 max-w-xs overflow-y-auto">
              <p class="px-4 py-2 text-xs font-medium uppercase tracking-[.1em] text-[var(--color-text-tertiary)]">Filter by department</p>
              <button type="button" role="option" :aria-selected="!deptFilter"
                class="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] cursor-pointer"
                @click="selectDepartment(null)">
                <span class="w-6 h-6 rounded bg-[var(--color-primary-soft)] flex items-center justify-center">
                  <Check class="size-3" v-if="!deptFilter" />
                </span>
                <span>All departments</span>
              </button>
              <button v-for="dept in departments" :key="dept.id"
                type="button"
                role="option"
                :aria-selected="String(selectedDeptId) === String(dept.id)"
                class="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] cursor-pointer"
                @click.prevent="selectDepartment(dept)">
                <span class="w-6 h-6 rounded bg-[var(--color-primary-soft)] flex items-center justify-center">
                  <Check class="size-3" v-if="String(selectedDeptId) === String(dept.id)" />
                </span>
                <span>{{ dept.name }} {{ dept.code || '' }}</span>
              </button>
              <p v-if="departments.length === 0" class="px-4 py-2 text-xs font-medium text-[var(--color-text-tertiary)]">No departments found</p>
            </div>
          </Transition>
        </div>
        </div>
      </div>

      <!-- 3-Column Card Grid -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading enrolled courses">
        <div v-for="n in 6" :key="n" class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="w-10 h-10 rounded-xl mb-3" style="background: #EDEDED;"></div>
          <div class="h-4 w-24 rounded mb-2" style="background: #EDEDED;"></div>
          <div class="h-3 w-40 rounded mb-3" style="background: #EDEDED;"></div>
          <div class="h-2 w-full rounded mb-2" style="background: #EDEDED;"></div>
          <div class="h-3 w-32 rounded" style="background: #EDEDED;"></div>
        </div>
      </div>

      <div v-else-if="error" class="course-error rounded-xl p-6 text-center text-sm" role="alert" style="background: #FFFFFF; color: #B91C1C;">
        <p>{{ error }}</p>
        <button type="button" class="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]" :disabled="loading" @click="fetchCourses">Try again</button>
      </div>

      <div v-else-if="filteredCourses.length === 0" class="course-empty rounded-xl p-12 text-center" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div class="text-4xl mb-3">&#128218;</div>
        <div class="text-sm font-semibold text-[var(--color-text-primary)]">{{ enrolledCourses.length ? 'No matching courses' : 'No courses enrolled yet' }}</div>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">{{ enrolledCourses.length ? 'Try a different search or department.' : 'Your enrolled courses will appear here.' }}</p>
        <button v-if="searchQuery || deptFilter" type="button" class="mt-4 text-sm font-semibold text-[var(--color-primary)] hover:underline" @click="clearFilters">Clear filters</button>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <article v-for="course in filteredCourses" :key="course.id" class="course-card rounded-xl p-5 transition-all duration-200" style="background: var(--color-surface); box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <!-- Top row: icon chip + percentage -->
          <div class="flex items-start justify-between mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :style="{ background: chipBg(course) }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" :style="{ color: chipColor(course) }"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <span class="text-base font-bold" :style="rateStyle(course.attendanceRate)">{{ course.attendanceRate == null ? '—' : `${course.attendanceRate}%` }}</span>
          </div>

          <!-- Course code + name + lecturer -->
          <div class="text-xs font-bold mb-1" style="font-family: 'JetBrains Mono', 'Fira Code', monospace; color: chipColor(course);">{{ course.code }}</div>
          <div class="text-sm font-semibold mb-0.5 text-[var(--color-text-primary)]">{{ course.title }}</div>
          <div v-if="course.lecturer" class="text-xs mb-4" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ course.lecturer }}</div>

          <!-- Progress bar -->
          <div class="w-full h-2 rounded-full mb-1" style="background: #EDEDED;" role="progressbar" :aria-valuenow="course.attendanceRate == null ? 0 : Math.max(0, Math.min(100, course.attendanceRate))" aria-valuemin="0" aria-valuemax="100" :aria-label="`${course.title} attendance`">
            <div v-if="course.attendanceRate != null" class="h-full rounded-full transition-all duration-500" :style="{ width: Math.max(0, Math.min(100, course.attendanceRate)) + '%', background: course.attendanceRate >= 75 ? 'var(--color-success)' : 'var(--color-warning)' }"></div>
          </div>

          <!-- Footer: schedule + credits -->
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-1.5 text-xs" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {{ course.schedule || '—' }}
            </div>
            <span class="text-[10px] font-semibold" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ course.creditUnits == null ? '—' : `${course.creditUnits} cr.` }}</span>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../lib/api'
import { ChevronDown, Check, Search } from 'lucide-vue-next'

const enrolledCourses = ref([])
const loading = ref(true)
const error = ref('')

const deptFilter = ref(null)   // null = all, otherwise department id string
const searchQuery = ref('')
const selectedDeptId = ref(null)
const departmentMenuOpen = ref(false)

const departments = ref([])
const loadingDepts = ref(true)

const chipColors = ['#3D684B', '#B96445', '#6E7658', '#B38A4C', '#6F9270', '#8A5A44']

const selectedDepartmentName = computed(() =>
  departments.value.find(dept => String(dept.id) === String(selectedDeptId.value))?.name || '',
)

function colorIndex(course) {
  const source = String(course.id || course.code || '')
  return [...source].reduce((total, char) => total + char.charCodeAt(0), 0) % chipColors.length
}

function chipBg(course) {
  return `${chipColors[colorIndex(course)]}18`
}
function chipColor(course) {
  return chipColors[colorIndex(course)]
}
function rateStyle(rate) {
  if (rate == null) return { color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-display)' }
  return { color: rate >= 75 ? 'var(--color-success)' : 'var(--color-warning)', fontFamily: 'var(--font-display)' }
}

async function loadDepartments() {
  try {
    loadingDepts.value = true
    const { data } = await api.get('/departments')
    departments.value = Array.isArray(data)
      ? data
      : [data?.departments, data?.data].find(Array.isArray) || []
  } catch (e) {
    console.warn('[Courses] Load departments failed:', e)
    departments.value = []
  } finally {
    loadingDepts.value = false
  }
}

async function fetchCourses() {
  try {
    const { data } = await api.get('/courses/enrolled')
    const rows = Array.isArray(data) ? data : [data?.courses, data?.data].find(Array.isArray) || []
    enrolledCourses.value = rows.map(c => ({
      ...c,
      id: c.id ?? c.courseId ?? c.course_id ?? c.code ?? c.courseCode ?? c.course_code,
      title: c.title || c.name || c.courseName || c.course_name || '—',
      code: c.code || c.courseCode || c.course_code || '—',
      lecturer: c.lecturer || c.instructor || '',
      attendanceRate: c.attendanceRate ?? c.attendance_rate ?? c.attendance ?? null,
      creditUnits: c.creditUnits ?? c.credit_units ?? c.credits ?? null,
      schedule: c.schedule || c.meetingTime || c.meeting_time || '',
      departmentId: c.departmentId ?? c.department_id ?? c.department?.id ?? null,
    }))
    error.value = ''
  } catch (err) {
    enrolledCourses.value = []
    error.value = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Unable to load enrolled courses.'
  } finally {
    loading.value = false
  }
}

const filteredCourses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return enrolledCourses.value.filter(course => {
    const matchesDepartment = !deptFilter.value || String(course.departmentId) === String(deptFilter.value)
    const matchesSearch = !query || [course.code, course.title, course.lecturer, course.schedule]
      .some(value => String(value || '').toLowerCase().includes(query))
    return matchesDepartment && matchesSearch
  })
})

function clearFilters() {
  searchQuery.value = ''
  selectDepartment(null)
}

function toggleDepartmentFilter() {
  departmentMenuOpen.value = !departmentMenuOpen.value
}

function selectDepartment(dept) {
  deptFilter.value = dept?.id ?? null
  selectedDeptId.value = dept?.id ?? null
  departmentMenuOpen.value = false
}

function closeDepartmentFilter() {
  departmentMenuOpen.value = false
}

onMounted(async () => {
  await Promise.all([loadDepartments(), fetchCourses()])
})

</script>

<style>
.courses-page {
  font-family: 'Inter', system-ui, sans-serif;
}

.course-search {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 14px;
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}

.course-search:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.course-search input {
  width: min(260px, 55vw);
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  font-size: 13px;
}

.course-search input::placeholder { color: var(--color-text-tertiary); }
.course-card { border: 1px solid var(--color-border); box-shadow: var(--shadow-sm) !important; }
.course-card:hover { border-color: var(--color-border-accent); box-shadow: var(--shadow-md) !important; transform: translateY(-2px); }
.course-error { border: 1px solid var(--color-error-soft); color: var(--color-error) !important; }
.course-empty { border: 1px solid var(--color-border); box-shadow: var(--shadow-sm) !important; }

@media (prefers-reduced-motion: reduce) {
  .course-card { transition: none; }
}
</style>
