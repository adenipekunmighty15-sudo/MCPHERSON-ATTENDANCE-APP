'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { isAdminRole } from '@/lib/config'

export function RoleAwareNotFound() {
  const { initialized, isAuthenticated, user } = useAuth()

  if (!initialized) return <p className="mt-4 text-sm text-navy/60">Checking your portal access…</p>

  if (isAuthenticated && isAdminRole(user?.role)) {
    return <p className="mt-4 text-sm text-navy/60">That admin page could not be found. Return to the admin portal to continue.</p>
  }

  if (isAuthenticated) {
    return <p className="mt-4 text-sm text-navy/60">That portal page could not be found. Your dashboard is still available.</p>
  }

  return <p className="mt-4 text-sm text-navy/60">The page you followed is not part of the McPherson University portal.</p>
}

export default RoleAwareNotFound

export function NotFoundActions() {
  const { initialized, isAuthenticated, user } = useAuth()
  const admin = initialized && isAuthenticated && isAdminRole(user?.role)

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <a href="/" className="mcu-action mcu-action--primary">
        {isAuthenticated ? 'Go to dashboard' : 'Visit the portal'}
      </a>
      {admin ? (
        <a href="/admin/portal/dashboard" className="mcu-action border border-navy/15 bg-white text-navy">
          Admin portal
        </a>
      ) : (
        <a href="/login" className="mcu-action border border-navy/15 bg-white text-navy">
          Sign in
        </a>
      )}
    </div>
  )
}
