<template>
  <div class="messages-page" :class="{ 'show-new-chat': showNewChat }">
    <!-- ===== LEFT PANEL: CHAT LIST ===== -->
    <aside class="msg-list-panel">
      <div class="mlp-header">
        <h2 class="mlp-title">{{ authStore.user?.name?.split(' ')[0] || 'Messages' }}</h2>
        <button class="mlp-new-btn" @click="showNewChat = !showNewChat" title="New conversation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 8v8M8 12h8"/></svg>
        </button>
      </div>

      <div class="mlp-search">
        <svg class="mlp-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="store.searchQuery" class="mlp-search-input" placeholder="Search messages or people..." />
      </div>

      <div class="mlp-tabs" v-if="!store.searchQuery">
        <button v-for="tab in filterTabs" :key="tab.key" class="mlp-tab" :class="{ active: store.filterMode === tab.key }" @click="store.filterMode = tab.key">
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="mlp-tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <div class="mlp-list" ref="listRef">
        <template v-if="store.loading">
          <div v-for="n in 5" :key="n" class="mlp-skeleton">
            <div class="sk-avatar" />
            <div class="sk-lines">
              <div class="sk-line w-40" />
              <div class="sk-line w-70" />
            </div>
          </div>
        </template>

        <template v-else-if="store.filteredConversations.length === 0">
          <div class="mlp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p>No conversations yet</p>
            <button class="mlp-start-btn" @click="showNewChat = true">Start a chat</button>
          </div>
        </template>

        <template v-else>
          <button v-for="conv in store.filteredConversations" :key="conv.id" class="mlp-item" :class="{ active: conv.id === store.activeConversationId }" @click="store.setActiveConversation(conv.id)">
            <div class="mlp-item-avatar" :class="{ 'group-avatar': conv.type === 'group' }">
              <template v-if="conv.type === 'group'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </template>
              <template v-else>
                {{ getContactInitials(conv) }}
              </template>
              <span v-if="!conv.type && getContact(conv)?.online" class="online-dot" />
            </div>
            <div class="mlp-item-body">
              <div class="mlp-item-top">
                <span class="mlp-item-name">{{ conv.type === 'group' ? conv.groupName : getContact(conv)?.name || 'Unknown' }}</span>
                <span class="mlp-item-time">{{ store.formatTime(conv.lastMessage?.timestamp) }}</span>
              </div>
              <div class="mlp-item-bottom">
                <div class="mlp-item-preview">
                  <span v-if="conv.lastMessage?.senderId === 'me'" class="mlp-item-me">You: </span>
                  <span class="mlp-item-text">{{ conv.lastMessage?.content || 'No messages yet' }}</span>
                </div>
                <div class="mlp-item-meta">
                  <span v-if="conv.pinned" class="pin-icon" title="Pinned">📌</span>
                  <span v-if="conv.unreadCount > 0" class="mlp-badge">{{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}</span>
                  <span v-if="conv.type === 'group'" class="member-count">{{ conv.participants.length }}</span>
                </div>
              </div>
            </div>
          </button>
        </template>
      </div>
    </aside>

    <!-- ===== RIGHT PANEL: CONVERSATION ===== -->
    <div class="msg-thread-panel">
      <!-- Landing State -->
      <div v-if="!store.activeConversationId && !showNewChat" class="mtp-landing">
        <div class="mtp-landing-graphic">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h3>Your Messages</h3>
        <p>Select a conversation or start a new one</p>
        <button class="mtp-landing-btn" @click="showNewChat = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 8v8M8 12h8"/></svg>
          New Conversation
        </button>
      </div>

      <!-- Active Chat -->
      <template v-if="store.activeConversationId">
        <div class="mtp-thread-header">
          <button class="mtp-back-btn" @click="store.activeConversationId = null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div class="mtp-thread-avatar" :class="{ 'group-avatar': store.activeConversation?.type === 'group' }">
            <template v-if="store.activeConversation?.type === 'group'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </template>
            <template v-else>{{ getActiveContactInitials() }}</template>
          </div>
          <div class="mtp-thread-info">
            <span class="mtp-thread-name">{{ store.activeConversation?.type === 'group' ? store.activeConversation.groupName : getActiveContact()?.name || 'Unknown' }}</span>
            <span class="mtp-thread-status" v-if="store.isTyping(store.activeConversationId)">
              <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
            </span>
            <span class="mtp-thread-status" v-else-if="getActiveContact()?.online">Online</span>
            <span class="mtp-thread-status" v-else-if="getActiveContact()?.lastSeen">{{ formatLastSeen(getActiveContact()?.lastSeen) }}</span>
            <span class="mtp-thread-dept" v-else-if="store.activeConversation?.type === 'group'">{{ store.activeConversation.participants.length }} members</span>
          </div>
          <div class="mtp-thread-actions">
            <button class="mtp-action-btn" @click="showContactInfo = !showContactInfo" title="Contact info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
            <button class="mtp-action-btn" @click="store.deleteChat(store.activeConversationId)" title="Delete chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Contact Info Sidebar -->
        <div v-if="showContactInfo && !store.activeConversation?.type" class="mtp-contact-info-backdrop" @click="showContactInfo = false">
          <div class="mtp-contact-info" @click.stop>
            <button class="mtp-ci-close-top" @click="showContactInfo = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div class="mtp-ci-header">
              <div class="mtp-ci-avatar">{{ getActiveContactInitials() }}</div>
              <h3>{{ getActiveContact()?.name }}</h3>
            </div>
            <div class="mtp-ci-details">
              <div class="mtp-ci-row">
                <span class="mtp-ci-label">Department</span>
                <span class="mtp-ci-value">{{ getActiveContact()?.department }}</span>
              </div>
              <div class="mtp-ci-row">
                <span class="mtp-ci-label">Faculty</span>
                <span class="mtp-ci-value">{{ getActiveContact()?.faculty }}</span>
              </div>
              <div class="mtp-ci-row">
                <span class="mtp-ci-label">Year</span>
                <span class="mtp-ci-value">{{ getActiveContact()?.year ? `Year ${getActiveContact().year}` : '—' }}</span>
              </div>
              <div class="mtp-ci-row">
                <span class="mtp-ci-label">Role</span>
                <span class="mtp-ci-value" :class="{ 'is-lecturer': getActiveContact()?.role === 'lecturer' }">{{ getActiveContact()?.role === 'lecturer' ? 'Lecturer' : 'Student' }}</span>
              </div>
              <div class="mtp-ci-row" v-if="getActiveContact()?.courses?.length">
                <span class="mtp-ci-label">Courses</span>
                <div class="mtp-ci-courses">
                  <span v-for="c in getActiveContact()?.courses" :key="c" class="mtp-ci-course-tag">{{ c }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages Thread -->
        <div class="mtp-thread" ref="threadRef" @scroll="onThreadScroll">
          <div class="mtp-thread-scroll">
            <template v-for="(group, gi) in groupedMessages" :key="gi">
              <div class="mtp-date-divider">
                <span>{{ group.date }}</span>
              </div>
              <div v-for="msg in group.messages" :key="msg.id" class="msg-row" :class="{ 'msg-mine': msg.senderId === 'me', 'msg-theirs': msg.senderId !== 'me', 'msg-system': msg.type === 'system' }">
                <!-- Reply preview -->
                <div v-if="msg.replyTo" class="msg-reply-preview" @click="scrollToMessage(msg.replyTo)">
                  <div class="msg-reply-bar" :class="{ 'bar-mine': msg.senderId === 'me' }" />
                  <div class="msg-reply-content">
                    <span class="msg-reply-sender">{{ getReplySenderName(msg.replyTo) }}</span>
                    <span class="msg-reply-text">{{ getReplyPreview(msg.replyTo) }}</span>
                  </div>
                </div>

                <!-- System message -->
                <div v-if="msg.type === 'system'" class="msg-system-bubble">{{ msg.content }}</div>

                <!-- Normal message -->
                <div v-else class="msg-bubble-wrap" :data-msg-id="msg.id" @mouseenter="hoveredMsg = msg.id" @mouseleave="hoveredMsg = null">
                  <div class="msg-bubble" :class="{ 'has-reactions': hasActiveReactions(msg) }" @click="handleMsgClick(msg, $event)" @contextmenu.prevent="openContextMenu(msg, $event)">
                    <div class="msg-text">{{ msg.content }}</div>
                    <div class="msg-meta">
                      <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                      <span v-if="msg.senderId === 'me'" class="msg-status" :style="{ color: store.getStatusColor(msg.status) }">
                        {{ store.getStatusIcon(msg.status) }}
                      </span>
                    </div>
                    <!-- Reactions -->
                    <div v-if="hasActiveReactions(msg)" class="msg-reactions" @click.stop>
                      <span v-for="(users, emoji) in msg.reactions" :key="emoji" class="msg-reaction" :class="{ 'mine': users.includes('me') }" @click="store.toggleReaction(msg.id, emoji)">
                        {{ emoji }}
                        <span class="reaction-count">{{ users.length }}</span>
                      </span>
                    </div>
                  </div>
                  <button v-if="hoveredMsg === msg.id" class="msg-reply-btn" @click="store.setReplyTo(msg.id); focusInput()" :title="'Reply to ' + getMessageSenderName(msg.senderId)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </button>
                </div>

                <!-- Reaction picker -->
                <div v-if="showReactionPicker === msg.id" class="reaction-picker" @mouseleave="showReactionPicker = null">
                  <button v-for="emoji in reactionEmojis" :key="emoji" class="rp-emoji" :class="{ active: hasReaction(msg, emoji) }" @click="store.toggleReaction(msg.id, emoji); showReactionPicker = null">
                    {{ emoji }}
                  </button>
                </div>
              </div>
            </template>

            <!-- Typing indicator -->
            <div v-if="store.isTyping(store.activeConversationId)" class="typing-indicator">
              <div class="typing-avatar">{{ getActiveContactInitials() }}</div>
              <div class="typing-bubble">
                <span class="typing-dot" /><span class="typing-dot" /><span class="typing-dot" />
              </div>
            </div>
          </div>
        </div>

        <!-- Reply Preview Bar -->
        <div v-if="store.replyToMessage" class="reply-preview-bar">
          <div class="reply-bar-info">
            <span class="reply-bar-label">Replying to <strong>{{ store.replyToMessage.senderId === 'me' ? 'yourself' : getMessageSenderName(store.replyToMessage.senderId) }}</strong></span>
            <span class="reply-bar-text">{{ store.replyToMessage.content }}</span>
          </div>
          <button class="reply-bar-close" @click="store.clearReplyTo()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Message Input -->
        <div class="mtp-input-area">
          <button class="mia-btn" @click="showEmojiPicker = !showEmojiPicker" title="Emoji">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>
          </button>
          <label class="mia-btn" title="Attach file">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            <input type="file" hidden @change="handleFileAttach" />
          </label>
          <div class="mia-input-wrap" ref="inputWrapRef">
            <input ref="inputRef" v-model="messageText" class="mia-input" placeholder="Type a message..." @keydown.enter.prevent="sendMsg" />
          </div>
          <button v-if="messageText.trim()" class="mia-send-btn" @click="sendMsg" title="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
          <button v-else class="mia-btn" title="Voice message">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </button>
        </div>

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="emoji-picker">
          <button v-for="emoji in commonEmojis" :key="emoji" class="ep-emoji" @click="messageText += emoji; showEmojiPicker = false">{{ emoji }}</button>
        </div>
      </template>
    </div>

    <!-- ===== NEW CHAT OVERLAY ===== -->
    <Transition name="slide">
      <div v-if="showNewChat" class="new-chat-overlay" @click="showNewChat = false">
        <div class="new-chat-panel" @click.stop>
          <div class="ncp-header">
            <h3>New Conversation</h3>
            <button class="ncp-close" @click="showNewChat = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="ncp-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="newChatSearch" class="ncp-search-input" placeholder="Search contacts..." />
          </div>
          <div class="ncp-list">
            <template v-if="filteredContactGroups.length === 0">
              <div class="ncp-empty">No contacts found</div>
            </template>
            <template v-for="(group, gi) in filteredContactGroups" :key="gi">
              <div class="ncp-group-label">{{ group.label }}</div>
              <button v-for="contact in group.contacts" :key="contact.id" class="ncp-contact" @click="startNewChat(contact.id)">
                <div class="ncp-contact-avatar" :class="{ 'lecturer-avatar': contact.role === 'lecturer' }">
                  {{ contact.name.charAt(0) }}
                  <span v-if="contact.online" class="online-dot" />
                </div>
                <div class="ncp-contact-info">
                  <span class="ncp-contact-name">{{ contact.name }}</span>
                  <span class="ncp-contact-dept">{{ contact.department }}{{ contact.year ? ` · Year ${contact.year}` : '' }}</span>
                </div>
                <span v-if="contact.role === 'lecturer'" class="lecturer-badge">Faculty</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useMessagingStore } from '../stores/messaging'
import { useAuthStore } from '../stores/auth'

const store = useMessagingStore()
const authStore = useAuthStore()
const messageText = ref('')
const showNewChat = ref(false)
const newChatSearch = ref('')
const showContactInfo = ref(false)
const showEmojiPicker = ref(false)
const showReactionPicker = ref(null)
const hoveredMsg = ref(null)
const threadRef = ref(null)
const inputRef = ref(null)
const listRef = ref(null)
const inputWrapRef = ref(null)
const shouldAutoScroll = ref(true)

const commonEmojis = ['😊', '😂', '❤️', '🔥', '👍', '🎉', '😍', '🤔', '🙏', '👋', '✨', '💯', '😭', '🥺', '🤩', '😤', '💀', '👀']
const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉']

const filterTabs = computed(() => [
  { key: 'all', label: 'All', count: store.conversations.length },
  { key: 'department', label: 'Department' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'courses', label: 'Courses' },
])

function getContact(conv) {
  if (conv.type === 'group') return null
  return store.contactMap[conv.participants[0]] || null
}

function getActiveContact() {
  if (!store.activeConversation) return null
  if (store.activeConversation.type === 'group') return null
  return store.contactMap[store.activeConversation.participants[0]] || null
}

function getContactInitials(conv) {
  const contact = getContact(conv)
  if (!contact) return '?'
  return contact.name.split(' ').map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase()
}

function getActiveContactInitials() {
  const contact = getActiveContact()
  if (!contact) return '?'
  return contact.name.split(' ').map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase()
}

function formatLastSeen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `Last seen ${mins}m ago`
  if (hours < 24) return `Last seen ${hours}h ago`
  if (days < 7) return `Last seen ${d.toLocaleDateString('en-US', { weekday: 'long' })}`
  return `Last seen ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const groupedMessages = computed(() => {
  const msgs = store.activeMessages
  if (!msgs.length) return []
  const groups = []
  let currentGroup = null
  for (const msg of msgs) {
    const date = store.formatTimestamp(msg.timestamp)
    if (!currentGroup || currentGroup.date !== date) {
      currentGroup = { date, messages: [] }
      groups.push(currentGroup)
    }
    currentGroup.messages.push(msg)
  }
  return groups
})

const filteredContactGroups = computed(() => {
  const q = newChatSearch.value.toLowerCase()
  const groups = store.contactsByGroup
  if (!q) return groups
  return groups.map(g => ({
    ...g,
    contacts: g.contacts.filter(c => c.name.toLowerCase().includes(q) || c.department.toLowerCase().includes(q)),
  })).filter(g => g.contacts.length > 0)
})

function sendMsg() {
  if (!messageText.value.trim()) return
  store.sendMessage(messageText.value)
  messageText.value = ''
  showEmojiPicker.value = false
  nextTick(() => scrollToBottom())
}

function scrollToBottom() {
  if (!threadRef.value) return
  nextTick(() => {
    threadRef.value.scrollTop = threadRef.value.scrollHeight
  })
}

function onThreadScroll() {
  if (!threadRef.value) return
  const el = threadRef.value
  const threshold = 100
  shouldAutoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

function handleMsgClick(msg, e) {
  const target = e.target.closest('.msg-reaction, .reaction-count')
  if (target) {
    const emoji = target.closest('.msg-reaction')?.querySelector('.reaction-count')?.previousSibling?.textContent?.trim() || target.closest('.msg-reaction')?.textContent?.trim().split(' ')[0]
    return
  }

  if (showReactionPicker.value === msg.id) {
    showReactionPicker.value = null
  } else {
    showReactionPicker.value = msg.id
  }
}

function openContextMenu(msg, e) {
  store.setReplyTo(msg.id)
}

function hasActiveReactions(msg) {
  return msg.reactions && Object.keys(msg.reactions).length > 0
}

function hasReaction(msg, emoji) {
  return msg.reactions?.[emoji]?.includes('me') || false
}

function getMessageSenderName(senderId) {
  if (senderId === 'me') return 'You'
  const contact = store.contactMap[senderId]
  return contact?.name?.split(' ')[0] || 'Unknown'
}

function getReplySenderName(msgId) {
  for (const key in store.messages) {
    const msg = store.messages[key].find(m => m.id === msgId)
    if (msg) return getMessageSenderName(msg.senderId)
  }
  return 'Unknown'
}

function getReplyPreview(msgId) {
  for (const key in store.messages) {
    const msg = store.messages[key].find(m => m.id === msgId)
    if (msg) return msg.content?.slice(0, 80) + (msg.content?.length > 80 ? '...' : '')
  }
  return ''
}

function scrollToMessage(msgId) {
  const el = threadRef.value?.querySelector(`[data-msg-id="${msgId}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function startNewChat(contactId) {
  store.startConversation(contactId)
  showNewChat.value = false
}

function handleFileAttach(e) {
  const file = e.target.files?.[0]
  if (file) {
    store.sendMessage(`📎 ${file.name}`, 'file')
  }
  e.target.value = ''
}

function focusInput() {
  nextTick(() => inputRef.value?.focus())
}

watch(() => store.activeMessages.length, () => {
  if (shouldAutoScroll.value) {
    nextTick(() => scrollToBottom())
  }
})

watch(() => store.activeConversationId, () => {
  showContactInfo.value = false
  showReactionPicker.value = null
  shouldAutoScroll.value = true
  nextTick(() => scrollToBottom())
})

watch(() => store.replyToId, () => {
  if (store.replyToId) focusInput()
})

onMounted(() => {
  store.init()
  scrollToBottom()
})
</script>

<style scoped>
.messages-page {
  display: flex;
  gap: 0;
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--color-surface);
}

@media (min-width: 1025px) {
  .messages-page {
    border-radius: 0;
  }
}

/* ── LEFT PANEL ── */
.msg-list-panel {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.mlp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
}

.mlp-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
}

.mlp-new-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.mlp-new-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
}

.mlp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 12px 8px;
  padding: 8px 12px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.mlp-search:focus-within {
  border-color: var(--color-border-accent);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.mlp-search-icon {
  flex-shrink: 0;
  color: var(--color-text-quaternary);
}

.mlp-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--color-text-primary);
  font-family: inherit;
}

.mlp-search-input::placeholder {
  color: var(--color-text-quaternary);
}

.mlp-tabs {
  display: flex;
  gap: 4px;
  padding: 0 12px 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.mlp-tabs::-webkit-scrollbar {
  display: none;
}

.mlp-tab {
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mlp-tab:hover {
  color: var(--color-text-secondary);
  background: var(--color-primary-soft);
}

.mlp-tab.active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.mlp-tab-count {
  font-size: 9px;
  font-weight: 700;
  opacity: 0.7;
}

.mlp-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.mlp-list::-webkit-scrollbar {
  width: 4px;
}

.mlp-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.mlp-skeleton {
  display: flex;
  gap: 12px;
  padding: 12px 8px;
  align-items: center;
}

.sk-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

.sk-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk-line {
  height: 10px;
  border-radius: 5px;
  background: var(--color-border);
  animation: pulse 1.5s ease-in-out infinite;
}

.sk-line.w-40 { width: 40%; }
.sk-line.w-70 { width: 70%; }

.mlp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.mlp-empty p {
  font-size: 13px;
  margin: 0;
}

.mlp-start-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border-accent);
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mlp-start-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.mlp-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  align-items: center;
  font-family: inherit;
  color: inherit;
}

.mlp-item:hover {
  background: var(--color-primary-soft);
}

.mlp-item.active {
  background: var(--color-primary-muted);
}

.mlp-item-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.mlp-item-avatar.group-avatar {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-radius: 12px;
}

.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--color-surface);
}

.mlp-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mlp-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mlp-item-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.mlp-item-time {
  font-size: 10px;
  color: var(--color-text-quaternary);
  flex-shrink: 0;
}

.mlp-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.mlp-item-preview {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 3px;
  font-size: 12px;
  color: var(--color-text-quaternary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mlp-item-me {
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.mlp-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mlp-item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.pin-icon {
  font-size: 10px;
}

.mlp-badge {
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.member-count {
  font-size: 10px;
  color: var(--color-text-quaternary);
}

/* ── THREAD PANEL ── */
.msg-thread-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.mtp-landing {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-tertiary);
  padding: 40px;
}

.mtp-landing-graphic svg {
  opacity: 0.15;
}

.mtp-landing h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.mtp-landing p {
  font-size: 13px;
  margin: 0;
}

.mtp-landing-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  margin-top: 8px;
}

.mtp-landing-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.mtp-thread-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: relative;
  z-index: 2;
}

.mtp-back-btn {
  display: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  align-items: center;
  justify-content: center;
}

.mtp-thread-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mtp-thread-avatar.group-avatar {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-radius: 10px;
}

.mtp-thread-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mtp-thread-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.mtp-thread-status {
  font-size: 11px;
  color: var(--color-text-quaternary);
}

.typing-dots {
  display: inline-flex;
  gap: 2px;
  align-items: center;
}

.typing-dots span {
  animation: typingDot 1.4s infinite;
  font-weight: 700;
  font-size: 16px;
  line-height: 1;
  color: var(--color-primary);
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingDot {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

.mtp-thread-dept {
  font-size: 11px;
  color: var(--color-text-quaternary);
}

.mtp-thread-actions {
  display: flex;
  gap: 4px;
}

.mtp-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.mtp-action-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-text-secondary);
}

/* Contact Info Sidebar */
.mtp-contact-info-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(2px);
  z-index: 20;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mtp-contact-info {
  width: 300px;
  height: 100%;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.mtp-ci-close-top {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.mtp-ci-close-top:hover {
  background: var(--color-primary-soft);
  color: var(--color-text-secondary);
}

.mtp-ci-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 20px;
}

.mtp-ci-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mtp-ci-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.mtp-ci-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mtp-ci-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.mtp-ci-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-quaternary);
}

.mtp-ci-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.mtp-ci-value.is-lecturer {
  color: var(--color-primary);
}

.mtp-ci-courses {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.mtp-ci-course-tag {
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 600;
}

/* ── THREAD ── */
.mtp-thread {
  flex: 1;
  overflow-y: auto;
  padding: 16px 40px;
  position: relative;
}

.mtp-thread::-webkit-scrollbar {
  width: 4px;
}

.mtp-thread::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.mtp-thread-scroll {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mtp-date-divider {
  display: flex;
  justify-content: center;
  margin: 16px 0 12px;
}

.mtp-date-divider span {
  padding: 4px 14px;
  border-radius: 8px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.msg-row {
  display: flex;
  flex-direction: column;
  position: relative;
  max-width: 65%;
  margin-bottom: 4px;
}

.msg-mine {
  align-self: flex-end;
  align-items: flex-end;
}

.msg-theirs {
  align-self: flex-start;
  align-items: flex-start;
}

.msg-system {
  align-self: center;
  max-width: 100%;
}

.msg-system-bubble {
  padding: 6px 16px;
  border-radius: 8px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-style: italic;
  text-align: center;
}

.msg-reply-preview {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  margin-bottom: 2px;
  border-radius: 8px;
  background: var(--color-surface-elevated);
  cursor: pointer;
  max-width: 100%;
  width: fit-content;
}

.msg-mine .msg-reply-preview {
  background: rgba(0,0,0,0.08);
}

.msg-reply-bar {
  width: 3px;
  border-radius: 2px;
  background: var(--color-text-quaternary);
  flex-shrink: 0;
}

.msg-reply-bar.bar-mine {
  background: var(--color-primary-light);
}

.msg-reply-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.msg-reply-sender {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
}

.msg-reply-text {
  font-size: 11px;
  color: var(--color-text-quaternary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-bubble {
  padding: 8px 14px 6px;
  border-radius: 18px;
  position: relative;
  cursor: pointer;
  transition: all 0.15s ease;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.msg-mine .msg-bubble {
  background: var(--color-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-theirs .msg-bubble {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-bottom-left-radius: 4px;
}

.msg-bubble:hover {
  filter: brightness(1.05);
}

.msg-bubble-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
}

.msg-reply-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
  z-index: 5;
}

.msg-mine .msg-reply-btn {
  right: -40px;
}

.msg-theirs .msg-reply-btn {
  left: -40px;
}

.msg-reply-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
  transform: translateY(-50%) scale(1.1);
}

.msg-text {
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.msg-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.msg-time {
  font-size: 10px;
  opacity: 0.6;
}

.msg-mine .msg-time {
  color: rgba(255,255,255,0.7);
}

.msg-theirs .msg-time {
  color: var(--color-text-quaternary);
}

.msg-status {
  font-size: 12px;
  line-height: 1;
}

.msg-reactions {
  display: flex;
  gap: 2px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.msg-reaction {
  padding: 2px 6px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.msg-reaction.mine {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.msg-reaction:hover {
  transform: scale(1.1);
}

.reaction-count {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-quaternary);
}

.msg-mine .reaction-count {
  color: var(--color-text-primary);
}

.reaction-picker {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-accent);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  z-index: 20;
  animation: popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.msg-mine .reaction-picker {
  left: auto;
  right: 0;
  transform: none;
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.rp-emoji {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-emoji:hover {
  background: var(--color-primary-soft);
  transform: scale(1.2);
}

.rp-emoji.active {
  background: var(--color-primary-muted);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  align-self: flex-start;
}

.typing-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.typing-bubble {
  padding: 10px 16px;
  border-radius: 16px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  display: flex;
  gap: 4px;
  align-items: center;
  border-bottom-left-radius: 4px;
}

.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-text-quaternary);
  animation: typingBounce 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* Reply Preview Bar */
.reply-preview-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--color-surface-elevated);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.reply-bar-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.reply-bar-label {
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 600;
}

.reply-bar-text {
  font-size: 11px;
  color: var(--color-text-quaternary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reply-bar-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reply-bar-close:hover {
  background: var(--color-primary-soft);
}

/* ── INPUT AREA ── */
.mtp-input-area {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 10px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.mia-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.mia-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-text-secondary);
}

.mia-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 0 14px;
  transition: all 0.2s ease;
}

.mia-input-wrap:focus-within {
  border-color: var(--color-border-accent);
}

.mia-input {
  width: 100%;
  height: 36px;
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--color-text-primary);
  font-family: inherit;
}

.mia-input::placeholder {
  color: var(--color-text-quaternary);
}

.mia-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.mia-send-btn:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

/* Emoji Picker */
.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px;
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-accent);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  z-index: 20;
  max-width: 280px;
  animation: popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ep-emoji {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ep-emoji:hover {
  background: var(--color-primary-soft);
  transform: scale(1.15);
}

/* ── NEW CHAT OVERLAY ── */
.new-chat-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
}

.new-chat-panel {
  width: 420px;
  max-height: 70vh;
  background: var(--color-surface);
  border: 1px solid var(--color-border-accent);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ncp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.ncp-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.ncp-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ncp-close:hover {
  background: var(--color-primary-soft);
}

.ncp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 12px;
  padding: 8px 12px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.ncp-search svg {
  color: var(--color-text-quaternary);
  flex-shrink: 0;
}

.ncp-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--color-text-primary);
  font-family: inherit;
}

.ncp-search-input::placeholder {
  color: var(--color-text-quaternary);
}

.ncp-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;
}

.ncp-list::-webkit-scrollbar {
  width: 4px;
}

.ncp-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.ncp-group-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-quaternary);
}

.ncp-contact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
  transition: all 0.2s ease;
}

.ncp-contact:hover {
  background: var(--color-primary-soft);
}

.ncp-contact-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.ncp-contact-avatar.lecturer-avatar {
  background: var(--color-primary-muted);
  color: var(--color-primary);
}

.ncp-contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ncp-contact-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.ncp-contact-dept {
  font-size: 11px;
  color: var(--color-text-quaternary);
}

.lecturer-badge {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.ncp-empty {
  text-align: center;
  padding: 24px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

/* ── TRANSITIONS ── */
.slide-enter-active, .slide-leave-active {
  transition: opacity 0.2s ease;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
}

.slide-enter-active .new-chat-panel {
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── WIDE LAPTOP / DESKTOP ── */
@media (min-width: 1281px) {
  .msg-list-panel {
    width: 340px;
    min-width: 340px;
  }

  .mtp-thread {
    padding: 20px 48px;
  }

  .msg-row {
    max-width: 60%;
  }

  .mlp-title {
    font-size: 20px;
  }

  .mlp-item {
    padding: 12px 16px;
  }

  .mlp-item-name {
    font-size: 14px;
  }

  .mlp-item-preview {
    font-size: 13px;
  }
}

/* ── LAPTOP ── */
@media (min-width: 1025px) and (max-width: 1280px) {
  .msg-list-panel {
    width: 300px;
    min-width: 300px;
  }

  .mtp-thread {
    padding: 16px 32px;
  }

  .msg-row {
    max-width: 65%;
  }
}

/* ── SMALL LAPTOP / TABLET ── */
@media (max-width: 1024px) {
  .msg-list-panel {
    width: 280px;
    min-width: 280px;
  }

  .mtp-thread {
    padding: 14px 24px;
  }

  .msg-row {
    max-width: 72%;
  }

  .msg-reply-btn {
    display: none !important;
  }
}

/* ── TABLET PORTRAIT ── */
@media (max-width: 820px) {
  .msg-list-panel {
    width: 240px;
    min-width: 240px;
  }

  .mlp-tabs {
    gap: 2px;
  }

  .mlp-tab {
    padding: 4px 8px;
    font-size: 10px;
  }
}

/* ── MOBILE ── */
@media (max-width: 768px) {
  .messages-page {
    height: 100%;
    min-height: auto;
    border-radius: 0;
    border: none;
  }

  .msg-list-panel {
    width: 100%;
    min-width: 0;
    border-right: none;
  }

  .msg-thread-panel {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--color-surface);
    display: none;
  }

  .msg-thread-panel:has(.mtp-thread-header) {
    display: flex;
  }

  .msg-list-panel:has(~ .msg-thread-panel .mtp-thread-header) {
    display: none;
  }

  .mtp-back-btn {
    display: flex;
  }

  .mtp-thread {
    padding: 12px 16px;
  }

  .msg-row {
    max-width: 85%;
  }

  .mtp-contact-info-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
  }

  .mtp-contact-info {
    width: 100%;
    max-width: 100%;
  }

  .new-chat-panel {
    width: calc(100% - 32px);
    max-height: 80vh;
  }

  .new-chat-overlay {
    padding-top: 40px;
  }

  .msg-reply-btn {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .mtp-thread {
    padding: 8px 10px;
  }
}
</style>
