'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ApiError,
  api,
  setUnauthorizedHandler,
} from '@/lib/api'
import {
  buildApiUrl,
  friendlyAuthError,
  getSiteOrigin,
  isAdminRole,
} from '@/lib/config'
import {
  clearLegacyUserData,
  clearLocalSession,
  getSupabaseClient,
  isSupabaseConfigured,
  setRememberMe,
} from '@/lib/supabase'
import {
  asRecord,
  firstString,
  type AuthUser,
  type BackendProfile,
  type LoginResponse,
  type Session,
  type SignupResponse,
} from '@/lib/types'

type SignupMetadata = Record<string, string>

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  token: string | null
  loading: boolean
  initialized: boolean
  configured: boolean
  error: string | null
  isAuthenticated: boolean
  ready: Promise<void>
  login: (email: string, password: string) => Promise<Session | null>
  signIn: (email: string, password: string) => Promise<Session | null>
  signup: (email: string, password: string, metadata?: SignupMetadata) => Promise<SignupResponse | null>
  adminLogin: (email: string, password: string) => Promise<Session | null>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (newPassword: string) => Promise<unknown>
  resetPasswordForEmail: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<unknown>
  syncProfile: () => Promise<void>
  buildUser: (input: unknown, profile?: BackendProfile | null) => AuthUser | null
  adoptSession: (next: Session | null) => void
  setRemember: (remember: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Build the display user from Supabase metadata; role is display-only here. */
export function buildUser(input: unknown, profile?: BackendProfile | null): AuthUser | null {
  const outer = asRecord(input)
  const inner = asRecord(outer.user)
  const source = Object.keys(inner).length ? inner : outer
  if (!source.id && !source.email && !profile?.id) return null

  const meta = asRecord(source.user_metadata)
  const appMeta = asRecord(source.app_metadata)
  const email = firstString(source.email, profile?.email)
  const matric = firstString(meta.matric, meta.matric_number, meta.matricNumber, appMeta.matric, profile?.matric_number, profile?.matricNumber)
  const staffId = firstString(meta.staff_id, meta.staffId, appMeta.staff_id, profile?.staff_id)
  const name = firstString(
    profile?.name,
    appMeta.name,
    meta.name,
    meta.full_name,
    email.split('@')[0]?.replace(/[._]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    'User',
  )

  return {
    id: firstString(source.id, profile?.id),
    email,
    name,
    // The backend profile wins; metadata role is replaced by syncProfile().
    role: firstString(profile?.role, appMeta.role, meta.role, 'student'),
    department: firstString(profile?.department, meta.department, 'Computer Science'),
    matric,
    matricNumber: matric || staffId,
    staffId,
    avatar: (name || email || 'U').charAt(0).toUpperCase(),
    avatarUrl: firstString(profile?.avatar_url, profile?.avatarUrl, meta.avatar_url, meta.avatarUrl),
    isGuest: false,
    provider: firstString(profile?.provider, appMeta.provider, 'email'),
  }
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [session, setSessionState] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userRef = useRef<AuthUser | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const logoutRef = useRef<() => Promise<void>>(async () => undefined)

  const readyRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null)
  if (!readyRef.current) {
    let resolveReady!: () => void
    const promise = new Promise<void>((resolve) => {
      resolveReady = resolve
    })
    readyRef.current = { promise, resolve: resolveReady }
  }

  const setCurrentUser = useCallback((next: AuthUser | null) => {
    userRef.current = next
    setUserState(next)
  }, [])

  const applySession = useCallback((next: Session | null, profile?: BackendProfile | null) => {
    sessionRef.current = next
    setSessionState(next)
    setCurrentUser(buildUser(next?.user ?? next, profile))
  }, [setCurrentUser])

  const syncProfile = useCallback(async () => {
    try {
      let row: BackendProfile | null = null
      try {
        const response = await api.get<BackendProfile>('/auth/me')
        row = response || null
      } catch (syncError) {
        if (syncError instanceof ApiError && syncError.status === 404) {
          // Fall through and create the missing profile row.
        } else if (syncError instanceof ApiError && (syncError.status === 0 || syncError.status === 401)) {
          return
        } else {
          throw syncError
        }
      }

      if (!row || (!row.name && !row.created_at)) {
        const current = userRef.current
        await api.post('/auth/create-user-profile', {
          name: current?.name || 'User',
          department: current?.department || 'Computer Science',
          provider: current?.provider || 'email',
        })
        return
      }

      const current = userRef.current
      if (current) {
        setCurrentUser({
          ...current,
          role: row.role || current.role,
          name: row.name || current.name,
          department: row.department || current.department,
          avatarUrl: row.avatar_url || current.avatarUrl,
          matricNumber: row.matric_number || row.staff_id || current.matricNumber,
        })
      }
    } catch (syncError) {
      if (syncError instanceof ApiError && syncError.status === 0) return
      console.warn('[auth] Profile sync failed:', syncError instanceof Error ? syncError.message : syncError)
    }
  }, [setCurrentUser])

  const login = useCallback(async (email: string, password: string): Promise<Session | null> => {
    setError(null)
    setLoading(true)
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) throw new Error('Portal authentication is currently unavailable. Please try again shortly.')

      // The backend validates policy/status and performs the password grant;
      // Supabase still owns the resulting browser session.
      const response = await api.post<LoginResponse>('/auth/login', { email, password }, { auth: false })
      const tokens = response?.session
      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error('Portal authentication is currently unavailable. Please try again shortly.')
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      })
      if (sessionError) throw sessionError

      const { data } = await supabase.auth.getSession()
      const nextSession = data.session ?? null
      applySession(nextSession, response?.user)
      await syncProfile()
      return nextSession
    } catch (loginError) {
      const message = friendlyAuthError(loginError)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [applySession, syncProfile])

  const signup = useCallback(async (
    email: string,
    password: string,
    metadata: SignupMetadata = {},
  ): Promise<SignupResponse | null> => {
    setError(null)
    setLoading(true)
    try {
      const supabase = await getSupabaseClient()
      if (!supabase) throw new Error('Portal authentication is currently unavailable. Please try again shortly.')

      const registration = await api.post<SignupResponse>('/auth/signup', {
        email,
        password,
        name: metadata.name,
        full_name: metadata.full_name || metadata.name,
        matric: metadata.matric,
        matric_number: metadata.matric_number || metadata.matric,
        matricNumber: metadata.matricNumber || metadata.matric,
        staff_id: metadata.staff_id || metadata.matric,
        department: metadata.department,
        role: 'student',
      }, { auth: false })

      if (registration?.confirmationRequired) return registration

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (!data.session) throw new Error('Account created, but the session could not be started')

      applySession(data.session)
      await syncProfile()
      return registration
    } catch (signupError) {
      const message = friendlyAuthError(signupError)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [applySession, syncProfile])

  const adoptSession = useCallback((next: Session | null) => {
    applySession(next)
    if (next) void syncProfile()
  }, [applySession, syncProfile])

  const logout = useCallback(async () => {
    const currentToken = sessionRef.current?.access_token || null
    setError(null)
    sessionRef.current = null
    setSessionState(null)
    setCurrentUser(null)

    if (currentToken) {
      try {
        await fetch(buildApiUrl('/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          keepalive: true,
        })
      } catch {
        // Best effort: local sign-out must still complete.
      }
    }
    await clearLocalSession()
  }, [setCurrentUser])

  logoutRef.current = logout

  const adminLogin = useCallback(async (email: string, password: string): Promise<Session | null> => {
    const result = await login(email, password)
    if (!isAdminRole(userRef.current?.role)) {
      const message = 'Access denied. Admin credentials required.'
      setError(message)
      await logout()
      throw new Error(message)
    }
    return result
  }, [login, logout])

  const forgotPassword = useCallback(async (email: string) => {
    setError(null)
    const supabase = await getSupabaseClient()
    if (!supabase) {
      const message = 'Password reset is currently unavailable. Please try again shortly.'
      setError(message)
      throw new Error(message)
    }
    const origin = getSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : '')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })
    if (resetError) {
      const message = friendlyAuthError(resetError)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null)
    const supabase = await getSupabaseClient()
    if (!supabase) {
      const message = 'Password update is currently unavailable. Please try again shortly.'
      setError(message)
      throw new Error(message)
    }
    const { data, error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      const message = friendlyAuthError(updateError)
      setError(message)
      throw new Error(message)
    }
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    const initialize = async () => {
      try {
        clearLegacyUserData()
        const supabase = await getSupabaseClient()
        if (cancelled) return
        setConfigured(!!supabase)
        if (!supabase) return

        // Supabase auth callbacks must stay synchronous.
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (cancelled) return
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
            if (!newSession) return
            applySession(newSession)
            if (event === 'SIGNED_IN') void syncProfile()
          } else if (event === 'SIGNED_OUT') {
            applySession(null)
          }
        })
        unsubscribe = () => data.subscription.unsubscribe()

        const { data: sessionData } = await supabase.auth.getSession()
        if (cancelled) return
        const currentSession = sessionData.session
        if (currentSession) {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (cancelled) return
          if (userError || !userData.user) {
            await supabase.auth.signOut()
            applySession(null)
          } else {
            applySession(currentSession)
            await syncProfile()
          }
        }
      } catch (initError) {
        console.error('[auth] Initialization failed:', initError instanceof Error ? initError.message : initError)
        setError('Failed to initialize authentication')
      } finally {
        if (!cancelled) setInitialized(true)
        readyRef.current?.resolve()
      }
    }

    void initialize()
    setUnauthorizedHandler(() => logoutRef.current())
    return () => {
      cancelled = true
      unsubscribe?.()
      setUnauthorizedHandler(null)
    }
  }, [applySession, syncProfile])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    token: session?.access_token ?? null,
    loading,
    initialized,
    configured,
    error,
    isAuthenticated: !!user,
    ready: readyRef.current!.promise,
    login,
    signIn: login,
    signup,
    adminLogin,
    logout,
    forgotPassword,
    resetPassword: updatePassword,
    resetPasswordForEmail: forgotPassword,
    updatePassword,
    syncProfile,
    buildUser,
    adoptSession,
    setRemember: setRememberMe,
  }), [
    user,
    session,
    loading,
    initialized,
    configured,
    error,
    login,
    signup,
    adminLogin,
    logout,
    forgotPassword,
    updatePassword,
    syncProfile,
    applySession,
    adoptSession,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
