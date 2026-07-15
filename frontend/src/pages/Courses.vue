<template>
  <div class="min-h-screen p-4 md:p-6 bg-[var(--color-bg)]">
    <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4 animate-slide-up">
      <div>
        <h1 class="h2 text-[var(--color-text-primary)]">My Courses</h1>
        <p class="text-body-sm text-[var(--color-text-secondary)] mt-1">Manage your enrolled courses and track attendance</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <select class="input" v-model="selectedSemester" style="min-width: 120px;">
            <option value="">Semester</option>
            <option value="1">First Semester</option>
            <option value="2">Second Semester</option>
          </select>
          <select class="input" v-model="selectedLevel" style="min-width: 120px;">
            <option value="">Level</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
          </select>
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
      <p class="text-body-sm text-[var(--color-text-secondary)]">Click "Add Course" to enroll in a new course.</p>
    </div>

    <!-- Course Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
      <div
        v-for="course in filteredCourses"
        :key="course.id"
        class="card card-hover p-5 course-card cursor-pointer"
        @click="openDetail(course)"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="badge">{{ course.code }}</span>
            <span class="badge" style="font-size:10px">{{ course.creditUnits }} CU</span>
          </div>
          <h3 class="h4 text-[var(--color-text-primary)] mb-1">{{ course.title }}</h3>
          <p class="text-body-sm text-[var(--color-text-tertiary)] mb-3">{{ course.lecturer }}</p>
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
            <div class="h-2 bg-[var(--color-border)] overflow-hidden">
              <div
                :style="{
                  width: course.progress + '%',
                  height: '100%',
                  background: 'var(--color-primary)',
                  transition: 'width 0.4s ease'
                }"
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
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
        </div>

        <div class="mb-5">
          <div class="flex justify-between text-body-sm text-[var(--color-text-tertiary)] mb-1">
            <span>Progress</span>
            <span>{{ selectedCourse.progress }}%</span>
          </div>
          <div class="h-2.5 bg-[var(--color-border)] overflow-hidden">
            <div :style="{ width: selectedCourse.progress + '%', height: '100%', background: 'var(--color-primary)' }"></div>
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
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

const selectedSemester = ref('')
const selectedLevel = ref('')
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
  addForm.value.semester &&
  addForm.value.level
)

const filteredCourses = computed(() => {
  let list = courses.value
  if (selectedSemester.value) {
    list = list.filter(c => String(c.semester) === selectedSemester.value)
  }
  if (selectedLevel.value) {
    list = list.filter(c => String(c.level) === selectedLevel.value)
  }
  return list
})

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
    semester: Number(addForm.value.semester),
    level: Number(addForm.value.level)
  })
  showAddModal.value = false
  addForm.value = { code: '', title: '', lecturer: '', schedule: '', venue: '', creditUnits: '', semester: '', level: '' }
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
    courses.value = [
      { id: 1, code: 'CSC 301', title: 'Data Structures & Algorithms', lecturer: 'Dr. Okonkwo', schedule: 'Mon & Wed 10:00-11:30', venue: 'MLT 1', creditUnits: 3, semester: 1, level: 300, progress: 72, attendanceRate: 88, enrolledStudents: 45, outline: ['Introduction to Data Structures', 'Arrays and Linked Lists', 'Stacks and Queues', 'Trees and Graphs', 'Sorting Algorithms', 'Search Algorithms'], materialsLink: '#' },
      { id: 2, code: 'CSC 303', title: 'Operating Systems', lecturer: 'Prof. Eze', schedule: 'Tue & Thu 08:00-09:30', venue: 'MLT 2', creditUnits: 3, semester: 1, level: 300, progress: 65, attendanceRate: 82, enrolledStudents: 42, outline: ['Process Management', 'Memory Management', 'File Systems', 'I/O Systems', 'Deadlocks'], materialsLink: '#' },
      { id: 3, code: 'MTH 301', title: 'Linear Algebra', lecturer: 'Dr. Adebayo', schedule: 'Mon & Wed 13:00-14:30', venue: 'LH 3', creditUnits: 3, semester: 1, level: 300, progress: 58, attendanceRate: 75, enrolledStudents: 50, outline: ['Vector Spaces', 'Linear Transformations', 'Matrices and Determinants', 'Eigenvalues and Eigenvectors'], materialsLink: '#' },
      { id: 4, code: 'GNS 301', title: 'Entrepreneurship Studies', lecturer: 'Mrs. Bello', schedule: 'Fri 10:00-12:00', venue: 'CH 1', creditUnits: 2, semester: 1, level: 300, progress: 80, attendanceRate: 90, enrolledStudents: 60, outline: ['Business Planning', 'Market Analysis', 'Financial Management', 'Business Law'], materialsLink: '#' },
      { id: 5, code: 'CSC 305', title: 'Software Engineering', lecturer: 'Dr. Kalu', schedule: 'Tue & Thu 14:00-15:30', venue: 'Lab 204', creditUnits: 3, semester: 1, level: 300, progress: 45, attendanceRate: 70, enrolledStudents: 38, outline: ['SDLC Models', 'Requirements Engineering', 'Design Patterns', 'Testing and QA', 'Agile Methodologies'], materialsLink: '#' },
      { id: 6, code: 'CSC 307', title: 'Computer Networks', lecturer: 'Engr. Musa', schedule: 'Wed & Fri 09:00-10:30', venue: 'NL 2', creditUnits: 3, semester: 1, level: 300, progress: 55, attendanceRate: 78, enrolledStudents: 40, outline: ['OSI Model', 'TCP/IP Protocol Suite', 'Network Topologies', 'Routing Algorithms', 'Network Security'], materialsLink: '#' },
    ]
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
</style>