<template>
  <div class="min-h-screen" style="background: #F5F1EA;">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <div class="mb-6">
        <p class="text-xs font-semibold uppercase tracking-[0.15em]" style="color: #96A0B5;">ACADEMIC TOOLS</p>
        <h1 class="text-3xl font-bold mt-1" style="color: #0F1E3D; font-family: 'Playfair Display', 'Georgia', serif;">Study Hub</h1>
      </div>

      <div class="flex gap-1 mb-8 p-1 rounded-xl inline-flex flex-wrap" style="background: #EDEDED;">
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

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Main content area -->
        <div class="flex-1 min-w-0">
          <!-- STUDY GROUPS -->
          <div v-if="activeTab === 'groups'">
            <StudyGroupManager />
          </div>

          <!-- FLASHCARDS -->
          <div v-if="activeTab === 'flashcards'">
            <div class="mb-6">
              <FlashcardGenerator @saved="refreshFlashcardDecks" />
            </div>
            <div v-if="decks.length > 0" class="mt-8">
              <h3 class="text-sm font-bold mb-4" style="color: #0F1E3D;">Saved Decks</h3>
              <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));">
                <div v-for="d in decks" :key="d.id" @click="viewDeck(d.id)"
                  class="rounded-2xl p-4 border transition-all cursor-pointer" style="background: #FFFFFF; border-color: #E2E6ED;"
                  @mouseenter="$el.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)'" @mouseleave="$el.style.boxShadow='none'"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: #DBEAFE; color: #3B82F6;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold truncate" style="color: #0F1E3D;">{{ d.title }}</p>
                      <p class="text-[10px] mt-0.5" style="color: #96A0B5;">{{ d.flashcardCount || 0 }} cards</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- QUIZZES -->
          <div v-if="activeTab === 'quizzes'">
            <QuizView />
          </div>

          <!-- RESOURCES -->
          <div v-if="activeTab === 'resources'">
            <PodcastAudio />
          </div>
        </div>

        <!-- Global sidebar — Pomodoro + Goals (visible on all tabs) -->
        <div class="w-full lg:w-80 space-y-6 shrink-0">
          <div class="rounded-2xl p-6 border" style="background: #FFFFFF; border-color: #E2E6ED;">
            <h3 class="text-sm font-bold mb-4" style="color: #0F1E3D;">Pomodoro Timer</h3>
            <div class="relative w-36 h-36 mx-auto mb-4">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#EDEDED" stroke-width="6" />
                <circle cx="60" cy="60" r="52" fill="none" :stroke="timerColor" stroke-width="6" stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="progressOffset" class="transition-all duration-300" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold font-mono" style="color: #0F1E3D;">{{ formattedTime }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider mt-0.5" :style="{ color: timerState === 'running' ? '#EF4444' : timerState === 'paused' ? '#F59E0B' : '#96A0B5' }">{{ timerStateLabel }}</span>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3 mb-4">
              <button v-if="timerState !== 'running'" @click="startTimer" class="px-6 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #10B981; color: #FFFFFF;" @mouseenter="$el.style.background='#059669'" @mouseleave="$el.style.background='#10B981'">Start</button>
              <button v-else @click="pauseTimer" class="px-6 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #F59E0B; color: #FFFFFF;" @mouseenter="$el.style.background='#D97706'" @mouseleave="$el.style.background='#F59E0B'">Pause</button>
              <button @click="resetTimer" class="w-9 h-9 rounded-xl flex items-center justify-center transition-all border-0 cursor-pointer" style="background: #EDEDED; color: #68758E;" @mouseenter="$el.style.background='#E2E6ED'" @mouseleave="$el.style.background='#EDEDED'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              </button>
            </div>
            <div class="flex gap-2 justify-center">
              <button v-for="p in presets" :key="p.label" @click="setDuration(p.minutes)" class="px-3 py-1.5 rounded-lg text-[11px] font-semibold border-0 cursor-pointer transition-all"
                :style="{ background: currentDuration === p.minutes ? (timerState === 'running' ? '#EF4444' : '#0F1E3D') : '#EDEDED', color: currentDuration === p.minutes ? '#FFFFFF' : '#68758E' }"
              >{{ p.label }}</button>
            </div>
          </div>

          <div class="rounded-2xl p-6 border" style="background: #FFFFFF; border-color: #E2E6ED;">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold" style="color: #0F1E3D;">Weekly Goals</h3>
              <span class="text-xs font-semibold" style="color: #96A0B5;">{{ completedGoals }}/{{ goals.length }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="g in goals" :key="g.id" class="flex items-center gap-2 py-1.5 group">
                <input type="checkbox" v-model="g.done" class="w-4 h-4 rounded border-2 appearance-none cursor-pointer shrink-0 transition-all"
                  :style="{ borderColor: g.done ? '#10B981' : '#D0D6E0', background: g.done ? '#10B981' : 'transparent' }"
                />
                <input v-if="editingGoalId === g.id" v-model="g.text" @blur="editingGoalId = null" @keydown.enter="editingGoalId = null"
                  class="flex-1 text-sm px-1 py-0.5 border rounded outline-none" style="border-color:#D0D6E0; color:#0F1E3D; background:transparent;"
                />
                <span v-else class="flex-1 text-sm transition-all cursor-pointer" :style="{ color: g.done ? '#B8C0D0' : '#0F1E3D', textDecoration: g.done ? 'line-through' : 'none' }"
                  @dblclick="editingGoalId = g.id">{{ g.text }}</span>
                <button @click="deleteGoal(g.id)" class="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded border-0 cursor-pointer" style="color:#EF4444; background:transparent;" title="Delete goal">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="flex items-center gap-2 pt-1">
                <input v-model="newGoalText" @keydown.enter="addGoal" placeholder="Add a goal..." class="flex-1 text-sm px-2 py-1 rounded border outline-none" style="border-color:#D0D6E0; color:#0F1E3D; background:transparent;" />
                <button @click="addGoal" class="px-3 py-1 rounded-lg text-[11px] font-semibold border-0 cursor-pointer" style="background:#0F1E3D; color:#FFFFFF;">Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import FlashcardGenerator from '../components/study/FlashcardGenerator.vue'
import QuizView from '../components/study/QuizView.vue'
import PodcastAudio from '../components/study/PodcastAudio.vue'
import StudyGroupManager from '../components/study/StudyGroupManager.vue'
import api from '../lib/api'

const router = useRouter()

const tabs = [
  { id: 'groups', label: 'Study Groups' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'resources', label: 'Resources' },
]
const activeTab = ref('flashcards')
const decks = ref([])

onMounted(async () => {
  await Promise.all([refreshFlashcardDecks(), loadGoals()])
})

onUnmounted(() => {
  if (interval) { clearInterval(interval); interval = null }
})

async function refreshFlashcardDecks() {
  try {
    const res = await api.get('/study-materials')
    decks.value = (res.data || []).map(m => ({
      id: m.id,
      title: m.title,
      flashcardCount: m.flashcardCount || 0,
    }))
  } catch (e) {
    console.warn('[StudyHub] Load decks failed:', e)
  }
}

function viewDeck(id) {
  router.push({ name: 'flashcard-review', params: { materialId: id } })
}

// Pomodoro Timer
const totalSeconds = ref(25 * 60)
const remainingSeconds = ref(25 * 60)
const timerState = ref('idle')
let interval = null
const presets = [{ label: '25m', minutes: 25 }, { label: '15m', minutes: 15 }, { label: '5m', minutes: 5 }]

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
const timerColor = computed(() => {
  if (timerState.value === 'running') return '#EF4444'
  if (timerState.value === 'paused') return '#F59E0B'
  return '#96A0B5'
})
const timerStateLabel = computed(() => {
  if (timerState.value === 'running') return 'FOCUSING'
  if (timerState.value === 'paused') return 'PAUSED'
  return 'READY'
})

function setDuration(minutes) { if (timerState.value === 'running') return; totalSeconds.value = minutes * 60; remainingSeconds.value = minutes * 60; timerState.value = 'idle' }

function savePomodoroSession() {
  const duration = currentDuration.value
  api.post('/pomodoro/sessions', { durationMinutes: duration }).catch(() => {})
}

function startTimer() {
  if (timerState.value === 'idle' || timerState.value === 'paused') {
    timerState.value = 'running'
    interval = setInterval(() => {
      remainingSeconds.value--
      if (remainingSeconds.value <= 0) {
        clearInterval(interval); interval = null; timerState.value = 'idle'
        savePomodoroSession()
      }
    }, 1000)
  }
}
function pauseTimer() { if (timerState.value === 'running') { clearInterval(interval); interval = null; timerState.value = 'paused' } }
function resetTimer() { clearInterval(interval); interval = null; remainingSeconds.value = totalSeconds.value; timerState.value = 'idle' }

// Weekly Goals
const goals = ref([])
const completedGoals = computed(() => goals.value.filter(g => g.done).length)
const newGoalText = ref('')
const editingGoalId = ref(null)

function addGoal() {
  const text = newGoalText.value.trim()
  if (!text) return
  goals.value.push({ id: crypto.randomUUID?.() || Date.now().toString(36), text, done: false })
  newGoalText.value = ''
}

function deleteGoal(id) {
  goals.value = goals.value.filter(g => g.id !== id)
}

async function loadGoals() {
  try {
    const { data } = await api.get('/pomodoro/goals')
    if (Array.isArray(data) && data.length > 0) {
      goals.value = data.map(g => ({ id: g.id, text: g.text, done: g.done }))
    }
  } catch { goals.value = [] }
}

async function saveGoals() {
  try {
    await api.post('/pomodoro/goals', { goals: goals.value.map(g => ({ id: g.id, text: g.text, done: g.done })) })
  } catch {}
}

// Watch goals for changes and persist
watch(goals, saveGoals, { deep: true })
</script>
