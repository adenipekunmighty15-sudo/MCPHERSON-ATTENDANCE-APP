import type { Session, User } from '@supabase/supabase-js'

export type { Session, User }

/** Shape returned by the backend's authoritative /api/auth/me endpoint. */
export interface BackendProfile {
  id?: string
  email?: string
  name?: string
  role?: string
  department?: string
  provider?: string
  matric_number?: string
  matricNumber?: string
  staff_id?: string
  avatar_url?: string
  avatarUrl?: string
  created_at?: string
  [key: string]: unknown
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  department: string
  matric: string
  matricNumber: string
  staffId: string
  avatar: string
  avatarUrl: string
  isGuest: boolean
  provider: string
}

export interface LoginResponse {
  session?: {
    access_token: string
    refresh_token: string
    [key: string]: unknown
  } | null
  user?: BackendProfile | null
}

export interface SignupResponse {
  success?: boolean
  confirmationRequired?: boolean
  message?: string
  userId?: string
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}
