import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '../lib/api'

function responseData(response) {
  const payload = response?.data
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback
}

export const useMessagingStore = defineStore('messaging', () => {
  const contacts = ref([])
  const conversations = ref([])
  const messages = ref({})
  const activeConversationId = ref(null)
  const loading = ref(false)
  const loadingMessages = ref(false)
  const sending = ref(false)
  const error = ref('')
  const searchQuery = ref('')
  const filterMode = ref('all')
  const replyToId = ref(null)
  let pollingTimer = null
  let initialization = null

  const contactMap = computed(() => Object.fromEntries(contacts.value.map(contact => [contact.id, contact])))
  const activeConversation = computed(() =>
    conversations.value.find(conversation => conversation.id === activeConversationId.value) || null
  )
  const activeMessages = computed(() => messages.value[activeConversationId.value] || [])
  const replyToMessage = computed(() =>
    activeMessages.value.find(message => message.id === replyToId.value) || null
  )
  const unreadTotal = computed(() =>
    conversations.value.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0)
  )
  const filteredConversations = computed(() => {
    const search = searchQuery.value.trim().toLowerCase()
    return conversations.value.filter(conversation => {
      if (filterMode.value === 'unread' && !conversation.unreadCount) return false
      if (!search) return true
      const partner = conversation.partner || contactMap.value[conversation.participants[0]]
      return [partner?.name, partner?.department, conversation.lastMessage?.content]
        .some(value => value?.toLowerCase().includes(search))
    })
  })
  const contactsByGroup = computed(() => {
    const groups = []
    const lecturers = contacts.value.filter(contact => contact.role === 'lecturer')
    if (lecturers.length) groups.push({ label: 'Lecturers', contacts: lecturers })

    const departments = new Map()
    contacts.value
      .filter(contact => contact.role !== 'lecturer')
      .forEach(contact => {
        const label = contact.department?.trim() || 'Other students'
        if (!departments.has(label)) departments.set(label, [])
        departments.get(label).push(contact)
      })
    for (const [label, groupContacts] of departments) {
      groups.push({ label, contacts: groupContacts })
    }
    return groups
  })

  function unwrapArray(response, label) {
    const data = responseData(response)
    if (!Array.isArray(data)) throw new Error(`The server returned invalid ${label} data`)
    return data
  }

  async function loadContacts() {
    const response = await api.get('/messages/contacts')
    contacts.value = unwrapArray(response, 'contacts')
  }

  async function refreshConversations() {
    try {
      const response = await api.get('/messages/conversations')
      conversations.value = unwrapArray(response, 'conversations')
      return true
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Could not refresh conversations.')
      console.error('Failed to refresh conversations:', requestError)
      return false
    }
  }

  async function loadMessages(conversationId) {
    loadingMessages.value = true
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`)
      const conversationMessages = unwrapArray(response, 'messages')
      const existing = messages.value[conversationId] || []
      const messageIds = new Set(conversationMessages.map(message => message.id))
      const merged = [
        ...conversationMessages,
        ...existing.filter(message => !messageIds.has(message.id)),
      ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      messages.value = { ...messages.value, [conversationId]: merged }
      await refreshConversations()
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Could not load messages.')
      console.error('Failed to load messages:', requestError)
    } finally {
      loadingMessages.value = false
    }
  }

  async function init() {
    if (initialization) return initialization
    if (loading.value) return

    loading.value = true
    error.value = ''
    initialization = Promise.all([loadContacts(), refreshConversations()])
      .then(([, conversationsLoaded]) => {
        if (conversationsLoaded) error.value = ''
      })
      .catch(requestError => {
        error.value = getErrorMessage(requestError, 'Could not load messaging.')
        console.error('Failed to initialize messaging:', requestError)
      })
      .finally(() => {
        loading.value = false
        initialization = null
        if (!pollingTimer && typeof window !== 'undefined') {
          pollingTimer = window.setInterval(refreshConversations, 15000)
        }
      })
    return initialization
  }

  async function setActiveConversation(id) {
    activeConversationId.value = id
    replyToId.value = null
    await loadMessages(id)
  }

  async function startConversation(contactId) {
    error.value = ''
    try {
      const response = await api.post('/messages/conversations', { recipientId: contactId })
      const result = responseData(response)
      if (!result?.id) throw new Error('The server did not return a conversation')
      await refreshConversations()
      if (!conversations.value.some(conversation => conversation.id === result.id)) {
        conversations.value.unshift({
          id: result.id,
          participants: [contactId],
          type: 'individual',
          partner: contactMap.value[contactId],
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        })
      }
      await setActiveConversation(result.id)
      return result.id
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Could not start the conversation.')
      console.error('Failed to start conversation:', requestError)
      throw requestError
    }
  }

  async function sendMessage(content) {
    const conversationId = activeConversationId.value
    const text = typeof content === 'string' ? content.trim() : ''
    if (!conversationId || !text || sending.value) return

    sending.value = true
    error.value = ''
    try {
      const response = await api.post(
        `/messages/conversations/${conversationId}/messages`,
        { content: text, replyToId: replyToId.value }
      )
      const sentMessage = responseData(response)
      if (!sentMessage?.id) throw new Error('The server did not confirm the message')
      const currentMessages = messages.value[conversationId] || []
      messages.value = {
        ...messages.value,
        [conversationId]: [...currentMessages, sentMessage],
      }
      replyToId.value = null
      await refreshConversations()
      return sentMessage
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Message was not sent. Please try again.')
      console.error('Failed to send message:', requestError)
      throw requestError
    } finally {
      sending.value = false
    }
  }

  async function deleteChat(conversationId) {
    try {
      await api.delete(`/messages/conversations/${conversationId}`)
      conversations.value = conversations.value.filter(conversation => conversation.id !== conversationId)
      delete messages.value[conversationId]
      if (activeConversationId.value === conversationId) activeConversationId.value = null
      error.value = ''
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Could not hide this conversation.')
      console.error('Failed to hide conversation:', requestError)
      throw requestError
    }
  }

  function setReplyTo(id) {
    replyToId.value = id
  }

  function clearReplyTo() {
    replyToId.value = null
  }

  function formatTime(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  function formatTimestamp(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return formatTime(value)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  function getStatusIcon(status) {
    return status === 'read' ? '✓✓' : status === 'sent' ? '✓' : ''
  }

  function getStatusColor(status) {
    return status === 'read' ? 'var(--color-primary)' : 'var(--color-text-quaternary)'
  }

  function stopPolling() {
    if (pollingTimer && typeof window !== 'undefined') {
      window.clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  return {
    contacts,
    conversations,
    messages,
    activeConversationId,
    loading,
    loadingMessages,
    sending,
    error,
    searchQuery,
    filterMode,
    activeConversation,
    activeMessages,
    replyToId,
    replyToMessage,
    contactMap,
    filteredConversations,
    unreadTotal,
    contactsByGroup,
    init,
    loadMessages,
    refreshConversations,
    setActiveConversation,
    startConversation,
    sendMessage,
    deleteChat,
    setReplyTo,
    clearReplyTo,
    formatTime,
    formatTimestamp,
    getStatusIcon,
    getStatusColor,
    stopPolling,
  }
})
