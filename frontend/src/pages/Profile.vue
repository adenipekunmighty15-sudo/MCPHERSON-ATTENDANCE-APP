<template>
  <div class="profile-page" style="background: #F5F1EA; min-height: 100dvh;">
    <div class="max-w-6xl mx-auto px-6 py-8 lg:px-8">
      <!-- Eyebrow + Title -->
      <div class="mb-8">
        <div class="text-[10px] font-semibold uppercase tracking-[1.5px] mb-1.5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Account</div>
        <h1 class="text-3xl lg:text-4xl font-bold leading-tight" style="font-family: 'Fraunces', Georgia, serif; color: #1A1A2E;">My Profile</h1>
      </div>

      <!-- 2-column body -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- LEFT: Profile Card (2/5 width) -->
        <div class="lg:col-span-2">
          <div class="rounded-xl overflow-hidden" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <!-- Gradient banner -->
            <div class="h-24 relative" style="background: linear-gradient(135deg, #2563EB, #1D4ED8, #0F1E3D);">
              <button v-if="editMode" @click="saveProfile" class="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all" style="background: rgba(255,255,255,0.2); color: #FFFFFF;" @mouseenter="$event.target.style.background = 'rgba(255,255,255,0.3)'" @mouseleave="$event.target.style.background = 'rgba(255,255,255,0.2)'">Save</button>
            </div>

            <!-- Avatar overlapping -->
            <div class="flex justify-center -mt-10 mb-3">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-4" style="border-color: #FFFFFF; background: #2563EB; color: #FFFFFF; font-family: 'Fraunces', Georgia, serif;">
                {{ initials }}
              </div>
            </div>

            <!-- Name & Email -->
            <div class="text-center px-6">
              <h2 class="text-xl font-bold" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">{{ authStore.user?.name || 'Adeola Johnson' }}</h2>
              <p class="text-sm mt-0.5 font-medium" style="color: #2563EB; font-family: 'Inter', system-ui, sans-serif;">{{ authStore.user?.email || 'adeola@mcu.edu.ng' }}</p>
            </div>

            <!-- Pills -->
            <div class="flex flex-wrap justify-center gap-2 px-6 mt-4">
              <span class="px-3 py-1 rounded-full text-[10px] font-semibold" style="background: #EDEDED; color: #68758E; font-family: 'Inter', system-ui, sans-serif;">Computer Science</span>
              <span class="px-3 py-1 rounded-full text-[10px] font-semibold" style="background: #EDEDED; color: #68758E; font-family: 'Inter', system-ui, sans-serif;">200 Level</span>
              <span class="px-3 py-1 rounded-full text-[10px] font-semibold" style="background: #EDEDED; color: #68758E; font-family: 'Inter', system-ui, sans-serif;">{{ authStore.user?.matricNo || '2023/0451' }}</span>
            </div>

            <!-- Divider -->
            <div class="mx-6 my-5" style="border-top: 1px solid #E2E6ED;"></div>

            <!-- 2x2 Stat mini-grid -->
            <div class="grid grid-cols-2 gap-3 px-6 pb-6">
              <div v-for="s in profileStats" :key="s.label" class="rounded-xl py-4 px-4 text-center" style="background: #F5F1EA;">
                <div class="text-2xl font-bold" style="color: #1A1A2E; font-family: 'Fraunces', Georgia, serif;">{{ s.value }}</div>
                <div class="text-[10px] font-semibold mt-1" style="color: #68758E; font-family: 'Inter', system-ui, sans-serif;">{{ s.label }}</div>
              </div>
            </div>
          </div>

          <!-- Edit button (outside card) -->
          <button v-if="!editMode" @click="editMode = true" class="w-full mt-4 py-3 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all" style="background: #FFFFFF; color: #1A1A2E; box-shadow: 0 2px 8px rgba(0,0,0,0.04);" @mouseenter="$event.target.style.background = '#EDEDED'" @mouseleave="$event.target.style.background = '#FFFFFF'">
            Edit Profile
          </button>
        </div>

        <!-- RIGHT: Info Panels (3/5 width) -->
        <div class="lg:col-span-3 space-y-5">
          <!-- Personal Information -->
          <div class="rounded-xl p-6" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <h3 class="text-[10px] font-semibold uppercase tracking-wider mb-5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Personal Information</h3>
            <div class="grid grid-cols-2 gap-x-8 gap-y-4">
              <div v-for="field in personalInfo" :key="field.label" class="flex flex-col gap-0.5">
                <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ field.label }}</span>
                <span class="text-sm font-medium" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">{{ field.value }}</span>
              </div>
            </div>
          </div>

          <!-- Academic Information -->
          <div class="rounded-xl p-6" style="background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <h3 class="text-[10px] font-semibold uppercase tracking-wider mb-5" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">Academic Information</h3>
            <div class="grid grid-cols-2 gap-x-8 gap-y-4">
              <div v-for="field in academicInfo" :key="field.label" class="flex flex-col gap-0.5">
                <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: #96A0B5; font-family: 'Inter', system-ui, sans-serif;">{{ field.label }}</span>
                <span class="text-sm font-medium" style="color: #1A1A2E; font-family: 'Inter', system-ui, sans-serif;">{{ field.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const editMode = ref(false)
const stats = ref({ gpa: 4.52, attendanceRate: 90.1, courses: 18, streak: 3 })

const initials = computed(() => {
  const name = authStore.user?.name || 'Adeola Johnson'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const profileStats = computed(() => [
  { value: stats.value.gpa.toFixed(2), label: 'GPA' },
  { value: stats.value.courses, label: 'Courses' },
  { value: stats.value.attendanceRate + '%', label: 'Attendance' },
  { value: stats.value.streak + 'd', label: 'Streak' },
])

const personalInfo = computed(() => [
  { label: 'Full Name', value: authStore.user?.name || 'Adeola Johnson' },
  { label: 'Date of Birth', value: '—' },
  { label: 'Gender', value: '—' },
  { label: 'Phone', value: authStore.user?.phone || '—' },
])

const academicInfo = computed(() => [
  { label: 'Matric Number', value: authStore.user?.matricNo || '2023/0451' },
  { label: 'Department', value: authStore.user?.department || 'Computer Science' },
  { label: 'Faculty', value: 'Science and Technology' },
  { label: 'Level', value: (authStore.user?.level || '200') + ' Level' },
])

onMounted(async () => {
  const api = (await import('../lib/api')).default
  try {
    const res = await api.get('/gamification/profile')
    if (res?.data) stats.value = { ...stats.value, ...res.data }
  } catch { /* ignore */ }
})
</script>

<style>
.profile-page {
  font-family: 'Inter', system-ui, sans-serif;
}
</style>
