'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import ChatMarkdown from './ChatMarkdown'
import styles from './chat.module.css'

type Rating = 'like' | 'dislike' | null

type ChatMessage = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  rating?: Rating
  elapsed?: number
  model?: string
  attachments?: string[]
}

type Conversation = {
  id: string
  title: string
  model?: string
  updatedAt?: string
}

type ModelInfo = {
  id: string
  name: string
  status: string
  role?: string
  provider?: string
  model?: string
}

type ModelsResponse = {
  models: ModelInfo[]
  verifiedModels: ModelInfo[]
  capabilities?: unknown[]
  defaultModel: string
  online: number
}

type Attachment = {
  id: string
  name: string
  title: string
  context: string
}

const EXPERTS = [
  { id: 'general', icon: '✦', label: 'General Assistant', blurb: 'Clear help with anything' },
  { id: 'math', icon: '∑', label: 'Math Tutor', blurb: 'Step-by-step reasoning' },
  { id: 'programming', icon: '⌘', label: 'Programming Mentor', blurb: 'Code, bugs and algorithms' },
  { id: 'medical', icon: '✚', label: 'Medical Explainer', blurb: 'Health and life sciences' },
  { id: 'history', icon: '◇', label: 'History Expert', blurb: 'Context, causes and evidence' },
  { id: 'writing', icon: '✎', label: 'Writing Coach', blurb: 'Structure and clarity' },
  { id: 'physics', icon: '◉', label: 'Physics Tutor', blurb: 'Concepts and calculations' },
  { id: 'chemistry', icon: '⬡', label: 'Chemistry Tutor', blurb: 'Reactions and mechanisms' },
  { id: 'literature', icon: '❖', label: 'Literature Guide', blurb: 'Texts and interpretation' },
  { id: 'career', icon: '➤', label: 'Career Advisor', blurb: 'Practical next steps' },
] as const

const SUGGESTIONS = [
  { icon: '∑', title: 'Break down a concept', prompt: 'Explain a course concept in simple terms with one example.' },
  { icon: '◷', title: 'Plan a study session', prompt: 'Help me plan a focused 45-minute study session.' },
  { icon: '✎', title: 'Improve my writing', prompt: 'Review my writing and suggest clearer phrasing.' },
  { icon: '⌘', title: 'Debug my code', prompt: 'Help me debug this code and explain the fix.' },
]

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

export default function AIChatWorkspace() {
  const { user } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [models, setModels] = useState<ModelsResponse | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [expertId, setExpertId] = useState<string>('general')
  const [webSearch, setWebSearch] = useState(false)
  const [council, setCouncil] = useState(false)
  const [input, setInput] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [followUps, setFollowUps] = useState<string[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [expertMenuOpen, setExpertMenuOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const abortedByUserRef = useRef(false)
  const stoppedRef = useRef(false)
  const streamingRef = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])

  const onlineModels = useMemo(
    () => (models?.verifiedModels || []).filter((model) => model.status === 'online'),
    [models],
  )
  const selectedModel = useMemo(
    () => onlineModels.find((model) => model.id === selectedModelId) || onlineModels[0] || null,
    [onlineModels, selectedModelId],
  )
  const activeExpert = EXPERTS.find((expert) => expert.id === expertId) || EXPERTS[0]
  const onlineCount = models?.online ?? 0
  const aiUnavailable = modelsLoaded && onlineCount === 0
  const activeLabel = council ? 'AI Council' : selectedModel?.name || 'AI Assistant'
  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: messages.length > 1 ? 'smooth' : 'auto' })
  }, [messages, streamText])

  const refreshConversations = useCallback(async () => {
    try {
      const rows = await api.get<Conversation[]>('/chats', { cache: false })
      setConversations(Array.isArray(rows) ? rows : [])
    } catch {
      setConversations([])
    }
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await api.get<ModelsResponse>('/ai/models')
        if (!active) return
        setModels(data)
        const preferred =
          (data.verifiedModels || []).find((model) => model.model === data.defaultModel) ||
          (data.verifiedModels || []).find((model) => model.status === 'online')
        if (preferred) setSelectedModelId(preferred.id)
      } catch {
        if (active) setModels(null)
      } finally {
        if (active) setModelsLoaded(true)
      }
    })()
    void refreshConversations()
    return () => {
      active = false
    }
  }, [refreshConversations])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const sendStream = useCallback(async (rawText: string) => {
    const text = rawText.trim()
    if (!text || streamingRef.current || (aiUnavailable && !council)) return
    streamingRef.current = true

    const history = messagesRef.current
      .slice(-40)
      .map((message) => ({ role: message.role, content: message.content }))

    const contextBlock = attachments.length
      ? attachments
          .map((attachment) => `Study material: ${attachment.title}${attachment.context ? `\n${attachment.context}` : ''}`)
          .join('\n\n')
      : ''
    const requestMessage = contextBlock
      ? `${text}\n\n--- STUDY CONTEXT ---\n${contextBlock}\n--- END STUDY CONTEXT ---`
      : text

    setError('')
    setUploadError('')
    setFollowUps([])
    setStatusText('')
    setStreamText('')
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      attachments: attachments.map((attachment) => attachment.title),
    }
    const optimisticMessages = [...messagesRef.current, userMessage]
    messagesRef.current = optimisticMessages
    setMessages(optimisticMessages)
    setStreaming(true)
    abortedByUserRef.current = false
    stoppedRef.current = false

    const controller = new AbortController()
    abortRef.current = controller
    let accumulated = ''
    let finalAnswer = ''
    let streamError = ''
    let assistantId: string | undefined
    let elapsed = 0
    let doneModel: string | undefined
    let nextConversationId: string | null = null
    let nextFollowUps: string[] = []

    try {
      await api.stream(
        '/ai/chat/stream',
        {
          message: requestMessage,
          history,
          conversationId,
          expert: expertId,
          council,
          webSearch,
          ...(council || !selectedModel ? {} : { modelId: selectedModel.id }),
        },
        {
          signal: controller.signal,
          onMessage: (payload, event) => {
            const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>
            switch (event) {
              case 'status':
                setStatusText(String(data.message || ''))
                break
              case 'thinking':
                // Never surface raw reasoning/thinking payloads to the UI.
                setStatusText('Preparing your answer…')
                break
              case 'delta': {
                const delta = String(data.content || '')
                accumulated += delta
                setStreamText(accumulated)
                break
              }
              case 'answer':
                accumulated = String(data.content || '')
                setStreamText(accumulated)
                break
              case 'verifying':
                setStatusText(String(data.message || `Verifying ${String(data.count || 0)} claims…`))
                break
              case 'done':
                finalAnswer = String(data.answer || accumulated)
                accumulated = finalAnswer
                setStreamText(accumulated)
                assistantId = typeof data.assistantMessageId === 'string' ? data.assistantMessageId : undefined
                elapsed = Number(data.elapsed) || 0
                doneModel = typeof data.model === 'string' ? data.model : undefined
                nextConversationId = typeof data.conversationId === 'string' ? data.conversationId : null
                nextFollowUps = Array.isArray(data.followUps) ? data.followUps.filter((item): item is string => typeof item === 'string') : []
                break
              case 'error':
                streamError = String(data.message || 'The AI provider could not complete this request.')
                break
              default:
                break
            }
          },
        },
      )

      if (abortedByUserRef.current) {
        if (stoppedRef.current) setError('Generation stopped. Nothing incomplete was saved.')
        return
      }

      const answer = finalAnswer || accumulated
      if (streamError || !answer.trim()) {
        setError(streamError || 'The AI provider returned no answer. Please try again.')
        return
      }

      if (nextConversationId && nextConversationId !== conversationId) {
        setConversationId(nextConversationId)
        void refreshConversations()
      }
      if (nextFollowUps.length) setFollowUps(nextFollowUps.slice(0, 4))
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: answer.trim(),
        rating: null,
        elapsed,
        model: doneModel,
      }
      messagesRef.current = [...messagesRef.current, assistantMessage]
      setMessages(messagesRef.current)
    } catch (streamFailure) {
      if (abortedByUserRef.current) {
        if (stoppedRef.current) setError('Generation stopped. Nothing incomplete was saved.')
      } else {
        setError(errorMessage(streamFailure, 'Could not reach the AI service. Check your connection and try again.'))
      }
    } finally {
      abortRef.current = null
      streamingRef.current = false
      setStreaming(false)
      setStatusText('')
      setStreamText('')
    }
  }, [aiUnavailable, attachments, council, conversationId, expertId, refreshConversations, selectedModel, webSearch])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendStream(input)
    setInput('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendStream(input)
      setInput('')
    }
  }

  function newChat() {
    abortedByUserRef.current = true
    stoppedRef.current = false
    abortRef.current?.abort()
    streamingRef.current = false
    messagesRef.current = []
    setMessages([])
    setConversationId(null)
    setAttachments([])
    setFollowUps([])
    setError('')
    setUploadError('')
    setStreamText('')
    setStreaming(false)
    setHistoryOpen(false)
  }

  async function loadConversation(conversation: Conversation) {
    try {
      const rows = await api.get<ChatMessage[]>(`/chats/${conversation.id}/messages`, { cache: false })
      const loaded: ChatMessage[] = Array.isArray(rows)
        ? rows.map((row): ChatMessage => ({ ...row, role: row.role === 'assistant' ? 'assistant' : 'user' }))
        : []
      messagesRef.current = loaded
      setMessages(loaded)
      setConversationId(conversation.id)
      setAttachments([])
      setFollowUps([])
      setError('')
      setHistoryOpen(false)
    } catch {
      setError('Could not open that conversation. Please try again.')
    }
  }

  async function deleteConversation(conversation: Conversation) {
    try {
      await api.delete(`/chats/${conversation.id}`)
      if (conversationId === conversation.id) newChat()
      await refreshConversations()
    } catch {
      setError('Could not delete that conversation.')
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadError('')
    const form = new FormData()
    form.append('document', file)
    try {
      const result = await api.upload<Record<string, unknown>>('/study-materials/upload', form, { timeout: 120000 })
      const title = typeof result.title === 'string' && result.title.trim() ? result.title : file.name
      const context = typeof result.summary === 'string' ? result.summary : ''
      setAttachments((current) => [
        ...current,
        {
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          title,
          context: context.slice(0, 1600),
        },
      ])
    } catch (uploadFailure) {
      setUploadError(errorMessage(uploadFailure, `Could not upload ${file.name}. Try a different file.`))
    } finally {
      event.target.value = ''
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null
        setRecording(false)
        if (!chunks.length) return
        const form = new FormData()
        form.append('audio', new Blob(chunks, { type: 'audio/webm' }), 'voice.webm')
        try {
          const result = await api.upload<{ transcript?: string }>('/voice/stt', form)
          if (result.transcript) setInput((current) => `${current}${current ? ' ' : ''}${result.transcript}`)
        } catch {
          setError('Voice transcription failed. Please type your question instead.')
        }
      }
      recorder.start()
      setRecording(true)
      setError('')
    } catch {
      setError('Microphone access was denied or unavailable.')
    }
  }

  async function copyMessage(message: ChatMessage, index: number) {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(message.id || `message-${index}`)
      window.setTimeout(() => setCopiedId(null), 1400)
    } catch {
      setError('Could not copy this answer.')
    }
  }

  async function rateMessage(message: ChatMessage, rating: Exclude<Rating, null>) {
    if (!message.id || !conversationId) return
    const previous = message.rating || null
    const next: Rating = previous === rating ? null : rating
    setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, rating: next } : item)))
    try {
      await api.patch(`/chats/${conversationId}/messages/${message.id}/feedback`, { rating: next })
    } catch {
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, rating: previous } : item)))
      setError('Could not save your feedback. Please try again.')
    }
  }

  function regenerate(index: number) {
    if (streaming) return
    const previousUser = messagesRef.current
      .slice(0, index)
      .reverse()
      .find((message) => message.role === 'user')
    if (!previousUser) return
    const truncated = messagesRef.current.slice(0, index)
    messagesRef.current = truncated
    setMessages(truncated)
    void sendStream(previousUser.content)
  }

  const filteredConversations = conversations.filter((conversation) =>
    (conversation.title || '').toLowerCase().includes(historySearch.trim().toLowerCase()),
  )

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${historyOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHead}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>M</span>
            <span>
              <strong>McPherson AI</strong>
              <small>Study intelligence</small>
            </span>
          </div>
          <button className={styles.iconButton} onClick={() => setHistoryOpen(false)} aria-label="Close chat history">×</button>
        </div>

        <button className={styles.newChatButton} onClick={newChat}>
          <span aria-hidden="true">＋</span> New chat
        </button>

        <label className={styles.searchField}>
          <span aria-hidden="true">⌕</span>
          <input
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Find a conversation"
            aria-label="Find a conversation"
          />
        </label>

        <div className={styles.sidebarSection}>Recent conversations</div>
        <div className={styles.conversationList}>
          {filteredConversations.length === 0 ? (
            <p className={styles.sidebarEmpty}>Your saved chats will appear here.</p>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${conversationId === conversation.id ? styles.conversationActive : ''}`}
              >
                <button className={styles.conversationOpen} onClick={() => void loadConversation(conversation)}>
                  <span>{conversation.title || 'Untitled chat'}</span>
                  <small>{conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString() : ''}</small>
                </button>
                <button
                  className={styles.conversationDelete}
                  onClick={() => void deleteConversation(conversation)}
                  aria-label={`Delete ${conversation.title || 'conversation'}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.sidebarFoot}>
          <Link href="/" className={styles.sidebarLink}>← University home</Link>
          <span className={styles.sidebarUser}>{user?.name || 'Student account'}</span>
        </div>
      </aside>

      {historyOpen ? <button className={styles.scrim} onClick={() => setHistoryOpen(false)} aria-label="Close chat history" /> : null}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenu} onClick={() => setHistoryOpen(true)} aria-label="Open chat history">☰</button>

          <div className={styles.menuWrap}>
            <button className={styles.topPill} onClick={() => setModelMenuOpen((open) => !open)} aria-expanded={modelMenuOpen}>
              <span className={styles.pillIcon}>◇</span>
              <span>{activeLabel}</span>
              <span aria-hidden="true">⌄</span>
            </button>
            {modelMenuOpen ? (
              <div className={styles.dropdown}>
                <p className={styles.dropdownTitle}>Choose a real model</p>
                {onlineModels.length === 0 ? (
                  <p className={styles.dropdownEmpty}>No model is online. Check backend keys.</p>
                ) : (
                  onlineModels.map((model) => (
                    <button
                      key={model.id}
                      className={`${styles.dropdownItem} ${selectedModel?.id === model.id && !council ? styles.dropdownItemActive : ''}`}
                      onClick={() => {
                        setSelectedModelId(model.id)
                        setCouncil(false)
                        setModelMenuOpen(false)
                      }}
                    >
                      <span>
                        <strong>{model.name}</strong>
                        <small>{model.role || model.provider || model.id}</small>
                      </span>
                      <span className={styles.onlineDot} />
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className={styles.menuWrap}>
            <button className={styles.topPill} onClick={() => setExpertMenuOpen((open) => !open)} aria-expanded={expertMenuOpen}>
              <span className={styles.pillIcon}>{activeExpert.icon}</span>
              <span>{activeExpert.label}</span>
              <span aria-hidden="true">⌄</span>
            </button>
            {expertMenuOpen ? (
              <div className={styles.dropdown}>
                <p className={styles.dropdownTitle}>Study mode</p>
                {EXPERTS.map((expert) => (
                  <button
                    key={expert.id}
                    className={`${styles.dropdownItem} ${expertId === expert.id ? styles.dropdownItemActive : ''}`}
                    onClick={() => {
                      setExpertId(expert.id)
                      setExpertMenuOpen(false)
                    }}
                  >
                    <span>
                      <strong>{expert.icon} {expert.label}</strong>
                      <small>{expert.blurb}</small>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <span className={`${styles.statusPill} ${aiUnavailable ? styles.statusOffline : ''}`}>
            <span className={styles.statusDot} />
            {modelsLoaded ? `${onlineCount} online` : 'Checking AI…'}
          </span>

          <Link href="/dashboard" className={styles.dashboardLink}>Dashboard ↗</Link>
        </header>

        <div className={styles.stream} ref={scrollRef}>
          {messages.length === 0 && !streaming ? (
            <section className={styles.emptyState}>
              <p className={styles.kicker}>McPherson University</p>
              <h1>What are we studying today?</h1>
              <p className={styles.emptyLead}>
                Ask a question, attach study material, or choose a subject mode. Answers come from the university&apos;s configured AI providers.
              </p>

              {aiUnavailable ? (
                <div className={styles.banner} role="status">
                  No AI provider is online. Chat is disabled until a backend key is configured.
                </div>
              ) : null}
              {error ? <div className={`${styles.banner} ${styles.bannerError}`} role="alert">{error}</div> : null}

              <div className={styles.suggestionGrid}>
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion.title} className={styles.suggestionCard} onClick={() => setInput(suggestion.prompt)}>
                    <span className={styles.suggestionIcon}>{suggestion.icon}</span>
                    <strong>{suggestion.title}</strong>
                    <small>{suggestion.prompt}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className={styles.messageList}>
              {messages.map((message, index) => (
                <article key={message.id || `message-${index}`} className={`${styles.messageRow} ${message.role === 'user' ? styles.userRow : styles.assistantRow}`}>
                  <div className={`${styles.avatar} ${message.role === 'user' ? styles.userAvatar : styles.aiAvatar}`}>
                    {message.role === 'user' ? userInitial : '✦'}
                  </div>
                  <div className={styles.messageBody}>
                    <div className={styles.messageMeta}>
                      <strong>{message.role === 'user' ? 'You' : activeLabel}</strong>
                      {message.elapsed ? <span>{(message.elapsed / 1000).toFixed(1)}s</span> : null}
                    </div>
                    <div className={styles.bubble}>
                      {message.role === 'assistant' ? <ChatMarkdown content={message.content} /> : <p>{message.content}</p>}
                      {message.attachments?.length ? (
                        <div className={styles.messageAttachments}>
                          {message.attachments.map((attachment, attachmentIndex) => (
                            <span key={attachmentIndex}>⌎ {attachment}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {message.role === 'assistant' ? (
                      <div className={styles.messageActions}>
                        <button onClick={() => void copyMessage(message, index)}>
                          {copiedId === (message.id || `message-${index}`) ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          className={message.rating === 'like' ? styles.actionActive : ''}
                          onClick={() => void rateMessage(message, 'like')}
                        >
                          ▲ Helpful
                        </button>
                        <button
                          className={message.rating === 'dislike' ? styles.actionActive : ''}
                          onClick={() => void rateMessage(message, 'dislike')}
                        >
                          ▼ Not helpful
                        </button>
                        {index === messages.length - 1 ? <button onClick={() => regenerate(index)}>↻ Regenerate</button> : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}

              {streaming ? (
                <article className={`${styles.messageRow} ${styles.assistantRow}`}>
                  <div className={`${styles.avatar} ${styles.aiAvatar}`}>✦</div>
                  <div className={styles.messageBody}>
                    <div className={styles.messageMeta}><strong>{activeLabel}</strong><span>responding</span></div>
                    <div className={styles.bubble}>
                      {statusText ? <p className={styles.streamStatus}><span className={styles.pulse} />{statusText}</p> : null}
                      {streamText ? <ChatMarkdown content={streamText} /> : null}
                      {!streamText && !statusText ? <p className={styles.streamStatus}><span className={styles.pulse} />Thinking…</p> : null}
                    </div>
                  </div>
                </article>
              ) : null}

              {followUps.length && !streaming ? (
                <div className={styles.followUps}>
                  <span>Suggested next steps</span>
                  <div>
                    {followUps.map((followUp, index) => (
                      <button key={`${followUp}-${index}`} onClick={() => void sendStream(followUp)}>{followUp}</button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          )}
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          {attachments.length ? (
            <div className={styles.attachmentRow}>
              {attachments.map((attachment) => (
                <span key={attachment.id} className={styles.attachmentChip}>
                  ⌎ {attachment.title}
                  <button
                    type="button"
                    onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                    aria-label={`Remove ${attachment.title}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.composerBox}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={aiUnavailable ? 'AI chat is unavailable right now' : 'Ask McPherson AI anything…'}
              disabled={aiUnavailable}
              rows={2}
              aria-label="Message McPherson AI"
            />
            <div className={styles.composerActions}>
              <button type="button" className={styles.toolButton} onClick={() => fileRef.current?.click()} disabled={aiUnavailable} title="Attach study material">
                ⌎ <span>Attach</span>
              </button>
              <button type="button" className={`${styles.toolButton} ${recording ? styles.recording : ''}`} onClick={() => void toggleRecording()} disabled={aiUnavailable} title="Voice input">
                ◉ <span>{recording ? 'Stop' : 'Voice'}</span>
              </button>
              <button
                type="button"
                className={`${styles.toolButton} ${webSearch ? styles.actionActive : ''}`}
                onClick={() => setWebSearch((enabled) => !enabled)}
                disabled={aiUnavailable}
                title="Search the web before answering"
              >
                ⌕ <span>Web</span>
              </button>
              <button
                type="button"
                className={`${styles.toolButton} ${council ? styles.actionActive : ''}`}
                onClick={() => setCouncil((enabled) => !enabled)}
                disabled={aiUnavailable}
                title="Ask multiple AI providers to deliberate"
              >
                ◇ <span>Council</span>
              </button>
              <span className={styles.composerSpacer} />
              {streaming ? (
                <button
                  type="button"
                  className={styles.stopButton}
                  onClick={() => {
                    stoppedRef.current = true
                    abortedByUserRef.current = true
                    abortRef.current?.abort()
                  }}
                >
                  ■ Stop
                </button>
              ) : (
                <button type="submit" className={styles.sendButton} disabled={!input.trim() || aiUnavailable}>
                  Send ↑
                </button>
              )}
            </div>
          </div>

          <input ref={fileRef} type="file" className={styles.hiddenInput} onChange={(event) => void handleUpload(event)} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp" />
          {uploadError ? <div className={`${styles.banner} ${styles.bannerError}`} role="alert">{uploadError}</div> : null}
          {error ? <div className={`${styles.banner} ${styles.bannerError}`} role="alert">{error}</div> : null}
          <p className={styles.disclaimer}>AI can make mistakes. Verify important academic or medical details.</p>
        </form>
      </main>

      <aside className={styles.insights}>
        <div className={styles.insightCard}>
          <p className={styles.kicker}>Session</p>
          <h2>{conversationId ? 'Saved conversation' : 'New conversation'}</h2>
          <p>Messages are saved to your account only after a real provider answers. Feedback is stored with the answer.</p>
          <dl>
            <div><dt>Model</dt><dd>{activeLabel}</dd></div>
            <div><dt>Mode</dt><dd>{activeExpert.label}</dd></div>
            <div><dt>Providers</dt><dd>{modelsLoaded ? `${onlineCount} online` : 'checking…'}</dd></div>
            <div><dt>Context</dt><dd>{attachments.length ? `${attachments.length} uploaded` : 'None'}</dd></div>
          </dl>
        </div>

        <div className={styles.insightCard}>
          <p className={styles.kicker}>Privacy</p>
          <h2>Your workspace</h2>
          <p>Conversations are scoped to your account. Attachments are uploaded to the Study Hub and never embedded as fake AI context.</p>
          <Link href="/dashboard" className={styles.insightLink}>Open dashboard →</Link>
        </div>

        <div className={styles.tipCard}>
          <span aria-hidden="true">✦</span>
          <p><strong>Tip:</strong> Choose Math Tutor or Programming Mentor for step-by-step explanations tailored to coursework.</p>
        </div>
      </aside>
    </div>
  )
}
