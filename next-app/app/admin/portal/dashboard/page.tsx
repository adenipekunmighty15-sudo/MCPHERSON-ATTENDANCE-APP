'use client'

import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminPortalDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  )
}
