'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { initialized, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!initialized || isAuthenticated) return
    const target = `/login?redirect=${encodeURIComponent(pathname || '/')}`
    router.replace(target)
  }, [initialized, isAuthenticated, pathname, router])

  if (!initialized) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper text-navy">
        <p className="text-sm font-medium text-navy/60">Preparing your portal…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper text-navy">
        <p className="text-sm font-medium text-navy/60">Redirecting you to sign in…</p>
      </main>
    )
  }

  return <>{children}</>
}
