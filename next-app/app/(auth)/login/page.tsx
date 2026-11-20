'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import AuthFrame from '@/components/auth/AuthFrame'
import { errorTextClass, fieldLabelClass, inputClass, noticeClass, primaryButtonClass } from '@/components/auth/formStyles'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  ALLOWED_EMAIL_DOMAINS,
  DEFAULT_STUDENT_DOMAIN,
  normalizeUniversityEmail,
  isValidUniversityEmail,
  sanitizeRedirect,
} from '@/lib/config'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const reason = searchParams.get('reason')
  const { login, isAuthenticated, initialized, configured, ready, setRemember } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRememberValue] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionNotice, setSessionNotice] = useState(false)

  useEffect(() => {
    let active = true
    void ready.then(() => {
      if (!active) return
      if (reason === 'session-expired') setSessionNotice(true)
      if (isAuthenticated) router.replace(sanitizeRedirect(redirectParam))
    })
    return () => {
      active = false
    }
  }, [ready, reason, isAuthenticated, redirectParam, router])

  const applyDomain = (domain: string) => {
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) return
    const localPart = email.split('@')[0].trim()
    setEmail(localPart ? `${localPart}@${domain}` : `@${domain}`)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setError(null)

    const normalized = normalizeUniversityEmail(email)
    if (!normalized) {
      setError('Enter your university email.')
      return
    }
    if (!isValidUniversityEmail(normalized)) {
      setError(`Use an accepted domain (${ALLOWED_EMAIL_DOMAINS.join(', ')}).`)
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }

    setEmail(normalized)
    setRemember(remember)
    setBusy(true)
    try {
      await login(normalized, password)
      router.push(sanitizeRedirect(redirectParam))
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Sign in to continue"
      description="Use your registered university account to access your portal."
      badge="Student portal"
      footer={
        <>
          New to the portal? <Link href="/signup" className="font-semibold text-blue hover:underline">Create an account</Link>
          <span className="mx-2 text-navy/25">·</span>
          <Link href="/admin/portal/login" className="font-semibold text-navy/70 hover:text-navy">Admin sign in</Link>
        </>
      }
    >
      {sessionNotice ? (
        <div className={`${noticeClass} mb-5 border-amber-300 bg-amber-50 text-amber-900`} role="status">
          Your session ended. Please sign in again.
        </div>
      ) : null}

      {initialized && !configured ? (
        <div className={`${noticeClass} mb-5 border-amber-300 bg-amber-50 text-amber-900`} role="status">
          Portal authentication is in maintenance mode. Please try again shortly or contact the IT helpdesk.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="signin-email" className={fieldLabelClass}>University email</label>
          <input
            id="signin-email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="you@undergraduate.mcu.edu.ng"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            className={inputClass}
            disabled={busy}
          />
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Quick-fill email domains">
            {ALLOWED_EMAIL_DOMAINS.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => applyDomain(domain)}
                className="rounded-full border border-navy/10 bg-[#F6F8FC] px-2.5 py-1 text-[11px] font-medium text-navy/60 transition hover:border-blue/40 hover:text-blue"
              >
                @{domain}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-navy/45">@{DEFAULT_STUDENT_DOMAIN} is appended automatically to a bare matric ID.</p>
        </div>

        <div>
          <label htmlFor="signin-password" className={fieldLabelClass}>Password</label>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(null)
            }}
            className={inputClass}
            disabled={busy}
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-navy/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRememberValue(event.target.checked)}
              className="h-4 w-4 rounded border-navy/30 accent-blue"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-semibold text-blue hover:underline">Forgot password?</Link>
        </div>

        {error ? <p className={errorTextClass} role="alert">{error}</p> : null}

        <button type="submit" className={primaryButtonClass} disabled={busy} aria-busy={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </AuthFrame>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-paper text-sm text-navy/60">Preparing sign in…</main>}>
      <LoginForm />
    </Suspense>
  )
}
