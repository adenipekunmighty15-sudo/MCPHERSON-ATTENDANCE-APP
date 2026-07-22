<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] relative overflow-hidden font-sans">
    
    <div class="page-wide h-screen flex" style="padding:0;">
      <!-- Side navigation - Clean dark blue style -->
      <div v-if="showHistory"
        class="chat-sidebar w-56 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col h-full glass">
        <div class="px-4 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Brand dots -->
            <div class="flex items-center gap-0.5">
              <span class="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
              <span class="w-2 h-2 rounded-full bg-[var(--color-primary-light)]"></span>
              <span class="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
              <span class="w-2 h-2 rounded-full bg-[var(--color-success)]"></span>
            </div>
            <span class="text-sm font-semibold text-[var(--color-text-primary)]">History</span>
          </div>
          <button @click="showHistory = false" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-0.5 p-2 scrollbar-thin">
          <div v-if="conversations.length === 0" class="text-center text-[var(--color-text-tertiary)] text-xs py-8">No saved chats yet</div>
          <button v-for="conv in conversations" :key="conv.id"
            @click="loadConversation(conv)"
            class="w-full text-left text-xs px-3 py-2.5 rounded-lg transition-all"
            :class="conv.id === conversationId ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-elevated)]/50 hover:text-[var(--color-text-primary)]'">
            <div class="font-medium truncate">{{ conv.title }}</div>
            <div class="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 flex items-center gap-2">
              <span>{{ formatDate(conv.updatedAt || conv.updated_at) }}</span>
              <span>·</span>
              <span>{{ conv.model }}</span>
            </div>
          </button>
        </div>
        <div class="p-3 border-t border-[var(--color-border)] space-y-1">
          <button @click="newChat()" class="w-full text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] rounded-lg px-3 py-2 transition-all text-left font-medium">+ New chat</button>
          <button @click="deleteOldConversations" class="w-full text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg px-3 py-2 transition-all text-left">Delete old (50d+)</button>
        </div>
      </div>

      <!-- Main area -->
      <div class="flex-1 flex flex-col min-w-0 h-full">
        <!-- Minimal header -->
        <div class="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0 border-b border-[var(--color-border)]/50">
          <div class="flex items-center gap-3">
            <button @click="showHistory = !showHistory"
              class="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-all" title="Toggle history">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <button @click="newChat"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-all" title="Start new chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              <span class="hidden sm:inline">New chat</span>
            </button>
            <!-- Brand dots -->
            <div class="flex items-center gap-1.5">
              <div class="flex items-center gap-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></span>
              </div>
              <span class="text-sm font-medium text-[var(--color-text-tertiary)] hidden sm:inline">{{ selectedExpert.label }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Thinking level selector -->
            <div class="relative" ref="expertRef">
              <button @click="showExpertMenu = !showExpertMenu"
                class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-all">
                <span>{{ selectedExpert.label }}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform" :class="{ 'rotate-180': showExpertMenu }"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div v-if="showExpertMenu" class="absolute top-full right-0 mt-1 w-52 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xl shadow-black/30 z-50 glass-strong animate-in">
                <div class="px-3 py-2 text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold border-b border-[var(--color-border)]">Thinking level</div>
                <button v-for="expert in experts" :key="expert.id" @click="selectExpert(expert)"
                  class="w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center gap-2.5"
                  :class="expert.id === selectedExpert.id ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-elevated)]/50 hover:text-[var(--color-text-primary)]'">
                  <span class="w-6 h-6 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-xs">{{ expert.icon }}</span>
                  <div>
                    <div class="font-medium">{{ expert.label }}</div>
                    <div class="text-[10px] text-[var(--color-text-tertiary)]">{{ expert.description }}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages area -->
        <div ref="messagesRef" class="flex-1 relative overflow-y-auto px-4 sm:px-6 py-4 scrollbar-thin" @scroll="onScroll">
          <!-- Scroll to bottom button -->
          <transition name="fade">
            <button v-if="showScrollButton" @click="scrollToBottom(true)"
              class="absolute bottom-4 right-6 z-20 w-10 h-10 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </transition>
          <div class="space-y-4 min-h-full">
          <!-- Gemini-style empty state -->
          <div v-if="mindStore.messages.length === 0" class="flex flex-col items-center justify-center h-full px-4 -mt-10">
            <!-- Gemini spark icon with four-color glow -->
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#4285F4]/20 via-[#DB4437]/20 via-[#F4B400]/20 to-[#0F9D58]/20 flex items-center justify-center mb-5 animate-pulse-glow" style="animation-delay:0s">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-text)]">
                <path d="M12 2l2.4 7.2L21 12l-6.6 2.8L12 22l-2.4-7.2L3 12l6.6-2.8z"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-[var(--color-text)] mb-2">Hey {{ authStore.user?.name || 'there' }}, what's up?</h2>
            <p class="text-sm text-[var(--color-text-muted)] text-center max-w-md mb-8">
              I can help with <span class="text-[var(--color-text)]">math</span>,
              <span class="text-[var(--color-text)]">code</span>,
              <span class="text-[var(--color-text)]">writing</span>,
              <span class="text-[var(--color-text)]">science</span> or just chat!
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              <button v-for="s in suggestions" :key="s.text" @click="sendPrompt(s.text)"
                class="group text-xs bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-border)] rounded-xl p-3.5 text-left transition-all hover:bg-[var(--color-surface-elevated)]">
                <span class="text-base block mb-1">{{ s.icon }}</span>
                <span class="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">{{ s.text }}</span>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div v-for="(msg, i) in mindStore.messages" :key="i" class="flex gap-3" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            <div v-if="msg.role === 'assistant'" class="w-7 h-7 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 mt-1 border border-[var(--color-border)]">
              <div class="flex items-center gap-[2px]">
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-primary)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-primary-light)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-accent)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-success)]"></span>
              </div>
            </div>

            <div :class="msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-stream'">
              <!-- Thinking steps - Gemini-style overflow menu -->
              <div v-if="msg.role === 'assistant' && msg.thinking" class="thinking-section mb-2">
                <button @click="toggleThinking(i)"
                  class="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors w-full text-left">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform" :class="{ 'rotate-90': msg.showThinking }"><path d="m9 18 6-6-6-6"/></svg>
                  <span>See thinking steps</span>
                </button>
                <div v-if="msg.showThinking" class="mt-2 text-[11px] text-[var(--color-text-muted)] italic leading-relaxed whitespace-pre-wrap border-l-2 border-[var(--color-border)] pl-3">{{ msg.thinking }}</div>
              </div>
              <div class="prose-sm max-w-none leading-relaxed" v-html="sanitizeHtml(renderMarkdown(msg.content))"></div>

              <!-- Response footer (AI only) -->
              <div v-if="msg.role === 'assistant'" class="mt-3 pt-2 border-t border-[var(--color-border)]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                    <span class="text-[var(--color-text)] font-medium">{{ selectedExpert.label }}</span>
                    <span>·</span>
                    <span>{{ msg.elapsed ? formatElapsed(msg.elapsed) : '0.3s' }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button @click="copyMessage(msg.content)" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors" title="Copy">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button @click="regenerateMessage(i)" class="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors" title="Regenerate">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                    </button>
                    <button @click="rateMessage(i, 'like')" class="p-1 rounded transition-colors" :class="msg.rating === 'like' ? 'text-[var(--color-text)] bg-[var(--color-surface-elevated)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'" title="Like">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h14.6a2 2 0 0 0 2-1.7l1.2-7a2 2 0 0 0-2-2.3H14V4a2 2 0 0 0-2-2h-1.4a2 2 0 0 0-1.9 1.4L7 11v11"/></svg>
                    </button>
                    <button @click="rateMessage(i, 'dislike')" class="p-1 rounded transition-colors" :class="msg.rating === 'dislike' ? 'text-[var(--color-text)] bg-[var(--color-surface-elevated)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'" title="Dislike">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2v9m0 0v1.5M17 11h3.3a2 2 0 0 1 2 1.7l1.2 7a2 2 0 0 1-2 2.3H7.4a2 2 0 0 1-2-1.4L4 13.7V11"/><path d="M17 2H8.4a2 2 0 0 0-1.9 1.4L4 11"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="msg.role === 'user'" class="w-7 h-7 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 mt-1 border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)]">
              {{ userInitial }}
            </div>
          </div>

          <!-- Thinking indicator -->
          <div v-if="streaming" class="flex gap-3">
            <div class="w-7 h-7 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 mt-1 border border-[var(--color-border)]">
              <div class="flex items-center gap-[2px]">
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-primary)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-primary-light)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-accent)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-success)]"></span>
              </div>
            </div>
            <div class="chat-bubble-stream">
              <div v-if="streamThinking || !streamAnswer" class="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                <div class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] animate-pulse" style="animation-delay:0.2s"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" style="animation-delay:0.4s"></span>
                </div>
                <span class="text-[10px] font-medium uppercase tracking-wider">{{ streamThinking ? 'Thinking...' : 'Responding...' }}</span>
              </div>
            </div>
          </div>

          <!-- Verifying indicator -->
          <div v-if="verifying" class="flex gap-3">
            <div class="w-7 h-7 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 mt-1 border border-[var(--color-border)]">
              <div class="flex items-center gap-[2px]">
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-primary)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-primary-light)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-accent)]"></span>
                <span class="w-[3px] h-[3px] rounded-full bg-[var(--color-success)]"></span>
              </div>
            </div>
            <div class="chat-bubble-stream">
              <div class="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                <div class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] animate-pulse" style="animation-delay:0.2s"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" style="animation-delay:0.4s"></span>
                </div>
                <span class="text-[10px] font-medium uppercase tracking-wider">Verifying {{ verificationCount }} claims…</span>
              </div>
            </div>
          </div>

          <div v-if="streamAnswer" class="prose-sm max-w-none leading-relaxed">
            <span v-html="sanitizeHtml(renderMarkdown(streamAnswer))"></span>
            <span class="inline-block w-0.5 h-4 bg-[var(--color-primary)] ml-0.5 animate-pulse align-text-bottom"></span>
          </div>
        </div>
      </div>

      <!-- Follow-up suggestions -->
      <div v-if="followUps.length > 0 && !streaming && !mindStore.processing" class="px-4 sm:px-6 pb-3 animate-in">
        <div class="max-w-5xl mx-auto">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[10px] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wider">Suggestions:</span>
            <button v-for="(q, i) in followUps" :key="i"
              @click="sendPrompt(q)"
              class="text-[11px] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-full px-3 py-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-all shadow-sm hover:shadow-md">
              {{ q }}
            </button>
          </div>
        </div>
      </div>

      <!-- Premium AI Chat Input -->
      <AIChatInput
        v-model="input"
        :streaming="streaming"
        :processing="mindStore.processing"
        :web-search-enabled="webSearchEnabled"
        :expert="selectedExpert"
        :attached-file="attachedFile"
        :conversation-id="conversationId"
        :show-history="showHistory"
        :mind-store="mindStore"
        @update:modelValue="input = $event"
        @update:webSearchEnabled="webSearchEnabled = $event"
        @send="send"
        @send-prompt="sendPrompt"
        @trigger-file-upload="triggerFileUpload"
        @file-selected="onFileSelect"
        @remove-file="() => {}"
        @new-chat="newChat"
        @load-conversation="loadConversation"
        @delete-old-conversations="deleteOldConversations"
      />
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useMindStore } from '../stores/mind'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { sanitizeHtml } from '../lib/sanitize.js'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.min.css'
import AIChatInput from '../components/AIChatInput.vue'

let katex = null
let hljs = null
const katexReady = import('katex').then(m => { katex = m.default || m }).catch(() => {})
const hljsReady = import('highlight.js').then(m => { hljs = m.default || m }).catch(() => {})

const authStore = useAuthStore()
const mindStore = useMindStore()

const input = ref('')
const inputRef = ref(null)
const fileInputRef = ref(null)
const messagesRef = ref(null)
const expertRef = ref(null)
const followUps = ref([])
const lastElapsed = ref(null)
const showScrollButton = ref(false)
const webSearchEnabled = ref(false)

const showHistory = ref(false)
const showToolSheet = ref(false)
const conversations = ref([])
const conversationId = ref(null)
const attachedFile = ref(null)
const showExpertMenu = ref(false)
const selectedExpert = ref({ id: 'general', label: 'General Assistant', icon: '\u{1F9E0}' })

const streaming = ref(false)
const streamThinking = ref('')
const streamAnswer = ref('')
const verifying = ref(false)
const verificationCount = ref(0)
let abortController = null

const experts = [
  { id: 'general', label: 'General Assistant', icon: '\u2728', description: 'Help with any topic', prompt: 'You are a warm, conversational AI assistant like ChatGPT, Claude, and Gemini. Be natural and thoughtful — greet back when greeted, match the user\'s tone. When asked to teach a topic, teach it like a comprehensive textbook: start from the fundamentals, build step by step, cover everything the user needs to know from basics to advanced concepts, include examples and real-world applications. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'math', label: 'Math Tutor', icon: '\u2211', description: 'Step-by-step math help', prompt: 'You are a warm math tutor like Khan Academy and ChatGPT. Be friendly and encouraging. When asked to teach a topic, teach it like a textbook: start with the core idea, build up step by step with simple examples, then move to harder problems, cover edge cases and common mistakes. Never use LaTeX — write "x squared" instead. Always end with a follow-up question.' },
  { id: 'programming', label: 'Programming Mentor', icon: '\u2328', description: 'Code & algorithms', prompt: 'You are a warm programming mentor like ChatGPT and GitHub Copilot. Be encouraging and thorough. When asked to teach a topic, teach it like a textbook: start with why it matters, explain the concept simply, show examples, then dive into advanced patterns, best practices, and common pitfalls. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'medical', label: 'Medical Explainer', icon: '\u2695', description: 'Health & sciences', prompt: 'You are a warm medical educator like a textbook author. Be approachable and clear. When asked to teach a topic, cover anatomy, function, conditions, and treatments — start simple, build to advanced. Explain in plain language. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'history', label: 'History Expert', icon: '\u{1F4DC}', description: 'Events & contexts', prompt: 'You are a warm history professor like a textbook author. Be engaging and narrative-driven. When asked to teach a topic, cover causes, key events, major figures, impacts — tell the full story from beginning to advanced analysis. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'writing', label: 'Writing Coach', icon: '\u270D', description: 'Essays & grammar', prompt: 'You are a warm writing coach like a composition textbook. Be encouraging and thorough. When asked to teach a topic, cover structure, techniques, examples, and common mistakes — from basics to advanced rhetorical strategies. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'physics', label: 'Physics Tutor', icon: '\u269B', description: 'Laws & problems', prompt: 'You are a warm physics tutor like a textbook. Be engaging and clear. When asked to teach a topic, cover laws, real-world examples, and problem-solving — start with intuition, build to formulas, then advanced applications. Spell out formulas in words. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'chemistry', label: 'Chemistry Tutor', icon: '\u{1F52C}', description: 'Reactions & theory', prompt: 'You are a warm chemistry tutor like a textbook. Be approachable and thorough. When asked to teach a topic, cover reactions, theories, and lab applications — from basics to advanced mechanisms. Explain in plain language. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'literature', label: 'Literature Guide', icon: '\u{1F4D6}', description: 'Texts & analysis', prompt: 'You are a warm literature guide like a textbook. Be engaging and insightful. When asked to teach a topic, cover themes, devices, context, and analysis — from basic reading to advanced critical theory. Use plain conversational language. Never use LaTeX. Always end with a follow-up question.' },
  { id: 'career', label: 'Career Advisor', icon: '\u{1F4BC}', description: 'Paths & guidance', prompt: 'You are a warm career advisor. Be supportive and thorough. When asked to teach about a career path, cover options, requirements, outlook, and growth — from entry-level to advanced. Use plain language. Never use LaTeX. Always end with a follow-up question.' },
]

const suggestions = [
  { icon: '\u{1F4D0}', text: 'Teach me calculus from the basics' },
  { icon: '\u269B', text: 'Explain quantum physics simply' },
  { icon: '\u{1F40D}', text: 'Help me debug my Python code' },
  { icon: '\u270D', text: 'How to write a strong essay' },
  { icon: '\u{1F4DC}', text: 'Summarize the French Revolution' },
  { icon: '\u{1F33F}', text: 'What is photosynthesis?' },
]

function selectExpert(expert) {
  selectedExpert.value = expert
  showExpertMenu.value = false
}

const userInitial = computed(() => (authStore.user?.name?.charAt(0) || 'U').toUpperCase())

function triggerFileUpload(accept) {
  const input = fileInputRef.value
  if (input) {
    input.accept = accept
    input.click()
  }
  showToolSheet.value = false
}

function formatElapsed(ms) {
  if (!ms) return '0.3s'
  if (ms < 1000) return (ms / 1000).toFixed(1) + 's'
  return (ms / 1000).toFixed(1) + 's'
}

function toPlainText(math) {
  return math
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
    .replace(/\\sum/g, 'sum of')
    .replace(/\\int/g, 'integral of')
    .replace(/\\infty/g, 'infinity')
    .replace(/\\times/g, 'times')
    .replace(/\\div/g, 'divided by')
    .replace(/\\pm/g, 'plus or minus')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\theta/g, 'theta')
    .replace(/\\pi/g, 'pi')
    .replace(/\\Delta/g, 'Delta')
    .replace(/\\Sigma/g, 'Sigma')
    .replace(/\\rightarrow/g, 'approaches')
    .replace(/\\Rightarrow/g, 'implies')
    .replace(/\\approx/g, 'approximately')
    .replace(/\\neq/g, 'not equal to')
    .replace(/\\geq/g, 'greater than or equal to')
    .replace(/\\leq/g, 'less than or equal to')
    .replace(/\\cdot/g, 'dot')
    .replace(/\^\{([^}]+)\}/g, '^$1')
    .replace(/\^(\d)/g, '^$1')
    .replace(/_\{([^}]+)\}/g, '_$1')
    .replace(/_(\d)/g, '_$1')
    .replace(/[{}]/g, '')
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
      try {
        const html = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
        displayMathBlocks.push(`<div class="math-display">${html}</div>`)
      } catch {
        displayMathBlocks.push(`<div class="math-error">${math}</div>`)
      }
    } else {
      displayMathBlocks.push(`<div class="math-display">${math}</div>`)
    }
    displayIdx++
    return key
  })

  const inlineMathBlocks = []
  let inlineIdx = 0
  cleaned = cleaned.replace(/\$(.+?)\$/g, (_, math) => {
    const key = `__IM${inlineIdx}__`
    if (katex) {
      try {
        const html = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
        inlineMathBlocks.push(`<span class="math-inline">${html}</span>`)
      } catch {
        inlineMathBlocks.push(`<span class="math-error">${math}</span>`)
      }
    } else {
      inlineMathBlocks.push(`<span class="math-inline">${math}</span>`)
    }
    inlineIdx++
    return key
  })

  let html = cleaned
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const validLang = lang && hljs?.getLanguage(lang) ? lang : ''
    const highlighted = validLang ? hljs.highlight(code.trim(), { language: validLang }).value : escapeHtml(code.trim())
    return `<div class="code-block-wrapper"><div class="code-lang">${lang || 'code'}</div><pre class="code-block"><code class="${validLang ? 'hljs' : ''}">${highlighted}</code></pre></div>`
  })
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="chat-image" loading="lazy" />')
  html = html.replace(/### (.+)/g, '<h3 class="text-base font-bold mt-3 mb-1.5">$1</h3>')
  html = html.replace(/## (.+)/g, '<h2 class="text-lg font-bold mt-3 mb-1.5">$1</h2>')
  html = html.replace(/# (.+)/g, '<h1 class="text-xl font-bold mt-3 mb-1.5">$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^- (.+)/gm, '<li class="ml-4 list-disc mb-0.5">$1</li>')
  html = html.replace(/^\d+\. (.+)/gm, '<li class="ml-4 list-decimal mb-0.5">$1</li>')

  // Tables
  html = html.replace(/^\|(.+)\|\s*$/gm, (line) => {
    const cells = line.slice(1, -1).trim().split('|').map(c => c.trim())
    const isHeader = cells.length > 0 && cells.every(isMarkdownDividerCell)
    if (isHeader) return '<hr class="table-divider">'
    const tag = 'td'
    return '<tr>' + cells.map(c => `<${tag} class="table-cell">${c || ''}</${tag}>`).join('') + '</tr>'
  })
  html = html.replace(
    /<tr>.*?<\/tr>\s*(<hr class="table-divider">\s*)?(<tr>.*?<\/tr>\s*)+/g,
    (match) => {
      const rows = match.split(/\s*<hr class="table-divider">\s*/)
      if (rows.length === 2) {
        const header = rows[0].replace(/<td>/g, '<th class="table-cell table-header">').replace(/<\/td>/g, '</th>')
        return `<table class="markdown-table"><thead>${header}</thead><tbody>${rows[1]}</tbody></table>`
      }
      return `<table class="markdown-table"><tbody>${match}</tbody></table>`
    }
  )

  // Horizontal rules (must be on own line, not part of table)
  html = html.replace(/^---\s*$/gm, '<hr class="my-3 border-[var(--color-border)]">')

  html = html.replace(/\n\n/g, '</p><p class="mb-2.5">')
  html = '<p class="mb-2.5">' + html + '</p>'

  displayMathBlocks.forEach((h, i) => { html = html.replace(`__DM${i}__`, h) })
  inlineMathBlocks.forEach((h, i) => { html = html.replace(`__IM${i}__`, h) })

  return html
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function sendStream(msg) {
  streaming.value = true
  streamThinking.value = ''
  streamAnswer.value = ''
  followUps.value = []
  let streamError = ''

  const startTime = performance.now()
  if (abortController) abortController.abort()
  abortController = new AbortController()

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || null
    if (!token) throw new Error('No auth token')

    const history = mindStore.messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

    const response = await fetch(`${baseUrl}/api/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ message: msg, history, conversationId: conversationId.value, expert: selectedExpert.value.id, council: true, webSearch: webSearchEnabled.value }),
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
        // Process any remaining data in buffer
        if (buffer.trim()) {
          const line = buffer.trim()
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) streamAnswer.value = data.content
              if (data.answer) streamAnswer.value = data.answer
            } catch (e) { console.warn('[Chat] Parse stream event failed:', e) }
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
              case 'verifying':
                verifying.value = true
                verificationCount.value = data.count || 0
                break
              case 'claim_verified':
                // Optional: could track individual claims
                break
              case 'verified':
                verifying.value = false
                break
case 'done':
                streamThinking.value = data.thinking || streamThinking.value
                streamAnswer.value = data.answer || streamAnswer.value
                if (data.conversationId) conversationId.value = data.conversationId
                if (data.followUps) followUps.value = data.followUps
                setTimeout(() => scrollToBottom(true), 100)
                break
              case 'error': console.error('Stream error:', data.message); streamError = data.message; break
              default:
                // Treat unknown events as answer data
                if (data.content) streamAnswer.value = data.content
                break
            }
          } catch (e) { console.warn('[Chat] Parse stream data failed:', e) }
        }
      }
      await scrollToBottom()
    }

    lastElapsed.value = Math.round(performance.now() - startTime)

    if (streamAnswer.value) {
      mindStore.messages.push({
        role: 'assistant', content: streamAnswer.value,
        council: [{ provider: 'stream', thinking: streamThinking.value, answer: streamAnswer.value }],
        thinking: streamThinking.value, elapsed: lastElapsed.value, rating: null, showThinking: false,
      })
      streamAnswer.value = '' // clear to avoid duplication
    } else if (streamError) {
      mindStore.messages.push({
        role: 'assistant', content: `I'm sorry, I couldn't process your request. The AI service is currently unavailable. Please try again later.`,
        elapsed: lastElapsed.value, rating: null,
      })
    } else {
      mindStore.messages.push({
        role: 'assistant', content: `I wasn't able to generate a response. Please try rephrasing your question.`,
        elapsed: lastElapsed.value, rating: null,
      })
    }
  } catch (err) {
    console.error('Stream error:', err)
    const elapsed = Math.round(performance.now() - startTime)
    mindStore.messages.push({
      role: 'assistant',
      content: `I'm sorry, I couldn't process your request. The AI service is currently unavailable. Please try again later.`,
      elapsed, rating: null,
    })
    lastElapsed.value = elapsed
  } finally {
    streaming.value = false
  }

  await scrollToBottom()
}

async function send() {
  if ((!input.value.trim() && !attachedFile.value) || streaming.value || mindStore.processing) return
  const msg = input.value.trim()
  input.value = ''
  attachedFile.value = null

  mindStore.messages.push({ role: 'user', content: msg })
  await sendStream(msg)
  await scrollToBottom()
}

async function sendPrompt(text) {
  if (streaming.value || mindStore.processing) return
  input.value = text
  await send()
}

async function copyMessage(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) { console.warn('[Chat] Copy failed:', e) }
}

async function regenerateMessage(index) {
  if (streaming.value) return
  const msg = mindStore.messages[index]
  if (!msg || msg.role !== 'assistant') return
  const prevUserMsg = mindStore.messages.slice(0, index).reverse().find(m => m.role === 'user')
  if (!prevUserMsg) return
  followUps.value = []
  mindStore.messages.splice(index, 1)
  lastElapsed.value = null
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

function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) attachedFile.value = file
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function fetchConversations() {
  try {
    const { data } = await api.get('/chats')
    conversations.value = Array.isArray(data) ? data : []
  } catch { conversations.value = [] }
}

async function loadConversation(conv) {
  try {
    const { data } = await api.get(`/chats/${conv.id}/messages`)
    const msgs = Array.isArray(data) ? data : []
    mindStore.setMessages(msgs.map(m => ({ role: m.role, content: m.content, council: [], thinking: '', elapsed: null, rating: null, showThinking: false })))
    conversationId.value = conv.id
    showHistory.value = false
    followUps.value = []
    lastElapsed.value = null
    await nextTick()
    setTimeout(() => scrollToBottom(true), 200)
  } catch (e) { console.warn('[Chat] Load conversation failed:', e) }
}

function newChat() {
  mindStore.clearChat()
  conversationId.value = null
  lastElapsed.value = null
  followUps.value = []
  showHistory.value = false
  showToolSheet.value = false
}

async function deleteOldConversations() {
  try {
    await api.post('/chats/cleanup', { days: 50 })
    await fetchConversations()
  } catch (e) { console.warn('[Chat] Cleanup failed:', e) }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
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
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 999px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }

@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.08); }
}

.animate-pulse-glow {
  animation: pulse-glow 8s ease-in-out infinite;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes brain-argue {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  12% { transform: scale(2); opacity: 1; }
  25% { transform: scale(1.1); opacity: 0.6; }
  40% { transform: scale(1.7); opacity: 0.85; }
  55% { transform: scale(1); opacity: 0.35; }
  70% { transform: scale(1.4); opacity: 0.7; }
  85% { transform: scale(1.1); opacity: 0.5; }
}

.brain-node {
  animation: brain-argue 3.2s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
  filter: drop-shadow(0 0 4px currentColor);
}

.brain-node-center {
  animation-duration: 2.6s;
  filter: drop-shadow(0 0 8px currentColor);
}

@keyframes brain-glow-pulse {
  0%, 100% { opacity: 0.06; r: 12; }
  50% { opacity: 0.2; r: 15; }
}

.brain-glow {
  animation: brain-glow-pulse 3.5s ease-in-out infinite;
}

@keyframes nerve-fire {
  0% { stroke-dashoffset: 20; opacity: 0.1; }
  50% { opacity: 0.5; }
  100% { stroke-dashoffset: 0; opacity: 0.1; }
}

.nerve-line {
  animation: nerve-fire 2s linear infinite;
}

.nerve-lines {
  stroke-linecap: round;
}

@keyframes pulse-expand {
  0% { r: 4; opacity: 0; }
  50% { r: 8; opacity: 0.3; }
  100% { r: 12; opacity: 0; }
}

.burst-ring {
  animation: pulse-expand 3.2s ease-out infinite;
}

@keyframes ring-wave {
  0% { r: 18; opacity: 0.08; }
  50% { r: 26; opacity: 0.15; }
  100% { r: 32; opacity: 0; }
}

.pulse-ring {
  animation: ring-wave 4s ease-out infinite;
}
</style>

<style scoped>
.chat-bubble-user {
  max-width: 78%;
  background: var(--color-primary);
  border-radius: 18px 18px 4px 18px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  color: #FFFFFF;
}

.chat-bubble-ai {
  max-width: 82%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.chat-bubble-stream {
  max-width: 82%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.streaming-bubble {
  border-color: var(--color-border-accent);
  min-width: 240px;
}

:deep(.code-block-wrapper) {
  margin: 8px 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
:deep(.code-lang) {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 12px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}
:deep(.code-block) {
  background: var(--color-surface-elevated);
  padding: 12px;
  overflow-x: auto;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text);
}
:deep(.inline-code) {
  background: var(--color-surface-elevated);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 13px;
  color: var(--color-primary);
}
:deep(.math-display) {
  overflow-x: auto;
  padding: 8px 0;
  margin: 8px 0;
  text-align: center;
}
:deep(.math-inline) {
  display: inline-block;
  vertical-align: middle;
}
:deep(.math-error) {
  color: var(--color-red-brand);
  font-style: italic;
  font-size: 0.85em;
}
:deep(.math-plain) {
  font-style: italic;
  color: var(--color-text);
  background: var(--color-surface-elevated);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 0.9em;
}
:deep(.chat-image) {
  max-width: 100%;
  border-radius: 12px;
  margin: 12px 0;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
:deep(li) { margin-bottom: 3px; }
:deep(.markdown-table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 8px 0;
  font-size: 13px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
:deep(.table-cell) {
  padding: 6px 10px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}
:deep(.table-header) {
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-surface-elevated);
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
:deep(.markdown-table tr:last-child td) { border-bottom: none; }
:deep(.markdown-table tr:hover td) { background: var(--color-surface-elevated); }

/* Responsive */
@media (max-width: 768px) {
  .chat-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    width: 220px;
    box-shadow: 8px 0 32px rgba(0,0,0,0.2);
    animation: slideIn 0.2s ease-out;
  }
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  .chat-bubble-user, .chat-bubble-ai, .chat-bubble-stream {
    max-width: 92%;
    font-size: 13px;
    padding: 8px 12px;
  }
}
@media (max-width: 480px) {
  .chat-bubble-user, .chat-bubble-ai, .chat-bubble-stream {
    max-width: 95%;
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style>