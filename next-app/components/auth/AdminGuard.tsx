'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { isAdminRole } from '@/lib/config'

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { initialized, isAuthenticated, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const allowed = isAuthenticated && isAdminRole(user?.role)

  useEffect(() => {
    if (!initialized) return
    if (!isAuthenticated) {
      router.replace(`/admin/portal/login?redirect=${encodeURIComponent(pathname || '/admin/portal/dashboard')}`)
    } else if (!isAdminRole(user?.role)) {
      router.replace('/')
    }
  }, [initialized, isAuthenticated, user?.role, pathname, router])

  if (!initialized || !isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper text-navy">
        <p className="text-sm font-medium text-navy/60">
          {initialized ? 'Redirecting you to admin sign in…' : 'Preparing the admin portal…'}
        </p>
      </main>
    )
  }

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-5 text-navy">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Admin access only</h1>
          <p className="mt-3 text-sm text-navy/60">This area requires an administrator account. Taking you back to your dashboard…</p>
          <Link href="/" className="mcu-action mcu-action--primary mt-6">
            Return to dashboard
          </Link>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
