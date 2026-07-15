import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../lib/api'

function friendlyError(err) {
  if (err instanceof TypeError || err?.code === 'ECONNABORTED') {
    return 'I\'m having trouble connecting right now. Please check your internet connection and try again.'
  }
  const m = (err?.message || '').toLowerCase()
  if (m.includes('network') || m.includes('fetch') || m.includes('connect') || m.includes('timeout') || m.includes('failed to fetch')) {
    return 'I\'m having trouble connecting right now. Please check your internet connection and try again.'
  }
  if (m.includes('ai generation is taking longer')) {
    return 'That took longer than expected to generate. Please try asking again in a moment.'
  }
  if (err?.response?.status === 401) {
    return 'Your session has expired. Please sign in again to continue.'
  }
  if (err?.response?.status >= 500) {
    return 'The AI service is temporarily unavailable. Please try again in a little while.'
  }
  if (err?.response?.data?.error && typeof err.response.data.error === 'string') {
    return err.response.data.error
  }
  return 'Something went wrong on my end. Please try again.'
}

export const useMindStore = defineStore('mind', () => {
  const messages = ref([])
  const processing = ref(false)

  function setMessages(msgs) {
    messages.value = msgs
  }

  async function sendMessage(text, options = {}) {
    if (!text.trim() || processing.value) return
    processing.value = true
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const history = messages.value.slice(-10).map(m => ({ role: m.role, content: m.content }))
          const { data } = await api.post('/ai/chat', {
            message: text.trim(), history, council: options.council || false,
            conversationId: options.conversationId || null,
          }, { timeout: 90000 })
          const responseText = data.response || '...'
          const councilData = data.council || []
          const thinkingData = data.thinking || ''
          const newConvId = data.conversationId || null
          messages.value.push({ role: 'assistant', content: responseText, council: councilData, thinking: thinkingData, showThinking: false })
          if (newConvId && options.onConversationId) options.onConversationId(newConvId)
          return { response: responseText, elapsed: data.elapsed, followUps: data.followUps || [] }
        } catch (err) {
          console.error(`AI chat error (attempt ${attempt + 1}):`, err.message)
          const is429 = err?.response?.status === 429
          if (is429 && attempt < 2) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
            continue
          }
          messages.value.push({ role: 'assistant', content: friendlyError(err), elapsed: 0, rating: null })
          break
        }
      }
    } finally {
      processing.value = false
    }
  }

  function clearChat() { messages.value = [] }

  return { messages, processing, setMessages, sendMessage, clearChat }
})
