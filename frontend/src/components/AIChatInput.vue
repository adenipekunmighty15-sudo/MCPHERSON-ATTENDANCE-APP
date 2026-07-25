<template>
  <div class="ai-chat-input" :class="{ 'has-text': input.trim(), 'is-focused': isFocused, 'web-search-active': webSearchEnabled }">
    <!-- Glowing border ring -->
    <div class="glow-ring" :class="{ 'pulse': isFocused || webSearchEnabled }">
      <div class="glow-inner"></div>
    </div>
    
    <!-- Input wrapper with tool attachments -->
    <div class="input-wrapper">
      <!-- Left side: Plus button for attachments -->
      <button
        class="attach-btn"
        @click="showToolSheet = !showToolSheet"
        :class="{ 'active': showToolSheet }"
        :aria-label="showToolSheet ? 'Close attachments' : 'Attach files'"
        type="button"
      >
        <svg v-if="!showToolSheet" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>

      <!-- Tool sheet dropdown -->
      <Transition name="tool-sheet">
        <div v-if="showToolSheet" class="tool-sheet">
          <div class="tool-sheet-header">
            <span class="tool-sheet-title">Attach from</span>
            <button class="tool-sheet-close" @click="showToolSheet = false" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="tool-sheet-grid">
            <button class="tool-option" @click="triggerFileUpload('image/*')">
              <div class="tool-icon photos"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
              <span>Photos</span>
            </button>
            <button class="tool-option" @click="triggerFileUpload('image/*;capture=camera')">
              <div class="tool-icon camera"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
              <span>Camera</span>
            </button>
            <button class="tool-option" @click="triggerFileUpload('.pdf,.doc,.docx,.txt,.md')">
              <div class="tool-icon files"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
              <span>Files</span>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Main textarea -->
      <div class="textarea-container" :class="{ 'has-file': attachedFile }">
        <textarea
          ref="textareaRef"
          v-model="input"
          @keydown.enter.prevent="send"
          @keydown.shift.enter="allowNewline"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @input="onInput"
          placeholder="Ask anything..."
          class="main-textarea"
          :disabled="streaming || processing"
          rows="1"
          style="height: 24px;"
        ></textarea>
        
        <!-- Attached file preview -->
        <div v-if="attachedFile" class="attached-file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="file-name">{{ attachedFile.name }}</span>
          <button class="remove-file" @click="removeAttachedFile" aria-label="Remove file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Right side: Web search toggle + Send button -->
      <div class="input-actions">
        <!-- Web search toggle -->
        <div class="web-search-toggle">
          <button
            @click="webSearchEnabled = !webSearchEnabled; emit('update:webSearchEnabled', webSearchEnabled.value)"
            class="web-search-btn"
            :class="{ active: webSearchEnabled }"
            :title="webSearchEnabled ? 'Disable web search' : 'Enable web search'"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span v-if="webSearchEnabled" class="pulse-dot"></span>
          </button>
        </div>

        <!-- Send button with magnetic effect -->
        <button
          ref="sendBtnRef"
          @click="send"
          @mousemove="onSendMouseMove"
          @mouseleave="onSendMouseLeave"
          :disabled="!input.trim() || streaming || processing"
          class="send-btn"
          :class="{ 'has-text': input.trim(), 'loading': streaming }"
          type="button"
          :style="sendBtnStyle"
        >
          <svg v-if="!streaming" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <div v-else class="send-spinner">
            <svg class="spinner-ring" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.md" class="hidden" @change="onFileSelect" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useMindStore } from '../stores/mind'

const props = defineProps({
  modelValue: String,
  streaming: Boolean,
  processing: Boolean,
  webSearchEnabled: Boolean,
  expert: Object,
  attachedFile: Object,
  conversationId: String,
  selectedExpert: Object,
  showHistory: Boolean,
  mindStore: Object
})

const emit = defineEmits([
  'update:modelValue',
  'update:webSearchEnabled',
  'send',
  'send-prompt',
  'trigger-file-upload',
  'file-selected',
  'remove-file',
  'new-chat',
  'load-conversation',
  'delete-old-conversations'
])

const mindStore = useMindStore()

const textareaRef = ref(null)
const sendBtnRef = ref(null)
const fileInputRef = ref(null)

const input = ref(props.modelValue)
const isFocused = ref(false)
const showToolSheet = ref(false)
const attachedFile = ref(props.attachedFile)
const sendBtnStyle = ref({ transform: 'translate(0, 0)' })

const webSearchEnabled = ref(props.webSearchEnabled)

watch(() => props.modelValue, (val) => { input.value = val || '' })
watch(() => props.webSearchEnabled, (val) => { webSearchEnabled.value = val })
watch(() => props.attachedFile, (val) => { attachedFile.value = val })

watch(input, (val) => {
  emit('update:modelValue', val)
})

function onInput() {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      const newHeight = Math.min(textareaRef.value.scrollHeight, 160)
      textareaRef.value.style.height = newHeight + 'px'
    }
  })
}

function send() {
  if (!input.value.trim() || props.streaming || props.processing) return
  emit('send', input.value)
}

function sendPrompt(text) {
  if (props.streaming || props.processing) return
  input.value = text
  emit('send', text)
}

function triggerFileUpload(accept) {
  emit('trigger-file-upload', accept)
  showToolSheet.value = false
}

function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) {
    attachedFile.value = file
    emit('file-selected', file)
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function removeAttachedFile() {
  attachedFile.value = null
  emit('remove-file')
}

function allowNewline(e) {
  // Allow Shift+Enter for newlines
}

function onSendMouseMove(e) {
  const rect = sendBtnRef.value?.getBoundingClientRect()
  if (!rect) return
  const x = e.clientX - rect.left - rect.width / 2
  const y = e.clientY - rect.top - rect.height / 2
  sendBtnStyle.value = { transform: `translate(${x * 0.3}px, ${y * 0.3}px)` }
}

function onSendMouseLeave() {
  sendBtnStyle.value = { transform: 'translate(0, 0)' }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    // Could open command palette
  }
}

// Expose methods for parent
defineExpose({
  send,
  sendPrompt,
  focus: () => nextTick(() => textareaRef.value?.focus())
})
</script>

<style scoped>
.ai-chat-input {
  position: relative;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
  transition: all 0.3s var(--ease-smooth);
}

/* Glowing border ring */
.glow-ring {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 2px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s var(--ease-smooth);
}

.glow-ring::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 22px;
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-light) 50%,
    var(--color-accent) 100%
  );
  opacity: 0;
  filter: blur(8px);
  transition: opacity 0.4s var(--ease-smooth);
}

.glow-ring.pulse::before {
  opacity: 0.6;
}

.glow-ring.has-focus::before,
.glow-ring.is-focused::before {
  opacity: 0.8;
}

.ai-chat-input.is-focused .glow-ring,
.ai-chat-input.web-search-active .glow-ring {
  opacity: 1;
}

/* Inner glow for depth */
.glow-inner {
  position: absolute;
  inset: 2px;
  border-radius: 18px;
  background: var(--color-bg);
  z-index: 1;
}

/* Input wrapper */
.input-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 18px;
  padding: 8px 12px;
  transition: all 0.25s var(--ease-smooth);
}

.ai-chat-input.is-focused .input-wrapper,
.ai-chat-input:focus-within .input-wrapper {
  border-color: var(--color-border-accent);
  box-shadow: 
    0 0 0 3px var(--color-primary-soft),
    0 8px 32px rgba(0, 0, 0, 0.08);
}

.ai-chat-input.web-search-active .input-wrapper {
  border-color: var(--color-primary);
  box-shadow: 
    0 0 0 3px var(--color-primary-soft),
    0 0 24px var(--color-primary-glow);
}

/* Attach button */
.attach-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s var(--ease-smooth);
  flex-shrink: 0;
}

.attach-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.attach-btn.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

/* Tool sheet dropdown */
.tool-sheet {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(56, 139, 253, 0.1);
  z-index: 10;
  animation: toolSheetIn 0.25s var(--ease-spring);
}

@keyframes toolSheetIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.tool-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.tool-sheet-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tool-sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.tool-sheet-close:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.tool-sheet-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.tool-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.tool-option:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.tool-icon.photos { background: var(--color-primary-soft); color: var(--color-primary); }
.tool-icon.camera { background: var(--color-error-soft); color: var(--color-error); }
.tool-icon.files { background: var(--color-warning-soft); color: var(--color-warning); }
.tool-icon.notebooks { background: var(--color-success-soft); color: var(--color-success); }

.tool-sheet-divider {
  height: 1px;
  background: var(--color-border);
  margin: 10px 0;
}

.tool-sheet-tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-sheet-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tool-sheet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.tool-sheet-grid .tool-option {
  flex-direction: row;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
}

.tool-sheet-grid .tool-option .tool-icon {
  display: none;
}

/* Textarea container */
.textarea-container {
  flex: 1;
  min-width: 0;
  position: relative;
}

.main-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font: inherit;
  color: var(--color-text-primary);
  line-height: 1.5;
  padding: 0;
  font-size: 14px;
}

.main-textarea::placeholder {
  color: var(--color-text-tertiary);
}

.main-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Attached file preview */
.attached-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--color-primary-soft);
  border-radius: 8px;
  margin-bottom: 8px;
  animation: fileIn 0.2s var(--ease-spring);
}

@keyframes fileIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.attached-file svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.file-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.remove-file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  margin-left: auto;
  transition: background 0.15s;
}

.remove-file:hover {
  background: rgba(56, 139, 253, 0.15);
}

/* Input actions */
.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Web search toggle */
.web-search-toggle {
  position: relative;
}

.web-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s var(--ease-smooth);
}

.web-search-btn:hover {
  background: var(--color-surface-elevated);
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
}

.web-search-btn.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.web-search-btn .pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulseDot 1.5s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* Send button */
.send-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.25s var(--ease-spring);
  flex-shrink: 0;
  overflow: hidden;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #081226;
  transform: scale(1.05);
  box-shadow: 0 4px 20px var(--color-primary-glow);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.send-btn.has-text {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #081226;
  box-shadow: 0 4px 20px var(--color-primary-glow);
}

.send-btn.has-text:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: scale(1.03);
  box-shadow: 0 6px 28px var(--color-primary-glow);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-btn.loading {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #081226;
}

.send-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  animation: spin 1s linear infinite;
}

.spinner-ring circle {
  stroke: #081226;
}

.spinner-ring path {
  stroke: #081226;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Hidden file input */
.hidden {
  display: none !important;
}

/* Responsive */
@media (max-width: 640px) {
  .ai-chat-input {
    padding: 8px 12px;
  }
  
  .tool-sheet-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tool-sheet-grid .tool-option {
    flex-direction: column;
    padding: 8px;
    font-size: 11px;
  }
  
  .tool-sheet-grid .tool-option .tool-icon {
    display: flex;
    width: 28px;
    height: 28px;
  }
  
  .send-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
}
</style>