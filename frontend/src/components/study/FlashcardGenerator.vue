<template>
  <div>
    <!-- IDLE / UPLOAD -->
    <div v-if="state === 'idle'"
      class="upload-zone rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
      :class="{ 'dragging': isDragging }"
      style="border-color: #D0D6E0; background: transparent;"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#96A0B5" stroke-width="1.5" class="mx-auto mb-3">
        <path d="M12 3v12m0-12 4 4m-4-4-4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>
      </svg>
      <p class="text-sm font-semibold" style="color: #0F1E3D;">Drop a PDF or audio file, or click to browse</p>
      <p class="text-xs mt-1" style="color: #96A0B5;">We'll extract text and generate flashcards, quizzes, and more</p>
      <input ref="fileInput" type="file" accept=".pdf,.mp3,.wav,.m4a,.docx" class="hidden" @change="handleFile" />
      <div v-if="lastDeck" class="mt-4 pt-4 border-t" style="border-color: #E2E6ED;">
        <p class="text-xs font-semibold" style="color: #10B981;">Last generated: {{ lastDeck.title }}</p>
        <p class="text-xs" style="color: #96A0B5;">{{ lastDeck.cardCount }} flashcards &middot; {{ lastDeck.quizCount }} quiz questions</p>
      </div>
    </div>

    <!-- PROCESSING -->
    <div v-else-if="state === 'processing'" class="rounded-2xl border p-10 text-center" style="background: #FFFFFF; border-color: #E2E6ED;">
      <div class="w-10 h-10 mx-auto mb-3 rounded-full border-3 border-t-transparent animate-spin" style="border-color: #E2E6ED; border-top-color: #3B82F6;"></div>
      <p class="text-sm font-semibold" style="color: #0F1E3D;">{{ processingStep }}</p>
      <p class="text-xs font-mono mt-1" style="color: #96A0B5;">{{ fileName }}</p>
      <div class="flex justify-center gap-1 mt-3">
        <span v-for="i in 3" :key="i" class="w-2 h-2 rounded-full" :style="{ background: i <= stepIndex ? '#3B82F6' : '#E2E6ED', opacity: i <= stepIndex ? 1 : 0.4 }"></span>
      </div>
    </div>

    <!-- ERROR -->
    <div v-else-if="state === 'error'" class="rounded-2xl border p-10 text-center" style="background: #FFFFFF; border-color: #E2E6ED;">
      <p class="text-sm font-bold" style="color: #EF4444;">Couldn't generate flashcards</p>
      <p class="text-xs mt-1" style="color: #96A0B5;">{{ errorMessage }}</p>
      <button @click="reset" class="mt-4 px-5 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer btn-ghost" style="background: #EDEDED; color: #0F1E3D;">Try again</button>
    </div>

    <!-- STEP 1: FLASHCARD REVIEW (flip grid) -->
    <div v-else-if="state === 'review-flashcards'">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 class="text-sm font-bold" style="color: #0F1E3D;">{{ cards.length }} flashcards generated</h3>
          <p class="text-xs font-mono mt-0.5" style="color: #96A0B5;">{{ courseDisplay }} &middot; {{ fileName }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="reset" class="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer btn-ghost" style="background: #EDEDED; color: #68758E;">Discard</button>
          <button @click="goToQuizPreview" class="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #0F1E3D; color: #FFFFFF;"
            @mouseenter="$el.style.background='#1A2D52'" @mouseleave="$el.style.background='#0F1E3D'">
            Review quiz &rarr;
          </button>
        </div>
      </div>
      <p class="text-[11px] mb-3" style="color: #96A0B5;">Tap a card to flip it</p>
      <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
        <button v-for="(card, i) in cards" :key="i"
          @click="flipped[i] = !flipped[i]"
          class="card-btn rounded-xl border text-left cursor-pointer transition-all p-0 overflow-hidden"
          style="background: #FFFFFF; border-color: #E2E6ED; height: 150px; perspective: 1000px;"
        >
          <div class="relative w-full h-full transition-transform duration-500" style="transform-style: preserve-3d;"
            :style="{ transform: flipped[i] ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
          >
            <div class="absolute inset-0 p-4 flex flex-col gap-2" style="backface-visibility: hidden;">
              <span class="text-[10px] font-mono font-bold" style="color: #96A0B5;">Q{{ i + 1 }}</span>
              <p class="text-xs leading-relaxed" style="color: #0F1E3D;">{{ card.front || card.question }}</p>
            </div>
            <div class="absolute inset-0 p-4 flex flex-col gap-2" style="backface-visibility: hidden; transform: rotateY(180deg); background: #F0FDF4;">
              <span class="text-[10px] font-mono font-bold" style="color: #10B981;">Answer</span>
              <p class="text-xs leading-relaxed" style="color: #0F1E3D;">{{ card.back || card.answer }}</p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- STEP 2: QUIZ PREVIEW (sample questions before save) -->
    <div v-else-if="state === 'review-quiz'">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 class="text-sm font-bold" style="color: #0F1E3D;">{{ quiz.length }} quiz questions from the same material</h3>
          <p class="text-xs font-mono mt-0.5" style="color: #96A0B5;">Try a few sample questions before saving</p>
        </div>
        <div class="flex gap-2">
          <button @click="state = 'review-flashcards'" class="px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer btn-ghost" style="background: #EDEDED; color: #68758E;">&larr; Back to cards</button>
          <button @click="saveDeck" :disabled="saving" class="save-btn px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all" style="background: #0F1E3D; color: #FFFFFF;">
            {{ saving ? 'Saving…' : 'Save to library' }}
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <div v-for="(q, i) in quiz" :key="i" class="rounded-xl border p-4" style="background: #FFFFFF; border-color: #E2E6ED;">
          <p class="text-sm font-bold mb-3" style="color: #0F1E3D;">{{ i + 1 }}. {{ q.question }}</p>
          <div class="space-y-2">
            <label v-for="(opt, oi) in q.options" :key="oi"
              class="flex items-center gap-3 p-2.5 rounded-lg text-xs cursor-pointer transition-all border"
              :style="{
                background: q.selectedIndex === oi ? (oi === q.answerIndex ? '#F0FDF4' : '#FEF2F2') : '#FFFFFF',
                borderColor: q.selectedIndex === oi ? (oi === q.answerIndex ? '#86EFAC' : '#FECACA') : '#E2E6ED',
                cursor: q.selectedIndex !== undefined ? 'default' : 'pointer',
              }"
              @click="selectQuizAnswer(i, oi)"
            >
              <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                :style="{
                  borderColor: q.selectedIndex === oi ? (oi === q.answerIndex ? '#10B981' : '#EF4444') : '#D0D6E0',
                  background: q.selectedIndex === oi ? (oi === q.answerIndex ? '#10B981' : '#EF4444') : 'transparent',
                }"
              >
                <span v-if="q.selectedIndex === oi" class="text-white text-[8px] font-bold">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5L20 7"/></svg>
                </span>
              </span>
              <span :style="{ color: q.selectedIndex === oi ? (oi === q.answerIndex ? '#065F46' : '#991B1B') : '#0F1E3D' }">{{ opt }}</span>
            </label>
          </div>
          <p v-if="q.selectedIndex !== undefined" class="mt-2 text-[11px] leading-relaxed" :style="{ color: q.selectedIndex === q.answerIndex ? '#10B981' : '#EF4444' }">
            {{ q.selectedIndex === q.answerIndex ? 'Correct!' : 'The correct answer was: ' + q.options[q.answerIndex] }}
          </p>
        </div>
      </div>
    </div>

    <!-- SAVED CONFIRMATION -->
    <div v-if="state === 'saved'" class="rounded-2xl border p-8 text-center" style="background: #F0FDF4; border-color: #86EFAC;">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" class="mx-auto mb-2"><path d="m5 12 5 5L20 7"/></svg>
      <p class="text-sm font-bold" style="color:#065F46;">Saved to your study library!</p>
      <p class="text-xs mt-1" style="color:#6EE7B7;">{{ savedTitle }} &middot; {{ cards.length }} flashcards &middot; {{ quiz.length }} quiz questions</p>
      <button @click="reset" class="mt-4 px-5 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer btn-green" style="background: #10B981; color: #FFFFFF;">Generate another</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../../lib/api'

const emit = defineEmits(['saved'])

const state = ref('idle')
const isDragging = ref(false)
const fileInput = ref(null)
const fileName = ref('')
const courseDisplay = ref('')
const cards = ref([])
const quiz = ref([])
const flipped = ref([])
const saving = ref(false)
const errorMessage = ref('')
const processingStep = ref('')
const stepIndex = ref(0)
const savedTitle = ref('')
const lastDeck = ref(null)

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
}

async function processFile(file) {
  fileName.value = file.name
  state.value = 'processing'
  errorMessage.value = ''
  stepIndex.value = 0

  const steps = ['Uploading…', 'Extracting text…', 'Generating flashcards…']
  processingStep.value = steps[0]
  const stepTimer = setInterval(() => {
    stepIndex.value = Math.min(stepIndex.value + 1, steps.length - 1)
    processingStep.value = steps[stepIndex.value]
  }, 1500)

  try {
    const formData = new FormData()
    const ext = file.name.split('.').pop().toLowerCase()
    if (['mp3', 'wav', 'm4a'].includes(ext)) {
      formData.append('audio', file)
    } else if (ext === 'pdf') {
      formData.append('pdf', file)
    } else {
      formData.append('document', file)
    }
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
    formData.append('flashcardCount', '15')
    formData.append('quizCount', '8')
    formData.append('keyPointCount', '6')

    const res = await api.post('/study-materials/upload', formData, {
      timeout: 120000,
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const data = res.data
    cards.value = data.flashcards || []
    quiz.value = (data.quiz || []).map(q => ({ ...q, selectedIndex: undefined }))
    flipped.value = new Array(cards.value.length).fill(false)
    courseDisplay.value = data.courseId || 'General'
    savedTitle.value = data.title || fileName.value
    state.value = 'review-flashcards'
  } catch (err) {
    errorMessage.value = err.response?.data?.error || err.message || 'Something went wrong.'
    state.value = 'error'
  } finally {
    clearInterval(stepTimer)
  }
}

function selectQuizAnswer(qi, oi) {
  if (quiz.value[qi].selectedIndex !== undefined) return
  quiz.value[qi].selectedIndex = oi
}

function goToQuizPreview() {
  state.value = 'review-quiz'
}

async function saveDeck() {
  saving.value = true
  try {
    await api.post('/study-materials/save-deck', {
      title: savedTitle.value,
      sourceText: `Generated from ${fileName.value}`,
      flashcards: cards.value,
      quiz: quiz.value.map(q => ({ question: q.question, options: q.options, answerIndex: q.answerIndex, explanation: q.explanation || '' })),
    })
    lastDeck.value = { title: savedTitle.value, cardCount: cards.value.length, quizCount: quiz.value.length }
    state.value = 'saved'
    emit('saved')
  } catch (err) {
    state.value = 'review-quiz'
    errorMessage.value = err.response?.data?.error || err.message
  } finally {
    saving.value = false
  }
}

function reset() {
  state.value = 'idle'
  cards.value = []
  quiz.value = []
  flipped.value = []
  fileName.value = ''
  errorMessage.value = ''
}
</script>

<style scoped>
.hidden { display: none; }
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 800ms linear infinite;
}
.upload-zone:hover {
  border-color: #3B82F6 !important;
}
.upload-zone:hover svg {
  stroke: #3B82F6;
}
.upload-zone.dragging {
  border-color: #3B82F6;
  background: rgba(59, 130, 246, 0.05);
}
.save-btn:hover:not(:disabled) {
  background: #1A2D52 !important;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-ghost:hover {
  background: #E2E6ED !important;
}
.btn-green:hover {
  background: #059669 !important;
}
.card-btn:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
</style>
