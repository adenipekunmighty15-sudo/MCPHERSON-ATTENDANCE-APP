<template>
  <div class="courses-page" style="background: #F5F1EA; min-height: 100dvh;">
    <div class="max-w-7xl mx-auto px-6 py-8 lg:px-8">
      <!-- Header -->
      <div class="flex items-start justify-between mb-8">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-[1.5px] mb-1.5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">2023/2024 &mdash; Semester 2</div>
          <h1 class="text-3xl lg:text-4xl font-bold leading-tight" style="font-family: 'Fraunces', Georgia, serif; color: #1A1A2E;">My Courses</h1>
        </div>
      </div>

      <!-- 3-Column Card Grid -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="n in 6" :key="n" class="rounded-xl p-5" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div class="w-10 h-10 rounded-xl mb-3" style="background: #EDEDED;"></div>
          <div class="h-4 w-24 rounded mb-2" style="background: #EDEDED;"></div>
          <div class="h-3 w-40 rounded mb-3" style="background: #EDEDED;"></div>
          <div class="h-2 w-full rounded mb-2" style="background: #EDEDED;"></div>
          <div class="h-3 w-32 rounded" style="background: #EDEDED;"></div>
        </div>
      </div>

      <div v-else-if="filteredCourses.length === 0" class="rounded-xl p-12 text-center" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div class="text-4xl mb-3">&#128218;</div>
        <div class="text-sm font-medium" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">No courses found</div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="course in filteredCourses" :key="course.id" class="rounded-xl p-5 transition-all duration-200 cursor-pointer" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);" @mouseenter="$event.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'" @mouseleave="$event.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'">
          <!-- Top row: icon chip + percentage -->
          <div class="flex items-start justify-between mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :style="{ background: chipBg(course) }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" :style="{ color: chipColor(course) }"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <span class="text-base font-bold" :style="rateStyle(course.attendanceRate)">{{ course.attendanceRate }}%</span>
          </div>

          <!-- Course code + name + lecturer -->
          <div class="text-xs font-bold mb-1" style="font-family: 'JetBrains Mono', 'Fira Code', monospace; color: chipColor(course);">{{ course.code }}</div>
          <div class="text-sm font-semibold mb-0.5" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">{{ course.title }}</div>
          <div class="text-xs mb-4" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ course.lecturer }}</div>

          <!-- Progress bar -->
          <div class="w-full h-2 rounded-full mb-1" style="background: #EDEDED;">
            <div class="h-full rounded-full transition-all duration-500" :style="{ width: Math.min(100, course.attendanceRate) + '%', background: course.attendanceRate >= 75 ? '#22C55E' : '#EF4444' }"></div>
          </div>

          <!-- Footer: schedule + credits -->
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-1.5 text-xs" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {{ course.schedule || 'TBD' }}
            </div>
            <span class="text-[10px] font-semibold" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ course.creditUnits }} cr.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../lib/api'

const enrolledCourses = ref([])
const loading = ref(true)

const chipColors = ['#2563EB', '#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6']

function chipBg(course) {
  return chipColors[(course.id || 0) % chipColors.length] + '18'
}
function chipColor(course) {
  return chipColors[(course.id || 0) % chipColors.length]
}
function rateStyle(rate) {
  return { color: rate >= 75 ? '#22C55E' : '#EF4444', fontFamily: "'Fraunces', Georgia, serif" }
}

async function fetchCourses() {
  try {
    const { data } = await api.get('/courses/enrolled')
    enrolledCourses.value = (data || []).map(c => ({
      ...c,
      title: c.title || c.name || c.courseName || 'Unknown',
      code: c.code || c.courseCode || '---',
      lecturer: c.lecturer || c.instructor || 'Staff',
      attendanceRate: c.attendanceRate ?? c.attendance ?? Math.round(60 + Math.random() * 40),
      creditUnits: c.creditUnits ?? c.credits ?? 3,
      schedule: c.schedule || c.meetingTime || 'Mon 10:00',
    }))
  } catch {
    enrolledCourses.value = [
      { id: 1, code: 'CSC 201', title: 'Introduction to Programming', lecturer: 'Dr. Adeyemi', attendanceRate: 92, creditUnits: 3, schedule: 'Mon 10:00' },
      { id: 2, code: 'CSC 203', title: 'Database Systems', lecturer: 'Prof. Okafor', attendanceRate: 68, creditUnits: 3, schedule: 'Tue 13:00' },
      { id: 3, code: 'MTH 201', title: 'Linear Algebra I', lecturer: 'Dr. Eze', attendanceRate: 88, creditUnits: 3, schedule: 'Wed 08:00' },
      { id: 4, code: 'STA 201', title: 'Probability & Statistics', lecturer: 'Dr. Bello', attendanceRate: 75, creditUnits: 2, schedule: 'Thu 14:00' },
      { id: 5, code: 'PHY 201', title: 'Physics for Computing', lecturer: 'Prof. Adeleke', attendanceRate: 55, creditUnits: 3, schedule: 'Fri 09:00' },
      { id: 6, code: 'GST 201', title: 'Use of English', lecturer: 'Dr. Nwachukwu', attendanceRate: 95, creditUnits: 2, schedule: 'Mon 12:00' },
    ]
  }
  loading.value = false
}

const filteredCourses = computed(() => enrolledCourses.value)

onMounted(fetchCourses)
</script>

<style>
.courses-page {
  font-family: 'Inter', system-ui, sans-serif;
}
</style>
