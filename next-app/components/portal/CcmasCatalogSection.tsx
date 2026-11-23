'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import s from './ccmasWorkspace.module.css'

export type CcmasCourse = {
  id: string
  code: string
  title: string
  units: number
  status: string
  level: number
  department: string
  departmentSlug: string
  faculty: string
  programme: string
  degree: string
  outcomes: string[]
  contents: string
  builtinNotes: string
  sourceUrl: string
  sourcePage: number
}

type Department = {
  slug: string
  department: string
  faculty: string
  programme: string
  degree: string
  courseCount: number
}

type Overview = {
  departments: Department[]
  faculties: string[]
  totalCourses: number
  source: string
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'The CCMAS catalog is unavailable right now.'
}

export default function CcmasCatalogSection({ onOpenNotes }: { onOpenNotes: (course: CcmasCourse) => void }) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [courses, setCourses] = useState<CcmasCourse[]>([])
  const [total, setTotal] = useState(0)
  const [department, setDepartment] = useState('')
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void api.get<Overview>('/ccmas/overview', { cache: false })
      .then(setOverview)
      .catch((err) => setError(messageOf(err)))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadCourses = useCallback(async (reset: boolean) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    setError('')
    try {
      const response = await api.get<{ courses: CcmasCourse[]; total: number }>('/ccmas/courses', {
        params: {
          department,
          search: debouncedSearch,
          level,
          limit: 60,
          offset: reset ? 0 : courses.length,
        },
        cache: false,
      })
      setCourses((current) => reset ? response.courses : [...current, ...response.courses])
      setTotal(response.total)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [courses.length, department, debouncedSearch, level])

  useEffect(() => {
    void loadCourses(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, debouncedSearch, level])

  const groupedDepartments = useMemo(() => {
    const groups = new Map<string, Department[]>()
    for (const item of overview?.departments || []) {
      groups.set(item.faculty, [...(groups.get(item.faculty) || []), item])
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [overview])

  const selectedDepartmentName = overview?.departments.find((item) => item.slug === department)?.department

  return (
    <div className={s.wrap}>
      <section className={s.catalogHead}>
        <div>
          <span className={s.eyebrow}>NUC CCMAS 2023</span>
          <h2>Every course, by department</h2>
          <p>Browse {overview?.totalCourses || 795} CCMAS courses mapped to McPherson University departments, with real outlines and learning outcomes.</p>
        </div>
        <div className={s.sourceBadge}>
          <strong>{overview?.departments.length || 20}</strong>
          <span>departments</span>
        </div>
      </section>

      <div className={s.catalogGrid}>
        <aside className={s.departmentPanel} aria-label="CCMAS departments">
          <div className={s.panelTitle}>
            <strong>Departments</strong>
            <button type="button" className={s.linkButton} onClick={() => setDepartment('')} disabled={!department}>All</button>
          </div>
          <div className={s.departmentList}>
            {groupedDepartments.map(([faculty, items]) => (
              <div key={faculty} className={s.facultyGroup}>
                <span className={s.facultyLabel}>{faculty}</span>
                {items.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    className={`${s.departmentButton} ${department === item.slug ? s.departmentButtonActive : ''}`}
                    onClick={() => setDepartment(item.slug)}
                  >
                    <span>{item.department}</span>
                    <small>{item.courseCount}</small>
                  </button>
                ))}
              </div>
            ))}
            {!overview && !error ? <p className={s.state}>Loading departments…</p> : null}
          </div>
        </aside>

        <div className={s.resultsPanel}>
          <div className={s.toolbar}>
            <label className={s.search}>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search course code, title or topic"
                aria-label="Search CCMAS courses"
              />
            </label>
            <select value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by level">
              <option value="">All levels</option>
              <option value="100">100 level</option>
              <option value="200">200 level</option>
              <option value="300">300 level</option>
              <option value="400">400 level</option>
              <option value="500">500 level</option>
            </select>
          </div>

          {selectedDepartmentName ? (
            <div className={s.activeFilter}>
              Showing <strong>{selectedDepartmentName}</strong>
              <button type="button" onClick={() => setDepartment('')}>Clear</button>
            </div>
          ) : null}

          {error ? <p className={s.error} role="alert">{error}</p> : null}
          {loading ? <p className={s.state}>Loading CCMAS courses…</p> : null}
          {!loading && !courses.length ? <p className={s.state}>No courses match this search.</p> : null}

          <ul className={s.courseList}>
            {courses.map((course) => {
              const isOpen = expanded === course.id
              return (
                <li key={course.id} className={isOpen ? s.courseItemOpen : ''}>
                  <button
                    type="button"
                    className={s.courseItemHead}
                    onClick={() => setExpanded(isOpen ? null : course.id)}
                    aria-expanded={isOpen}
                  >
                    <span className={s.courseCode}>{course.code}</span>
                    <span className={s.courseInfo}>
                      <strong>{course.title}</strong>
                      <small>{course.department} · {course.programme} · {course.units} units</small>
                    </span>
                    <span className={s.levelPill}>{course.level}</span>
                    <span className={s.chevron} aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen ? (
                    <div className={s.courseDetail}>
                      <div>
                        <h4>Learning outcomes</h4>
                        <ul>
                          {course.outcomes.length
                            ? course.outcomes.map((outcome, index) => <li key={index}>{outcome}</li>)
                            : <li>No learning outcomes were published for this course.</li>}
                        </ul>
                      </div>
                      <div>
                        <h4>Course outline</h4>
                        <p>{course.contents || 'No outline content was published for this course.'}</p>
                      </div>
                      <div className={s.courseActions}>
                        <button type="button" className={s.primaryButton} onClick={() => onOpenNotes(course)}>
                          Open in notes
                        </button>
                        <a href={course.sourceUrl} target="_blank" rel="noreferrer" className={s.secondaryButton}>
                          NUC source
                        </a>
                      </div>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>

          {courses.length < total ? (
            <button type="button" className={s.loadMore} disabled={loadingMore} onClick={() => void loadCourses(false)}>
              {loadingMore ? 'Loading…' : `Load more (${total - courses.length} remaining)`}
            </button>
          ) : courses.length ? (
            <p className={s.endNote}>All {total} courses loaded.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
