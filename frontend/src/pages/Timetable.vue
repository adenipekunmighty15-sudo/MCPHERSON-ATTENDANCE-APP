<template>
  <div class="min-h-screen" style="background: #F5F1EA;">
    <div class="max-w-7xl mx-auto px-6 py-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.15em]" style="color: #96A0B5;">2023/2024 &middot; SEMESTER 2</p>
          <h1 class="text-3xl font-bold mt-1" style="color: #0F1E3D; font-family: 'Playfair Display', 'Georgia', serif;">Timetable</h1>
        </div>
        <div class="flex items-center gap-3">
          <button @click="prevWeek" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="background: #EDEDED; color: #68758E;" @mouseenter="$el.style.background='#E2E6ED'" @mouseleave="$el.style.background='#EDEDED'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span class="text-sm font-semibold" style="color: #0F1E3D;">Week {{ currentWeekLabel }}</span>
          <button @click="nextWeek" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="background: #EDEDED; color: #68758E;" @mouseenter="$el.style.background='#E2E6ED'" @mouseleave="$el.style.background='#EDEDED'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Course Legend -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <span class="text-xs font-semibold uppercase tracking-wider" style="color: #96A0B5;">Courses</span>
        <button v-for="c in courses" :key="c.code"
          @click="toggleCourseFilter(c.code)"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0"
          :style="{
            background: courseFilter.includes(c.code) ? c.color + '22' : '#EDEDED',
            color: courseFilter.includes(c.code) ? c.color : '#96A0B5',
          }"
        >
          <span class="w-2 h-2 rounded-full" :style="{ background: c.color }"></span>
          {{ c.code }}
        </button>
      </div>

      <!-- 7-Day Grid -->
      <div class="rounded-2xl overflow-hidden border" style="background: #FFFFFF; border-color: #E2E6ED;">
        <!-- Header Row -->
        <div class="grid" style="grid-template-columns: 72px repeat(7, 1fr);">
          <div class="p-3" style="border-right: 1px solid #E2E6ED; border-bottom: 1px solid #E2E6ED; background: #F5F1EA;"></div>
          <div v-for="(d, di) in days" :key="d"
            class="p-3 text-center font-bold text-xs uppercase tracking-wider border-b transition-colors"
            :class="{ 'today-column': di === todayCol }"
            :style="{
              borderRight: di < 6 ? '1px solid #E2E6ED' : 'none',
              color: di === todayCol ? '#0F1E3D' : '#96A0B5',
              background: di === todayCol ? '#F5F1EA' : '#FFFFFF',
              borderBottom: di === todayCol ? '2px solid #0F1E3D' : '1px solid #E2E6ED',
            }"
          >
            <span class="block text-[11px] font-bold tracking-wider">{{ d.slice(0, 3) }}</span>
            <span class="block text-xs mt-0.5" :style="{ color: di === todayCol ? '#0F1E3D' : '#B8C0D0' }">{{ dayNumber(di) }}</span>
          </div>
        </div>

        <!-- Time Rows -->
        <div v-for="(t, ti) in timeSlots" :key="t"
          class="grid" style="grid-template-columns: 72px repeat(7, 1fr);"
        >
          <!-- Time label -->
          <div class="relative text-right pr-4 text-[11px] font-mono font-semibold border-r" style="padding: 0 12px; height: 80px; color: #96A0B5; border-color: #E2E6ED;">
            <span class="absolute" style="top: -6px; right: 12px;">{{ t }}</span>
          </div>

          <!-- Day cells -->
          <div v-for="(d, di) in days" :key="d + t"
            class="relative border-r p-1.5 transition-colors"
            :style="{
              borderColor: '#E2E6ED',
              background: di === todayCol ? '#F5F1EA' : '#FFFFFF',
              height: '80px',
            }"
          >
            <div
              v-for="cl in getClasses(d, t)" :key="cl.code + t"
              @click="openClassDetail(cl)"
              class="absolute inset-x-1 rounded-lg p-2 text-xs cursor-pointer transition-all hover:scale-[1.02] border shadow-sm overflow-hidden"
              :style="{
                background: cl.color + '18',
                borderColor: cl.color + '44',
                borderLeft: '3px solid ' + cl.color,
                top: '4px',
                bottom: '4px',
              }"
            >
              <div class="font-bold text-[12px] leading-tight" :style="{ color: cl.color }">{{ cl.code }}</div>
              <div class="text-[10px] font-medium mt-0.5" style="color: #68758E;">{{ cl.room }}</div>
              <div class="text-[9px]" style="color: #96A0B5;">{{ cl.start }}–{{ cl.end }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Class Detail Modal -->
      <div v-if="selectedClass" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(15, 30, 61, 0.3);" @click.self="selectedClass = null">
        <div class="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-fade-in" style="background: #FFFFFF;">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-3 h-3 rounded-full" :style="{ background: selectedClass.color }"></span>
            <h3 class="text-lg font-bold" style="color: #0F1E3D;">{{ selectedClass.code }}</h3>
          </div>
          <div class="space-y-2 text-sm" style="color: #68758E;">
            <p><span class="font-semibold" style="color: #0F1E3D;">Course:</span> {{ selectedClass.title }}</p>
            <p><span class="font-semibold" style="color: #0F1E3D;">Room:</span> {{ selectedClass.room }}</p>
            <p><span class="font-semibold" style="color: #0F1E3D;">Time:</span> {{ selectedClass.day }} {{ selectedClass.start }}–{{ selectedClass.end }}</p>
            <p><span class="font-semibold" style="color: #0F1E3D;">Lecturer:</span> {{ selectedClass.lecturer }}</p>
          </div>
          <button @click="selectedClass = null" class="w-full mt-5 py-2.5 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all" style="background: #EDEDED; color: #0F1E3D;" @mouseenter="$el.style.background='#E2E6ED'" @mouseleave="$el.style.background='#EDEDED'">Close</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const today = new Date()
const todayCol = ref((today.getDay() + 6) % 7)
const weekOffset = ref(0)

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00']

const courseFilter = ref(['CSC 201', 'MTH 201', 'STA 201', 'CSC 203', 'GNS 201', 'CSC 205'])

const courses = [
  { code: 'CSC 201', title: 'Introduction to Programming', color: '#3B82F6', lecturer: 'Dr. Adebayo' },
  { code: 'MTH 201', title: 'Linear Algebra', color: '#8B5CF6', lecturer: 'Prof. Okonkwo' },
  { code: 'STA 201', title: 'Probability & Statistics', color: '#10B981', lecturer: 'Dr. Eze' },
  { code: 'CSC 203', title: 'Data Structures', color: '#F59E0B', lecturer: 'Dr. Adebayo' },
  { code: 'GNS 201', title: 'Use of English', color: '#EC4899', lecturer: 'Mrs. Bello' },
  { code: 'CSC 205', title: 'Computer Organization', color: '#06B6D4', lecturer: 'Dr. Okonkwo' },
]

const scheduleData = [
  { day: 'Monday',    start: '08:00', end: '10:00', code: 'CSC 201', title: 'Introduction to Programming', room: 'Lab 1', lecturer: 'Dr. Adebayo' },
  { day: 'Monday',    start: '12:00', end: '14:00', code: 'MTH 201', title: 'Linear Algebra', room: 'Hall A', lecturer: 'Prof. Okonkwo' },
  { day: 'Tuesday',   start: '10:00', end: '12:00', code: 'STA 201', title: 'Probability & Statistics', room: 'Lab 2', lecturer: 'Dr. Eze' },
  { day: 'Tuesday',   start: '14:00', end: '16:00', code: 'CSC 203', title: 'Data Structures', room: 'Lab 1', lecturer: 'Dr. Adebayo' },
  { day: 'Wednesday', start: '08:00', end: '10:00', code: 'CSC 201', title: 'Introduction to Programming', room: 'Hall A', lecturer: 'Dr. Adebayo' },
  { day: 'Wednesday', start: '10:00', end: '12:00', code: 'GNS 201', title: 'Use of English', room: 'Auditorium', lecturer: 'Mrs. Bello' },
  { day: 'Wednesday', start: '14:00', end: '16:00', code: 'CSC 205', title: 'Computer Organization', room: 'Lab 3', lecturer: 'Dr. Okonkwo' },
  { day: 'Thursday',  start: '08:00', end: '10:00', code: 'STA 201', title: 'Probability & Statistics', room: 'Lab 2', lecturer: 'Dr. Eze' },
  { day: 'Thursday',  start: '12:00', end: '14:00', code: 'MTH 201', title: 'Linear Algebra', room: 'Hall B', lecturer: 'Prof. Okonkwo' },
  { day: 'Friday',    start: '10:00', end: '12:00', code: 'CSC 203', title: 'Data Structures', room: 'Lab 1', lecturer: 'Dr. Adebayo' },
  { day: 'Friday',    start: '14:00', end: '16:00', code: 'CSC 205', title: 'Computer Organization', room: 'Lab 3', lecturer: 'Dr. Okonkwo' },
]

const selectedClass = ref(null)

const currentWeekLabel = computed(() => {
  const n = today.getDate()
  const m = today.getMonth()
  const y = today.getFullYear()
  const weekNum = Math.ceil((n + new Date(y, m, 1).getDay()) / 7) + weekOffset.value
  return weekNum
})

function dayNumber(di) {
  const diff = di - todayCol.value
  const d = new Date(today)
  d.setDate(d.getDate() + diff)
  return d.getDate()
}

function toggleCourseFilter(code) {
  const i = courseFilter.value.indexOf(code)
  if (i >= 0) courseFilter.value.splice(i, 1)
  else courseFilter.value.push(code)
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getClasses(day, time) {
  const tMin = timeToMinutes(time)
  const tMax = tMin + 120
  return scheduleData.filter(cl =>
    cl.day === day &&
    courseFilter.value.includes(cl.code) &&
    timeToMinutes(cl.start) < tMax &&
    timeToMinutes(cl.end) > tMin
  ).map(cl => ({
    ...cl,
    color: courses.find(c => c.code === cl.code)?.color || '#96A0B5',
  }))
}

function openClassDetail(cl) {
  selectedClass.value = cl
}

function prevWeek() { weekOffset.value-- }
function nextWeek() { weekOffset.value++ }

function getCourseColor(code) {
  return courses.find(c => c.code === code)?.color || '#96A0B5'
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
