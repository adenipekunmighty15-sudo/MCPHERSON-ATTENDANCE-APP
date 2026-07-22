<template>
  <div class="min-h-screen bg-[var(--color-bg)] p-4 md:p-6 text-[var(--color-text-primary)] relative overflow-hidden font-sans">
    <div class="absolute inset-0 z-0 overflow-hidden mix-blend-screen pointer-events-none opacity-30">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--color-primary)]/15 blur-[120px] rounded-full" />
      <div class="absolute top-[20%] right-[10%] w-[30%] h-[50%] bg-[var(--color-red-brand)]/10 blur-[120px] rounded-full" />
      <div class="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[var(--color-gold)]/8 blur-[100px] rounded-full" />
    </div>

    <div class="page-wide space-y-6" style="padding:var(--page-padding);">
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-3">
            <span class="text-[var(--color-text-primary)]">&#9670;</span> University Admin
          </h1>
          <p class="text-[var(--color-text-secondary)] mt-1 text-sm">Manage faculties, departments, programmes, semesters, and more</p>
        </div>
        <div class="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
          <span class="px-3 py-1.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
            <span class="text-[var(--color-text-primary)] font-semibold">{{ role }}</span>
          </span>
        </div>
      </header>

      <!-- Tab Navigation -->
      <div class="flex flex-wrap gap-1 bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-2xl p-1.5 backdrop-blur-sm">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          :class="activeTab === tab.key ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]/50'">
          <component :is="tab.icon" class="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="bg-[var(--color-surface)]/60 border border-[var(--color-border)] rounded-2xl p-4 md:p-6 backdrop-blur-sm">
        <FacultiesTab v-if="activeTab === 'faculties'" @refresh="fetchData" />
        <DepartmentsTab v-if="activeTab === 'departments'" @refresh="fetchData" />
        <ProgrammesTab v-if="activeTab === 'programmes'" @refresh="fetchData" />
        <AcademicYearsTab v-if="activeTab === 'academic-years'" @refresh="fetchData" />
        <SemestersTab v-if="activeTab === 'semesters'" @refresh="fetchData" />
        <CoursesTab v-if="activeTab === 'courses'" @refresh="fetchData" />
        <UsersTab v-if="activeTab === 'users'" @refresh="fetchData" />
        <EnrollmentsTab v-if="activeTab === 'enrollments'" @refresh="fetchData" />
        <LecturerCoursesTab v-if="activeTab === 'lecturer-courses'" @refresh="fetchData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, markRaw } from 'vue'
import { useAuthStore } from '../stores/auth'

import FacultiesTab from '../components/admin/FacultiesTab.vue'
import DepartmentsTab from '../components/admin/DepartmentsTab.vue'
import ProgrammesTab from '../components/admin/ProgrammesTab.vue'
import AcademicYearsTab from '../components/admin/AcademicYearsTab.vue'
import SemestersTab from '../components/admin/SemestersTab.vue'
import CoursesTab from '../components/admin/CoursesTab.vue'
import UsersTab from '../components/admin/UsersTab.vue'
import EnrollmentsTab from '../components/admin/EnrollmentsTab.vue'
import LecturerCoursesTab from '../components/admin/LecturerCoursesTab.vue'

const authStore = useAuthStore()
const role = ref(authStore.user?.role || 'student')

const activeTab = ref('faculties')

const tabs = [
  { key: 'faculties', label: 'Faculties', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>' }) },
  { key: 'departments', label: 'Depts', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' }) },
  { key: 'programmes', label: 'Programmes', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' }) },
  { key: 'academic-years', label: 'Acad Years', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' }) },
  { key: 'semesters', label: 'Semesters', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' }) },
  { key: 'courses', label: 'Courses', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' }) },
  { key: 'users', label: 'Users', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }) },
  { key: 'enrollments', label: 'Enrollments', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/></svg>' }) },
  { key: 'lecturer-courses', label: 'Lecturer Assign', icon: markRaw({ template: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }) },
]

function fetchData() {}
</script>