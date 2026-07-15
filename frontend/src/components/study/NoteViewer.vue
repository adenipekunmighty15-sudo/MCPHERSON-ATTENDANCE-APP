<template>
  <Teleport to="body">
    <div class="viewer-overlay" @click.self="$emit('close')">
      <div class="viewer-panel card card-hover">
        <div class="viewer-header">
          <button class="back-btn" @click="$emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div class="viewer-title-area">
            <h2 class="viewer-title">{{ note?.title || 'Loading...' }}</h2>
            <span v-if="note" class="viewer-meta">{{ formatDate(note.createdAt) }}</span>
          </div>
          <div class="viewer-actions">
            <button class="action-btn" :class="{ active: showChat }" @click="showChat = !showChat" title="AI Chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="action-btn" @click="$emit('close')" title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div v-if="loading" class="viewer-loading">
          <div class="gen-spinner-lg"></div>
          <p>Loading note...</p>
        </div>

        <div v-else-if="note" class="viewer-body" :class="{ 'with-chat': showChat }">
          <div class="viewer-content">
            <div class="content-actions">
              <button class="content-action" :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">Notes</button>
              <button class="content-action" :class="{ active: activeTab === 'summary' }" @click="activeTab = 'summary'">Summary</button>
              <button class="content-action" :class="{ active: activeTab === 'keypoints' }" @click="activeTab = 'keypoints'">Key Points</button>
              <button class="content-action" :class="{ active: activeTab === 'flashcards' }" @click="activeTab = 'flashcards'">
                Flashcards <span v-if="flashcards.length" class="tab-count">{{ flashcards.length }}</span>
              </button>
              <button class="content-action" :class="{ active: activeTab === 'quiz' }" @click="activeTab = 'quiz'">
                Quiz <span v-if="quizLen" class="tab-count">{{ quizLen }}</span>
              </button>
              <button class="content-action" :class="{ active: activeTab === 'podcast' }" @click="activeTab = 'podcast'">Podcast</button>
            </div>

            <!-- Notes Tab -->
            <div v-if="activeTab === 'notes'" class="tab-content">
              <div class="markdown-body" v-html="renderMarkdown(studyNote)"></div>
            </div>

            <!-- Summary Tab -->
            <div v-if="activeTab === 'summary'" class="tab-content">
              <div class="markdown-body" v-html="renderMarkdown(note.summary)"></div>
            </div>

            <!-- Key Points Tab -->
            <div v-if="activeTab === 'keypoints'" class="tab-content">
              <div v-for="kp in keyPoints" :key="kp.id" class="keypoint-item">
                <span class="keypoint-num">{{ kp.id }}</span>
                <span class="keypoint-text">{{ kp.text }}</span>
              </div>
              <div v-if="!keyPoints.length" class="empty-tab">No key points available</div>
            </div>

            <!-- Flashcards Tab -->
            <div v-if="activeTab === 'flashcards'" class="tab-content">
              <div v-if="!flashcards.length" class="empty-tab">
                <p style="margin-bottom: 12px;">No flashcards available</p>
                <button class="primary-btn" @click="generateFlashcards" :disabled="fcLoading">
                  {{ fcLoading ? 'Generating...' : 'Generate Enhanced Flashcards' }}
                </button>
              </div>
              <div v-else class="flashcard-area">
                <div class="fc-header">
                  <span class="fc-counter">{{ fcIndex + 1 }} / {{ flashcards.length }}</span>
                  <button class="fc-shuffle" @click="shuffleFlashcards">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
                    Shuffle
                  </button>
                </div>
                <div class="fc-card-wrapper">
                  <div class="fc-card" :class="{ flipped: fcFlipped }" @click="fcFlipped = !fcFlipped">
                    <div class="fc-face fc-front">
                      <span class="fc-label">Question</span>
                      <p class="fc-text">{{ flashcards[fcIndex]?.front }}</p>
                      <span class="fc-hint">Click to reveal answer</span>
                    </div>
                    <div class="fc-face fc-back">
                      <span class="fc-label">Answer</span>
                      <p class="fc-text">{{ flashcards[fcIndex]?.back }}</p>
                      <span class="fc-hint">Click to see question</span>
                    </div>
                  </div>
                </div>
                <div class="fc-nav">
                  <button class="fc-nav-btn" :disabled="fcIndex === 0" @click="fcIndex--; fcFlipped = false">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
                    Prev
                  </button>
                  <button class="fc-nav-btn primary" @click="rateCard(3)">Good</button>
                  <button class="fc-nav-btn" @click="rateCard(1)">Hard</button>
                  <button class="fc-nav-btn" :disabled="fcIndex >= flashcards.length - 1" @click="fcIndex++; fcFlipped = false">
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Quiz Tab -->
            <div v-if="activeTab === 'quiz'" class="tab-content">
              <div v-if="!quizLen" class="empty-tab">No quiz questions available</div>
              <div v-else-if="!quizStarted" class="quiz-start">
                <h3>Quiz Yourself</h3>
                <p>{{ quizLen }} questions ready</p>
                <button class="primary-btn" @click="startQuiz">Start Quiz</button>
              </div>
              <div v-else-if="!quizFinished" class="quiz-area">
                <div class="quiz-progress"><div class="quiz-bar" :style="{ width: ((quizIndex + 1) / quizQuestions.length * 100) + '%' }"></div></div>
                <div class="quiz-question">
                  <span class="quiz-qnum">Q{{ quizIndex + 1 }}</span>
                  <p class="quiz-qtext">{{ quizQuestions[quizIndex]?.question }}</p>
                  <div class="quiz-options">
                    <button v-for="(opt, i) in quizQuestions[quizIndex]?.options" :key="i" class="quiz-option"
                      :class="{ selected: quizSelected === i, correct: quizRevealed && i === quizQuestions[quizIndex].answerIndex, wrong: quizRevealed && quizSelected === i && i !== quizQuestions[quizIndex].answerIndex }"
                      @click="selectOption(i)">
                      <span class="quiz-opt-letter">{{ ['A','B','C','D'][i] }}</span>
                      <span class="quiz-opt-text">{{ opt }}</span>
                    </button>
                  </div>
                  <div v-if="quizRevealed" class="quiz-explanation">
                    <strong>{{ quizSelected === quizQuestions[quizIndex].answerIndex ? 'Correct!' : 'Incorrect.' }}</strong>
                    {{ quizQuestions[quizIndex]?.explanation }}
                  </div>
                  <button v-if="quizRevealed" class="primary-btn" @click="nextQuestion">
                    {{ quizIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results' }}
                  </button>
                </div>
              </div>
              <div v-else class="quiz-results">
                <div class="quiz-score-circle" :class="{ perfect: quizCorrect === quizQuestions.length }">
                  <span class="quiz-score-num">{{ Math.round(quizCorrect / quizQuestions.length * 100) }}%</span>
                </div>
                <h3>Quiz Complete!</h3>
                <p>{{ quizCorrect }}/{{ quizQuestions.length }} correct</p>
                <button class="primary-btn" @click="resetQuiz">Try Again</button>
              </div>
            </div>

            <!-- Podcast Tab -->
            <div v-if="activeTab === 'podcast'" class="tab-content">
              <div class="podcast-area">
                <div v-if="podcastLoading" class="podcast-loading">
                  <div class="gen-spinner-lg"></div>
                  <p>Generating podcast...</p>
                </div>
                <div v-else-if="note.podcastUrl" class="podcast-player">
                  <audio :src="note.podcastUrl" controls class="podcast-audio"></audio>
                </div>
                <div v-else class="podcast-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-tertiary)"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></svg>
                  <p>Generate an AI podcast from this note</p>
                  <button class="primary-btn" @click="generatePodcast">Generate Podcast</button>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Chat Panel -->
          <div v-if="showChat" class="chat-panel">
            <div class="chat-header">
              <span class="chat-title">AI Assistant</span>
              <button class="close-chat" @click="showChat = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="chat-messages" ref="chatRef">
              <div v-if="!chatHistory.length" class="chat-welcome">
                <p>Ask me anything about this note.</p>
                <div class="chat-prompts">
                  <button v-for="p in quickPrompts" :key="p" class="prompt-chip" @click="sendChat(p)">{{ p }}</button>
                </div>
              </div>
              <div v-for="(msg, i) in chatHistory" :key="i" class="chat-msg" :class="'chat-' + msg.role">
                <div class="chat-bubble">{{ msg.content }}</div>
              </div>
              <div v-if="chatLoading" class="chat-msg chat-assistant">
                <div class="chat-bubble typing-indicator"><span></span><span></span><span></span></div>
              </div>
            </div>
            <div class="chat-input-area">
              <div class="chat-input-row">
                <input v-model="chatInput" class="chat-input" placeholder="Ask about this note..."
                  @keydown.enter="sendChat(chatInput)" />
                <button class="send-btn" @click="sendChat(chatInput)" :disabled="!chatInput.trim() || chatLoading">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import api from '../../lib/api'

const props = defineProps({ noteId: String })
const emit = defineEmits(['close'])

const note = ref(null)
const loading = ref(true)
const showChat = ref(false)
const activeTab = ref('notes')
const chatInput = ref('')
const chatHistory = ref([])
const chatLoading = ref(false)
const chatRef = ref(null)
const podcastLoading = ref(false)

const flashcards = ref([])
const fcIndex = ref(0)
const fcFlipped = ref(false)
const fcLoading = ref(false)

const quizStarted = ref(false)
const quizIndex = ref(0)
const quizSelected = ref(null)
const quizRevealed = ref(false)
const quizCorrect = ref(0)
const quizFinished = ref(false)
const quizQuestions = ref([])

const quickPrompts = ['Summarize this', 'Key takeaways', 'Quiz me', 'Explain deeper']

const studyNote = computed(() => {
  const improved = note.value?.improvedNote
  if (typeof improved === 'string' && improved.trim()) return improved
  if (improved && typeof improved === 'object') return JSON.stringify(improved, null, 2)
  return note.value?.sourceText || note.value?.summary || ''
})

const keyPoints = computed(() => {
  try {
    const kp = note.value?.keyPoints
    if (Array.isArray(kp)) return kp
    if (typeof kp === 'string') return JSON.parse(kp)
  } catch { return [] }
  return []
})

const quizLen = computed(() => {
  const q = note.value?.quiz
  if (Array.isArray(q)) return q.length
  if (typeof q === 'string') { try { return JSON.parse(q).length } catch { return 0 } }
  return 0
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderMarkdown(text) {
  if (!text) return ''
  return escapeHtml(text)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

function shuffleFlashcards() {
  flashcards.value = [...flashcards.value].sort(() => Math.random() - 0.5)
  fcIndex.value = 0
  fcFlipped.value = false
}

function rateCard(quality) {
  const currentCard = flashcards.value[fcIndex.value]
  if (fcIndex.value < flashcards.value.length - 1) {
    fcIndex.value++
    fcFlipped.value = false
  }
  api.post(`/study-materials/${props.noteId}/flashcards/review`, {
    flashcardId: currentCard?.id, quality
  }).catch(() => {})
}

function startQuiz() {
  let q = note.value?.quiz
  if (typeof q === 'string') { try { q = JSON.parse(q) } catch { q = [] } }
  quizQuestions.value = [...(q || [])].sort(() => Math.random() - 0.5)
  quizStarted.value = true
  quizIndex.value = 0
  quizCorrect.value = 0
  quizFinished.value = false
}

function selectOption(i) {
  if (quizRevealed.value) return
  quizSelected.value = i
  quizRevealed.value = true
  if (i === quizQuestions.value[quizIndex.value].answerIndex) quizCorrect.value++
}

function nextQuestion() {
  if (quizIndex.value < quizQuestions.value.length - 1) {
    quizIndex.value++
    quizSelected.value = null
    quizRevealed.value = false
  } else {
    quizFinished.value = true
    api.post('/study-sessions', {
      materialId: props.noteId, sessionType: 'quiz',
      score: Math.round(quizCorrect.value / quizQuestions.value.length * 100),
      totalQuestions: quizQuestions.value.length, correctAnswers: quizCorrect.value,
    }).catch(() => {})
  }
}

function resetQuiz() {
  quizStarted.value = false
  quizFinished.value = false
  quizIndex.value = 0
  quizSelected.value = null
  quizRevealed.value = false
  quizCorrect.value = 0
}

async function generatePodcast() {
  podcastLoading.value = true
  try {
    const { data } = await api.post(`/study-materials/${props.noteId}/podcast`)
    if (data.url) note.value.podcastUrl = data.url
  } catch {}
  podcastLoading.value = false
}

async function generateFlashcards() {
  fcLoading.value = true
  try {
    const { data } = await api.post(`/study-materials/${props.noteId}/enhanced-flashcards`)
    if (data.flashcards) {
      flashcards.value = typeof data.flashcards === 'string' ? JSON.parse(data.flashcards) : data.flashcards
    }
  } catch {}
  fcLoading.value = false
}

async function sendChat(msg) {
  if (!msg?.trim() || chatLoading.value) return
  chatInput.value = ''
  chatHistory.value.push({ role: 'user', content: msg })
  chatLoading.value = true
  await nextTick()
  if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight

  try {
    const { data } = await api.post(`/study-materials/${props.noteId}/chat`, {
      message: msg, history: chatHistory.value.slice(-10),
    })
    if (data.response) chatHistory.value.push({ role: 'assistant', content: data.response })
  } catch {
    chatHistory.value.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' })
  }
  chatLoading.value = false
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/study-materials/${props.noteId}`)
    note.value = data
    try {
      flashcards.value = typeof data.flashcards === 'string' ? JSON.parse(data.flashcards) : (data.flashcards || [])
    } catch { flashcards.value = [] }
    try {
      chatHistory.value = typeof data.chatHistory === 'string' ? JSON.parse(data.chatHistory) : (data.chatHistory || [])
    } catch { chatHistory.value = [] }
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.viewer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px); z-index: 9000; display: flex; justify-content: flex-end;
}
.viewer-panel {
  width: 100%; max-width: 900px; height: 100vh; display: flex; flex-direction: column;
  border-radius: 18px 0 0 18px; background: var(--color-surface);
  border: 1px solid var(--color-border); box-shadow: -8px 0 40px rgba(0,0,0,0.15); overflow: hidden;
}
.viewer-header {
  display: flex; align-items: center; gap: 12px; padding: 16px 20px;
  border-bottom: 1px solid var(--color-border); flex-shrink: 0;
}
.back-btn { background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; padding: 4px; border-radius: 6px; }
.back-btn:hover { background: var(--color-primary-soft); }
.viewer-title-area { flex: 1; min-width: 0; }
.viewer-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.viewer-meta { font-size: 11px; color: var(--color-text-tertiary); }
.viewer-actions { display: flex; gap: 4px; }
.action-btn {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--color-border); border-radius: 8px;
  color: var(--color-text-tertiary); cursor: pointer; transition: all 0.15s;
}
.action-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.action-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.viewer-loading { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--color-text-tertiary); }
.gen-spinner-lg { width: 36px; height: 36px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.viewer-body { flex: 1; display: flex; overflow: hidden; }
.viewer-content { flex: 1; overflow-y: auto; padding: 20px; }

.content-actions { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
.content-action {
  padding: 8px 14px; background: var(--color-surface-elevated); border: 1px solid var(--color-border);
  border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px;
}
.content-action:hover { border-color: var(--color-border-strong); }
.content-action.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.tab-count { font-size: 10px; background: rgba(255,255,255,0.2); padding: 1px 5px; border-radius: 4px; }

.tab-content { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.empty-tab { text-align: center; padding: 40px; color: var(--color-text-tertiary); font-size: 13px; }

.markdown-body { font-size: 14px; line-height: 1.7; color: var(--color-text-secondary); }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) { color: var(--color-text-primary); font-weight: 700; margin: 16px 0 8px; }
.markdown-body :deep(h1) { font-size: 20px; }
.markdown-body :deep(h2) { font-size: 17px; }
.markdown-body :deep(h3) { font-size: 15px; }
.markdown-body :deep(strong) { color: var(--color-text-primary); }
.markdown-body :deep(li) { margin-left: 20px; margin-bottom: 4px; }
.markdown-body :deep(pre) { background: var(--color-surface-elevated); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
.markdown-body :deep(code) { background: var(--color-surface-elevated); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

.keypoint-item { display: flex; gap: 12px; padding: 12px; border-radius: 10px; background: var(--color-surface-elevated); border: 1px solid var(--color-border); margin-bottom: 8px; transition: transform 0.15s; }
.keypoint-item:hover { transform: translateX(4px); }
.keypoint-num { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 700; border-radius: 8px; flex-shrink: 0; }
.keypoint-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; padding-top: 3px; }

.flashcard-area { text-align: center; }
.fc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.fc-counter { font-size: 13px; font-weight: 600; color: var(--color-text-tertiary); }
.fc-shuffle { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: none; border: 1px solid var(--color-border); border-radius: 8px; font-size: 12px; color: var(--color-text-secondary); cursor: pointer; }
.fc-shuffle:hover { background: var(--color-primary-soft); }
.fc-card-wrapper { perspective: 1000px; margin-bottom: 16px; }
.fc-card { width: 100%; max-width: 480px; height: 280px; margin: 0 auto; position: relative; cursor: pointer; transform-style: preserve-3d; transition: transform 0.5s ease; }
.fc-card.flipped { transform: rotateY(180deg); }
.fc-face { position: absolute; inset: 0; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; backface-visibility: hidden; }
.fc-front { background: linear-gradient(135deg, var(--color-surface-elevated), var(--color-surface)); border: 2px solid var(--color-border); }
.fc-back { background: var(--color-primary); color: #fff; transform: rotateY(180deg); }
.fc-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; margin-bottom: 12px; }
.fc-text { font-size: 16px; font-weight: 600; line-height: 1.5; text-align: center; }
.fc-hint { font-size: 11px; opacity: 0.4; margin-top: 16px; }
.fc-nav { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.fc-nav-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--color-surface-elevated); border: 1px solid var(--color-border);
  border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); cursor: pointer;
}
.fc-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.fc-nav-btn:hover:not(:disabled) { background: var(--color-primary-soft); }
.fc-nav-btn.primary { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.quiz-start { text-align: center; padding: 40px 0; }
.quiz-start h3 { font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; }
.quiz-start p { font-size: 13px; color: var(--color-text-tertiary); margin-bottom: 20px; }
.primary-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
  background: var(--color-primary); color: #fff; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.primary-btn:hover { opacity: 0.9; }
.quiz-progress { height: 4px; background: var(--color-border); border-radius: 2px; margin-bottom: 20px; overflow: hidden; }
.quiz-bar { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.3s; }
.quiz-question { max-width: 500px; margin: 0 auto; }
.quiz-qnum { display: inline-block; font-size: 11px; font-weight: 700; color: var(--color-primary); background: var(--color-primary-soft); padding: 3px 8px; border-radius: 6px; margin-bottom: 10px; }
.quiz-qtext { font-size: 16px; font-weight: 600; color: var(--color-text-primary); line-height: 1.5; margin-bottom: 16px; }
.quiz-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.quiz-option {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  background: var(--color-surface-elevated); border: 2px solid var(--color-border);
  border-radius: 12px; cursor: pointer; transition: all 0.15s; text-align: left;
}
.quiz-option:hover:not(.correct):not(.wrong) { border-color: var(--color-border-strong); }
.quiz-option.selected { border-color: var(--color-primary); background: var(--color-primary-soft); }
.quiz-option.correct { border-color: var(--color-success); background: var(--color-success-soft); }
.quiz-option.wrong { border-color: var(--color-error); background: var(--color-error-soft); }
.quiz-opt-letter { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 12px; font-weight: 700; background: var(--color-border); color: var(--color-text-secondary); flex-shrink: 0; }
.quiz-opt-text { font-size: 13px; color: var(--color-text-secondary); }
.quiz-explanation { padding: 12px 16px; background: var(--color-info-soft); border-radius: 10px; margin-bottom: 12px; font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
.quiz-results { text-align: center; padding: 20px 0; }
.quiz-score-circle { width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.quiz-score-circle.perfect { background: var(--color-success); }
.quiz-score-num { font-size: 20px; font-weight: 800; }

.podcast-area { text-align: center; padding: 40px 0; }
.podcast-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--color-text-tertiary); }
.podcast-audio { width: 100%; max-width: 400px; }
.podcast-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--color-text-tertiary); }

.chat-panel { width: 320px; border-left: 1px solid var(--color-border); display: flex; flex-direction: column; flex-shrink: 0; }
.chat-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
.chat-title { font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
.close-chat { background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; padding: 4px; }
.chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.chat-welcome { padding: 20px; text-align: center; color: var(--color-text-tertiary); font-size: 13px; }
.chat-prompts { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-top: 10px; }
.prompt-chip { padding: 6px 12px; background: var(--color-primary-soft); border: 1px solid var(--color-border); border-radius: 6px; font-size: 11px; font-weight: 600; color: var(--color-text-secondary); cursor: pointer; }
.prompt-chip:hover { background: var(--color-primary-muted); }
.chat-msg { display: flex; }
.chat-user { justify-content: flex-end; }
.chat-assistant { justify-content: flex-start; }
.chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 12px; line-height: 1.5; white-space: pre-wrap; }
.chat-user .chat-bubble { background: var(--color-primary); color: #fff; border-bottom-right-radius: 4px; }
.chat-assistant .chat-bubble { background: var(--color-surface-elevated); color: var(--color-text-secondary); border-bottom-left-radius: 4px; border: 1px solid var(--color-border); }
.typing-indicator { display: flex; gap: 4px; padding: 12px 16px; }
.typing-indicator span { width: 6px; height: 6px; background: var(--color-text-tertiary); border-radius: 50%; animation: typingBounce 1.2s infinite; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
.chat-input-area { padding: 12px; border-top: 1px solid var(--color-border); }
.chat-input-row { display: flex; gap: 6px; }
.chat-input {
  flex: 1; padding: 8px 12px; background: var(--color-surface-elevated);
  border: 1px solid var(--color-border); border-radius: 8px; font-size: 12px;
  color: var(--color-text-primary); outline: none;
}
.chat-input:focus { border-color: var(--color-border-accent); }
.send-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: var(--color-primary); color: #fff; border: none; border-radius: 8px; cursor: pointer; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .viewer-panel { max-width: 100%; border-radius: 0; }
  .chat-panel { position: fixed; inset: 0; width: 100%; z-index: 1; background: var(--color-surface); }
}
</style>
