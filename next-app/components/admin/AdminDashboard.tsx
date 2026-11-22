'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import styles from './AdminDashboard.module.css'

type UnknownRecord = Record<string, unknown>

interface StatsView {
  users: number | null
  courses: number | null
  departments: number | null
}

interface SummaryView {
  records: number | null
  atRiskStudents: number | null
  present: number | null
  absent: number | null
  attendanceRate: number | null
}

interface DepartmentAttendance {
  department: string
  records: number
  attendanceRate: number
}

interface AtRiskStudent {
  studentId: string
  studentName: string
  department: string
  records: number
  present: number
  attendanceRate: number
}

interface InsightsView {
  summary: SummaryView
  departmentBreakdown: DepartmentAttendance[]
  atRiskStudents: AtRiskStudent[]
}

interface ActionNotice {
  tone: 'success' | 'error'
  text: string
}

type IconName = 'users' | 'courses' | 'departments' | 'trend' | 'download' | 'search'

const EMPTY_STATS: StatsView = { users: null, courses: null, departments: null }
const EMPTY_SUMMARY: SummaryView = {
  records: null,
  atRiskStudents: null,
  present: null,
  absent: null,
  attendanceRate: null,
}
const UNASSIGNED = '__unassigned__'

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null
}

// The API returns plain objects, but tolerate a legacy `{ data }` envelope too.
function unwrapPayload(payload: unknown): unknown {
  let current = payload
  for (let depth = 0; depth < 2; depth += 1) {
    const record = asRecord(current)
    if (!record || !('data' in record)) break
    const nested = record.data
    if (!nested || typeof nested !== 'object') break
    current = nested
  }
  return current
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return typeof value === 'string' ? value.trim() : String(value)
}

function toCount(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }
  return null
}

function toRate(value: unknown): number | null {
  const parsed = toCount(value)
  return parsed === null ? null : Math.min(100, parsed)
}

function formatValue(value: number | null): string {
  return value === null ? '—' : String(value)
}

function formatRate(value: number | null): string {
  return value === null ? '—' : `${value}%`
}

function normalizeStats(payload: unknown): StatsView {
  const record = asRecord(unwrapPayload(payload))
  if (!record) return EMPTY_STATS
  return {
    users: toCount(record.users),
    courses: toCount(record.courses),
    departments: toCount(record.departments),
  }
}

function normalizeInsights(payload: unknown): InsightsView {
  const record = asRecord(unwrapPayload(payload))
  if (!record) {
    return { summary: EMPTY_SUMMARY, departmentBreakdown: [], atRiskStudents: [] }
  }

  const summaryRecord = asRecord(record.summary) ?? {}
  const summary: SummaryView = {
    records: toCount(summaryRecord.records),
    atRiskStudents: toCount(summaryRecord.atRiskStudents),
    present: toCount(summaryRecord.present),
    absent: toCount(summaryRecord.absent),
    attendanceRate: toRate(summaryRecord.attendanceRate),
  }

  const departmentBreakdown = (Array.isArray(record.departmentBreakdown) ? record.departmentBreakdown : [])
    .map((item): DepartmentAttendance | null => {
      const row = asRecord(item)
      if (!row) return null
      const department = toText(row.department)
      if (!department) return null
      return {
        department,
        records: toCount(row.records) ?? 0,
        attendanceRate: toRate(row.attendanceRate) ?? 0,
      }
    })
    .filter((item): item is DepartmentAttendance => item !== null)

  const atRiskStudents = (Array.isArray(record.atRiskStudents) ? record.atRiskStudents : [])
    .map((item): AtRiskStudent | null => {
      const row = asRecord(item)
      if (!row) return null
      return {
        studentId: toText(row.studentId ?? row.userId),
        studentName: toText(row.studentName ?? row.name) || 'Unknown student',
        department: toText(row.department),
        records: toCount(row.records) ?? 0,
        present: toCount(row.present) ?? 0,
        attendanceRate: toRate(row.attendanceRate) ?? 0,
      }
    })
    .filter((item): item is AtRiskStudent => item !== null)

  return { summary, departmentBreakdown, atRiskStudents }
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return fallback
}

// Quotes every cell, neutralises line breaks and prefixes spreadsheet formulas
// with an apostrophe so exported student data cannot be executed in a viewer.
function csvCell(value: string): string {
  const text = String(value ?? '').replace(/[\r\n\t]+/g, ' ')
  const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const

  switch (name) {
    case 'users':
      return (
        <svg {...svgProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'courses':
      return (
        <svg {...svgProps}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
    case 'departments':
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
        </svg>
      )
    case 'trend':
      return (
        <svg {...svgProps}>
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-5 5" />
        </svg>
      )
    case 'download':
      return (
        <svg {...svgProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )
    case 'search':
      return (
        <svg {...svgProps}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      )
    default:
      return null
  }
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<ActionNotice | null>(null)
  const [stats, setStats] = useState<StatsView>(EMPTY_STATS)
  const [summary, setSummary] = useState<SummaryView>(EMPTY_SUMMARY)
  const [departmentBreakdown, setDepartmentBreakdown] = useState<DepartmentAttendance[]>([])
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([])
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [notifyingId, setNotifyingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [statsPayload, insightsPayload] = await Promise.all([
        api.get<unknown>('/stats', { cache: false }),
        api.get<unknown>('/insights', { cache: false }),
      ])
      const insights = normalizeInsights(insightsPayload)
      setStats(normalizeStats(statsPayload))
      setSummary(insights.summary)
      setDepartmentBreakdown(insights.departmentBreakdown)
      setAtRiskStudents(insights.atRiskStudents)
    } catch (error) {
      setStats(EMPTY_STATS)
      setSummary(EMPTY_SUMMARY)
      setDepartmentBreakdown([])
      setAtRiskStudents([])
      setLoadError(errorMessage(error, 'Could not load admin data. Please retry.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!notice || notice.tone !== 'success') return
    const timer = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const departments = useMemo(
    () => Array.from(new Set(atRiskStudents.map((student) => student.department).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)),
    [atRiskStudents],
  )

  const hasUnassignedDepartment = useMemo(
    () => atRiskStudents.some((student) => !student.department),
    [atRiskStudents],
  )

  const filteredAtRisk = useMemo(() => {
    const query = search.trim().toLowerCase()
    return atRiskStudents.filter((student) => {
      const matchesSearch = !query
        || student.studentName.toLowerCase().includes(query)
        || student.studentId.toLowerCase().includes(query)
      const matchesDepartment = !departmentFilter
        || (departmentFilter === UNASSIGNED ? !student.department : student.department === departmentFilter)
      return matchesSearch && matchesDepartment
    })
  }, [atRiskStudents, search, departmentFilter])

  async function notifyStudent(student: AtRiskStudent): Promise<void> {
    if (!student.studentId || notifyingId) return
    setNotifyingId(student.studentId)
    setNotice(null)
    try {
      await api.post('/admin/notifications/student', { userId: student.studentId })
      setNotice({ tone: 'success', text: `Reminder sent to ${student.studentName}.` })
    } catch (error) {
      setNotice({ tone: 'error', text: errorMessage(error, 'Could not send the reminder.') })
    } finally {
      setNotifyingId(null)
    }
  }

  function exportCsv(): void {
    if (!filteredAtRisk.length) return
    const headers = ['Student ID', 'Name', 'Department', 'Records', 'Attended', 'Rate']
    const rows = filteredAtRisk.map((student) => [
      student.studentId,
      student.studentName,
      student.department,
      String(student.records),
      String(student.present),
      `${student.attendanceRate}%`,
    ])
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'at-risk-students.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const campusRate = summary.records !== null && summary.records > 0
    ? formatRate(summary.attendanceRate)
    : '—'

  const statCards: Array<{ label: string; value: string; icon: IconName; tone: string }> = [
    { label: 'Registered accounts', value: formatValue(stats.users), icon: 'users', tone: styles.statIconBlue },
    { label: 'Courses', value: formatValue(stats.courses), icon: 'courses', tone: styles.statIconGreen },
    { label: 'Departments', value: formatValue(stats.departments), icon: 'departments', tone: styles.statIconGold },
    { label: 'Campus attendance rate', value: campusRate, icon: 'trend', tone: styles.statIconGold },
  ]

  const insightCards: Array<{ label: string; value: string; tone: string }> = [
    { label: 'Attendance records', value: formatValue(summary.records), tone: '' },
    { label: 'At-risk students', value: formatValue(summary.atRiskStudents), tone: styles.insightValueRed },
    { label: 'Present', value: formatValue(summary.present), tone: styles.insightValueGreen },
    { label: 'Absent', value: formatValue(summary.absent), tone: styles.insightValueRed },
  ]

  return (
    <main className={styles.root} aria-busy={loading}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>McPherson University · Administration</p>
          <h1 className={styles.title}>Admin Console</h1>
          <p className={styles.subtitle}>Monitor attendance thresholds across the university</p>
        </div>
        <button
          type="button"
          className={styles.exportButton}
          onClick={exportCsv}
          disabled={loading || Boolean(loadError) || filteredAtRisk.length === 0}
        >
          <Icon name="download" size={16} />
          <span>Export CSV</span>
        </button>
      </header>

      {notice ? (
        <p
          className={`${styles.notice} ${notice.tone === 'error' ? styles.noticeError : ''}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </p>
      ) : null}

      {loadError && !loading ? (
        <div className={`${styles.state} ${styles.stateError}`} role="alert">
          <p>{loadError}</p>
          <button type="button" className={styles.retryButton} onClick={() => void fetchData()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <>
          <p className={styles.srOnly} role="status">Loading admin dashboard…</p>
          <div className={styles.loadingGrid} aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={styles.skeletonCard} />
            ))}
          </div>
        </>
      ) : !loadError ? (
        <>
          <section className={styles.statsGrid} aria-label="University overview">
            {statCards.map((card) => (
              <article className={styles.statCard} key={card.label}>
                <div className={styles.statTop}>
                  <div>
                    <p className={styles.statLabel}>{card.label}</p>
                    <p className={styles.statValue}>{card.value}</p>
                  </div>
                  <span className={`${styles.statIcon} ${card.tone}`}>
                    <Icon name={card.icon} size={20} />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className={styles.insightGrid} aria-label="Attendance insights">
            {insightCards.map((card) => (
              <article className={styles.insightCard} key={card.label}>
                <p className={styles.insightLabel}>{card.label}</p>
                <p className={`${styles.insightValue} ${card.tone}`}>{card.value}</p>
              </article>
            ))}
          </section>

          <section className={styles.departmentSection} aria-labelledby="department-chart-title">
            <header className={styles.departmentHeading}>
              <div>
                <h2 id="department-chart-title">Attendance by department</h2>
                <p>Share of recorded sessions marked present.</p>
              </div>
              <span>{departmentBreakdown.length} departments</span>
            </header>
            {departmentBreakdown.length ? (
              <div className={styles.departmentChart}>
                {departmentBreakdown.map((department, index) => (
                  <div className={styles.departmentRow} key={`${department.department}-${index}`}>
                    <div className={styles.departmentLabel}>
                      <strong title={department.department}>{department.department}</strong>
                      <span>{department.attendanceRate}% · {department.records} records</span>
                    </div>
                    <div
                      className={styles.departmentTrack}
                      role="progressbar"
                      aria-label={`${department.department} attendance rate`}
                      aria-valuenow={department.attendanceRate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className={styles.departmentTrackFill} style={{ width: `${department.attendanceRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.departmentEmpty} role="status">
                No department-linked attendance records are available yet.
              </p>
            )}
          </section>

          <section className={styles.atRiskSection} aria-labelledby="at-risk-title">
            <header className={styles.sectionHeader}>
              <div>
                <h2 id="at-risk-title">At-risk students</h2>
                <p className={styles.sectionNote}>
                  Below 75% attendance with at least two sessions; the report shows up to 10 highest-risk students.
                </p>
              </div>
              <div className={styles.tableFilters}>
                <div className={styles.departmentFilter}>
                  <label className={styles.srOnly} htmlFor="admin-risk-department">Filter by department</label>
                  <select
                    id="admin-risk-department"
                    value={departmentFilter}
                    onChange={(event) => setDepartmentFilter(event.target.value)}
                    disabled={!departments.length && !hasUnassignedDepartment}
                  >
                    <option value="">All departments</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                    {hasUnassignedDepartment ? <option value={UNASSIGNED}>Department unavailable</option> : null}
                  </select>
                </div>
                <div className={styles.searchWrap}>
                  <span className={styles.searchIcon} aria-hidden="true">
                    <Icon name="search" size={16} />
                  </span>
                  <label className={styles.srOnly} htmlFor="admin-risk-search">Search at-risk students by name or ID</label>
                  <input
                    id="admin-risk-search"
                    className={styles.searchInput}
                    type="search"
                    placeholder="Search name or ID..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>
            </header>

            {!departments.length && hasUnassignedDepartment ? (
              <p className={styles.departmentNotice} role="status">
                Department assignments are unavailable for the listed student records.
              </p>
            ) : null}

            <div className={styles.tableWrap}>
              <table className={styles.riskTable}>
                <caption className={styles.srOnly}>At-risk students at McPherson University</caption>
                <thead>
                  <tr>
                    <th scope="col">Student ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Department</th>
                    <th scope="col">Records</th>
                    <th scope="col">Attended</th>
                    <th scope="col">Rate</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtRisk.map((student, index) => (
                    <tr key={`${student.studentId || 'unknown'}-${index}`}>
                      <td className={styles.mono}>{student.studentId || '—'}</td>
                      <td className={styles.bold}>{student.studentName}</td>
                      <td>{student.department || '—'}</td>
                      <td>{student.records}</td>
                      <td>{student.present}</td>
                      <td>
                        <span className={`${styles.ratePill} ${student.attendanceRate < 60 ? styles.rateLow : styles.rateMid}`}>
                          {student.attendanceRate}%
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.notifyButton}
                          onClick={() => void notifyStudent(student)}
                          disabled={!student.studentId || notifyingId === student.studentId}
                          aria-label={`Send attendance reminder to ${student.studentName}`}
                          aria-busy={notifyingId === student.studentId}
                        >
                          {notifyingId === student.studentId ? 'Sending...' : 'Notify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAtRisk.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>No at-risk students found</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}
