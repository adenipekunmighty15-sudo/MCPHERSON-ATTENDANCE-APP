<template>
  <section class="messages-page" aria-label="Messages">
    <aside class="conversation-panel" :class="{ 'conversation-panel-hidden': store.activeConversationId }">
      <header class="panel-header">
        <div>
          <p class="eyebrow">Connect</p>
          <h1>Messages</h1>
        </div>
        <button class="icon-button primary-icon" type="button" aria-label="New conversation" title="New conversation" @click="showNewChat = true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </header>

      <label class="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input v-model="store.searchQuery" type="search" placeholder="Search conversations" aria-label="Search conversations" />
      </label>

      <div class="filter-tabs" role="group" aria-label="Filter conversations">
        <button type="button" :class="{ selected: store.filterMode === 'all' }" @click="store.filterMode = 'all'">All</button>
        <button type="button" :class="{ selected: store.filterMode === 'unread' }" @click="store.filterMode = 'unread'">
          Unread <span v-if="store.unreadTotal" class="filter-count">{{ store.unreadTotal }}</span>
        </button>
      </div>

      <div v-if="store.error" class="inline-error" role="alert">
        <span>{{ store.error }}</span>
        <button type="button" @click="retry">Retry</button>
      </div>

      <div v-if="store.loading && !store.conversations.length" class="conversation-list" aria-label="Loading conversations">
        <div v-for="index in 4" :key="index" class="conversation-skeleton">
          <span></span><div><i></i><i></i></div>
        </div>
      </div>
      <div v-else-if="store.filteredConversations.length === 0" class="list-empty">
        <div class="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></svg>
        </div>
        <p>{{ store.filterMode === 'unread' ? 'No unread messages' : store.searchQuery ? 'No conversations match your search' : 'Your inbox is empty' }}</p>
        <button v-if="store.filterMode !== 'unread' && !store.searchQuery" type="button" class="text-button" @click="showNewChat = true">
          Start a conversation
        </button>
      </div>
      <nav v-else class="conversation-list" aria-label="Conversations">
        <button
          v-for="conversation in store.filteredConversations"
          :key="conversation.id"
          type="button"
          class="conversation-item"
          :class="{ active: conversation.id === store.activeConversationId }"
          :aria-current="conversation.id === store.activeConversationId ? 'page' : undefined"
          @click="store.setActiveConversation(conversation.id)"
        >
          <span class="avatar" :class="avatarTone(conversation.partner?.role)">
            {{ initials(partnerFor(conversation)?.name) }}
          </span>
          <span class="conversation-copy">
            <span class="conversation-topline">
              <span class="conversation-name">{{ partnerFor(conversation)?.name || 'User' }}</span>
              <time v-if="conversation.lastMessage?.timestamp" class="conversation-time">{{ store.formatTimestamp(conversation.lastMessage.timestamp) }}</time>
            </span>
            <span class="conversation-bottomline">
              <span class="conversation-preview">
                <span v-if="conversation.lastMessage?.senderId === 'me'">You: </span>
                {{ conversation.lastMessage?.content || 'Start a conversation' }}
              </span>
              <span v-if="conversation.unreadCount" class="unread-badge">{{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}</span>
            </span>
          </span>
        </button>
      </nav>
    </aside>

    <main class="thread-panel">
      <template v-if="store.activeConversation">
        <header class="thread-header">
          <button type="button" class="icon-button mobile-back" aria-label="Back to conversations" @click="store.activeConversationId = null">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span class="avatar" :class="avatarTone(activePartner?.role)">{{ initials(activePartner?.name) }}</span>
          <div class="thread-person">
            <h2>{{ activePartner?.name || 'User' }}</h2>
            <p>{{ [activePartner?.role, activePartner?.department].filter(Boolean).join(' · ') || 'Direct conversation' }}</p>
          </div>
          <button type="button" class="icon-button thread-action" aria-label="Hide conversation" title="Hide conversation" @click="hideConversation">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>
          </button>
        </header>

        <div ref="threadRef" class="message-history" role="log" aria-label="Message history" aria-live="polite">
          <div v-if="store.loadingMessages && !store.activeMessages.length" class="thread-empty">
            <span class="loading-spinner" aria-hidden="true"></span>
            <p>Loading messages…</p>
          </div>
          <div v-else-if="!store.activeMessages.length" class="thread-empty">
            <div class="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></svg>
            </div>
            <p>No messages yet</p>
            <span>Send a message to get the conversation started.</span>
          </div>
          <template v-else>
            <div v-for="group in groupedMessages" :key="group.label" class="message-day">
              <span>{{ group.label }}</span>
              <article
                v-for="message in group.messages"
                :key="message.id"
                class="message-row"
                :class="{ mine: message.senderId === 'me' }"
              >
                <div class="message-bubble">
                  <div v-if="replyPreview(message)" class="reply-preview">
                    <strong>{{ message.replyPreview?.senderId === 'me' || replyPreview(message)?.senderId === 'me' ? 'You' : activePartner?.name }}</strong>
                    <span>{{ message.replyPreview?.content || replyPreview(message)?.content }}</span>
                  </div>
                  <p class="message-content">{{ message.content }}</p>
                  <footer class="message-meta">
                    <time>{{ store.formatTime(message.timestamp) }}</time>
                    <span v-if="message.senderId === 'me' && message.status" :style="{ color: store.getStatusColor(message.status) }" :aria-label="message.status">
                      {{ store.getStatusIcon(message.status) }}
                    </span>
                  </footer>
                </div>
                <button
                  type="button"
                  class="reply-button"
                  :aria-label="`Reply to message: ${message.content.slice(0, 60)}`"
                  title="Reply"
                  @click="store.setReplyTo(message.id)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 17-5-5 5-5M4 12h9a7 7 0 0 1 7 7" /></svg>
                </button>
              </article>
            </div>
          </template>
        </div>

        <div v-if="store.error" class="composer-error" role="alert">{{ store.error }}</div>
        <form class="composer" @submit.prevent="send">
          <div v-if="store.replyToMessage" class="replying-to">
            <span>Replying to {{ store.replyToMessage.senderId === 'me' ? 'yourself' : activePartner?.name }}</span>
            <span class="replying-content">{{ store.replyToMessage.content }}</span>
            <button type="button" aria-label="Cancel reply" @click="store.clearReplyTo()">×</button>
          </div>
          <div class="composer-row">
            <textarea
              v-model="messageText"
              rows="1"
              maxlength="5000"
              placeholder="Write a message…"
              aria-label="Write a message"
              :disabled="store.sending"
              @keydown.enter.exact.prevent="send"
            ></textarea>
            <button class="send-button" type="submit" :disabled="!messageText.trim() || store.sending" aria-label="Send message">
              <span v-if="store.sending" class="loading-spinner" aria-hidden="true"></span>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </button>
          </div>
          <p class="composer-hint">Text messages are sent securely to this conversation.</p>
        </form>
      </template>

      <div v-else class="welcome-panel">
        <div class="welcome-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></svg>
        </div>
        <h2>Your conversations, in one place</h2>
        <p>Choose a conversation or start a new one with a student or lecturer.</p>
        <button type="button" class="new-conversation-button" @click="showNewChat = true">New conversation</button>
      </div>
    </main>

    <div v-if="showNewChat" class="dialog-backdrop" @click.self="showNewChat = false">
      <section class="contacts-dialog" role="dialog" aria-modal="true" aria-labelledby="new-conversation-title">
        <header class="dialog-header">
          <div>
            <p class="eyebrow">Messages</p>
            <h2 id="new-conversation-title">New conversation</h2>
          </div>
          <button type="button" class="icon-button" aria-label="Close" @click="showNewChat = false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
        </header>
        <label class="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input v-model="newChatSearch" type="search" placeholder="Search people by name or department" aria-label="Search people" />
        </label>
        <p v-if="store.error" class="inline-error" role="alert">{{ store.error }}</p>
        <div class="contact-list">
          <template v-for="group in filteredContactGroups" :key="group.label">
            <h3 class="contact-group-title">{{ group.label }}</h3>
            <button
              v-for="contact in group.contacts"
              :key="contact.id"
              type="button"
              class="contact-item"
              :disabled="openingContactId === contact.id"
              @click="startNewChat(contact.id)"
            >
              <span class="avatar" :class="avatarTone(contact.role)">{{ initials(contact.name) }}</span>
              <span class="contact-copy">
                <strong>{{ contact.name }}</strong>
                <span>{{ [contact.role, contact.department].filter(Boolean).join(' · ') || 'MCU member' }}</span>
              </span>
              <span class="contact-open">{{ openingContactId === contact.id ? 'Opening…' : 'Message' }}</span>
            </button>
          </template>
          <div v-if="!filteredContactGroups.length" class="list-empty contact-empty">
            <p>{{ newChatSearch ? 'No people match your search.' : 'No active students or lecturers are available yet.' }}</p>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useMessagingStore } from '../stores/messaging'

const store = useMessagingStore()
const messageText = ref('')
const showNewChat = ref(false)
const newChatSearch = ref('')
const openingContactId = ref(null)
const threadRef = ref(null)
let messagePollingTimer = null

const activePartner = computed(() => {
  const conversation = store.activeConversation
  if (!conversation) return null
  return conversation.partner || store.contactMap[conversation.participants[0]] || null
})

const filteredContactGroups = computed(() => {
  const search = newChatSearch.value.trim().toLowerCase()
  return store.contactsByGroup
    .map(group => ({
      ...group,
      contacts: group.contacts.filter(contact =>
        !search || [contact.name, contact.department, contact.role]
          .some(value => value?.toLowerCase().includes(search))
      ),
    }))
    .filter(group => group.contacts.length)
})

const groupedMessages = computed(() => {
  const groups = []
  for (const message of store.activeMessages) {
    const date = new Date(message.timestamp)
    const key = Number.isNaN(date.getTime()) ? 'unknown' : date.toDateString()
    let group = groups[groups.length - 1]
    if (!group || group.key !== key) {
      group = { key, label: formatDay(date), messages: [] }
      groups.push(group)
    }
    group.messages.push(message)
  }
  return groups
})

function formatDay(date) {
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

function partnerFor(conversation) {
  return conversation.partner || store.contactMap[conversation.participants[0]]
}

function initials(name) {
  return (name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
}

function avatarTone(role) {
  return role === 'lecturer' ? 'lecturer-tone' : ''
}

function replyPreview(message) {
  return message.replyPreview || store.activeMessages.find(item => item.id === message.replyTo)
}

async function scrollToLatest() {
  await nextTick()
  if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
}

async function send() {
  const text = messageText.value.trim()
  if (!text || store.sending) return
  try {
    await store.sendMessage(text)
    messageText.value = ''
    await scrollToLatest()
  } catch {
    // The store exposes the server error in the composer.
  }
}

async function startNewChat(contactId) {
  openingContactId.value = contactId
  try {
    await store.startConversation(contactId)
    showNewChat.value = false
    newChatSearch.value = ''
  } catch {
    // The store exposes the server error in the dialog.
  } finally {
    openingContactId.value = null
  }
}

async function hideConversation() {
  const conversationId = store.activeConversationId
  if (!conversationId) return
  try {
    await store.deleteChat(conversationId)
  } catch {
    // The store exposes the server error in the conversation list.
  }
}

async function retry() {
  await store.init()
  if (store.activeConversationId) await store.loadMessages(store.activeConversationId)
}

watch(
  () => [store.activeConversationId, store.activeMessages.length],
  scrollToLatest
)

onMounted(async () => {
  await store.init()
  messagePollingTimer = window.setInterval(() => {
    if (store.activeConversationId) {
      store.loadMessages(store.activeConversationId)
    } else {
      store.refreshConversations()
    }
  }, 5000)
})

onUnmounted(() => {
  if (messagePollingTimer) window.clearInterval(messagePollingTimer)
})
</script>

<style scoped>
.messages-page {
  display: grid;
  grid-template-columns: minmax(290px, 360px) minmax(0, 1fr);
  min-height: min(760px, calc(100dvh - 112px));
  height: calc(100dvh - 112px);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  box-shadow: 0 12px 40px rgba(15, 30, 61, 0.06);
}

.conversation-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.panel-header,
.thread-header,
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-header {
  justify-content: space-between;
  padding: 24px 22px 18px;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-header h1,
.dialog-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.icon-button {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
}

.icon-button:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.icon-button svg,
.search-box svg,
.empty-icon svg,
.welcome-icon svg,
.send-button svg,
.reply-button svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.primary-icon {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.primary-icon:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-hover, var(--color-primary));
  color: #fff;
}

.search-box {
  display: flex;
  height: 42px;
  align-items: center;
  gap: 9px;
  margin: 0 18px 16px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-elevated);
  color: var(--color-text-tertiary);
}

.search-box svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  font-size: 12px;
}

.search-box input::placeholder {
  color: var(--color-text-tertiary);
}

.filter-tabs {
  display: flex;
  gap: 5px;
  padding: 0 18px 14px;
}

.filter-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.filter-tabs button.selected {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.filter-count,
.unread-badge {
  display: inline-flex;
  min-width: 19px;
  height: 19px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.conversation-list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 12px;
}

.conversation-item {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.conversation-item:hover,
.conversation-item.active {
  background: var(--color-surface-elevated);
}

.conversation-item.active {
  box-shadow: inset 3px 0 var(--color-primary);
}

.avatar {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 800;
}

.avatar.lecturer-tone {
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
}

.conversation-copy,
.contact-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.conversation-topline,
.conversation-bottomline {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conversation-name,
.conversation-preview,
.conversation-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-name {
  font-size: 12px;
  font-weight: 750;
}

.conversation-time {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 9px;
}

.conversation-preview {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.unread-badge {
  min-width: 18px;
  height: 18px;
}

.inline-error,
.composer-error {
  margin: 0 16px 12px;
  padding: 10px 12px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.06);
  color: var(--color-error, #b91c1c);
  font-size: 11px;
}

.inline-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.inline-error button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.list-empty,
.thread-empty,
.welcome-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 26px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.list-empty p,
.thread-empty p,
.welcome-panel p {
  margin: 10px 0 0;
  font-size: 12px;
}

.empty-icon,
.welcome-icon {
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 17px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.empty-icon svg,
.welcome-icon svg {
  width: 23px;
  height: 23px;
}

.text-button {
  margin-top: 8px;
  padding: 5px;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
}

.thread-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 50% 0, var(--color-primary-soft) 0, transparent 38%),
    var(--color-bg);
}

.thread-header {
  min-height: 72px;
  padding: 14px 22px;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
}

.thread-header .avatar {
  width: 40px;
  height: 40px;
}

.thread-person {
  min-width: 0;
  flex: 1;
}

.thread-person h2 {
  overflow: hidden;
  margin: 0;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-person p {
  overflow: hidden;
  margin: 4px 0 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: capitalize;
}

.message-history {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  padding: 22px clamp(14px, 5vw, 56px);
}

.thread-empty {
  min-height: 220px;
}

.thread-empty span:not(.loading-spinner) {
  margin-top: 5px;
  font-size: 11px;
}

.message-day {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-day > span {
  align-self: center;
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 700;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.message-row.mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(72%, 560px);
  padding: 10px 12px 7px;
  border: 1px solid var(--color-border);
  border-radius: 15px 15px 15px 4px;
  background: var(--color-surface);
  box-shadow: 0 2px 6px rgba(15, 30, 61, 0.04);
}

.mine .message-bubble {
  border-color: var(--color-primary);
  border-radius: 15px 15px 4px 15px;
  background: var(--color-primary);
  color: #fff;
}

.message-content {
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.55;
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 5px;
  color: var(--color-text-tertiary);
  font-size: 9px;
}

.mine .message-meta {
  color: rgba(255, 255, 255, 0.72);
}

.reply-preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: -2px 0 8px;
  padding: 5px 8px;
  border-left: 2px solid currentColor;
  border-radius: 3px;
  background: rgba(127, 127, 127, 0.1);
  font-size: 9px;
  opacity: 0.85;
}

.reply-preview span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reply-button {
  display: inline-flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.message-row:hover .reply-button,
.reply-button:focus-visible {
  opacity: 1;
}

.reply-button svg {
  width: 14px;
  height: 14px;
}

.composer {
  padding: 12px 20px 14px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.composer-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background: var(--color-surface-elevated);
}

.composer textarea {
  width: 100%;
  max-height: 140px;
  min-height: 38px;
  resize: vertical;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
}

.composer textarea::placeholder {
  color: var(--color-text-tertiary);
}

.send-button {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 11px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.send-button svg {
  width: 17px;
  height: 17px;
}

.composer-hint {
  margin: 7px 3px 0;
  color: var(--color-text-tertiary);
  font-size: 9px;
}

.replying-to {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 10px;
  border-left: 3px solid var(--color-primary);
  border-radius: 7px;
  background: var(--color-primary-soft);
  color: var(--color-text-secondary);
  font-size: 10px;
}

.replying-content {
  overflow: hidden;
  flex: 1;
  color: var(--color-text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.replying-to button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
}

.composer-error {
  margin: 10px 20px 0;
}

.welcome-panel {
  min-height: 100%;
}

.welcome-icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
}

.welcome-icon svg {
  width: 30px;
  height: 30px;
}

.welcome-panel h2 {
  margin: 20px 0 0;
  color: var(--color-text-primary);
  font-size: 19px;
  font-weight: 800;
}

.welcome-panel p {
  max-width: 350px;
  line-height: 1.6;
}

.new-conversation-button {
  margin-top: 18px;
  padding: 11px 16px;
  border: 0;
  border-radius: 11px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 800;
}

.dialog-backdrop {
  position: fixed;
  z-index: 10000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(5px);
}

.contacts-dialog {
  display: flex;
  width: min(480px, 100%);
  max-height: min(680px, 90dvh);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
}

.dialog-header {
  justify-content: space-between;
  padding: 22px 22px 16px;
}

.contact-list {
  min-height: 120px;
  overflow-y: auto;
  padding: 0 12px 14px;
}

.contact-group-title {
  margin: 13px 10px 7px;
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.contact-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
}

.contact-item:hover:not(:disabled) {
  background: var(--color-surface-elevated);
}

.contact-item:disabled {
  cursor: progress;
  opacity: 0.6;
}

.contact-item .avatar {
  width: 38px;
  height: 38px;
}

.contact-copy strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-copy span {
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: capitalize;
}

.contact-open {
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 750;
}

.contact-empty {
  min-height: 120px;
}

.conversation-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
}

.conversation-skeleton > span {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-surface-elevated);
}

.conversation-skeleton div {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
}

.conversation-skeleton i {
  height: 8px;
  border-radius: 5px;
  background: var(--color-surface-elevated);
}

.conversation-skeleton i:last-child {
  width: 65%;
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.mobile-back {
  display: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .messages-page {
    position: relative;
    display: block;
    height: calc(100dvh - 142px);
    min-height: 470px;
    border-radius: 14px;
  }

  .conversation-panel {
    height: 100%;
    border-right: 0;
  }

  .conversation-panel-hidden {
    display: none;
  }

  .thread-panel {
    display: flex;
    height: 100%;
  }

  .thread-header {
    gap: 9px;
    padding: 11px 12px;
  }

  .mobile-back {
    display: inline-flex;
    width: 34px;
    height: 34px;
  }

  .message-history {
    padding: 16px 12px;
  }

  .message-bubble {
    max-width: 82%;
  }

  .reply-button {
    display: none;
  }

  .composer {
    padding: 10px 10px 12px;
  }

  .composer-error {
    margin: 8px 10px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
