<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal card card-hover">
        <div v-if="step === 1">
          <div class="modal-header">
            <h2 class="modal-title">Create New Note</h2>
            <button class="close-btn" @click="$emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="input-types">
            <button class="input-type-card" :class="{ selected: inputType === 'blank' }" @click="inputType = 'blank'">
              <div class="it-icon" style="background:rgba(59,130,246,0.1);color:#3B82F6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              </div>
              <span class="it-label">Blank Document</span>
              <span class="it-desc">Start from scratch</span>
            </button>
            <button class="input-type-card" :class="{ selected: inputType === 'record' }" @click="inputType = 'record'">
              <div class="it-icon" style="background:rgba(239,68,68,0.1);color:#EF4444">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></svg>
              </div>
              <span class="it-label">Record Audio</span>
              <span class="it-desc">Record a lecture</span>
            </button>
            <button class="input-type-card" :class="{ selected: inputType === 'upload' }" @click="inputType = 'upload'">
              <div class="it-icon" style="background:rgba(139,92,246,0.1);color:#8B5CF6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <span class="it-label">Upload Document</span>
              <span class="it-desc">PDF, DOCX, TXT</span>
            </button>
            <button class="input-type-card" :class="{ selected: inputType === 'url' }" @click="inputType = 'url'">
              <div class="it-icon" style="background:rgba(234,88,12,0.1);color:#EA580C">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <span class="it-label">Paste URL</span>
              <span class="it-desc">YouTube or website</span>
            </button>
          </div>

          <div class="content-input-area">
            <div v-if="inputType === 'blank' || inputType === 'url'" class="form-group">
              <label class="form-label">Title (optional)</label>
              <input v-model="title" class="form-input" placeholder="e.g. Machine Learning Lecture 5" />
            </div>
            <div v-if="inputType === 'blank'" class="form-group">
              <label class="form-label">Paste your content</label>
              <textarea v-model="sourceText" class="form-textarea" rows="8" placeholder="Paste lecture notes, textbook content, or any text here..."></textarea>
            </div>
            <div v-if="inputType === 'url'" class="form-group">
              <label class="form-label">URL</label>
              <input v-model="youtubeUrl" class="form-input" placeholder="https://youtube.com/watch?v=... or any URL" />
            </div>
            <div v-if="inputType === 'upload'" class="form-group">
              <div class="upload-zone" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-tertiary)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span class="upload-text">Drop files here or click to browse</span>
                <span class="upload-hint">PDF, DOCX, TXT, MP3, WAV</span>
              </div>
              <input ref="fileInput" type="file" accept=".pdf,.docx,.doc,.txt,.mp3,.wav,.m4a,.webm" style="display:none" @change="onFileSelect" multiple />
              <div v-if="uploadedFiles.length" class="file-list">
                <div v-for="(f, i) in uploadedFiles" :key="i" class="file-item">
                  <span class="file-name">{{ f.name }}</span>
                  <span class="file-size">{{ (f.size / 1024).toFixed(0) }}KB</span>
                  <button class="file-remove" @click="uploadedFiles.splice(i, 1)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div v-if="inputType === 'record'" class="form-group">
              <div class="recorder-area">
                <div class="recorder-wave">
                  <div v-for="n in 32" :key="n" class="wave-bar" :style="{ height: recording ? (Math.random() * 30 + 10) + 'px' : '4px' }"></div>
                </div>
                <div class="recorder-controls">
                  <button v-if="!recording" class="record-btn" @click="startRecording">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
                    Start Recording
                  </button>
                  <button v-else class="record-btn recording-active" @click="stopRecording">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    {{ formatTime(recordTime) }} — Stop
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="config-row">
            <div class="config-item">
              <label class="config-label">Flashcards</label>
              <input v-model.number="flashcardCount" type="range" min="5" max="50" class="config-slider" />
              <span class="config-value">{{ flashcardCount }}</span>
            </div>
            <div class="config-item">
              <label class="config-label">Quiz Questions</label>
              <input v-model.number="quizCount" type="range" min="3" max="30" class="config-slider" />
              <span class="config-value">{{ quizCount }}</span>
            </div>
          </div>

          <button class="generate-btn" :disabled="!canGenerate || generating" @click="generate">
            <span v-if="generating" class="gen-spinner"></span>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            {{ generating ? 'Generating Study Pack...' : 'Generate Study Pack' }}
          </button>
        </div>

        <div v-if="step === 2" class="generating-step">
          <div class="gen-animation">
            <div class="gen-ring"></div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary)"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h3 class="gen-title">AI is crafting your study pack...</h3>
          <p class="gen-desc">Analyzing content, generating flashcards, quizzes, and summaries</p>
          <div class="gen-progress"><div class="gen-progress-bar" :style="{ width: genProgress + '%' }"></div></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import api from '../../lib/api'

const emit = defineEmits(['close', 'created'])

const step = ref(1)
const inputType = ref('blank')
const title = ref('')
const sourceText = ref('')
const youtubeUrl = ref('')
const uploadedFiles = ref([])
const flashcardCount = ref(12)
const quizCount = ref(8)
const generating = ref(false)
const genProgress = ref(0)
const recording = ref(false)
const recordTime = ref(0)
const recordedAudio = ref(null)
const fileInput = ref(null)
let recordInterval = null
let mediaRecorder = null
let recordedChunks = []

const canGenerate = computed(() => {
  if (generating.value) return false
  if (inputType.value === 'blank') return sourceText.value.trim().length >= 50
  if (inputType.value === 'url') return youtubeUrl.value.trim().length > 0
  if (inputType.value === 'upload') return uploadedFiles.value.length > 0
  if (inputType.value === 'record') return !!recordedAudio.value && !recording.value
  return false
})

function triggerFileInput() { fileInput.value?.click() }
function onFileSelect(e) { uploadedFiles.value.push(...Array.from(e.target.files)) }
function onDrop(e) { uploadedFiles.value.push(...Array.from(e.dataTransfer.files)) }

function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    alert('Audio recording is not supported in this browser')
    return
  }

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    recordedChunks = []
    recordedAudio.value = null
    mediaRecorder = new window.MediaRecorder(stream)
    mediaRecorder.addEventListener('dataavailable', e => {
      if (e.data?.size) recordedChunks.push(e.data)
    })
    mediaRecorder.addEventListener('stop', () => {
      const type = recordedChunks[0]?.type || 'audio/webm'
      recordedAudio.value = new File(recordedChunks, `lecture-${Date.now()}.webm`, { type })
    }, { once: true })
    mediaRecorder.start()
    recording.value = true
    recordTime.value = 0
    recordInterval = setInterval(() => recordTime.value++, 1000)
  }).catch(() => alert('Microphone access denied'))
}

function stopRecording() {
  if (mediaRecorder) { mediaRecorder.stop(); mediaRecorder.stream.getTracks().forEach(t => t.stop()) }
  recording.value = false
  clearInterval(recordInterval)
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

async function generate() {
  generating.value = true
  genProgress.value = 0
  step.value = 2
  const pi = setInterval(() => { if (genProgress.value < 90) genProgress.value += Math.random() * 15 }, 1000)

  try {
    let data
    if (inputType.value === 'upload' || inputType.value === 'record') {
      const fd = new FormData()
      const files = inputType.value === 'record' ? [recordedAudio.value].filter(Boolean) : uploadedFiles.value
      files.forEach(f => {
        if (f.type.startsWith('audio/')) fd.append('audio', f)
        else fd.append('document', f)
      })
      fd.append('title', title.value)
      fd.append('sourceText', sourceText.value)
      fd.append('flashcardCount', flashcardCount.value)
      fd.append('quizCount', quizCount.value)
      ;({ data } = await api.post('/study-materials/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }))
    } else {
      ;({ data } = await api.post('/study-materials', {
        title: title.value, sourceText: sourceText.value,
        youtubeUrl: inputType.value === 'url' ? youtubeUrl.value : undefined,
        flashcardCount: flashcardCount.value, quizCount: quizCount.value,
      }, { timeout: 120000 }))
    }
    clearInterval(pi)
    emit('created', data)
  } catch (e) {
    clearInterval(pi)
    generating.value = false
    step.value = 1
    genProgress.value = 0
    alert(e?.response?.data?.error || 'Failed to generate study pack. Please try again.')
  }
}

onUnmounted(() => {
  clearInterval(recordInterval)
  if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); mediaRecorder.stream.getTracks().forEach(t => t.stop()) }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px); display: flex; align-items: center;
  justify-content: center; z-index: 9000; padding: 20px;
}
.modal {
  width: 100%; max-width: 560px; max-height: 85vh; overflow-y: auto;
  padding: 24px; border-radius: 18px; background: var(--color-surface);
  border: 1px solid var(--color-border); box-shadow: 0 24px 80px rgba(0,0,0,0.2);
}
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-title { font-size: 18px; font-weight: 800; color: var(--color-text-primary); }
.close-btn { background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; padding: 4px; border-radius: 6px; }
.close-btn:hover { background: var(--color-primary-soft); }

.input-types { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
.input-type-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px;
  background: var(--color-surface-elevated); border: 2px solid var(--color-border);
  border-radius: 12px; cursor: pointer; transition: all 0.2s;
}
.input-type-card:hover { border-color: var(--color-border-strong); }
.input-type-card.selected { border-color: var(--color-primary); background: var(--color-primary-soft); }
.it-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.it-label { font-size: 12px; font-weight: 700; color: var(--color-text-primary); }
.it-desc { font-size: 10px; color: var(--color-text-tertiary); }

.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.form-input, .form-textarea {
  width: 100%; padding: 10px 14px; background: var(--color-surface-elevated);
  border: 1px solid var(--color-border); border-radius: 10px; font-size: 13px;
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
  font-family: inherit; resize: vertical;
}
.form-input:focus, .form-textarea:focus { border-color: var(--color-border-accent); }
.form-input::placeholder, .form-textarea::placeholder { color: var(--color-text-tertiary); }

.upload-zone {
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px;
  border: 2px dashed var(--color-border); border-radius: 12px; cursor: pointer; transition: all 0.2s;
}
.upload-zone:hover { border-color: var(--color-border-accent); background: var(--color-primary-soft); }
.upload-text { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.upload-hint { font-size: 11px; color: var(--color-text-tertiary); }

.file-list { margin-top: 10px; }
.file-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--color-surface-elevated); border-radius: 8px; margin-bottom: 4px; }
.file-name { flex: 1; font-size: 12px; font-weight: 500; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { font-size: 10px; color: var(--color-text-tertiary); }
.file-remove { background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; padding: 2px; }

.recorder-area { text-align: center; }
.recorder-wave { display: flex; align-items: center; justify-content: center; gap: 3px; height: 60px; margin-bottom: 12px; }
.wave-bar { width: 4px; background: var(--color-primary); border-radius: 2px; transition: height 0.1s; }
.recorder-controls { display: flex; justify-content: center; }
.record-btn {
  display: flex; align-items: center; gap: 8px; padding: 10px 20px;
  background: var(--color-error); color: #fff; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.recording-active { animation: pulse-rec 1s infinite; }
@keyframes pulse-rec { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

.config-row { display: flex; gap: 16px; margin-bottom: 16px; }
.config-item { flex: 1; }
.config-label { display: block; font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); margin-bottom: 6px; }
.config-slider { width: 100%; accent-color: var(--color-primary); }
.config-value { font-size: 14px; font-weight: 700; color: var(--color-primary); }

.generate-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
  padding: 14px; background: var(--color-primary); color: #fff; border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.generate-btn:hover:not(:disabled) { opacity: 0.9; }
.generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.gen-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.generating-step { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; text-align: center; }
.gen-animation { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.gen-ring { position: absolute; inset: 0; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1.2s linear infinite; }
.gen-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; }
.gen-desc { font-size: 13px; color: var(--color-text-tertiary); margin-bottom: 20px; }
.gen-progress { width: 200px; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.gen-progress-bar { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.5s ease; }

@media (max-width: 480px) { .input-types { grid-template-columns: 1fr; } .config-row { flex-direction: column; gap: 10px; } }
</style>
