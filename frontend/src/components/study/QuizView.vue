<template>
  <div>
    <!-- PICKER: list saved quiz materials -->
    <div v-if="screen === 'picker'">
      <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
        <div v-for="m in materials" :key="m.id"
          @click="startQuiz(m)"
          class="rounded-2xl p-4 border transition-all cursor-pointer"
          style="background: #FFFFFF; border-color: #E2E6ED;"
          @mouseenter="$el.style.boxShadow='0 4px 16px rgba(0,0,0,0.06)'" @mouseleave="$el.style.boxShadow='none'"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background: #FEF3C7; color: #F59E0B;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate" style="color: #0F1E3D;">{{ m.title }}</p>
              <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                <span class="text-[11px] font-semibold" style="color: #96A0B5;">{{ m.quiz.length }} questions</span>
                <span v-if="m.bestScore != null" class="text-[11px] font-semibold" style="color: #10B981;">Best: {{ m.bestScore }}%</span>
                <span v-if="m.lastTaken" class="text-[11px]" style="color: #96A0B5;">Last: {{ m.lastTaken }}</span>
              </div>
            </div>
            <span class="text-xs font-semibold shrink-0" style="color: #F59E0B;">Start &rarr;</span>
          </div>
        </div>
      </div>

      <div v-if="materials.length === 0" class="text-center py-16">
        <p class="text-sm font-semibold" style="color: #96A0B5;">No quizzes yet</p>
        <p class="text-xs mt-1" style="color: #B8C0D0;">Upload a PDF or audio from the Flashcards tab — quizzes are generated automatically</p>
      </div>
    </div>

    <!-- QUIZ: one question at a time -->
    <div v-else-if="screen === 'quiz'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <button @click="confirmExit" class="text-xs font-semibold inline-flex items-center gap-1 border-0 bg-transparent cursor-pointer" style="color: #96A0B5;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            Quit
          </button>
          <h3 class="text-sm font-bold mt-1" style="color: #0F1E3D;">{{ activeMaterial.title }}</h3>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold" style="color: #96A0B5;">{{ currentIndex + 1 }} / {{ activeQuiz.length }}</span>
          <!-- progress dots -->
          <div class="flex gap-1">
            <span v-for="(q, i) in activeQuiz" :key="i" class="w-2 h-2 rounded-full transition-all"
              :style="{ background: q.selectedIndex !== undefined ? '#10B981' : (i === currentIndex ? '#F59E0B' : '#E2E6ED') }"
            ></span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border p-6" style="background: #FFFFFF; border-color: #E2E6ED;">
        <p class="text-sm font-bold mb-5" style="color: #0F1E3D;">{{ currentIndex + 1 }}. {{ currentQuestion.question }}</p>

        <div class="space-y-2.5">
          <div v-for="(opt, oi) in currentQuestion.options" :key="oi"
            @click="submitAnswer(oi)"
            class="flex items-center gap-3 p-3.5 rounded-xl text-sm cursor-pointer transition-all border"
            :style="{
              background: getOptionBg(oi),
              borderColor: getOptionBorder(oi),
              cursor: currentQuestion.selectedIndex !== undefined ? 'default' : 'pointer',
              opacity: currentQuestion.selectedIndex !== undefined && oi !== currentQuestion.selectedIndex && oi !== currentQuestion.answerIndex ? 0.6 : 1,
            }"
          >
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              :style="{
                borderColor: getOptionRadioBorder(oi),
                background: getOptionRadioBg(oi),
              }"
            >
              <span v-if="currentQuestion.selectedIndex !== undefined && oi === currentQuestion.answerIndex" class="text-white">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5L20 7"/></svg>
              </span>
              <span v-else-if="currentQuestion.selectedIndex === oi && oi !== currentQuestion.answerIndex" class="text-white">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </span>
            </span>
            <span :style="{ color: getOptionTextColor(oi) }">{{ opt }}</span>
          </div>
        </div>

        <div v-if="currentQuestion.selectedIndex !== undefined" class="mt-5 pt-4 border-t" style="border-color: #E2E6ED;">
          <p class="text-sm font-semibold" :style="{ color: currentQuestion.selectedIndex === currentQuestion.answerIndex ? '#10B981' : '#EF4444' }">
            {{ currentQuestion.selectedIndex === currentQuestion.answerIndex ? 'Correct!' : 'Wrong answer' }}
          </p>
          <p v-if="currentQuestion.explanation" class="text-xs mt-1 leading-relaxed" style="color: #68758E;">{{ currentQuestion.explanation }}</p>
          <button v-if="currentIndex < activeQuiz.length - 1" @click="nextQuestion"
            class="mt-4 px-5 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #0F1E3D; color: #FFFFFF;"
            @mouseenter="$el.style.background='#1A2D52'" @mouseleave="$el.style.background='#0F1E3D'"
          >Next question &rarr;</button>
          <button v-else @click="finishQuiz"
            class="mt-4 px-5 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #10B981; color: #FFFFFF;"
            @mouseenter="$el.style.background='#059669'" @mouseleave="$el.style.background='#10B981'"
          >See results</button>
        </div>
      </div>
    </div>

    <!-- SCORE SUMMARY -->
    <div v-else-if="screen === 'results'">
      <div class="rounded-2xl border p-8 text-center" style="background: #FFFFFF; border-color: #E2E6ED;">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" :style="{ background: scorePercent >= 70 ? '#F0FDF4' : scorePercent >= 40 ? '#FEF3C7' : '#FEF2F2' }">
          <span class="text-2xl font-bold" :style="{ color: scorePercent >= 70 ? '#10B981' : scorePercent >= 40 ? '#F59E0B' : '#EF4444' }">{{ scorePercent }}%</span>
        </div>
        <p class="text-sm font-bold" style="color: #0F1E3D;">{{ scoreLabel }}</p>
        <p class="text-xs mt-1" style="color: #96A0B5;">{{ correctCount }} of {{ activeQuiz.length }} correct</p>

        <div class="mt-6 flex items-center justify-center gap-3">
          <button @click="retakeQuiz" class="px-5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all" style="background: transparent; border-color: #D0D6E0; color: #0F1E3D;"
            @mouseenter="$el.style.borderColor='#68758E'" @mouseleave="$el.style.borderColor='#D0D6E0'"
          >Retake</button>
          <button @click="screen = 'picker'" class="px-5 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #0F1E3D; color: #FFFFFF;"
            @mouseenter="$el.style.background='#1A2D52'" @mouseleave="$el.style.background='#0F1E3D'"
          >Back to quizzes</button>
        </div>
      </div>

      <!-- missed questions -->
      <div v-if="missedQuestions.length > 0" class="mt-6">
        <h4 class="text-xs font-bold uppercase tracking-wider mb-3" style="color: #96A0B5;">Questions to review</h4>
        <div class="space-y-2">
          <div v-for="(q, i) in missedQuestions" :key="i" class="rounded-xl border p-4" style="background: #FFFFFF; border-color: #E2E6ED;">
            <p class="text-xs font-bold" style="color: #0F1E3D;">{{ q.question }}</p>
            <p class="text-[11px] mt-1" style="color: #10B981;">Correct answer: {{ q.options[q.answerIndex] }}</p>
            <p v-if="q.explanation" class="text-[11px] mt-0.5" style="color: #68758E;">{{ q.explanation }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../lib/api'

const screen = ref('picker')
const materials = ref([])
const activeMaterial = ref(null)
const activeQuiz = ref([])
const currentIndex = ref(0)
const correctCount = ref(0)
const sessionId = ref(null)

const currentQuestion = computed(() => activeQuiz.value[currentIndex.value] || {})
const missedQuestions = computed(() => activeQuiz.value.filter(q => q.selectedIndex !== undefined && q.selectedIndex !== q.answerIndex))
const scorePercent = computed(() => activeQuiz.value.length ? Math.round((correctCount.value / activeQuiz.value.length) * 100) : 0)
const scoreLabel = computed(() => {
  if (scorePercent.value >= 90) return 'Excellent!'
  if (scorePercent.value >= 70) return 'Great job!'
  if (scorePercent.value >= 50) return 'Good effort'
  if (scorePercent.value >= 30) return 'Keep practicing'
  return 'Review the material and try again'
})

onMounted(async () => {
  await loadMaterials()
})

async function loadMaterials() {
  try {
    const res = await api.get('/study-materials')
    const raw = res.data || []

    // load best scores from study_sessions
    let bestScores = {}
    try {
      const sRes = await api.get('/study-sessions')
      const sessions = sRes.data || []
      for (const s of sessions) {
        if (s.session_type === 'quiz') {
          const key = s.material_id
          const curr = bestScores[key]
          if (!curr || s.score > curr.score) {
            bestScores[key] = { score: s.score, lastTaken: s.created_at || s.started_at }
          }
        }
      }
    } catch (_) { /* ignore */ }

    materials.value = raw
      .filter(m => m.quiz && m.quiz.length > 0)
      .map(m => {
        const quiz = parseQuiz(m.quiz)
        return {
          id: m.id,
          title: m.title,
          quiz,
          bestScore: bestScores[m.id]?.score,
          lastTaken: bestScores[m.id]?.lastTaken
            ? new Date(bestScores[m.id].lastTaken).toLocaleDateString()
            : null,
        }
      })
  } catch (e) {
    console.warn('[QuizView] Load failed:', e)
  }
}

function parseQuiz(q) {
  if (!q) return []
  if (Array.isArray(q)) return q
  try { return JSON.parse(q) } catch { return [] }
}

function startQuiz(m) {
  activeMaterial.value = m
  activeQuiz.value = (m.quiz || []).map(q => ({ ...q, selectedIndex: undefined }))
  currentIndex.value = 0
  correctCount.value = 0
  sessionId.value = null
  screen.value = 'quiz'
}

function submitAnswer(oi) {
  const q = activeQuiz.value[currentIndex.value]
  if (q.selectedIndex !== undefined) return
  q.selectedIndex = oi
  if (oi === q.answerIndex) correctCount.value++
}

function nextQuestion() {
  if (currentIndex.value < activeQuiz.value.length - 1) currentIndex.value++
}

async function finishQuiz() {
  // save study session
  try {
    const res = await api.post('/study-sessions', {
      materialId: activeMaterial.value.id,
      sessionType: 'quiz',
      score: scorePercent.value,
      totalQuestions: activeQuiz.value.length,
      correctAnswers: correctCount.value,
      stats: {
        missed: missedQuestions.value.map(q => ({
          question: q.question,
          correctAnswer: q.options[q.answerIndex],
          explanation: q.explanation,
        })),
      },
      durationMinutes: 0,
    })
    sessionId.value = res.data?.id || null
  } catch (_) { /* non-critical */ }

  screen.value = 'results'
}

function retakeQuiz() {
  activeQuiz.value = (activeMaterial.value.quiz || []).map(q => ({ ...q, selectedIndex: undefined }))
  currentIndex.value = 0
  correctCount.value = 0
  sessionId.value = null
  screen.value = 'quiz'
}

function confirmExit() {
  if (activeQuiz.value.some(q => q.selectedIndex !== undefined)) {
    if (!confirm('Quit this quiz? Your progress will be lost.')) return
  }
  screen.value = 'picker'
}

// style helpers
function getOptionBg(oi) {
  const q = currentQuestion.value
  if (q.selectedIndex === undefined) return '#FFFFFF'
  if (oi === q.answerIndex) return '#F0FDF4'
  if (oi === q.selectedIndex && oi !== q.answerIndex) return '#FEF2F2'
  return '#FFFFFF'
}
function getOptionBorder(oi) {
  const q = currentQuestion.value
  if (q.selectedIndex === undefined) return '#E2E6ED'
  if (oi === q.answerIndex) return '#86EFAC'
  if (oi === q.selectedIndex && oi !== q.answerIndex) return '#FECACA'
  return '#E2E6ED'
}
function getOptionRadioBorder(oi) {
  const q = currentQuestion.value
  if (q.selectedIndex === undefined) return '#D0D6E0'
  if (oi === q.answerIndex) return '#10B981'
  if (oi === q.selectedIndex && oi !== q.answerIndex) return '#EF4444'
  return '#D0D6E0'
}
function getOptionRadioBg(oi) {
  const q = currentQuestion.value
  if (q.selectedIndex === undefined) return 'transparent'
  if (oi === q.answerIndex) return '#10B981'
  if (oi === q.selectedIndex && oi !== q.answerIndex) return '#EF4444'
  return 'transparent'
}
function getOptionTextColor(oi) {
  const q = currentQuestion.value
  if (q.selectedIndex === undefined) return '#0F1E3D'
  if (oi === q.answerIndex) return '#065F46'
  if (oi === q.selectedIndex && oi !== q.answerIndex) return '#991B1B'
  return '#0F1E3D'
}
</script>
