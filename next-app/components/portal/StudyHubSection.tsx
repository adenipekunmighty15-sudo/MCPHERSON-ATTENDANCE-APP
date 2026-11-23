'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import styles from './studyHub.module.css'

type Course = { id?: string | number; code?: string; title?: string; courseName?: string; name?: string }
type MaterialSummary = {
  id: string
  title: string
  courseId?: string | null
  courseCode?: string | null
  courseTitle?: string | null
  createdAt?: string
  status?: string
  flashcardCount?: number
}
type Flashcard = { id: string; front: string; back: string }
type QuizQuestion = { id?: number | string; question: string; options: string[]; answerIndex: number; explanation?: string }
type KeyPoint = { id?: number | string; text: string }
type MaterialDetail = MaterialSummary & {
  sourceText?: string
  summary?: string
  improvedNote?: string
  keyPoints?: KeyPoint[] | string
  quiz?: QuizQuestion[] | string
  flashcards?: Flashcard[]
  chatHistory?: { role: 'user' | 'assistant'; content: string }[] | string
}
type StudyStats = { cardsMastered?: number; quizzesTaken?: number; studyMinutes?: number; studyTime?: string }

function msg(err: unknown, fallback: string) {
  return err instanceof Error && err.message.trim() ? err.message : fallback
}
function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') { try { const p = JSON.parse(value); return Array.isArray(p) ? p as T[] : [] } catch { return [] } }
  return []
}
function fmtDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function StudyHubSection({
  courses,
  onStatsChange,
}: {
  courses: Course[]
  onStatsChange?: () => void
}) {
  const [materials, setMaterials] = useState<MaterialSummary[]>([])
  const [stats, setStats] = useState<StudyStats>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<MaterialDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [tab, setTab] = useState<'notes' | 'flashcards' | 'quiz' | 'chat'>('notes')

  // create form
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')

  // timer
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // notes
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // flashcards
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  // quiz
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // chat
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [mats, st] = await Promise.all([
        api.get<MaterialSummary[]>('/study-materials', { cache: false }),
        api.get<StudyStats>('/study-materials/stats', { cache: false }).catch(() => ({} as StudyStats)),
      ])
      setMaterials(Array.isArray(mats) ? mats : [])
      setStats(st || {})
    } catch (err) {
      setError(msg(err, 'Could not load study materials.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadMaterials() }, [loadMaterials])

  useEffect(() => {
    if (!timerStart) return
    const tick = () => setElapsed(Math.floor((Date.now() - timerStart) / 1000))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [timerStart])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [chatMessages, chatBusy])

  const openMaterial = useCallback(async (id: string) => {
    setSelectedId(id)
    setDetailLoading(true)
    setTab('notes')
    setQuizIndex(0); setQuizAnswers({}); setQuizSubmitted(false)
    setCardIndex(0); setFlipped(false)
    try {
      const d = await api.get<MaterialDetail>(`/study-materials/${id}`, { cache: false })
      setDetail(d)
      setNoteDraft(d.improvedNote || d.summary || '')
      setChatMessages(asArray<{ role: 'user' | 'assistant'; content: string }>(d.chatHistory))
      const due = await api.get<{ cards?: Flashcard[] }>(`/study-materials/${id}/flashcards/due`, { cache: false }).catch(() => ({ cards: [] }))
      setDueCards(Array.isArray(due?.cards) ? due.cards : Array.isArray(d.flashcards) ? d.flashcards : [])
    } catch (err) {
      setNotice(msg(err, 'Could not open study pack.'))
    } finally {
      setDetailLoading(false)
    }
  }, [])

  async function createPack(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || (!file && !sourceText.trim() && !youtubeUrl.trim())) {
      setNotice('Add a title and content: file, text, or YouTube URL.')
      return
    }
    setCreating(true)
    setNotice('Creating your study pack. This can take a moment…')
    try {
      if (file) {
        const form = new FormData()
        form.append('title', title.trim())
        if (courseId) form.append('courseId', courseId)
        if (sourceText.trim()) form.append('sourceText', sourceText.trim())
        if (youtubeUrl.trim()) form.append('youtubeUrl', youtubeUrl.trim())
        form.append('document', file)
        const created = await api.upload<MaterialDetail>('/study-materials/upload', form, { timeout: 180000 })
        if (created?.id) await openMaterial(created.id)
      } else {
        const created = await api.post<MaterialDetail>('/study-materials', {
          title: title.trim(), courseId: courseId || undefined,
          sourceText: sourceText.trim() || undefined, youtubeUrl: youtubeUrl.trim() || undefined,
        }, { timeout: 180000 })
        if (created?.id) await openMaterial(created.id)
      }
      setTitle(''); setCourseId(''); setSourceText(''); setYoutubeUrl(''); setFile(null)
      setNotice('Study pack ready.')
      await loadMaterials()
      onStatsChange?.()
    } catch (err) {
      setNotice(msg(err, 'Could not create study pack.'))
    } finally {
      setCreating(false)
    }
  }

  async function saveNote() {
    if (!detail?.id) return
    setSavingNote(true)
    try {
      await api.put(`/study-materials/${detail.id}/notes`, { improvedNote: noteDraft })
      setDetail((d) => d ? { ...d, improvedNote: noteDraft } : d)
      setNotice('Notes saved.')
    } catch (err) { setNotice(msg(err, 'Could not save notes.')) }
    finally { setSavingNote(false) }
  }

  async function reviewCard(quality: number) {
    const card = dueCards[cardIndex]
    if (!detail?.id || !card) return
    setReviewing(true)
    try {
      await api.post(`/study-materials/${detail.id}/flashcards/review`, { flashcardId: card.id, quality })
      const next = cardIndex + 1
      if (next < dueCards.length) { setCardIndex(next); setFlipped(false) }
      else { setNotice('Review complete.'); await openMaterial(detail.id); onStatsChange?.() }
    } catch (err) { setNotice(msg(err, 'Could not save review.')) }
    finally { setReviewing(false) }
  }

  async function submitQuiz() {
    if (!detail?.id) return
    const questions = asArray<QuizQuestion>(detail.quiz)
    const total = questions.length
    const correct = questions.reduce((n, q, i) => n + (quizAnswers[i] === q.answerIndex ? 1 : 0), 0)
    const score = total ? Math.round((correct / total) * 100) : 0
    setQuizSubmitted(true)
    try {
      await api.post('/study-sessions', {
        materialId: detail.id, sessionType: 'quiz', score, totalQuestions: total, correctAnswers: correct,
        startedAt: new Date(Date.now() - 5 * 60000).toISOString(), endedAt: new Date().toISOString(),
      })
      onStatsChange?.(); void loadMaterials()
    } catch {/* non-blocking */}
  }

  async function sendChat(e: FormEvent) {
    e.preventDefault()
    if (!detail?.id || !chatInput.trim() || chatBusy) return
    const message = chatInput.trim()
    setChatInput('')
    setChatMessages((m) => [...m, { role: 'user', content: message }])
    setChatBusy(true)
    try {
      const res = await api.post<{ response?: string; history?: { role: 'user' | 'assistant'; content: string }[] }>(
        `/study-materials/${detail.id}/chat`, { message }, { timeout: 120000 }
      )
      if (Array.isArray(res?.history)) setChatMessages(res.history)
      else if (res?.response) setChatMessages((m) => [...m, { role: 'assistant', content: res.response as string }])
    } catch (err) {
      setChatMessages((m) => [...m, { role: 'assistant', content: msg(err, 'I could not answer that right now.') }])
    } finally { setChatBusy(false) }
  }

  async function stopTimer() {
    if (!timerStart) return
    const startedAt = new Date(timerStart).toISOString()
    const endedAt = new Date().toISOString()
    setTimerStart(null); setElapsed(0)
    try {
      await api.post('/study-sessions', { startedAt, endedAt, sessionType: 'review', materialId: detail?.id })
      setNotice('Study time saved.')
      void loadMaterials(); onStatsChange?.()
    } catch (err) { setNotice(msg(err, 'Could not save study time.')) }
  }

  const quiz = asArray<QuizQuestion>(detail?.quiz)
  const currentCard = dueCards[cardIndex]

  return (
    <div className={styles.hub}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>✦</div>
          <div><strong>Study Hub</strong><span>Learn, test, remember</span></div>
        </div>

        <div className={styles.stats}>
          <div><strong>{stats.studyMinutes ?? 0}</strong><span>min studied</span></div>
          <div><strong>{stats.cardsMastered ?? 0}</strong><span>mastered</span></div>
          <div><strong>{stats.quizzesTaken ?? 0}</strong><span>quizzes</span></div>
        </div>

        <div className={styles.timerCard}>
          <span>Focus timer</span>
          <strong>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</strong>
          {timerStart
            ? <button type="button" onClick={() => void stopTimer()}>Stop & save</button>
            : <button type="button" className={styles.primaryBtn} onClick={() => setTimerStart(Date.now())}>Start</button>}
        </div>

        <div className={styles.packListHead}>
          <strong>Your packs</strong>
          <button type="button" onClick={() => { setSelectedId(null); setDetail(null) }}>+ New</button>
        </div>
        <div className={styles.packList} role="listbox" aria-label="Study packs">
          {loading ? <p className={styles.muted}>Loading packs…</p> : null}
          {!loading && !materials.length ? <p className={styles.muted}>No packs yet. Create one to start.</p> : null}
          {materials.map((m) => (
            <button key={m.id} type="button" role="option" aria-selected={selectedId === m.id}
              className={`${styles.packItem} ${selectedId === m.id ? styles.packItemActive : ''}`}
              onClick={() => void openMaterial(m.id)}>
              <span className={styles.packTitle}>{m.title}</span>
              <span className={styles.packMeta}>{m.courseCode || 'General'} · {fmtDate(m.createdAt)}{m.flashcardCount ? ` · ${m.flashcardCount} cards` : ''}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className={styles.main}>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

        {!selectedId || !detail ? (
          <section className={styles.createCard}>
            <div className={styles.createHead}>
              <span className={styles.kicker}>Create a study pack</span>
              <h2>Turn any material into notes, flashcards, quiz, and chat</h2>
              <p>Upload a document, paste text, or add a YouTube link. The AI builds a study pack you can actually learn from.</p>
            </div>
            <form className={styles.createForm} onSubmit={(e) => void createPack(e)}>
              <label><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. CSC 201 — Database Design" required /></label>
              <label><span>Course (optional)</span>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">No course</option>
                  {courses.map((c, i) => <option key={String(c.id || i)} value={String(c.id || '')}>{c.code || c.title || c.courseName || c.name || 'Course'}</option>)}
                </select>
              </label>
              <label className={styles.full}><span>Paste notes / source text</span><textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={6} placeholder="Paste lecture notes, textbook content, or anything you want to study…" /></label>
              <label><span>YouTube URL (optional)</span><input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." /></label>
              <label><span>Document (optional)</span><input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
              <div className={styles.createActions}>
                <button type="submit" className={styles.primaryBtn} disabled={creating}>{creating ? 'Creating pack…' : 'Generate study pack'}</button>
              </div>
            </form>
          </section>
        ) : detailLoading ? (
          <div className={styles.loadingState}>Loading study pack…</div>
        ) : (
          <section className={styles.workspace}>
            <header className={styles.workspaceHead}>
              <div>
                <button type="button" className={styles.backBtn} onClick={() => { setSelectedId(null); setDetail(null) }}>← All packs</button>
                <h2>{detail.title}</h2>
                <p>{detail.courseCode || detail.courseTitle || 'General'} · {asArray(detail.flashcards).length} cards · {quiz.length} quiz questions</p>
              </div>
            </header>

            <div className={styles.tabs} role="tablist" aria-label="Study pack views">
              {(['notes', 'flashcards', 'quiz', 'chat'] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
                  {t === 'notes' ? 'Notes' : t === 'flashcards' ? 'Flashcards' : t === 'quiz' ? 'Quiz' : 'Chat'}
                </button>
              ))}
            </div>

            {tab === 'notes' ? (
              <div className={styles.notesPane}>
                <div className={styles.notesToolbar}>
                  <span>Editable study notes</span>
                  <button type="button" className={styles.primaryBtn} onClick={() => void saveNote()} disabled={savingNote}>{savingNote ? 'Saving…' : 'Save notes'}</button>
                </div>
                <textarea className={styles.notesEditor} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Your study notes…" />
              </div>
            ) : null}

            {tab === 'flashcards' ? (
              <div className={styles.flashPane}>
                {!currentCard ? <p className={styles.muted}>No due flashcards right now. Great work.</p> : (
                  <>
                    <div className={styles.flashMeta}>Card {cardIndex + 1} of {dueCards.length}</div>
                    <button type="button" className={styles.flashCard} onClick={() => setFlipped((f) => !f)}>
                      <span className={styles.flashLabel}>{flipped ? 'Answer' : 'Question'}</span>
                      <p>{flipped ? currentCard.back : currentCard.front}</p>
                      <small>{flipped ? 'Rate your recall' : 'Tap to reveal answer'}</small>
                    </button>
                    {flipped ? (
                      <div className={styles.reviewRow}>
                        {[{q:1,l:'Again'},{q:3,l:'Hard'},{q:4,l:'Good'},{q:5,l:'Easy'}].map((r) => (
                          <button key={r.q} type="button" disabled={reviewing} onClick={() => void reviewCard(r.q)}>{r.l}</button>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            {tab === 'quiz' ? (
              <div className={styles.quizPane}>
                {!quiz.length ? <p className={styles.muted}>No quiz questions in this pack yet.</p> : !quizSubmitted ? (
                  <>
                    <div className={styles.flashMeta}>Question {quizIndex + 1} of {quiz.length}</div>
                    <h3 className={styles.quizQ}>{quiz[quizIndex]?.question}</h3>
                    <div className={styles.options}>
                      {(quiz[quizIndex]?.options || []).map((opt, i) => (
                        <label key={i} className={`${styles.option} ${quizAnswers[quizIndex] === i ? styles.optionSelected : ''}`}>
                          <input type="radio" name={`q-${quizIndex}`} checked={quizAnswers[quizIndex] === i} onChange={() => setQuizAnswers((a) => ({ ...a, [quizIndex]: i }))} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    <div className={styles.quizNav}>
                      <button type="button" disabled={quizIndex === 0} onClick={() => setQuizIndex((i) => i - 1)}>Previous</button>
                      {quizIndex < quiz.length - 1
                        ? <button type="button" className={styles.primaryBtn} onClick={() => setQuizIndex((i) => i + 1)}>Next</button>
                        : <button type="button" className={styles.primaryBtn} onClick={() => void submitQuiz()}>Submit quiz</button>}
                    </div>
                  </>
                ) : (
                  <div className={styles.quizResult}>
                    <h3>Quiz complete</h3>
                    <p>You scored {quiz.reduce((n, q, i) => n + (quizAnswers[i] === q.answerIndex ? 1 : 0), 0)} / {quiz.length}</p>
                    <button type="button" className={styles.primaryBtn} onClick={() => { setQuizAnswers({}); setQuizIndex(0); setQuizSubmitted(false) }}>Retake</button>
                  </div>
                )}
              </div>
            ) : null}

            {tab === 'chat' ? (
              <div className={styles.chatPane}>
                <div className={styles.chatLog}>
                  {!chatMessages.length ? <p className={styles.muted}>Ask anything about this study pack.</p> : null}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`${styles.chatMsg} ${m.role === 'user' ? styles.chatUser : styles.chatAi}`}>
                      <span>{m.role === 'user' ? 'You' : 'AI'}</span>
                      <p>{m.content}</p>
                    </div>
                  ))}
                  {chatBusy ? <div className={`${styles.chatMsg} ${styles.chatAi}`}><span>AI</span><p>Thinking…</p></div> : null}
                  <div ref={chatEndRef} />
                </div>
                <form className={styles.chatComposer} onSubmit={(e) => void sendChat(e)}>
                  <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about this material…" rows={2} />
                  <button type="submit" className={styles.primaryBtn} disabled={chatBusy || !chatInput.trim()}>Send</button>
                </form>
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  )
}
