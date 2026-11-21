'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import AuthFrame from '@/components/auth/AuthFrame'
import PasswordInput from '@/components/auth/PasswordInput'
import { errorTextClass, fieldLabelClass, noticeClass, primaryButtonClass } from '@/components/auth/formStyles'
import { useAuth } from '@/components/providers/AuthProvider'
import { getSupabaseClient } from '@/lib/supabase'

const PASSWORD_OK = /^(?=.{8,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/

function isRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return query.has('code') || query.get('type') === 'recovery' || hash.get('type') === 'recovery' || hash.has('access_token')
}

export default function ResetPasswordPage() {
  const { ready, isAuthenticated, resetPassword, logout } = useAuth()
  const [checking, setChecking] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recoveryEvent = useRef(false)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    const inspectLink = async () => {
      await ready
      const supabase = await getSupabaseClient()
      if (!supabase) {
        if (active) {
          setError('Password reset is currently unavailable. Please try again shortly.')
          setChecking(false)
        }
        return
      }

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session?.user) {
          recoveryEvent.current = true
          if (active) setValidLink(true)
        }
      })
      unsubscribe = () => data.subscription.unsubscribe()

      // Newer recovery links arrive with ?code=... and need an exchange before
      // updateUser() has a recovery session to work with.
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) console.warn('[reset] Code exchange failed:', exchangeError.message)
      }

      const { data: sessionData } = await supabase.auth.getSession()
      if (!active) return
      const hasSession = !!sessionData.session?.user
      const valid = recoveryEvent.current || (hasSession && (isRecoveryUrl() || isAuthenticated))
      setValidLink(valid)
      if (!valid) setError('This password reset link is invalid or has expired.')
      setChecking(false)
    }

    void inspectLink()
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [ready, isAuthenticated])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setError(null)

    if (!PASSWORD_OK.test(password)) {
      setError('Use 8–128 characters with uppercase, lowercase, number and symbol.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      await resetPassword(password)
      setSuccess(true)
      await logout()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update your password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Choose a new password"
      title="Set a new password"
      description="Pick a strong password you have not used on this portal before."
      badge="Account recovery"
      footer={
        <>
          <Link href="/forgot-password" className="font-semibold text-blue hover:underline">Request another link</Link>
          <span className="mx-2 text-navy/25">·</span>
          <Link href="/login" className="font-semibold text-blue hover:underline">Back to Sign In</Link>
        </>
      }
    >
      {checking ? (
        <p className="text-sm text-navy/60" role="status">Verifying your reset link…</p>
      ) : success ? (
        <div className={`${noticeClass} border-emerald-300 bg-emerald-50 text-emerald-900`} role="status">
          Your password has been updated. You can now sign in with your new password.
        </div>
      ) : !validLink ? (
        <div className={`${noticeClass} border-red-300 bg-red-50 text-red-800`} role="alert">
          {error || 'This password reset link is invalid or has expired.'}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="new-password" className={fieldLabelClass}>New password</label>
            <PasswordInput
              id="new-password"
              name="new-password"
              fieldName="new password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={fieldLabelClass}>Confirm password</label>
            <PasswordInput
              id="confirm-password"
              name="new-password-confirm"
              fieldName="confirm password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value)
                setError(null)
              }}
              disabled={saving}
            />
          </div>
          <p className="-mt-2 text-[11px] text-navy/45">8–128 characters with uppercase, lowercase, number and symbol.</p>
          {error ? <p className={errorTextClass} role="alert">{error}</p> : null}
          <button type="submit" className={primaryButtonClass} disabled={saving} aria-busy={saving}>
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}
    </AuthFrame>
  )
}
