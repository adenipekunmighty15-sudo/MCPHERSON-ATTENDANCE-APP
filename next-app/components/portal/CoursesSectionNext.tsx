'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { api } from '@/lib/api'
import CcmasCatalogSection, { type CcmasCourse } from './CcmasCatalogSection'
import CourseNotesSection from './CourseNotesSection'
import styles from './CoursesSectionNext.module.css'

export type Course = {
  id?: string | number
  courseId?: string | number
  course_id?: string | number
  code?: string
  courseCode?: string
  course_code?: string
  title?: string
  courseName?: string
  course_name?: string
  name?: string
  lecturer?: string
  instructor?: string
  departmentId?: string | number | null
  department_id?: string | number | null
  department?: { id?: string | number; name?: string; code?: string } | string | null
  attendanceRate?: number | string | null
  attendance_rate?: number | string | null
  attendance?: number | string | null
  creditUnits?: number | string | null
  credit_units?: number | string | null
  credits?: number | string | null
  schedule?: string
  meetingTime?: string
  meeting_time?: string
  status?: string
  [key: string]: unknown
}

type Props = {
  courses: Course[]
  loading: boolean
  error: string
  onReload: () => void
}

type Department = { id: string; name: string; code: string }
type CoursesTab = 'enrolled' | 'catalog' | 'notes'

type NormalizedCourse = {
  key: string
  departmentId: string
  code: string
  title: string
  lecturer: string
  schedule: string
  credits: string | null
  attendance: number | null
  chipColor: string
  chipBackground: string
  searchText: string
}

const CHIP_COLORS = ['#3D684B', '#B96445', '#6E7658', '#B38A4C', '#6F9270', '#8A5A44'] as const

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  const body = asRecord(error)
  if (body) {
    const candidate = body.error ?? body.message
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return 'Departments are unavailable right now.'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function firstString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

function pickValue(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim()) return value
  }
  return null
}

function normalizeDepartments(payload: unknown): Department[] {
  let rows: unknown[] = []
  if (Array.isArray(payload)) {
    rows = payload
  } else {
    const body = asRecord(payload)
    rows = body
      ? [body.data, body.departments, asRecord(body.data)?.departments].find(
          (candidate): candidate is unknown[] => Array.isArray(candidate),
        ) || []
      : []
  }

  return rows.flatMap((row, index) => {
    const record = asRecord(row)
    if (!record) return []
    const id = firstString(record, ['id', 'departmentId', 'department_id', 'deptId', 'dept_id'])
    const name = firstString(record, ['name', 'departmentName', 'department_name', 'title'])
    if (!id && !name) return []
    return [{
      id: id || name || String(index),
      name: name || id,
      code: firstString(record, ['code', 'departmentCode', 'department_code']),
    }]
  })
}

function parseRate(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  if (!text) return null
  const parsed = Number(text.replace(/%$/, '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

function clampRate(rate: number | null): number {
  if (rate === null) return 0
  return Math.min(100, Math.max(0, rate))
}

function chipIndex(identity: string): number {
  let total = 0
  for (const char of identity) total += char.charCodeAt(0)
  return total % CHIP_COLORS.length
}

function normalizeCourse(course: Course, index: number): NormalizedCourse {
  const row = asRecord(course) || {}
  const fallbackId = pickValue(row, ['code', 'courseCode', 'course_code'])
  const idValue = pickValue(row, ['id', 'courseId', 'course_id']) ?? fallbackId
  const code = firstString(row, ['code', 'courseCode', 'course_code']) || '—'
  const title = firstString(row, ['title', 'courseName', 'course_name', 'name']) || '—'
  const lecturer = firstString(row, ['lecturer', 'instructor', 'lecturerName', 'instructorName'])
  const departmentRecord = asRecord(course.department)
  const departmentIdValue = course.departmentId ?? course.department_id ?? departmentRecord?.id ?? null
  const departmentId = departmentIdValue === null || departmentIdValue === undefined ? '' : String(departmentIdValue)
  const attendance = parseRate(pickValue(row, ['attendanceRate', 'attendance_rate', 'attendance']))
  const creditsValue = pickValue(row, ['creditUnits', 'credit_units', 'credits'])
  const credits = creditsValue === null ? null : String(creditsValue)
  const schedule = firstString(row, ['schedule', 'meetingTime', 'meeting_time'])
  const identity = idValue === null ? `${code}-${index}` : String(idValue)
  const chipColor = CHIP_COLORS[chipIndex(identity)]

  return {
    key: identity || `course-${index}`,
    departmentId,
    code,
    title,
    lecturer,
    schedule,
    credits,
    attendance,
    chipColor,
    chipBackground: `${chipColor}18`,
    searchText: [code, title, lecturer, schedule].join(' ').toLowerCase(),
  }
}

function SearchIcon() {
  return (
    <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className={styles.icon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className={styles.icon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className={styles.icon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function CourseCard({ course }: { course: NormalizedCourse }) {
  const rate = clampRate(course.attendance)
  const isGood = course.attendance !== null && course.attendance >= 75
  const rateClass = course.attendance === null ? styles.rateMuted : isGood ? styles.rateGood : styles.rateWarn
  const cardStyle = {
    '--chip-color': course.chipColor,
    '--chip-bg': course.chipBackground,
  } as CSSProperties

  return (
    <article className={styles.card} style={cardStyle}>
      <div className={styles.cardTop}>
        <span className={styles.chip} aria-hidden="true"><BookIcon /></span>
        <span className={`${styles.rate} ${rateClass}`}>
          {course.attendance === null ? '—' : `${rate}%`}
        </span>
      </div>

      <p className={styles.code}>{course.code}</p>
      <h3 className={styles.cardTitle}>{course.title}</h3>
      {course.lecturer ? <p className={styles.lecturer}>{course.lecturer}</p> : null}

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={`${course.title} attendance`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rate}
        aria-valuetext={course.attendance === null ? 'Attendance not recorded' : `${rate}% attendance`}
      >
        {course.attendance === null ? null : (
          <div
            className={`${styles.progressFill} ${isGood ? styles.progressGood : styles.progressWarn}`}
            style={{ width: `${rate}%` }}
          />
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.schedule}>
          <CalendarIcon />
          <span className={styles.scheduleText}>{course.schedule || '—'}</span>
        </span>
        <span className={styles.credits}>{course.credits === null ? '—' : `${course.credits} cr.`}</span>
      </div>
    </article>
  )
}

export default function CoursesSectionNext({ courses, loading, error, onReload }: Props) {
  const [activeTab, setActiveTab] = useState<CoursesTab>('enrolled')
  const [selectedCcmasCourse, setSelectedCcmasCourse] = useState<CcmasCourse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentError, setDepartmentError] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)
  const generatedId = useId()
  const menuId = `course-departments-${generatedId}`
  const headingId = `courses-heading-${generatedId}`

  useEffect(() => {
    let active = true
    async function loadDepartments() {
      try {
        const response = await api.get<unknown>('/departments', { cache: false })
        if (!active) return
        setDepartments(normalizeDepartments(response))
        setDepartmentError('')
      } catch (err) {
        if (!active) return
        setDepartments([])
        setDepartmentError(messageOf(err))
      }
    }
    void loadDepartments()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen])

  const normalizedCourses = useMemo(() => courses.map(normalizeCourse), [courses])
  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return normalizedCourses.filter((course) => {
      const matchesDepartment = !selectedDepartmentId || course.departmentId === selectedDepartmentId
      const matchesSearch = !query || course.searchText.includes(query)
      return matchesDepartment && matchesSearch
    })
  }, [normalizedCourses, searchQuery, selectedDepartmentId])

  const selectedDepartmentName = useMemo(
    () => departments.find((dept) => dept.id === selectedDepartmentId)?.name || '',
    [departments, selectedDepartmentId],
  )
  const hasFilters = Boolean(searchQuery.trim() || selectedDepartmentId)

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedDepartmentId(null)
    setMenuOpen(false)
  }, [])

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setMenuOpen(false)
  }

  const selectDepartment = (id: string | null) => {
    setSelectedDepartmentId(id)
    setMenuOpen(false)
  }

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <div className={styles.tabs} role="tablist" aria-label="Course views">
        {([
          ['enrolled', 'My courses'],
          ['catalog', 'CCMAS catalog'],
          ['notes', 'Inbuilt notes'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'enrolled' ? (
        <>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Enrolled courses</p>
          <h2 id={headingId} className={styles.title}>My Courses</h2>
          <p className={styles.subtitle}>Your courses, progress, and class context in one place.</p>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search your courses"
              aria-label="Search your courses"
            />
          </label>

          <div className={styles.departmentWrap} ref={menuRef} onKeyDown={handleMenuKeyDown}>
            <button
              type="button"
              className={styles.departmentButton}
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label="Filter by department"
            >
              <span>{selectedDepartmentName || 'All departments'}</span>
              <ChevronIcon />
            </button>

            {menuOpen ? (
              <div id={menuId} className={styles.menu} role="listbox" aria-label="Filter by department">
                <p className={styles.menuTitle}>Filter by department</p>
                <button
                  type="button"
                  role="option"
                  aria-selected={!selectedDepartmentId}
                  className={styles.option}
                  onClick={() => selectDepartment(null)}
                >
                  <span className={styles.optionCheck}>{!selectedDepartmentId ? <CheckIcon /> : null}</span>
                  <span className={styles.optionLabel}>All departments</span>
                </button>

                {departments.map((dept) => {
                  const selected = selectedDepartmentId === dept.id
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={styles.option}
                      onClick={() => selectDepartment(dept.id)}
                    >
                      <span className={styles.optionCheck}>{selected ? <CheckIcon /> : null}</span>
                      <span className={styles.optionLabel}>{dept.name}{dept.code ? ` ${dept.code}` : ''}</span>
                    </button>
                  )
                })}

                {departments.length === 0 ? (
                  <p className={styles.menuNote}>{departmentError || 'No departments found'}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {hasFilters ? (
            <button type="button" className={styles.clearButton} onClick={clearFilters}>Clear filters</button>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className={styles.skeletonGrid} aria-busy="true" aria-label="Loading enrolled courses">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={styles.skeletonCard} aria-hidden="true">
              <div className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonCode}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonBar}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonFooter}`} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.stateError} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.retryButton} onClick={onReload} disabled={loading}>Try again</button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true">&#128218;</div>
          <p className={styles.emptyTitle}>
            {normalizedCourses.length ? 'No matching courses' : 'No courses enrolled yet'}
          </p>
          <p className={styles.emptyCopy}>
            {normalizedCourses.length ? 'Try a different search or department.' : 'Your enrolled courses will appear here.'}
          </p>
          {hasFilters ? (
            <button type="button" className={styles.emptyClear} onClick={clearFilters}>Clear filters</button>
          ) : null}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCourses.map((course) => <CourseCard key={course.key} course={course} />)}
        </div>
      )}
        </>
      ) : null}

      {activeTab === 'catalog' ? (
        <CcmasCatalogSection
          onOpenNotes={(course) => {
            setSelectedCcmasCourse(course)
            setActiveTab('notes')
          }}
        />
      ) : null}

      {activeTab === 'notes' ? <CourseNotesSection selectedCourse={selectedCcmasCourse} /> : null}
    </section>
  )
}
