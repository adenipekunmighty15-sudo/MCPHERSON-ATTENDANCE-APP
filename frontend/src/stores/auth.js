import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, supabaseConfigured } from '../lib/supabase'
import api from '../lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)
  const freshLogin = ref(false)

  let _resolveReady
  const ready = new Promise(resolve => { _resolveReady = resolve })

  const isAuthenticated = computed(() => !!user.value)
  const token = computed(() => session.value?.access_token || null)

  function friendlyAuthError(err) {
    if (err instanceof TypeError) return 'Network error — check your internet connection and try again.'
    const m = (err.message || '').toLowerCase()
    if (m.includes('network') || m.includes('fetch') || m.includes('connect') || m.includes('timeout')) {
      return 'Network error — check your internet connection and try again.'
    }
    if (m.includes('email not confirmed') || m.includes('user-not-found') || m.includes('wrong-password') || m.includes('invalid-credential')) {
      return 'Invalid email or password. Please try again.'
    }
    if (m.includes('user already registered') || m.includes('email-already-in-use')) {
      return 'An account with this email already exists. Try signing in.'
    }
    if (m.includes('auth/too-many-requests') || m.includes('too many requests') || m.includes('over_email_send_rate_limit') || m.includes('email rate limit exceeded')) {
      return 'That service is temporarily busy. Please try again shortly.'
    }
    if (m.includes('not configured')) {
      return 'Portal authentication is currently unavailable. Please try again shortly.'
    }
    return err.message || 'Authentication failed'
  }

  function buildUser(session) {
    const supaUser = session?.user || session
    if (!supaUser) return null
    const meta = supaUser.user_metadata || {}
    const appMeta = supaUser.app_metadata || {}
    const matric = meta.matric || meta.matric_number || meta.matricNumber || appMeta.matric || ''
    const staffId = meta.staff_id || meta.staffId || appMeta.staff_id || ''
    return {
      id: supaUser.id,
      email: supaUser.email || '',
      name: appMeta.name || meta.name || meta.full_name || supaUser.email?.split('@')[0]?.replace(/[._]/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'User',
      role: appMeta.role || meta.role || 'student',
      department: meta.department || 'Computer Science',
      matric,
      matricNumber: matric || staffId,
      staffId,
      avatar: meta.name?.charAt(0)?.toUpperCase() || supaUser.email?.charAt(0)?.toUpperCase() || 'U',
      avatarUrl: meta.avatar_url || meta.avatarUrl || '',
      isGuest: false,
      provider: appMeta.provider || 'email',
    }
  }

  // The backend is the source of truth for role (it reads public.users).
  // Supabase metadata is only used for display until this resolves.
  async function syncProfile() {
    try {
      let row = null
      try {
        const res = await api.get('/auth/me')
        row = res?.data || null
      } catch (e) {
        if (e?.response?.status !== 404) throw e
      }

      if (!row || (!row.name && !row.created_at)) {
        // No profile row yet. The backend ignores client-supplied id/role.
        await api.post('/auth/create-user-profile', {
          name: user.value?.name || 'User',
          department: user.value?.department || 'Computer Science',
          provider: user.value?.provider || 'email',
        })
        return
      }

      if (user.value) {
        if (row.role) user.value.role = row.role
        if (row.name) user.value.name = row.name
        if (row.department) user.value.department = row.department
        if (row.avatar_url) user.value.avatarUrl = row.avatar_url
      }
    } catch (e) {
      if (!(e instanceof TypeError) && !e?.message?.includes('Network')) {
        console.warn('[auth] Profile sync failed:', e?.message)
      }
    }
  }

  async function initializeAuth() {
    try {
      localStorage.removeItem('mcu_user')
      localStorage.removeItem('mcu_users')

      if (supabase && supabaseConfigured) {
        try {
          // Register once, even when the visitor starts signed out. Supabase
          // callbacks must stay synchronous — never await Supabase or API calls
          // inside them or the auth client can deadlock.
          supabase.auth.onAuthStateChange((event, newSession) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (!newSession) return
              session.value = newSession
              user.value = buildUser(newSession)
              if (event === 'SIGNED_IN') void syncProfile()
            } else if (event === 'SIGNED_OUT') {
              user.value = null
              session.value = null
            }
          })
          // Keep the subscription for the store's lifetime.

          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (currentSession) {
            const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser()
            if (userError || !supaUser) {
              await supabase.auth.signOut()
              throw userError || new Error('Invalid session')
            }
            session.value = currentSession
            user.value = buildUser(supaUser)
            await syncProfile()
          }
        } catch (supaErr) {
          console.error('Supabase auth failed:', supaErr?.message)
          user.value = null
          session.value = null
          try { await supabase.auth.signOut() } catch { /* already signed out */ }
        }
      }
    } catch (err) {
      console.error('Auth init error:', err)
      error.value = 'Failed to initialize authentication'
    } finally {
      initialized.value = true
      _resolveReady()
    }
  }

  async function signIn(email, password) {
    error.value = null
    loading.value = true
    try {
      if (!supabase || !supabaseConfigured) throw new Error('Authentication is not configured')

      // The API validates policy/account status and performs the password
      // grant with the public anon key. Supabase still owns the session.
      const { data } = await api.post('/auth/login', { email, password })
      const sessionTokens = data?.session
      if (!sessionTokens?.access_token || !sessionTokens?.refresh_token) {
        throw new Error('Authentication is not configured')
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: sessionTokens.access_token,
        refresh_token: sessionTokens.refresh_token,
      })
      if (sessionError) throw sessionError

      const { data: sessionData } = await supabase.auth.getSession()
      const nextSession = sessionData?.session || null
      user.value = buildUser(nextSession || data?.user)
      if (user.value && data?.user) {
        if (data.user.role) user.value.role = data.user.role
        if (data.user.name) user.value.name = data.user.name
        if (data.user.department) user.value.department = data.user.department
        if (data.user.avatarUrl) user.value.avatarUrl = data.user.avatarUrl
        if (data.user.matricNumber) user.value.matricNumber = data.user.matricNumber
      }
      session.value = nextSession
      freshLogin.value = true
      await syncProfile()
      return nextSession
    } catch (err) {
      const serverMessage = err?.response?.data?.error
      const msg = friendlyAuthError(serverMessage ? new Error(serverMessage) : err)
      error.value = msg
      throw new Error(msg)
    } finally {
      loading.value = false
    }
  }

  async function signUp(email, password, metadata = {}) {
    error.value = null
    loading.value = true
    try {
      if (!supabase || !supabaseConfigured) throw new Error('Authentication is not configured')

      // The backend creates the auth user with email_confirm=true for allowed
      // domains, so signup always returns a real session and the user lands
      // straight in the app. Role stays server-owned (always student here).
      await api.post('/auth/signup', { email, password, ...metadata })

      const { data, error: supaError } = await supabase.auth.signInWithPassword({ email, password })
      if (supaError) throw supaError
      if (!data?.session) throw new Error('Account created, but the session could not be started')

      user.value = buildUser(data)
      session.value = data.session
      freshLogin.value = true
      await syncProfile()
      return data
    } catch (err) {
      const serverMessage = err?.response?.data?.error
      error.value = friendlyAuthError(serverMessage ? new Error(serverMessage) : err)
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function signInWithOAuth(provider) {
    error.value = null
    loading.value = true
    try {
      if (supabase && supabaseConfigured) {
        const { data, error: supaError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/auth/callback' } })
        if (supaError) throw supaError
        if (data?.url) { window.location.href = data.url; return data }
      }
      throw new Error('Authentication is not configured')
    } catch (err) {
      error.value = friendlyAuthError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetPasswordForEmail(email) {
    if (supabase && supabaseConfigured) {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })
      if (supaError) throw supaError
      return
    }
    throw new Error('Password reset is currently unavailable. Please try again shortly.')
  }

  async function updatePassword(newPassword) {
    if (supabase && supabaseConfigured) {
      const { data, error: supaError } = await supabase.auth.updateUser({ password: newPassword })
      if (supaError) throw supaError
      return data
    }
    throw new Error('Password update is currently unavailable. Please try again shortly.')
  }

  async function logout() {
    error.value = null
    const currentToken = session.value?.access_token || null
    user.value = null
    session.value = null
    freshLogin.value = false

    // Revoke the refresh token on the server first. A raw fetch avoids the API
    // interceptor turning an expired token into a redirect loop on sign-out.
    if (currentToken) {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          keepalive: true,
        })
      } catch (e) {
        console.warn('[auth] Server signout unavailable:', e?.message || e)
      }
    }

    // Keep the auth subscription alive for cross-tab sign-out / later logins.
    try { localStorage.removeItem('mcu_user') } catch { /* optional */ }
    try {
      if (supabase && supabaseConfigured) await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      console.warn('[auth] Signout error:', e?.message || e)
    }
  }

  return {
    user, session, token, loading, error, isAuthenticated, initialized, ready,
    initializeAuth, signIn, signUp, signInWithOAuth, logout, freshLogin,
    resetPasswordForEmail, updatePassword, signOut: logout, buildUser, syncProfile,
  }
})
