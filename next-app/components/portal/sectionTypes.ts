export type DashboardSection =
  | 'overview'
  | 'attendance'
  | 'courses'
  | 'timetable'
  | 'studyhub'
  | 'aichat'
  | 'messaging'
  | 'feedback'
  | 'settings'

export const DASHBOARD_SECTIONS: { id: DashboardSection; label: string; icon: string; copy: string }[] = [
  { id: 'overview', label: 'Overview', icon: '⌂', copy: 'Your academic day at a glance' },
  { id: 'attendance', label: 'Attendance', icon: '✓', copy: 'Live sessions and verified records' },
  { id: 'courses', label: 'My Courses', icon: '▣', copy: 'Courses you are enrolled in' },
  { id: 'timetable', label: 'Timetable', icon: '◷', copy: 'Your scheduled classes' },
  { id: 'studyhub', label: 'StudyHub', icon: '✦', copy: 'Notes, flashcards and study time' },
  { id: 'aichat', label: 'AI Chat', icon: '◇', copy: 'Ask the AI council' },
  { id: 'messaging', label: 'Messaging', icon: '✉', copy: 'Direct conversations' },
  { id: 'feedback', label: 'Feedback', icon: '☰', copy: 'Send feedback and track replies' },
  { id: 'settings', label: 'Settings', icon: '⚙', copy: 'Your account and session' },
]
