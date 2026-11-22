'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import AuthFrame from '@/components/auth/AuthFrame'
import PasswordInput from '@/components/auth/PasswordInput'
import { errorTextClass, fieldLabelClass, inputClass, noticeClass, primaryButtonClass } from '@/components/auth/formStyles'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  ALLOWED_EMAIL_DOMAINS,
  DEPARTMENTS,
  STUDENT_ID_PATTERN,
  UNIVERSITY,
  isValidUniversityEmail,
  normalizeUniversityEmail,
  PORTAL_HOME_PATH,
} from '@/lib/config'

const PASSWORD_OK = /^(?=.{8,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/

export default function SignupPage() {
  const router = useRouter()
  const { signup, isAuthenticated, initialized, configured, ready } = useAuth()

  const [name, setName] = useState('')
  const [matric, setMatric] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void ready.then(() => {
      if (active && isAuthenticated) router.replace(PORTAL_HOME_PATH)
    })
    return () => {
      active = false
    }
  }, [ready, isAuthenticated, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setError(null)
    setInfo(null)

    const normalized = normalizeUniversityEmail(email)
    if (name.trim().length < 2) {
      setError('Enter your full name.')
      return
    }
    if (!STUDENT_ID_PATTERN.test(matric.trim())) {
      setError(`Use ${UNIVERSITY.idFormat} for your matric number.`)
      return
    }
    if (!isValidUniversityEmail(normalized)) {
      setError(`Use an accepted domain (${ALLOWED_EMAIL_DOMAINS.join(', ')}).`)
      return
    }
    if (!department) {
      setError('Choose a department.')
      return
    }
    if (!PASSWORD_OK.test(password)) {
      setError('Use 8–128 characters with uppercase, lowercase, number and symbol.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setEmail(normalized)
    setBusy(true)
    try {
      const result = await signup(normalized, password, {
        name: name.trim(),
        full_name: name.trim(),
        matric: matric.trim(),
        matric_number: matric.trim(),
        matricNumber: matric.trim(),
        staff_id: matric.trim(),
        department,
        role: 'student',
      })
      if (result?.confirmationRequired) {
        setInfo(result.message || 'Check your email for a confirmation link, then sign in.')
        return
      }
      router.push(PORTAL_HOME_PATH)
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create your account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Join the citadel"
      title="Create your account"
      description="Set up your McPherson University portal account in one short step."
      badge="Student onboarding"
      footer={
        <>
          Already registered? <Link href="/login" className="font-semibold text-blue hover:underline">Sign in</Link>
        </>
      }
    >
      <div className={`${noticeClass} mb-6 border-blue/20 bg-[#faf7ef] text-navy/70`} role="status">
        <strong className="block text-navy">Student accounts only</strong>
        Staff and lecturer accounts are provisioned by the ICT directorate. Contact{' '}
        <a href="mailto:ict@mcu.edu.ng" className="font-semibold text-blue hover:underline">ict@mcu.edu.ng</a> for access.
      </div>

      {initialized && !configured ? (
        <div className={`${noticeClass} mb-5 border-amber-300 bg-amber-50 text-amber-900`} role="status">
          Portal authentication is in maintenance mode. Please try again shortly.
        </div>
      ) : null}
      {info ? <div className={`${noticeClass} mb-5 border-blue/20 bg-[#faf7ef] text-blue`} role="status">{info}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-name" className={fieldLabelClass}>Full name</label>
            <input id="signup-name" name="name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} disabled={busy} />
          </div>
          <div>
            <label htmlFor="signup-matric" className={fieldLabelClass}>Matric number</label>
            <input id="signup-matric" name="matric" type="text" autoComplete="off" value={matric} onChange={(event) => setMatric(event.target.value)} className={inputClass} disabled={busy} />
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className={fieldLabelClass}>University email</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            disabled={busy}
          />
          <p className="mt-2 text-[11px] text-navy/45">Accepted domains: {ALLOWED_EMAIL_DOMAINS.join(', ')}</p>
        </div>

        <div>
          <label htmlFor="signup-department" className={fieldLabelClass}>Department</label>
          <select
            id="signup-department"
            name="department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className={inputClass}
            disabled={busy}
          >
            <option value="">Choose a department</option>
            {DEPARTMENTS.map((item) => (
              <option key={item.code} value={item.name}>{item.name} ({item.code})</option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-password" className={fieldLabelClass}>Password</label>
            <PasswordInput id="signup-password" name="new-password" fieldName="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          </div>
          <div>
            <label htmlFor="signup-confirm" className={fieldLabelClass}>Confirm password</label>
            <PasswordInput id="signup-confirm" name="new-password-confirm" fieldName="confirm password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={busy} />
          </div>
        </div>
        <p className="-mt-2 text-[11px] text-navy/45">8–128 characters with uppercase, lowercase, number and symbol.</p>

        {error ? <p className={errorTextClass} role="alert">{error}</p> : null}

        <button type="submit" className={primaryButtonClass} disabled={busy} aria-busy={busy}>
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthFrame>
  )
}
