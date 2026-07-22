<template>
  <div class="min-h-screen bg-[var(--color-bg)]">
    <div class="page page-wide">
    <!-- Header -->
    <div class="content-header">
      <div>
        <p style="color:var(--color-text-tertiary);font-size:var(--text-sm)">Browse courses by department, level, and semester</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <select class="input" v-model="selectedDepartment" style="min-width: 170px;">
            <option value="">All Departments</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <select class="input" v-model="selectedLevel" style="min-width: 110px;">
            <option value="">All Levels</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
          </select>
          <select class="input" v-model="selectedSemester" style="min-width: 110px;">
            <option value="">All Semesters</option>
            <option value="1">First Semester</option>
            <option value="2">Second Semester</option>
          </select>
          <div class="input-icon" style="min-width: 180px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input class="input input-inner" v-model="searchQuery" placeholder="Search courses..." />
          </div>
          <button v-if="selectedDepartment || selectedLevel || selectedSemester || searchQuery" class="btn btn-ghost btn-sm" @click="clearFilters">Clear</button>
        </div>
        <button class="btn btn-primary" @click="showAddModal = true">+ ADD COURSE</button>
      </div>
    </div>

    <div class="divider" />

    <!-- Loading -->
    <div v-if="loading">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <div class="card card-hover p-5 space-y-3">
          <div class="skeleton-box" style="width:80px;height:22px"></div>
          <div class="skeleton-text" style="width:70%"></div>
          <div class="skeleton-text-sm" style="width:40%"></div>
          <div class="skeleton-box" style="width:60%;height:14px"></div>
          <div class="skeleton-box" style="width:50%;height:14px"></div>
          <div class="skeleton-box" style="width:100%;height:8px"></div>
          <div class="skeleton-box" style="width:100px;height:20px"></div>
        </div>
        <div class="card card-hover p-5 space-y-3">
          <div class="skeleton-box" style="width:80px;height:22px"></div>
          <div class="skeleton-text" style="width:70%"></div>
          <div class="skeleton-text-sm" style="width:40%"></div>
          <div class="skeleton-box" style="width:60%;height:14px"></div>
          <div class="skeleton-box" style="width:50%;height:14px"></div>
          <div class="skeleton-box" style="width:100%;height:8px"></div>
          <div class="skeleton-box" style="width:100px;height:20px"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCourses.length === 0" class="card card-hover p-12 text-center animate-fade-in">
      <div class="text-5xl mb-4">&#128218;</div>
      <h3 class="h3 text-[var(--color-text-primary)] mb-2">No courses found</h3>
      <p class="text-body-sm text-[var(--color-text-secondary)]">Try adjusting your filters or <a class="text-[var(--color-primary)] cursor-pointer" @click="clearFilters">clear all filters</a>.</p>
    </div>

    <!-- Results Count -->
    <div class="flex items-center justify-between mb-1" v-if="!loading && filteredCourses.length > 0">
      <p class="text-body-sm text-[var(--color-text-tertiary)]"><strong class="text-[var(--color-text-primary)]">{{ filteredCourses.length }}</strong> course{{ filteredCourses.length !== 1 ? 's' : '' }} found</p>
    </div>

    <!-- Course Cards Grid -->
    <div v-if="filteredCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-courses">
      <div
        v-for="course in filteredCourses"
        :key="course.id"
        class="card card-hover p-5 course-card cursor-pointer card-lift-soft"
        @click="openDetail(course)"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="badge">{{ course.code }}</span>
            <div class="flex items-center gap-2">
              <span class="badge badge-level" :style="{ background: levelColor(course.level), color: '#fff', border: 'none' }">{{ course.level }} Lvl</span>
              <span class="badge" style="font-size:10px">{{ course.creditUnits }} CU</span>
            </div>
          </div>
          <h3 class="h4 text-[var(--color-text-primary)] mb-1">{{ course.title }}</h3>
          <p class="text-body-sm text-[var(--color-text-tertiary)]">{{ course.lecturer }}</p>
          <p class="text-body-sm text-[var(--color-text-quaternary)] mb-2" v-if="course.departmentName">{{ course.departmentName }}</p>
          <div class="flex items-center gap-2 text-body-sm text-[var(--color-text-secondary)] mb-1">
            <span class="text-[var(--color-primary)]">&#128197;</span>
            <span>{{ course.schedule }}</span>
          </div>
          <div class="flex items-center gap-2 text-body-sm text-[var(--color-text-secondary)] mb-4">
            <span class="text-[var(--color-primary)]">&#128205;</span>
            <span>{{ course.venue }}</span>
          </div>
          <div>
            <div class="flex justify-between text-body-sm text-[var(--color-text-tertiary)] mb-1">
              <span>Progress</span>
              <span>{{ course.progress }}%</span>
            </div>
            <div class="h-2 bg-[var(--color-border)] overflow-hidden rounded-full">
              <div
                :style="{
                  width: course.progress + '%',
                  height: '100%',
                  background: 'var(--color-primary)',
                  transition: 'width 0.4s ease'
                }"
                class="rounded-full"
              ></div>
            </div>
            <div class="mt-3">
              <span class="badge" :style="course.attendanceRate >= 75 ? 'border-color:var(--color-success);color:var(--color-success)' : 'border-color:var(--color-error);color:var(--color-error)'">{{ course.attendanceRate }}% Attendance</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Course Detail Modal -->
    <div v-if="selectedCourse"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in modal-backdrop"
      @click.self="selectedCourse = null"
    >
      <div class="card card-hover p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div class="flex items-start justify-between mb-4">
          <div>
            <span class="badge mb-2 inline-block">{{ selectedCourse.code }}</span>
            <h2 class="h3 text-[var(--color-text-primary)]">{{ selectedCourse.title }}</h2>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" @click="selectedCourse = null">&times;</button>
        </div>

        <div class="divider mb-4" />

        <div class="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p class="form-label">Lecturer</p>
            <p class="text-body text-[var(--color-text-primary)] font-semibold">{{ selectedCourse.lecturer }}</p>
          </div>
          <div>
            <p class="form-label">Schedule</p>
            <p class="text-body text-[var(--color-text-primary)] font-semibold">{{ selectedCourse.schedule }}</p>
          </div>
          <div>
            <p class="form-label">Venue</p>
            <p class="text-body text-[var(--color-text-primary)] font-semibold">{{ selectedCourse.venue }}</p>
          </div>
          <div>
            <p class="form-label">Credit Units</p>
            <p class="text-body text-[var(--color-text-primary)] font-semibold">{{ selectedCourse.creditUnits }}</p>
          </div>
          <div v-if="selectedCourse.departmentName">
            <p class="form-label">Department</p>
            <p class="text-body text-[var(--color-text-primary)] font-semibold">{{ selectedCourse.departmentName }}</p>
          </div>
          <div v-if="selectedCourse.facultyName">
            <p class="form-label">Faculty</p>
            <p class="text-body text-[var(--color-text-primary)] font-semibold">{{ selectedCourse.facultyName }}</p>
          </div>
        </div>

        <div class="mb-5">
          <div class="flex justify-between text-body-sm text-[var(--color-text-tertiary)] mb-1">
            <span>Progress</span>
            <span>{{ selectedCourse.progress }}%</span>
          </div>
          <div class="h-2.5 bg-[var(--color-border)] overflow-hidden rounded-full">
            <div :style="{ width: selectedCourse.progress + '%', height: '100%', background: 'var(--color-primary)' }" class="rounded-full"></div>
          </div>
        </div>

        <div class="mb-5">
          <h4 class="h4 text-[var(--color-text-primary)] mb-3">Course Outline</h4>
          <ol class="space-y-2 pl-5">
            <li v-for="(topic, i) in selectedCourse.outline" :key="i" class="text-body text-[var(--color-text-secondary)] leading-relaxed">{{ topic }}</li>
          </ol>
        </div>

        <div class="mb-5">
          <h4 class="h4 text-[var(--color-text-primary)] mb-3">Enrollment Info</h4>
          <p class="text-body text-[var(--color-text-secondary)] mb-1"><strong>Total Students:</strong> {{ selectedCourse.enrolledStudents || 'N/A' }}</p>
          <p class="text-body text-[var(--color-text-secondary)]"><strong>Attendance Rate:</strong> <span class="badge ml-2" :style="selectedCourse.attendanceRate >= 75 ? 'border-color:var(--color-success);color:var(--color-success)' : 'border-color:var(--color-error);color:var(--color-error)'">{{ selectedCourse.attendanceRate }}%</span></p>
        </div>

        <div class="flex gap-3">
          <a v-if="selectedCourse.materialsLink" :href="selectedCourse.materialsLink" class="btn btn-secondary flex-1 text-center" target="_blank">Course Materials</a>
          <button class="btn btn-secondary flex-1" @click="selectedCourse = null">Close</button>
        </div>
      </div>
    </div>

    <!-- Add Course Modal -->
    <div v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in modal-backdrop"
      @click.self="showAddModal = false"
    >
      <div class="card card-hover p-6 max-w-lg w-full animate-scale-in">
        <div class="flex items-center justify-between mb-5">
          <h2 class="h3 text-[var(--color-text-primary)]">Add New Course</h2>
          <button class="btn btn-ghost btn-icon btn-sm" @click="showAddModal = false">&times;</button>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Course Code</label>
              <input class="input" v-model="addForm.code" placeholder="e.g. CSC 301" />
            </div>
            <div class="form-group">
              <label class="form-label">Credit Units</label>
              <input class="input" v-model="addForm.creditUnits" placeholder="e.g. 3" type="number" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Course Title</label>
            <input class="input" v-model="addForm.title" placeholder="e.g. Data Structures" />
          </div>
          <div class="form-group">
            <label class="form-label">Lecturer Name</label>
            <input class="input" v-model="addForm.lecturer" placeholder="e.g. Dr. Adebayo" />
          </div>
          <div class="form-group">
            <label class="form-label">Schedule</label>
            <input class="input" v-model="addForm.schedule" placeholder="e.g. Mon & Wed 10:00-11:30" />
          </div>
          <div class="form-group">
            <label class="form-label">Venue</label>
            <input class="input" v-model="addForm.venue" placeholder="e.g. LT 3" />
          </div>
          <div class="form-group">
            <label class="form-label">Department</label>
            <select class="input" v-model="addForm.departmentId">
              <option value="">Select</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Semester</label>
              <select class="input" v-model="addForm.semester">
                <option value="">Select</option>
                <option value="1">First</option>
                <option value="2">Second</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Level</label>
              <select class="input" v-model="addForm.level">
                <option value="">Select</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary w-full" :disabled="!isAddValid" @click="submitCourse">Add Course</button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../lib/api'
import { departments as deptList, courses as allCourses, colleges } from '../data/courses'

const departments = deptList
const deptMap = Object.fromEntries(departments.map(d => [d.id, d]))

const selectedDepartment = ref('')
const selectedLevel = ref('')
const selectedSemester = ref('')
const searchQuery = ref('')
const loading = ref(true)
const courses = ref([])
const selectedCourse = ref(null)
const showAddModal = ref(false)

const addForm = ref({
  code: '',
  title: '',
  lecturer: '',
  schedule: '',
  venue: '',
  creditUnits: '',
  departmentId: '',
  semester: '',
  level: ''
})

const isAddValid = computed(() =>
  addForm.value.code &&
  addForm.value.title &&
  addForm.value.lecturer &&
  addForm.value.schedule &&
  addForm.value.venue &&
  addForm.value.creditUnits &&
  addForm.value.departmentId &&
  addForm.value.semester &&
  addForm.value.level
)

const filteredCourses = computed(() => {
  let list = courses.value
  if (selectedDepartment.value) {
    const deptId = selectedDepartment.value
    const deptName = deptMap[deptId]?.name
    list = list.filter(c => {
      const idMatch = (c.departmentId || '').toLowerCase() === deptId
      const nameMatch = deptName && (c.departmentName || '').toLowerCase() === deptName.toLowerCase()
      return idMatch || nameMatch
    })
  }
  if (selectedLevel.value) {
    list = list.filter(c => String(c.level) === selectedLevel.value)
  }
  if (selectedSemester.value) {
    list = list.filter(c => String(c.semester) === selectedSemester.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.lecturer.toLowerCase().includes(q) ||
      (c.departmentName || '').toLowerCase().includes(q)
    )
  }
  return list
})

function clearFilters() {
  selectedDepartment.value = ''
  selectedLevel.value = ''
  selectedSemester.value = ''
  searchQuery.value = ''
}

const levelColors = { '100': '#059669', '200': '#2563eb', '300': '#7c3aed', '400': '#d97706', '500': '#dc2626' }
function levelColor(level) {
  return levelColors[level] || '#6b7280'
}

function openDetail(course) {
  selectedCourse.value = course
}

async function submitCourse() {
  await api.post('/courses', {
    code: addForm.value.code,
    title: addForm.value.title,
    lecturer: addForm.value.lecturer,
    schedule: addForm.value.schedule,
    venue: addForm.value.venue,
    creditUnits: Number(addForm.value.creditUnits),
    departmentId: addForm.value.departmentId,
    semester: Number(addForm.value.semester),
    level: Number(addForm.value.level)
  })
  showAddModal.value = false
  addForm.value = { code: '', title: '', lecturer: '', schedule: '', venue: '', creditUnits: '', departmentId: '', semester: '', level: '' }
  loading.value = true
  await fetchCourses()
}

async function fetchCourses() {
  try {
    const { data } = await Promise.race([
      api.get('/courses'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
    ])
    courses.value = (data || []).map(c => ({
      id: c.id,
      code: c.code || '',
      title: c.title || '',
      lecturer: c.lecturerName || c.lecturer || '',
      schedule: c.schedule || '',
      venue: c.venue || '',
      creditUnits: c.units || c.creditUnits || 3,
      semester: c.semester || 1,
      level: c.level || '100',
      departmentId: c.departmentId || '',
      departmentName: c.departmentName || '',
      facultyName: c.facultyName || '',
      progress: c.progress || 0,
      attendanceRate: c.attendanceRate || 0,
      enrolledStudents: c.enrolledStudents || 0,
      outline: c.outline || [],
      materialsLink: c.materialsLink || '#',
    }))
    if (!data || data.length === 0) throw new Error('empty')
  } catch {
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d]))
    const collegeMap = colleges
    courses.value = allCourses.map((c, i) => ({
      id: c.id || i + 1,
      code: c.code,
      title: c.title,
      lecturer: c.lecturer,
      schedule: c.schedule,
      venue: c.venue,
      creditUnits: c.cu,
      semester: c.semester,
      level: String(c.level),
      departmentId: c.dept,
      departmentName: deptMap[c.dept]?.name || c.dept,
      facultyName: collegeMap[deptMap[c.dept]?.college] || '',
      progress: Math.floor(Math.random() * 40) + 45,
      attendanceRate: Math.floor(Math.random() * 25) + 68,
      enrolledStudents: Math.floor(Math.random() * 35) + 25,
      outline: [
        `Introduction to ${c.title}`,
        `Core Concepts in ${c.code}`,
        'Advanced Topics',
        'Practical Applications',
        'Revision & Assessment'
      ],
      materialsLink: '#',
    }))
  } finally {
    loading.value = false
  }
}

onMounted(fetchCourses)
</script>

<style scoped>
.course-card {
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
}

.course-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: 8px 8px 0 var(--nb-shadow-color);
}

.input-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.2s ease;
}

.input-icon:focus-within {
  border-color: var(--color-primary);
}

.input-icon svg {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

.input-inner {
  border: none !important;
  background: transparent !important;
  padding: 8px 0 !important;
  min-width: 140px;
  outline: none;
}

.badge-level {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

/* Stagger entrance for course cards */
.stagger-courses > * {
  animation: fadeInUp 0.35s var(--ease-out) both;
}
.stagger-courses > *:nth-child(1) { animation-delay: 0s; }
.stagger-courses > *:nth-child(2) { animation-delay: 0.06s; }
.stagger-courses > *:nth-child(3) { animation-delay: 0.12s; }
.stagger-courses > *:nth-child(4) { animation-delay: 0.18s; }
.stagger-courses > *:nth-child(5) { animation-delay: 0.24s; }
.stagger-courses > *:nth-child(6) { animation-delay: 0.3s; }
.stagger-courses > *:nth-child(7) { animation-delay: 0.36s; }
.stagger-courses > *:nth-child(8) { animation-delay: 0.42s; }
.stagger-courses > *:nth-child(9) { animation-delay: 0.48s; }
.stagger-courses > *:nth-child(10) { animation-delay: 0.54s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Modal backdrop enhancement */
.modal-backdrop {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: opacity 0.3s ease;
}

/* Filter bar inline entrance */
.content-header {
  animation: fadeInUp 0.3s var(--ease-out) both;
}

/* Progress bar glow */
.progress-glow {
  position: relative;
  overflow: hidden;
}
.progress-glow::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  animation: shimmerSlide 2s ease-in-out infinite;
}

@media (max-width: 768px) {
  .content-header select,
  .content-header .input-icon {
    min-width: 0 !important;
    flex: 1;
  }
  .content-header .input-icon { width: auto; }
}

@media (max-width: 480px) {
  .content-header > div:last-child {
    flex-direction: column;
    width: 100%;
  }
  .content-header > div:last-child > div.flex-wrap {
    width: 100%;
    flex-direction: column;
  }
  .content-header select,
  .content-header .input-icon {
    width: 100% !important;
    font-size: var(--text-xs);
  }
  .content-header .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>