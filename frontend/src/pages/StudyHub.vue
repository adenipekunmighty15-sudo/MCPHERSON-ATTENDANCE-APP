<template>
  <div class="min-h-screen" style="background: #F5F1EA;">
    <div class="max-w-7xl mx-auto px-6 py-8">

      <!-- Header -->
      <div class="mb-6">
        <p class="text-xs font-semibold uppercase tracking-[0.15em]" style="color: #96A0B5;">ACADEMIC TOOLS</p>
        <h1 class="text-3xl font-bold mt-1" style="color: #0F1E3D; font-family: 'Playfair Display', 'Georgia', serif;">Study Hub</h1>
      </div>

      <!-- Tab Bar -->
      <div class="flex gap-1 mb-8 p-1 rounded-xl inline-flex" style="background: #EDEDED;">
        <button v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          class="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border-0 cursor-pointer"
          :style="{
            background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
            color: activeTab === tab.id ? '#0F1E3D' : '#96A0B5',
            boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }"
        >{{ tab.label }}</button>
      </div>

      <!-- Two-column body -->
      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Left: Study Groups -->
        <div class="flex-1 min-w-0">

          <div class="space-y-3">
            <div v-for="g in studyGroups" :key="g.id"
              class="rounded-2xl p-5 transition-all cursor-pointer border"
              style="background: #FFFFFF; border-color: #E2E6ED;"
              @mouseenter="$el.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)'"
              @mouseleave="$el.style.boxShadow='none'"
            >
              <div class="flex items-start gap-4">
                <!-- Avatar -->
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :style="{ background: g.color + '18', color: g.color }">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <h3 class="font-bold text-sm" style="color: #0F1E3D;">{{ g.name }}</h3>
                      <span class="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold" style="background: #3B82F6; color: #FFFFFF;">{{ g.topic }}</span>
                    </div>
                    <button
                      class="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all shrink-0"
                      :style="{ background: g.btnColor + '18', color: g.btnColor }"
                      @mouseenter="$el.style.background = g.btnColor + '30'"
                      @mouseleave="$el.style.background = g.btnColor + '18'"
                    >Join Session</button>
                  </div>
                  <div class="flex items-center gap-4 mt-3 text-xs" style="color: #96A0B5;">
                    <span class="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      {{ g.members }}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      {{ g.session }}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full" :class="g.status === 'Active' ? 'bg-green-500' : 'bg-amber-400'"></span>
                      {{ g.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Create new group -->
          <button class="w-full mt-4 p-5 rounded-2xl text-sm font-semibold border-2 border-dashed cursor-pointer transition-all flex items-center justify-center gap-2" style="border-color: #D0D6E0; color: #96A0B5; background: transparent;" @mouseenter="$el.style.borderColor='#3B82F6'; $el.style.color='#3B82F6'" @mouseleave="$el.style.borderColor='#D0D6E0'; $el.style.color='#96A0B5'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Create new study group
          </button>
        </div>

        <!-- Right Sidebar -->
        <div class="w-full lg:w-80 space-y-6">

          <!-- Pomodoro Timer -->
          <div class="rounded-2xl p-6 border text-center" style="background: #FFFFFF; border-color: #E2E6ED;">
            <h3 class="text-sm font-bold text-left mb-4" style="color: #0F1E3D;">Pomodoro Timer</h3>

            <!-- Circular ring -->
            <div class="relative w-36 h-36 mx-auto mb-4">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#EDEDED" stroke-width="6" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#EF4444" stroke-width="6"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="progressOffset"
                  class="transition-all duration-300"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold font-mono" style="color: #0F1E3D;">{{ formattedTime }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style="color: #EF4444;">{{ timerState === 'running' ? 'Focusing' : timerState === 'paused' ? 'Paused' : 'Ready' }}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center gap-3 mb-4">
              <button v-if="timerState !== 'running'" @click="startTimer"
                class="px-6 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #10B981; color: #FFFFFF;"
                @mouseenter="$el.style.background='#059669'" @mouseleave="$el.style.background='#10B981'"
              >Start</button>
              <button v-else @click="pauseTimer"
                class="px-6 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #F59E0B; color: #FFFFFF;"
                @mouseenter="$el.style.background='#D97706'" @mouseleave="$el.style.background='#F59E0B'"
              >Pause</button>
              <button @click="resetTimer"
                class="w-9 h-9 rounded-xl flex items-center justify-center transition-all border-0 cursor-pointer" style="background: #EDEDED; color: #68758E;"
                @mouseenter="$el.style.background='#E2E6ED'" @mouseleave="$el.style.background='#EDEDED'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              </button>
            </div>

            <!-- Duration presets -->
            <div class="flex gap-2 justify-center">
              <button v-for="p in presets" :key="p.label"
                @click="setDuration(p.minutes)"
                class="px-3 py-1.5 rounded-lg text-[11px] font-semibold border-0 cursor-pointer transition-all"
                :style="{
                  background: currentDuration === p.minutes ? '#EF4444' : '#EDEDED',
                  color: currentDuration === p.minutes ? '#FFFFFF' : '#68758E',
                }"
              >{{ p.label }}</button>
            </div>
          </div>

          <!-- Weekly Goals -->
          <div class="rounded-2xl p-6 border" style="background: #FFFFFF; border-color: #E2E6ED;">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold" style="color: #0F1E3D;">Weekly Goals</h3>
              <span class="text-xs font-semibold" style="color: #96A0B5;">{{ completedGoals }}/{{ goals.length }}</span>
            </div>
            <div class="space-y-2">
              <label v-for="g in goals" :key="g.id"
                class="flex items-center gap-3 py-1.5 cursor-pointer group"
              >
                <input type="checkbox" v-model="g.done"
                  class="w-4 h-4 rounded border-2 appearance-none cursor-pointer shrink-0 transition-all"
                  :style="{
                    borderColor: g.done ? '#10B981' : '#D0D6E0',
                    background: g.done ? '#10B981' : 'transparent',
                  }"
                />
                <span v-if="g.done" class="absolute ml-0.5 mt-0.5 text-white text-[10px] font-bold pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5L20 7"/></svg>
                </span>
                <span
                  class="text-sm transition-all"
                  :style="{
                    color: g.done ? '#B8C0D0' : '#0F1E3D',
                    textDecoration: g.done ? 'line-through' : 'none',
                  }"
                >{{ g.text }}</span>
              </label>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const tabs = [
  { id: 'groups', label: 'Study Groups' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'resources', label: 'Resources' },
]
const activeTab = ref('groups')

const studyGroups = ref([
  { id: 1, name: 'CSC 201 Study Circle', topic: 'Dynamic Programming', members: 8, session: 'Today, 4:00 PM', status: 'Active', color: '#3B82F6', btnColor: '#3B82F6' },
  { id: 2, name: 'Math Problem Solvers', topic: 'Linear Algebra', members: 12, session: 'Tomorrow, 10:00 AM', status: 'Active', color: '#F59E0B', btnColor: '#F59E0B' },
  { id: 3, name: 'Statistics Lab Prep', topic: 'Hypothesis Testing', members: 6, session: 'Wed, 2:00 PM', status: 'Scheduled', color: '#10B981', btnColor: '#10B981' },
  { id: 4, name: 'English Essay Workshop', topic: 'Argumentative Writing', members: 10, session: 'Fri, 1:00 PM', status: 'Scheduled', color: '#EC4899', btnColor: '#EC4899' },
])

// Pomodoro Timer
const DURATIONS = [25, 15, 5]
const presets = [
  { label: '25m', minutes: 25 },
  { label: '15m', minutes: 15 },
  { label: '5m', minutes: 5 },
]

const totalSeconds = ref(25 * 60)
const remainingSeconds = ref(25 * 60)
const timerState = ref('idle')
let interval = null

const circumference = 2 * Math.PI * 52

const progressOffset = computed(() => {
  const fraction = remainingSeconds.value / totalSeconds.value
  return circumference * (1 - fraction)
})

const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const currentDuration = computed(() => {
  const m = totalSeconds.value / 60
  return presets.find(p => p.minutes === m)?.minutes || 25
})

function setDuration(minutes) {
  if (timerState.value === 'running') return
  totalSeconds.value = minutes * 60
  remainingSeconds.value = minutes * 60
  timerState.value = 'idle'
}

function startTimer() {
  if (timerState.value === 'idle' || timerState.value === 'paused') {
    timerState.value = 'running'
    interval = setInterval(() => {
      remainingSeconds.value--
      if (remainingSeconds.value <= 0) {
        clearInterval(interval)
        interval = null
        timerState.value = 'idle'
      }
    }, 1000)
  }
}

function pauseTimer() {
  if (timerState.value === 'running') {
    clearInterval(interval)
    interval = null
    timerState.value = 'paused'
  }
}

function resetTimer() {
  clearInterval(interval)
  interval = null
  remainingSeconds.value = totalSeconds.value
  timerState.value = 'idle'
}

// Weekly Goals
const goals = ref([
  { id: 1, text: 'Review CSC 201 lecture notes', done: true },
  { id: 2, text: 'Complete MTH 201 assignment', done: false },
  { id: 3, text: 'Practice STA 201 problems', done: false },
  { id: 4, text: 'Read GNS 201 chapter 3', done: false },
  { id: 5, text: 'Prepare for CSC 203 quiz', done: true },
])

const completedGoals = computed(() => goals.value.filter(g => g.done).length)
</script>

<style scoped>
input[type="checkbox"] {
  position: relative;
}
input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 1px;
  width: 8px;
  height: 4px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg);
}
</style>
