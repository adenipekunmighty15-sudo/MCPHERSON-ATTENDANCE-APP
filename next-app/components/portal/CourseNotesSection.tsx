'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { CcmasCourse } from './CcmasCatalogSection'
import s from './ccmasWorkspace.module.css'

type Note = {
  id: string
  courseCode: string
  courseTitle: string
  department: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

type Editor = {
  id: string
  courseCode: string
  courseTitle: string
  department: string
  title: string
  content: string
}

const EMPTY_EDITOR: Editor = {
  id: '',
  courseCode: '',
  courseTitle: '',
  department: '',
  title: '',
  content: '',
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Notes are unavailable right now.'
}

export default function CourseNotesSection({ selectedCourse }: { selectedCourse: CcmasCourse | null }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [editor, setEditor] = useState<Editor>(EMPTY_EDITOR)
  const [courseQuery, setCourseQuery] = useState('')
  const [courseResults, setCourseResults] = useState<CcmasCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setNotes(await api.get<Note[]>('/course-notes', { cache: false }))
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  useEffect(() => {
    if (!selectedCourse) return
    setEditor({
      id: '',
      courseCode: selectedCourse.code,
      courseTitle: selectedCourse.title,
      department: selectedCourse.department,
      title: `${selectedCourse.code} — study notes`,
      content: '',
    })
    setNotice(`Writing notes for ${selectedCourse.code}. Add the built-in outline below if you want a head start.`)
  }, [selectedCourse])

  useEffect(() => {
    const query = courseQuery.trim()
    if (query.length < 2) {
      setCourseResults([])
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      void api.get<{ courses: CcmasCourse[] }>('/ccmas/courses', {
        params: { search: query, limit: 8 },
        cache: false,
      }).then((response) => {
        if (!cancelled) setCourseResults(response.courses)
      }).catch(() => {
        if (!cancelled) setCourseResults([])
      })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [courseQuery])

  function chooseCourse(course: CcmasCourse) {
    setEditor({
      id: '',
      courseCode: course.code,
      courseTitle: course.title,
      department: course.department,
      title: `${course.code} — study notes`,
      content: '',
    })
    setCourseQuery('')
    setCourseResults([])
    setNotice(`${course.code} selected. Built-in CCMAS notes are available below.`)
  }

  function useBuiltinNotes() {
    const course = selectedCourse || courseResults.find((item) => item.code === editor.courseCode)
    if (!course?.builtinNotes) {
      setNotice('Search for a CCMAS course first, then load its built-in notes.')
      return
    }
    setEditor((current) => ({
      ...current,
      title: current.title || `${course.code} — built-in CCMAS notes`,
      content: course.builtinNotes,
    }))
    setNotice('Built-in CCMAS notes added. Edit them to make them yours.')
  }

  async function saveNote() {
    if (!editor.courseCode.trim()) {
      setNotice('Choose a course before saving.')
      return
    }
    if (!editor.content.trim()) {
      setNotice('Write something before saving your note.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const saved = editor.id
        ? await api.put<Note>(`/course-notes/${editor.id}`, editor)
        : await api.post<Note>('/course-notes', editor)
      setNotes((current) => [saved, ...current.filter((note) => note.id !== saved.id)])
      setEditor(EMPTY_EDITOR)
      setNotice('Note saved to your library.')
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(id: string) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    setError('')
    try {
      await api.delete(`/course-notes/${id}`)
      setNotes((current) => current.filter((note) => note.id !== id))
      if (editor.id === id) setEditor(EMPTY_EDITOR)
      setNotice('Note deleted.')
    } catch (err) {
      setError(messageOf(err))
    }
  }

  return (
    <div className={s.wrap}>
      <section className={s.catalogHead}>
        <div>
          <span className={s.eyebrow}>Inbuilt notes</span>
          <h2>Your notes, inside the app</h2>
          <p>Start from the real CCMAS course outline, then edit it into your own revision notes. Everything is saved to your account.</p>
        </div>
        <div className={s.sourceBadge}>
          <strong>{notes.length}</strong>
          <span>saved notes</span>
        </div>
      </section>

      <div className={s.notesGrid}>
        <section className={s.editorCard}>
          <div className={s.panelTitle}>
            <strong>{editor.id ? 'Edit note' : 'New note'}</strong>
            {editor.id ? (
              <button type="button" className={s.linkButton} onClick={() => setEditor(EMPTY_EDITOR)}>Cancel edit</button>
            ) : null}
          </div>

          <div className={s.coursePicker}>
            <label className={s.field}>
              <span>Find a CCMAS course</span>
              <input
                type="search"
                value={courseQuery}
                onChange={(event) => setCourseQuery(event.target.value)}
                placeholder="Search by code or title"
              />
            </label>
            {courseResults.length ? (
              <div className={s.courseResults} role="listbox" aria-label="CCMAS course results">
                {courseResults.map((course) => (
                  <button key={course.id} type="button" onClick={() => chooseCourse(course)}>
                    <strong>{course.code}</strong>
                    <span>{course.title}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className={s.formGrid}>
            <label className={s.field}>
              <span>Course code</span>
              <input value={editor.courseCode} onChange={(event) => setEditor({ ...editor, courseCode: event.target.value })} placeholder="e.g. CSC 201" />
            </label>
            <label className={s.field}>
              <span>Course title</span>
              <input value={editor.courseTitle} onChange={(event) => setEditor({ ...editor, courseTitle: event.target.value })} placeholder=" Course title" />
            </label>
          </div>
          <label className={s.field}>
            <span>Note title</span>
            <input value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} placeholder="e.g. Database design cheat sheet" />
          </label>
          <label className={s.field}>
            <span>Note content</span>
            <textarea
              value={editor.content}
              onChange={(event) => setEditor({ ...editor, content: event.target.value })}
              placeholder="Write your note here…"
              rows={14}
            />
          </label>

          <div className={s.editorActions}>
            <button type="button" className={s.secondaryButton} onClick={useBuiltinNotes} disabled={!editor.courseCode}>
              Use built-in notes
            </button>
            <button type="button" className={s.primaryButton} onClick={() => void saveNote()} disabled={saving}>
              {saving ? 'Saving…' : editor.id ? 'Update note' : 'Save note'}
            </button>
          </div>
          {notice ? <p className={s.notice} role="status">{notice}</p> : null}
          {error ? <p className={s.error} role="alert">{error}</p> : null}
        </section>

        <aside className={s.notesListCard}>
          <div className={s.panelTitle}><strong>Saved notes</strong></div>
          {loading ? <p className={s.state}>Loading notes…</p> : null}
          {!loading && !notes.length ? <p className={s.state}>No saved notes yet. Choose a course and write your first one.</p> : null}
          <ul className={s.noteList}>
            {notes.map((note) => (
              <li key={note.id}>
                <div className={s.noteInfo}>
                  <span className={s.noteCode}>{note.courseCode}</span>
                  <strong>{note.title}</strong>
                  <small>{note.courseTitle || note.department || 'Personal note'}</small>
                </div>
                <div className={s.noteActions}>
                  <button type="button" onClick={() => {
                    setEditor({
                      id: note.id,
                      courseCode: note.courseCode,
                      courseTitle: note.courseTitle,
                      department: note.department,
                      title: note.title,
                      content: note.content,
                    })
                    setNotice('')
                  }}>Edit</button>
                  <button type="button" className={s.deleteButton} onClick={() => void deleteNote(note.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
