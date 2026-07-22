<template>
  <div class="ai-chat">
    <ParticlesSwarm />

    <div class="radial-glow" />

    <!-- Left icon rail -->
    <aside class="icon-rail">
      <div class="rail-top">
        <button class="rail-btn" @click="newChat" title="New chat" aria-label="New chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button class="rail-btn" title="Compose" aria-label="Compose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="rail-btn" @click="showHistory = !showHistory" title="Search history" aria-label="Search history">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <div class="rail-divider" />
        <button class="rail-btn" title="Apps" aria-label="Apps">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          <span class="notif-dot" />
        </button>
        <button class="rail-btn" title="More" aria-label="More">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>
      <div class="rail-bottom">
        <button class="rail-btn" title="Settings" aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        <button class="rail-btn rail-avatar" title="Profile" aria-label="Profile">
          {{ userInitial }}
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <main class="chat-main">

      <!-- Top-right utility bar -->
      <div class="utility-bar">
        <button class="upgrade-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2L21 12l-6.6 2.8L12 22l-2.4-7.2L3 12l6.6-2.8z"/></svg>
          Upgrade
        </button>
        <button class="utility-btn" title="Edit" aria-label="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="mindStore.messages.length === 0 && !streaming" class="empty-state">
        <p class="empty-headline">Any new ideas to explore?</p>

        <div class="input-pill">
          <button class="attach-btn" title="Attach file" aria-label="Attach file">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input
            v-model="input"
            type="text"
            class="text-input"
            placeholder="Ask Gemini"
            @keydown.enter.prevent="send"
            :disabled="streaming || mindStore.processing"
          />
          <div class="input-controls">
            <div class="model-selector" ref="expertRef">
              <button class="model-btn" @click="showExpertMenu = !showExpertMenu">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                {{ selectedExpert.label === 'General Assistant' ? 'Flash' : selectedExpert.label.split(' ')[0] }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div v-if="showExpertMenu" class="expert-dropdown">
                <div class="dropdown-header">Thinking level</div>
                <button v-for="ex in experts" :key="ex.id" @click="selectExpert(ex)" class="dropdown-item" :class="{ active: ex.id === selectedExpert.id }">
                  <span class="ex-icon">{{ ex.icon }}</span>
                  <div><div class="ex-name">{{ ex.label }}</div><div class="ex-desc">{{ ex.description }}</div></div>
                </button>
              </div>
            </div>
            <button class="mic-btn" title="Voice input" aria-label="Voice input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Messages area -->
      <div v-else class="messages-area" ref="messagesRef" @scroll="onScroll">
        <div class="messages-inner">
          <div v-for="(msg, i) in mindStore.messages" :key="i" class="msg-row" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="msg-avatar ai">
              <div class="ai-dots">
                <span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span><span class="dot d4"></span>
              </div>
            </div>
            <div class="msg-bubble" :class="msg.role">
              <div v-if="msg.role === 'assistant' && msg.thinking" class="thinking-toggle">
                <button @click="toggleThinking(i)" class="think-btn">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ rotated: msg.showThinking }"><path d="m9 18 6-6-6-6"/></svg>
                  <span>See thinking steps</span>
                </button>
                <div v-if="msg.showThinking" class="thinking-text">{{ msg.thinking }}</div>
              </div>
              <div class="msg-content" v-html="sanitizeHtml(renderMarkdown(msg.content))" />
              <div v-if="msg.role === 'assistant'" class="msg-footer">
                <span class="msg-meta">{{ selectedExpert.label }} · {{ formatElapsed(msg.elapsed) }}</span>
                <div class="msg-actions">
                  <button @click="copyMessage(msg.content)" title="Copy"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                  <button @click="regenerateMessage(i)" title="Regenerate"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg></button>
                  <button @click="rateMessage(i, 'like')" :class="{ rated: msg.rating === 'like' }"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h14.6a2 2 0 0 0 2-1.7l1.2-7a2 2 0 0 0-2-2.3H14V4a2 2 0 0 0-2-2h-1.4a2 2 0 0 0-1.9 1.4L7 11v11"/></svg></button>
                  <button @click="rateMessage(i, 'dislike')" :class="{ rated: msg.rating === 'dislike' }"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2v9m0 0v1.5M17 11h3.3a2 2 0 0 1 2 1.7l1.2 7a2 2 0 0 1-2 2.3H7.4a2 2 0 0 1-2-1.4L4 13.7V11"/><path d="M17 2H8.4a2 2 0 0 0-1.9 1.4L4 11"/></svg></button>
                </div>
              </div>
            </div>
            <div v-if="msg.role === 'user'" class="msg-avatar user">{{ userInitial }}</div>
          </div>

          <!-- Streaming indicator -->
          <div v-if="streaming" class="msg-row assistant">
            <div class="msg-avatar ai">
              <div class="ai-dots"><span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span><span class="dot d4"></span></div>
            </div>
            <div class="msg-bubble assistant">
              <div v-if="streamThinking || !streamAnswer" class="stream-status">
                <div class="stream-pulse">
                  <span class="pulse-dot"></span><span class="pulse-dot"></span><span class="pulse-dot"></span>
                </div>
                <span class="stream-label">{{ streamThinking ? 'Thinking...' : 'Responding...' }}</span>
              </div>
              <div v-if="streamAnswer" class="msg-content" v-html="sanitizeHtml(renderMarkdown(streamAnswer))" />
              <span v-if="streamAnswer" class="cursor-blink" />
            </div>
          </div>

          <!-- Verifying indicator -->
          <div v-if="verifying" class="msg-row assistant">
            <div class="msg-avatar ai">
              <div class="ai-dots"><span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span><span class="dot d4"></span></div>
            </div>
            <div class="msg-bubble assistant">
              <div class="stream-status">
                <div class="stream-pulse"><span class="pulse-dot"></span><span class="pulse-dot"></span><span class="pulse-dot"></span></div>
                <span class="stream-label">Verifying {{ verificationCount }} claims...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input bar (when messages exist) -->
      <div v-if="mindStore.messages.length > 0 || streaming" class="input-area">
        <div class="input-pill chat-input-pill">
          <button class="attach-btn" title="Attach file" aria-label="Attach file">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input v-model="input" type="text" class="text-input" placeholder="Ask Gemini" @keydown.enter.prevent="send" :disabled="streaming || mindStore.processing" />
          <div class="input-controls">
            <div class="model-selector" ref="expertRefBottom">
              <button class="model-btn" @click="showExpertMenuBottom = !showExpertMenuBottom">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                {{ selectedExpert.label === 'General Assistant' ? 'Flash' : selectedExpert.label.split(' ')[0] }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div v-if="showExpertMenuBottom" class="expert-dropdown bottom-dropdown">
                <div class="dropdown-header">Thinking level</div>
                <button v-for="ex in experts" :key="ex.id" @click="selectExpert(ex); showExpertMenuBottom = false" class="dropdown-item" :class="{ active: ex.id === selectedExpert.id }">
                  <span class="ex-icon">{{ ex.icon }}</span>
                  <div><div class="ex-name">{{ ex.label }}</div><div class="ex-desc">{{ ex.description }}</div></div>
                </button>
              </div>
            </div>
            <button class="mic-btn" title="Voice input" aria-label="Voice input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            </button>
          </div>
        </div>
        <p v-if="error" class="input-error">{{ error }}</p>
      </div>

      <!-- History sidebar -->
      <div v-if="showHistory" class="history-overlay" @click="showHistory = false" />
      <aside class="history-sidebar" :class="{ open: showHistory }">
        <div class="history-header">
          <span class="history-title">History</span>
          <button @click="showHistory = false" class="close-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="history-list">
          <div v-if="conversations.length === 0" class="history-empty">No saved chats yet</div>
          <button v-for="conv in conversations" :key="conv.id" @click="loadConversation(conv)" class="history-item">
            <div class="history-name">{{ conv.title }}</div>
            <div class="history-meta">{{ formatDate(conv.updatedAt || conv.updated_at) }} · {{ conv.model }}</div>
          </button>
        </div>
        <div class="history-footer">
          <button @click="newChat()" class="history-action">+ New chat</button>
          <button @click="deleteOldConversations" class="history-action secondary">Delete old (50d+)</button>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useMindStore } from '../stores/mind'
import { supabase, supabaseConfigured } from '../lib/supabase'
import api from '../lib/api'
import { sanitizeHtml } from '../lib/sanitize.js'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.min.css'
import ParticlesSwarm from '../components/three/ParticlesSwarm.vue'

let katex = null
let hljs = null
import('katex').then(m => { katex = m.default || m }).catch(() => {})
import('highlight.js').then(m => { hljs = m.default || m }).catch(() => {})

const authStore = useAuthStore()
const mindStore = useMindStore()

const input = ref('')
const messagesRef = ref(null)
const expertRef = ref(null)
const expertRefBottom = ref(null)
const followUps = ref([])
const showScrollButton = ref(false)
const showHistory = ref(false)
const conversations = ref([])
const conversationId = ref(null)
const showExpertMenu = ref(false)
const showExpertMenuBottom = ref(false)
const selectedExpert = ref({ id: 'general', label: 'General Assistant', icon: '\u{1F9E0}' })
const streaming = ref(false)
const streamThinking = ref('')
const streamAnswer = ref('')
const verifying = ref(false)
const verificationCount = ref(0)
const error = ref('')
let abortController = null

const experts = [
  { id: 'general', label: 'General Assistant', icon: '\u2728', description: 'Help with any topic', prompt: 'You are a warm, conversational AI assistant like ChatGPT, Claude, and Gemini. Be natural and thoughtful.' },
  { id: 'math', label: 'Math Tutor', icon: '\u2211', description: 'Step-by-step math help', prompt: 'You are a warm math tutor like Khan Academy and ChatGPT.' },
  { id: 'programming', label: 'Programming Mentor', icon: '\u2328', description: 'Code & algorithms', prompt: 'You are a warm programming mentor like ChatGPT and GitHub Copilot.' },
  { id: 'medical', label: 'Medical Explainer', icon: '\u2695', description: 'Health & sciences', prompt: 'You are a warm medical educator.' },
  { id: 'history', label: 'History Expert', icon: '\u{1F4DC}', description: 'Events & contexts', prompt: 'You are a warm history professor.' },
  { id: 'writing', label: 'Writing Coach', icon: '\u270D', description: 'Essays & grammar', prompt: 'You are a warm writing coach.' },
  { id: 'physics', label: 'Physics Tutor', icon: '\u269B', description: 'Laws & problems', prompt: 'You are a warm physics tutor.' },
  { id: 'chemistry', label: 'Chemistry Tutor', icon: '\u{1F52C}', description: 'Reactions & theory', prompt: 'You are a warm chemistry tutor.' },
  { id: 'literature', label: 'Literature Guide', icon: '\u{1F4D6}', description: 'Texts & analysis', prompt: 'You are a warm literature guide.' },
  { id: 'career', label: 'Career Advisor', icon: '\u{1F4BC}', description: 'Paths & guidance', prompt: 'You are a warm career advisor.' },
]

const userInitial = computed(() => (authStore.user?.name?.charAt(0) || 'U').toUpperCase())

function selectExpert(expert) {
  selectedExpert.value = expert
  showExpertMenu.value = false
  showExpertMenuBottom.value = false
}

function formatElapsed(ms) {
  if (!ms) return '0.3s'
  return (ms / 1000).toFixed(1) + 's'
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function isMarkdownDividerCell(cell) {
  return [...cell].every(char => char === '-' || char === ':' || char.trim() === '')
}

function renderMarkdown(text) {
  if (!text) return ''
  let cleaned = text
  if ((cleaned.match(/\$\$/g) || []).length % 2 !== 0) cleaned = cleaned.replace(/\$\$\s*$/, '')
  if ((cleaned.match(/\$/g) || []).length % 2 === 1) cleaned = cleaned.replace(/\$\s*$/, '')
  const openFence = cleaned.match(/^```/m)
  const closeFence = cleaned.match(/^```$/m)
  if (openFence && !closeFence) cleaned = cleaned.replace(/```(\w*)?\n?$/, '')

  const displayMathBlocks = []
  let displayIdx = 0
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const key = `__DM${displayIdx}__`
    if (katex) {
      try { const html = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); displayMathBlocks.push(`<div class="math-display">${html}</div>`) }
      catch { displayMathBlocks.push(`<div class="math-error">${math}</div>`) }
    } else { displayMathBlocks.push(`<div class="math-display">${math}</div>`) }
    displayIdx++; return key
  })

  const inlineMathBlocks = []
  let inlineIdx = 0
  cleaned = cleaned.replace(/\$(.+?)\$/g, (_, math) => {
    const key = `__IM${inlineIdx}__`
    if (katex) {
      try { const html = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); inlineMathBlocks.push(`<span class="math-inline">${html}</span>`) }
      catch { inlineMathBlocks.push(`<span class="math-error">${math}</span>`) }
    } else { inlineMathBlocks.push(`<span class="math-inline">${math}</span>`) }
    inlineIdx++; return key
  })

  let html = cleaned
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const validLang = lang && hljs?.getLanguage(lang) ? lang : ''
    const highlighted = validLang ? hljs.highlight(code.trim(), { language: validLang }).value : escapeHtml(code.trim())
    return `<div class="code-block-wrapper"><div class="code-lang">${lang || 'code'}</div><pre class="code-block"><code class="${validLang ? 'hljs' : ''}">${highlighted}</code></pre></div>`
  })
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="chat-image" loading="lazy" />')
  html = html.replace(/### (.+)/g, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/## (.+)/g, '<h2 class="md-h2">$1</h2>')
  html = html.replace(/# (.+)/g, '<h1 class="md-h1">$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^- (.+)/gm, '<li class="md-li">$1</li>')
  html = html.replace(/^\d+\. (.+)/gm, '<li class="md-li-num">$1</li>')
  html = html.replace(/^\|(.+)\|\s*$/gm, (line) => {
    const cells = line.slice(1, -1).trim().split('|').map(c => c.trim())
    const isHeader = cells.length > 0 && cells.every(isMarkdownDividerCell)
    if (isHeader) return '<hr class="table-divider">'
    return '<tr>' + cells.map(c => `<td class="table-cell">${c || ''}</td>`).join('') + '</tr>'
  })
  html = html.replace(/<tr>.*?<\/tr>\s*(<hr class="table-divider">\s*)?(<tr>.*?<\/tr>\s*)+/g, (match) => {
    const rows = match.split(/\s*<hr class="table-divider">\s*/)
    if (rows.length === 2) {
      const header = rows[0].replace(/<td>/g, '<th class="table-cell table-header">').replace(/<\/td>/g, '</th>')
      return `<table class="markdown-table"><thead>${header}</thead><tbody>${rows[1]}</tbody></table>`
    }
    return `<table class="markdown-table"><tbody>${match}</tbody></table>`
  })
  html = html.replace(/^---\s*$/gm, '<hr class="md-hr">')
  html = html.replace(/\n\n/g, '</p><p class="md-p">')
  html = '<p class="md-p">' + html + '</p>'
  displayMathBlocks.forEach((h, i) => { html = html.replace(`__DM${i}__`, h) })
  inlineMathBlocks.forEach((h, i) => { html = html.replace(`__IM${i}__`, h) })
  return html
}

async function sendStream(msg) {
  streaming.value = true
  streamThinking.value = ''
  streamAnswer.value = ''
  error.value = ''
  let streamError = ''

  const startTime = performance.now()
  if (abortController) abortController.abort()
  abortController = new AbortController()

  try {
    if (!supabaseConfigured || !supabase) throw new Error('Supabase not configured')
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || null
    if (!token) throw new Error('No auth token')

    const history = mindStore.messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

    const response = await fetch(`${baseUrl}/api/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ message: msg, history, conversationId: conversationId.value, expert: selectedExpert.value.id, council: true, webSearch: false }),
      signal: abortController.signal,
    })

    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let eventType = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        if (buffer.trim()) {
          const line = buffer.trim()
          if (line.startsWith('data: ')) {
            try { const data = JSON.parse(line.slice(6)); if (data.content) streamAnswer.value = data.content; if (data.answer) streamAnswer.value = data.answer } catch (e) { console.warn(e) }
          }
        }
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed.startsWith('event: ')) eventType = trimmed.slice(7).trim()
        else if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6))
            switch (eventType) {
              case 'thinking': streamThinking.value = data.content || ''; break
              case 'status': streamThinking.value = data.message || ''; break
              case 'answer': streamAnswer.value = data.content || ''; break
              case 'verifying': verifying.value = true; verificationCount.value = data.count || 0; break
              case 'verified': verifying.value = false; break
              case 'done':
                streamThinking.value = data.thinking || streamThinking.value
                streamAnswer.value = data.answer || streamAnswer.value
                if (data.conversationId) conversationId.value = data.conversationId
                if (data.followUps) followUps.value = data.followUps
                setTimeout(() => scrollToBottom(true), 100)
                break
              case 'error': console.error('Stream error:', data.message); streamError = data.message; break
              default: if (data.content) streamAnswer.value = data.content; break
            }
          } catch (e) { console.warn(e) }
        }
      }
      await scrollToBottom()
    }

    if (streamAnswer.value) {
      mindStore.messages.push({ role: 'assistant', content: streamAnswer.value, council: [{ provider: 'stream', thinking: streamThinking.value, answer: streamAnswer.value }], thinking: streamThinking.value, elapsed: Math.round(performance.now() - startTime), rating: null, showThinking: false })
      streamAnswer.value = ''
    } else if (streamError) {
      mindStore.messages.push({ role: 'assistant', content: `I'm sorry, I couldn't process your request. The AI service is currently unavailable. Please try again later.`, elapsed: Math.round(performance.now() - startTime), rating: null })
    } else {
      mindStore.messages.push({ role: 'assistant', content: `I wasn't able to generate a response. Please try rephrasing your question.`, elapsed: Math.round(performance.now() - startTime), rating: null })
    }
  } catch (err) {
    console.error('Stream error:', err)
    error.value = 'Failed to reach AI service. Check your connection and try again.'
    const elapsed = Math.round(performance.now() - startTime)
    mindStore.messages.push({ role: 'assistant', content: `I'm sorry, I couldn't process your request. The AI service is currently unavailable. Please try again later.`, elapsed, rating: null })
  } finally {
    streaming.value = false
  }
  await scrollToBottom()
}

async function send() {
  error.value = ''
  if ((!input.value.trim()) || streaming.value || mindStore.processing) return
  const msg = input.value.trim()
  input.value = ''
  error.value = ''
  mindStore.messages.push({ role: 'user', content: msg })
  await sendStream(msg)
  await scrollToBottom()
}

async function copyMessage(text) {
  try { await navigator.clipboard.writeText(text) } catch (e) { console.warn(e) }
}

async function regenerateMessage(index) {
  if (streaming.value) return
  const msg = mindStore.messages[index]
  if (!msg || msg.role !== 'assistant') return
  const prevUserMsg = mindStore.messages.slice(0, index).reverse().find(m => m.role === 'user')
  if (!prevUserMsg) return
  mindStore.messages.splice(index, 1)
  await sendStream(prevUserMsg.content)
}

function rateMessage(index, rating) {
  const msg = mindStore.messages[index]
  if (!msg) return
  msg.rating = msg.rating === rating ? null : rating
}

function toggleThinking(index) {
  const msg = mindStore.messages[index]
  if (msg) msg.showThinking = !msg.showThinking
}

async function fetchConversations() {
  try { const { data } = await api.get('/chats'); conversations.value = Array.isArray(data) ? data : [] } catch { conversations.value = [] }
}

async function loadConversation(conv) {
  try {
    const { data } = await api.get(`/chats/${conv.id}/messages`)
    const msgs = Array.isArray(data) ? data : []
    mindStore.setMessages(msgs.map(m => ({ role: m.role, content: m.content, council: [], thinking: '', elapsed: null, rating: null, showThinking: false })))
    conversationId.value = conv.id
    showHistory.value = false
    followUps.value = []
    await nextTick()
    setTimeout(() => scrollToBottom(true), 200)
  } catch (e) { console.warn(e) }
}

function newChat() {
  mindStore.clearChat()
  conversationId.value = null
  followUps.value = []
  showHistory.value = false
  streamAnswer.value = ''
  streamThinking.value = ''
}

async function deleteOldConversations() {
  try { await api.post('/chats/cleanup', { days: 50 }); await fetchConversations() } catch (e) { console.warn(e) }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr); const now = new Date(); const diff = now - d
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scrollToBottom(force = false) {
  return nextTick().then(() => {
    const el = messagesRef.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: force ? 'smooth' : 'instant' })
  })
}

function onScroll() {
  const el = messagesRef.value
  if (!el) return
  showScrollButton.value = el.scrollHeight - el.scrollTop - el.clientHeight > 200
}

function handleClickOutside(e) {
  if (expertRef.value && !expertRef.value.contains(e.target)) showExpertMenu.value = false
  if (expertRefBottom.value && !expertRefBottom.value.contains(e.target)) showExpertMenuBottom.value = false
}

onMounted(() => {
  scrollToBottom()
  fetchConversations()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (abortController) abortController.abort()
})
</script>

<style>
.md-h1 { font-size: 20px; font-weight: 800; margin: 12px 0 6px; color: var(--color-text-primary); }
.md-h2 { font-size: 17px; font-weight: 700; margin: 10px 0 5px; color: var(--color-text-primary); }
.md-h3 { font-size: 15px; font-weight: 700; margin: 8px 0 4px; color: var(--color-text-primary); }
.md-p { margin-bottom: 8px; }
.md-li { margin-left: 16px; list-style: disc; margin-bottom: 2px; }
.md-li-num { margin-left: 16px; list-style: decimal; margin-bottom: 2px; }
.md-hr { margin: 12px 0; border: none; border-top: 1px solid var(--color-border); }
.code-block-wrapper { margin: 8px 0; border-radius: 10px; overflow: hidden; border: 1px solid var(--color-border); }
.code-lang { font-size: 10px; font-weight: 600; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 12px; background: var(--color-bg); border-bottom: 1px solid var(--color-border); }
.code-block { background: var(--color-surface-elevated); padding: 12px; overflow-x: auto; margin: 0; font-size: 13px; line-height: 1.5; color: var(--color-text-primary); }
.inline-code { background: var(--color-surface-elevated); border-radius: 4px; padding: 1px 5px; font-size: 13px; color: var(--color-primary); }
.math-display { overflow-x: auto; padding: 8px 0; margin: 8px 0; text-align: center; }
.math-inline { display: inline-block; vertical-align: middle; }
.math-error { color: var(--color-red-brand); font-style: italic; }
.chat-image { max-width: 100%; border-radius: 12px; margin: 12px 0; border: 1px solid var(--color-border); }
.markdown-table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 8px 0; font-size: 13px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border); }
.table-cell { padding: 6px 10px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
.table-header { font-weight: 600; color: var(--color-text-primary); background: var(--color-surface-elevated); text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
.markdown-table tr:last-child td { border-bottom: none; }
</style>

<style scoped>
.ai-chat {
  position: fixed;
  inset: 0;
  display: flex;
  background: var(--color-bg);
  font-family: 'Inter', system-ui, sans-serif;
  z-index: 1;
}

.radial-glow {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(100, 149, 237, 0.15), transparent 70%);
  pointer-events: none;
  z-index: 1;
}

/* Icon rail */
.icon-rail {
  width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 4px;
  border-right: 1px solid var(--color-border);
  background: transparent;
  z-index: 2;
  position: relative;
}
.rail-top { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
.rail-bottom { display: flex; flex-direction: column; align-items: center; gap: 4px; padding-bottom: 8px; }
.rail-divider { width: 20px; height: 1px; background: var(--color-border); margin: 6px 0; }
.rail-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px; border: none;
  background: transparent; color: var(--color-text-tertiary);
  cursor: pointer; transition: all 0.2s; position: relative;
}
.rail-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.rail-avatar {
  font-size: 13px; font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: #fff;
}
.rail-avatar:hover { background: linear-gradient(135deg, var(--color-primary-hover), var(--color-primary)); }
.notif-dot {
  position: absolute; top: 8px; right: 8px;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--color-primary);
}

/* Main */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  overflow: hidden;
}

/* Utility bar */
.utility-bar {
  position: absolute;
  top: 16px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 3;
}
.upgrade-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 20px;
  border: 1px solid var(--color-border);
  background: rgba(37, 99, 235, 0.1);
  color: var(--color-primary);
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.upgrade-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.utility-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; border: none;
  background: transparent; color: var(--color-text-tertiary);
  cursor: pointer; transition: all 0.2s;
}
.utility-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); }

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}
.empty-headline {
  font-size: 28px;
  font-weight: 300;
  color: var(--color-text-primary);
  text-align: center;
  margin: 0;
  line-height: 1.3;
}

/* Input pill */
.input-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px 8px 12px;
  border-radius: 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.input-pill:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.12);
}
.attach-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: none;
  background: transparent; color: var(--color-text-tertiary);
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.attach-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.text-input {
  flex: 1; border: none; outline: none;
  background: transparent;
  font-size: 15px; color: var(--color-text-primary);
  padding: 4px 0; font-family: inherit;
  min-width: 0;
}
.text-input::placeholder { color: var(--color-text-tertiary); }
.text-input:disabled { opacity: 0.5; }
.input-controls { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.model-selector { position: relative; }
.model-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 20px;
  border: none; background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.model-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.mic-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: none;
  background: transparent; color: var(--color-text-tertiary);
  cursor: pointer; transition: all 0.2s;
}
.mic-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); }

/* Expert dropdown */
.expert-dropdown {
  position: absolute; top: 100%; left: 0; margin-top: 6px;
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  z-index: 50;
}
.bottom-dropdown { bottom: 100%; top: auto; margin-bottom: 6px; margin-top: 0; }
.dropdown-header {
  padding: 10px 14px; font-size: 10px; font-weight: 700;
  color: var(--color-text-tertiary); text-transform: uppercase;
  letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border);
}
.dropdown-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  border: none; background: transparent;
  color: var(--color-text-secondary); font-size: 13px;
  cursor: pointer; text-align: left; transition: all 0.15s;
}
.dropdown-item:hover, .dropdown-item.active { background: var(--color-primary-soft); color: var(--color-primary); }
.ex-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ex-name { font-weight: 600; }
.ex-desc { font-size: 11px; color: var(--color-text-tertiary); margin-top: 1px; }

/* Messages area */
.messages-area {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  padding: 24px 40px 12px;
  scroll-behavior: smooth;
}
.messages-inner {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.msg-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.msg-row.user { flex-direction: row-reverse; }

.msg-avatar {
  width: 32px; height: 32px; min-width: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}
.msg-avatar.ai { background: transparent; border: none; }
.msg-avatar.user {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff; border: none;
}

.ai-dots { display: flex; align-items: center; gap: 2px; }
.dot { width: 4px; height: 4px; border-radius: 50%; }
.d1 { background: var(--color-primary); }
.d2 { background: var(--color-primary-light); }
.d3 { background: var(--color-accent); }
.d4 { background: var(--color-success); }

.msg-bubble {
  max-width: 78%;
  padding: 10px 14px;
  font-size: 14px; line-height: 1.6;
  border-radius: 16px;
}
.msg-bubble.assistant {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px 16px 16px 4px;
  color: var(--color-text-primary);
}
.msg-bubble.user {
  background: var(--color-primary);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
}

.msg-content { line-height: 1.6; }
.thinking-toggle { margin-bottom: 8px; }
.think-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none;
  color: var(--color-text-tertiary); font-size: 11px;
  cursor: pointer; padding: 2px 0;
  transition: color 0.2s;
}
.think-btn:hover { color: var(--color-text-primary); }
.think-btn svg { transition: transform 0.2s; }
.think-btn svg.rotated { transform: rotate(90deg); }
.thinking-text {
  margin-top: 6px; padding: 8px; padding-left: 12px;
  font-size: 11px; color: var(--color-text-tertiary);
  font-style: italic; border-left: 2px solid var(--color-border);
  white-space: pre-wrap;
}

.msg-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding-top: 6px;
  border-top: 1px solid var(--color-border);
}
.msg-meta { font-size: 10px; color: var(--color-text-tertiary); }
.msg-actions { display: flex; align-items: center; gap: 2px; }
.msg-actions button {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; border: none;
  background: transparent; color: var(--color-text-tertiary);
  cursor: pointer; transition: all 0.2s;
}
.msg-actions button:hover { background: var(--color-surface-elevated); color: var(--color-text-primary); }
.msg-actions button.rated { color: var(--color-primary); background: var(--color-primary-soft); }

.stream-status { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.stream-pulse { display: flex; align-items: center; gap: 4px; }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-primary); animation: pulse 1s ease-in-out infinite; }
.pulse-dot:nth-child(2) { animation-delay: 0.2s; }
.pulse-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
.stream-label { font-size: 11px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.cursor-blink { display: inline-block; width: 2px; height: 16px; background: var(--color-primary); margin-left: 2px; animation: blink 0.8s step-end infinite; vertical-align: text-bottom; }
@keyframes blink { 50% { opacity: 0; } }

/* Input area (bottom) */
.input-area {
  width: 100%;
  max-width: 640px;
  padding: 12px 20px 20px;
  margin: 0 auto;
}
.chat-input-pill {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  background: var(--color-surface);
  backdrop-filter: blur(12px);
}
.input-error { text-align: center; font-size: 12px; color: var(--color-error); margin: 6px 0 0; }

/* History sidebar */
.history-overlay {
  display: none;
  position: fixed; inset: 0; z-index: 9;
  background: rgba(0,0,0,0.3);
}
.history-sidebar {
  position: fixed; top: 0; right: 0; bottom: 0; width: 280px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  z-index: 10;
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
}
.history-sidebar.open { transform: translateX(0); }

.history-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid var(--color-border);
}
.history-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
.close-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; border: none; background: transparent;
  color: var(--color-text-tertiary); cursor: pointer;
}
.close-btn:hover { background: var(--color-surface-elevated); color: var(--color-text-primary); }
.history-list { flex: 1; overflow-y: auto; padding: 8px; }
.history-empty { text-align: center; color: var(--color-text-tertiary); font-size: 12px; padding: 32px 16px; }
.history-item {
  width: 100%; text-align: left; padding: 10px 12px;
  border-radius: 8px; border: none; background: transparent;
  cursor: pointer; transition: background 0.2s;
}
.history-item:hover { background: var(--color-surface-elevated); }
.history-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-meta { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
.history-footer { padding: 12px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 6px; }
.history-action {
  padding: 8px 12px; border-radius: 8px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;
  background: var(--color-primary-soft); color: var(--color-primary); transition: all 0.2s;
}
.history-action:hover { background: var(--color-primary); color: #fff; }
.history-action.secondary { background: transparent; color: var(--color-text-tertiary); }
.history-action.secondary:hover { background: var(--color-surface-elevated); color: var(--color-text-primary); }

/* Mobile */
@media (max-width: 768px) {
  .icon-rail { display: none; }
  .empty-state { padding: 24px; }
  .empty-headline { font-size: 22px; }
  .messages-area { padding: 16px; }
  .msg-bubble { max-width: 92%; font-size: 13px; }
  .utility-bar { top: 8px; right: 12px; }
  .input-area { padding: 8px 12px 16px; }
  .history-sidebar { width: 260px; }
}
</style>