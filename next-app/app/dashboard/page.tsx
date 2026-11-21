import type { Metadata } from 'next'
import AuthGuard from '@/components/auth/AuthGuard'
import DashboardWorkspace from '@/components/portal/DashboardWorkspace'

export const metadata: Metadata = {
  title: 'Dashboard | McPherson University',
  description: 'One McPherson University dashboard for attendance, courses, timetable, StudyHub, AI chat, messaging, feedback and settings.',
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardWorkspace />
    </AuthGuard>
  )
}
