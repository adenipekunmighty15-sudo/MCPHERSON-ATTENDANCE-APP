<template>
  <div class="min-h-screen p-4 md:p-6 bg-[var(--color-bg)] text-[var(--color-text-primary)]">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 class="h2 text-[var(--color-text-primary)]">Class Schedule</h1>
          <p class="text-[var(--color-text-secondary)] mt-1 text-body-sm">Manage your weekly JUPEB timetable</p>
        </div>
        <div class="flex items-center gap-2 card card-hover p-1">
          <button @click="viewMode = 'timeline'" class="btn btn-primary" :class="{ active: viewMode === 'timeline' }" style="padding:8px 16px;font-size:12px;border-width:2px">Timeline</button>
          <button @click="viewMode = 'week'" class="btn btn-primary" :class="{ active: viewMode === 'week' }" style="padding:8px 16px;font-size:12px;border-width:2px">Week</button>
          <button @click="viewMode = 'month'" class="btn btn-primary" :class="{ active: viewMode === 'month' }" style="padding:8px 16px;font-size:12px;border-width:2px">Month</button>
        </div>
      </header>

      <!-- Timeline View -->
      <div v-if="viewMode === 'timeline'" class="card card-hover p-6 animate-fade-in">
        <div class="flex items-center gap-2 mb-6">
          <span class="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Today</span>
          <span class="text-xs text-[var(--color-text-tertiary)]">{{ todayDate }}</span>
        </div>
        <div class="relative pl-8 space-y-0 timeline-container">
          <div v-for="(item, i) in timelineData" :key="i" class="relative pb-8 timeline-node">
            <div class="flex items-start gap-4">
              <div class="text-xs font-mono font-bold text-[var(--color-text-tertiary)] w-12 text-right shrink-0 pt-1.5">{{ item.time }}</div>
              <div class="flex-1 min-w-0">
                <div class="p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  :class="item.status === 'current' 
                    ? 'bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 border-[var(--color-primary)]/30 shadow-[0_0_24px_rgba(147,197,253,0.12)]' 
                    : item.status === 'done' 
                    ? 'bg-[var(--color-surface-elevated)]/30 border-[var(--color-border)] opacity-60' 
                    : 'bg-[var(--color-surface-elevated)]/20 border-[var(--color-border)] hover:border-[var(--color-border-strong)]'">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <h3 class="font-bold text-[var(--color-text-primary)] text-sm truncate">{{ item.title }}</h3>
                        <span v-if="item.status === 'current'" class="relative flex h-2 w-2 shrink-0">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
                        </span>
                      </div>
                      <p class="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-1.5">
                        <MapPin class="w-3 h-3 shrink-0" />
                        <span>{{ item.location }}</span>
                      </p>
                    </div>
                    <div v-if="item.status === 'current'" class="shrink-0">
                      <router-link to="/attendance" class="btn btn-primary" style="padding:6px 12px;font-size:10px">
                        <ClipboardCheck class="w-3 h-3" />
                        CHECK IN
                      </router-link>
                    </div>
                    <CheckCircle v-else-if="item.status === 'done'" class="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0 mt-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="timelineData.length === 0" class="flex flex-col items-center justify-center py-12 text-[var(--color-text-tertiary)]">
            <Calendar class="w-12 h-12 mb-3 opacity-20" />
            <p class="text-sm font-medium">No classes scheduled today</p>
          </div>
        </div>
      </div>

      <!-- Week Grid View -->
      <div v-if="viewMode === 'week'" class="card overflow-hidden relative animate-fade-in">
        <div class="overflow-x-auto">
          <div class="min-w-[800px]">
            <div class="grid grid-cols-6 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
              <div class="p-4 border-r border-[var(--color-border)]"></div>
              <div v-for="day in days" :key="day" class="p-4 border-r border-[var(--color-border)] last:border-0 text-center font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider">
                {{ day }}
              </div>
            </div>

            <div class="relative">
              <div v-for="time in timeSlots" :key="time" class="grid grid-cols-6 border-b border-[var(--color-border)]/50 group hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
                <div class="p-4 border-r border-[var(--color-border)] text-xs font-mono text-[var(--color-text-tertiary)] text-right pr-6 relative">
                  <span class="relative -top-3">{{ time }}</span>
                </div>
                <div v-for="day in days" :key="day + time" class="p-2 border-r border-[var(--color-border)] last:border-0 relative min-h-[80px]">
                  <div 
                    v-if="getClass(day, time)" 
                    class="absolute inset-x-2 inset-y-1 rounded-xl p-3 border shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] cursor-pointer z-10"
                    :class="getClassStyle(getClass(day, time).type)"
                  >
                    <h3 class="text-xs font-bold text-[var(--color-text-primary)] leading-tight mb-1">{{ getClass(day, time).course }}</h3>
                    <div class="flex items-center gap-1 text-[10px] opacity-80 font-medium">
                      <MapPin class="w-3 h-3" />
                      {{ getClass(day, time).room }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Month View (placeholder) -->
      <div v-if="viewMode === 'month'" class="card p-8 flex items-center justify-center animate-fade-in" style="min-height:300px">
        <div class="text-center text-[var(--color-text-tertiary)]">
          <Calendar class="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p class="text-body font-medium">Month view coming soon</p>
          <p class="text-body-sm text-[var(--color-text-tertiary)] mt-1">Use Timeline or Week view for now</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MapPin, Calendar, CheckCircle, ClipboardCheck } from 'lucide-vue-next'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00']
const viewMode = ref('timeline')

const now = new Date()
const todayDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const scheduleData = [
  { day: 'Monday', time: '08:00', course: 'JUPEB 001 Physics', room: 'Lab 1', type: 'science' },
  { day: 'Monday', time: '14:00', course: 'JUPEB 002 Chemistry', room: 'Hall B', type: 'science' },
  { day: 'Tuesday', time: '10:00', course: 'JUPEB 003 Biology', room: 'Lab 2', type: 'bio' },
  { day: 'Wednesday', time: '08:00', course: 'JUPEB 001 Physics', room: 'Hall A', type: 'science' },
  { day: 'Wednesday', time: '12:00', course: 'General Studies', room: 'Auditorium', type: 'general' },
  { day: 'Thursday', time: '10:00', course: 'JUPEB 002 Chemistry', room: 'Lab 1', type: 'science' },
  { day: 'Friday', time: '14:00', course: 'JUPEB 003 Biology', room: 'Lab 3', type: 'bio' }
]

const timelineData = [
  { time: '08:00', title: 'JUPEB 001 Physics', location: 'Lab 1', status: 'done' },
  { time: '10:00', title: 'JUPEB 003 Biology', location: 'Lab 2', status: 'done' },
  { time: '13:00', title: 'JUPEB 002 Chemistry', location: 'Hall B', status: 'current' },
  { time: '15:00', title: 'General Studies', location: 'Auditorium', status: 'upcoming' },
]

const getClass = (day, time) => {
  return scheduleData.find(c => c.day === day && c.time === time)
}

const getClassStyle = (type) => {
  const styles = {
    science: 'bg-[var(--color-primary-soft)] border-[var(--color-primary)]/30 text-blue-100',
    bio: 'bg-[#FFEBF3]/20 border-emerald-500/30 text-emerald-100',
    general: 'bg-purple-600/20 border-purple-500/30 text-purple-100'
  }
  return styles[type] || 'bg-[var(--color-surface-elevated)] border-[var(--color-border)]'
}
</script>

<style scoped>
.btn btn-primary.active {
  background: var(--color-primary) !important;
  color: var(--color-surface) !important;
  border-color: var(--color-primary) !important;
  box-shadow: 0 4px 16px var(--color-primary-glow) !important;
}

.timeline-container::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 104px;
  width: 2px;
  background: var(--color-border);
  border-radius: 999px;
}
.timeline-node::before {
  content: '';
  position: absolute;
  left: 98px;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid var(--color-bg);
  z-index: 1;
}
.timeline-node:last-child::after {
  content: '';
  position: absolute;
  left: 104px;
  bottom: 0;
  width: 2px;
  height: 8px;
  background: transparent;
}
.timeline-node:last-child { padding-bottom: 0; }
</style>
