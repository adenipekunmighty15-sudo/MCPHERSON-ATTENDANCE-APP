'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import AuthFrame from '@/components/auth/AuthFrame'
import { errorTextClass, fieldLabelClass, inputClass, noticeClass, primaryButtonClass } from '@/components/auth/formStyles'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  ALLOWED_EMAIL_DOMAINS,
  isValidUniversityEmail,
  normalizeUniversityEmail,
} from '@/lib/config'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return
    setError(null)
    setSent(false)

    const normalized = normalizeUniversityEmail(email)
    if (!isValidUniversityEmail(normalized)) {
      setError(`Use an accepted university domain (${ALLOWED_EMAIL_DOMAINS.join(', ')}).`)
      return
    }

    setEmail(normalized)
    setSending(true)
    try {
      await forgotPassword(normalized)
      setSent(true)
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to send a password reset link. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your university email and we will send you a link to choose a new password."
      badge="Account recovery"
      footer={<Link href="/login" className="font-semibold text-blue hover:underline">Back to Sign In</Link>}
    >
      {sent ? (
        <div className={`${noticeClass} mb-5 border-emerald-300 bg-emerald-50 text-emerald-900`} role="status">
          Password reset link sent. Check your inbox.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="reset-email" className={fieldLabelClass}>University email</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@undergraduate.mcu.edu.ng"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            className={inputClass}
            disabled={sending}
          />
        </div>

        {error ? <p className={errorTextClass} role="alert">{error}</p> : null}

        <button type="submit" className={primaryButtonClass} disabled={sending} aria-busy={sending}>
          {sending ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </AuthFrame>
  )
}
