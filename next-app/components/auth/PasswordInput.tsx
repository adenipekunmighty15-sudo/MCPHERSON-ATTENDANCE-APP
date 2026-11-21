'use client'

import { useState, type CSSProperties, type InputHTMLAttributes } from 'react'
import { inputClass } from './formStyles'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Used in the toggle's accessible label, e.g. "confirm password". */
  fieldName?: string
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.2 12S5.8 5.5 12 5.5 21.8 12 21.8 12 18.2 18.5 12 18.5 2.2 12 2.2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.2 0 9.8 6 9.8 6a17 17 0 0 1-3.1 3.7M6.2 7.5A17 17 0 0 0 2.2 12S5.8 18 12 18a9.6 9.6 0 0 0 3.4-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

/** Password field with an accessible show/hide (eye) toggle. Hidden by default. */
export default function PasswordInput({ fieldName = 'password', className = '', disabled, style, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const label = `${visible ? 'Hide' : 'Show'} ${fieldName}`

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={`${inputClass} ${className}`.trim()}
        style={{ ...(style as CSSProperties), paddingRight: '3.25rem' }}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-navy/45 transition hover:text-blue focus:outline-none focus-visible:ring-4 focus-visible:ring-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
