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
  let authSubscription = null

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
    if (m.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please wait before trying again.'
    }
    return err.message || 'Authentication failed'
  }

  function buildUser(session) {
    const supaUser = session?.user || session
    if (!supaUser) return null
    const meta = supaUser.user_metadata || {}
    const appMeta = supaUser.app_metadata || {}
    return {
      id: supaUser.id,
      email: supaUser.email || '',
      name: appMeta.name || meta.name || meta.full_name || supaUser.email?.split('@')[0]?.replace(/[._]/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'User',
      role: appMeta.role || meta.role || 'student',
      department: meta.department || 'Computer Science',
      avatar: meta.name?.charAt(0)?.toUpperCase() || supaUser.email?.charAt(0)?.toUpperCase() || 'U',
      isGuest: false,
      provider: appMeta.provider || 'email',
    }
  }

  async function initializeAuth() {
    try {
      localStorage.removeItem('mcu_user')
      localStorage.removeItem('mcu_users')
      if (supabase && supabaseConfigured) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (currentSession) {
            const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser()
            if (userError || !supaUser) {
              await supabase.auth.signOut()
              localStorage.removeItem('mcu_user')
              throw userError || new Error('Invalid session')
            }
            session.value = currentSession
            user.value = buildUser(supaUser)
            const meta = supaUser.user_metadata || {}
            const provider = supaUser.app_metadata?.provider || 'email'
            try {
              await api.post('/auth/create-user-profile', {
                userId: supaUser.id,
                email: supaUser.email,
                name: meta.name || meta.full_name || supaUser.email?.split('@')[0] || 'User',
                role: 'student',
                department: 'Computer Science',
                provider,
              })
            } catch (e) {
              if (e?.message !== 'Network Error') {
                console.warn('Backend profile creation on init failed:', e?.message)
              }
            }
          } else {
            localStorage.removeItem('mcu_user')
            initialized.value = true
            _resolveReady()
            return
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              session.value = newSession
              user.value = buildUser(newSession)
              if (event === 'SIGNED_IN') {
                const supaUser = newSession?.user
                if (supaUser) {
                  const meta = supaUser.user_metadata || {}
                  const provider = supaUser.app_metadata?.provider || 'email'
                  try {
                    await api.post('/auth/create-user-profile', {
                      userId: supaUser.id,
                      email: supaUser.email,
                      name: meta.name || meta.full_name || supaUser.email?.split('@')[0] || 'User',
                      role: 'student',
                      department: 'Computer Science',
                      provider,
                    })
                  } catch (e) {
                    if (!(e instanceof TypeError) && !e?.message?.includes('Network')) {
                      console.warn('Backend profile creation on SIGNED_IN failed:', e?.message)
                    }
                  }
                }
              }
            } else if (event === 'SIGNED_OUT') {
              user.value = null
              session.value = null
            }
          })
          authSubscription = subscription
          initialized.value = true
          _resolveReady()
          return
        } catch (supaErr) {
          console.error('Supabase auth failed:', supaErr?.message)
          localStorage.removeItem('mcu_user')
        }
      }
    } catch (err) {
      console.error('Auth init error:', err)
      error.value = 'Failed to initialize authentication'
    } finally {
      if (!initialized.value) {
        initialized.value = true
        _resolveReady()
      }
    }
  }

  async function signIn(email, password) {
    error.value = null
    loading.value = true
    try {
      if (!supabase || !supabaseConfigured) throw new Error('Authentication is not configured')
      const { data, error: supaError } = await supabase.auth.signInWithPassword({ email, password })
      if (supaError) throw supaError
      user.value = buildUser(data)
      session.value = data.session
      freshLogin.value = true
      return data
    } catch (err) {
      const msg = friendlyAuthError(err)
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
      const { data, error: supaError } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
      if (supaError) throw supaError
      if (!data?.user?.id) throw new Error('Account could not be created')
      try { await api.post('/auth/confirm-signup', { userId: data.user.id, email }) } catch (e) { console.warn('[auth] Signup confirm failed:', e) }
      try { await api.post('/auth/create-user-profile', { userId: data.user.id, email, name: metadata.name || email.split('@')[0], role: metadata.role || 'student', department: metadata.department || 'Computer Science' }) } catch (e) { console.warn('[auth] Profile creation failed:', e) }
      if (data.session) {
        user.value = buildUser(data)
        session.value = data.session
        freshLogin.value = true
        return data
      }
      return { user: buildUser(data), needsConfirmation: true }
    } catch (err) {
      error.value = friendlyAuthError(err)
      throw err
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
    throw new Error('Password reset is not available in offline mode')
  }

  async function updatePassword(newPassword) {
    if (supabase && supabaseConfigured) {
      const { data, error: supaError } = await supabase.auth.updateUser({ password: newPassword })
      if (supaError) throw supaError
      return data
    }
    throw new Error('Password update is not available in offline mode')
  }

  async function logout() {
    error.value = null
    user.value = null
    session.value = null
    if (authSubscription) { authSubscription.unsubscribe(); authSubscription = null }
    localStorage.removeItem('mcu_user')
    try { if (supabase && supabaseConfigured) await supabase.auth.signOut() } catch (e) { console.warn('[auth] Signout error:', e) }
  }

  return {
    user, session, token, loading, error, isAuthenticated, initialized, ready,
    initializeAuth, signIn, signUp, signInWithOAuth, logout, freshLogin,
    resetPasswordForEmail, updatePassword, signOut: logout,
  }
})
