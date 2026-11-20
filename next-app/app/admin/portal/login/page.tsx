'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import AuthFrame from '@/components/auth/AuthFrame'
import { errorTextClass, fieldLabelClass, inputClass, noticeClass, primaryButtonClass } from '@/components/auth/formStyles'
import { useAuth } from '@/components/providers/AuthProvider'
import { isAdminRole, sanitizeRedirect } from '@/lib/config'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const adminLoginPath = '/admin/portal/dashboard'
  const { adminLogin, ready, user, isAuthenticated, initialized, configured } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void ready.then(() => {
      if (!active) return
      if (isAuthenticated && isAdminRole(user?.role)) {
        router.replace(sanitizeRedirect(redirectParam, adminLoginPath))
      }
    })
    return () => {
      active = false
    }
  }, [ready, isAuthenticated, user?.role, redirectParam, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setBusy(true)
    try {
      await adminLogin(email.trim(), password)
      router.replace(sanitizeRedirect(redirectParam, adminLoginPath))
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Administration"
      title="Admin Portal"
      description="MCU attendance management — administrator access only."
      badge="Restricted access"
      footer={
        <Link href="/login" className="font-semibold text-blue hover:underline">← Back to Student Portal</Link>
      }
    >
      {initialized && !configured ? (
        <div className={`${noticeClass} mb-5 border-amber-300 bg-amber-50 text-amber-900`} role="status">
          Portal authentication is in maintenance mode. Please try again shortly.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="admin-email" className={fieldLabelClass}>Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@mcpherson.edu"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            className={inputClass}
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="admin-password" className={fieldLabelClass}>Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(null)
            }}
            className={inputClass}
            disabled={busy}
          />
        </div>

        {error ? <p className={errorTextClass} role="alert">{error}</p> : null}

        <button type="submit" className={primaryButtonClass} disabled={busy} aria-busy={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </AuthFrame>
  )
}

export default function AdminPortalLoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-paper text-sm text-navy/60">Preparing admin sign in…</main>}>
      <AdminLoginForm />
    </Suspense>
  )
}
