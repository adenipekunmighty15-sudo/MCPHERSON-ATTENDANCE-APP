<template>
  <div class="min-h-screen bg-[var(--color-bg)] p-4 md:p-6 font-sans text-[var(--color-text-primary)] relative overflow-hidden">
    <!-- Ambient Glow -->
    <div class="absolute inset-0 z-0 overflow-hidden mix-blend-screen pointer-events-none opacity-30">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--color-primary)]/15 blur-[120px] rounded-full" />
      <div class="absolute top-[20%] right-[10%] w-[30%] h-[50%] bg-[var(--color-red-brand)]/10 blur-[120px] rounded-full" />
      <div class="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[var(--color-gold)]/8 blur-[120px] rounded-full" />
    </div>

    <div class="page-wide space-y-6 relative z-10">
      
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            Admin Console
          </h1>
          <p class="text-[var(--color-text-secondary)] mt-1 text-sm">Monitor University attendance thresholds and generate reports</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[var(--color-primary)]/20">
            <Download class="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </header>

      <!-- Risk Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 relative overflow-hidden">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total Enrolled</p>
              <p class="text-3xl font-bold text-[var(--color-text-primary)] mt-1">452</p>
            </div>
            <div class="p-2 bg-[var(--color-primary-soft)] rounded-lg">
              <Users class="w-5 h-5 text-[var(--color-text-primary)]" />
            </div>
          </div>
        </div>
        
        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 relative overflow-hidden">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">At Risk (< 75%)</p>
              <p class="text-3xl font-bold text-[var(--color-text-primary)] mt-1">34</p>
            </div>
            <div class="p-2 bg-[var(--color-gold-soft)] rounded-lg">
              <AlertTriangle class="w-5 h-5 text-[var(--color-text-primary)]" />
            </div>
          </div>
          <div class="w-full bg-[var(--color-surface-elevated)] h-1.5 rounded-full overflow-hidden">
            <div class="bg-[var(--color-red-brand)] h-full w-[7.5%]"></div>
          </div>
        </div>

        <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 relative overflow-hidden">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Average Rate</p>
              <p class="text-3xl font-bold text-[var(--color-text-primary)] mt-1">89.2%</p>
            </div>
            <div class="p-2 bg-[var(--color-red-brand-soft)] rounded-lg">
              <Activity class="w-5 h-5 text-[var(--color-text-primary)]" />
            </div>
          </div>
          <div class="w-full bg-[var(--color-surface-elevated)] h-1.5 rounded-full overflow-hidden">
            <div class="bg-[var(--color-primary)] h-full w-[89.2%]"></div>
          </div>
        </div>
      </div>

      <!-- At Risk Students Table -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-2xl">
        <div class="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 flex justify-between items-center">
          <h2 class="text-lg font-bold text-[var(--color-text-primary)]">At-Risk Students</h2>
          <div class="relative w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input type="text" placeholder="Search ID or Name..." class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-1.5 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[var(--color-bg)]/30 border-b border-[var(--color-border)]">
                <th class="p-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Student ID</th>
                <th class="p-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Name</th>
                <th class="p-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Course</th>
                <th class="p-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Rate</th>
                <th class="p-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]/50">
              <tr v-for="student in atRiskStudents" :key="student.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
                <td class="p-4 text-sm font-mono text-[var(--color-text-secondary)]">{{ student.id }}</td>
                <td class="p-4 text-sm font-semibold text-[var(--color-text-primary)]">{{ student.name }}</td>
                <td class="p-4 text-sm text-[var(--color-text-primary)]">{{ student.course }}</td>
                <td class="p-4 text-sm font-bold text-[var(--color-text-primary)]">{{ student.rate }}%</td>
                <td class="p-4">
                  <button class="text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] bg-[var(--color-primary-soft)] px-3 py-1 rounded-lg">Notify Parent</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { Download, Users, AlertTriangle, Activity, Search } from 'lucide-vue-next'

const atRiskStudents = [
  { id: 'MCU/26/0142', name: 'Oluwaseun Adebayo', course: 'University Sciences', rate: 68 },
  { id: 'MCU/26/0281', name: 'Ngozi Okafor', course: 'University Arts', rate: 72 },
  { id: 'MCU/26/0093', name: 'Ibrahim Musa', course: 'University Social Sci', rate: 55 },
  { id: 'MCU/26/0410', name: 'Chinedu Eze', course: 'University Sciences', rate: 74 },
  { id: 'MCU/26/0112', name: 'Aisha Bello', course: 'University Arts', rate: 60 }
]
</script>
