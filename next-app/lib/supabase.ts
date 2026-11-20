import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildApiUrl } from './config'

const REMEMBER_FLAG = 'mcu_remember_session'
const LEGACY_USER_KEYS = ['mcu_user', 'mcu_users']

let client: SupabaseClient | null = null
let initPromise: Promise<SupabaseClient | null> | null = null
let initialized = false
let authStorageKey = 'sb-mcu-auth-token'

function activeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    if (window.localStorage.getItem(REMEMBER_FLAG) === 'false' && window.sessionStorage) {
      return window.sessionStorage
    }
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Supabase persists the token through this facade. The "remember me" flag
 * decides which browser store is active, exactly like the legacy Vue portal.
 */
function createAuthStorage() {
  return {
    getItem(key: string): string | null {
      try {
        return activeStorage()?.getItem(key) ?? null
      } catch {
        return null
      }
    },
    setItem(key: string, value: string): void {
      try {
        const active = activeStorage()
        const inactive = active === window.sessionStorage ? window.localStorage : window.sessionStorage
        inactive?.removeItem(key)
        active?.setItem(key, value)
      } catch {
        // Storage may be disabled; Supabase then keeps the session in memory.
      }
    },
    removeItem(key: string): void {
      try {
        window.localStorage.removeItem(key)
        window.sessionStorage.removeItem(key)
      } catch {
        // Nothing to remove when storage is unavailable.
      }
    },
  }
}

async function loadRuntimeConfig(): Promise<{ supabaseUrl: string; supabaseAnonKey: string } | null> {
  try {
    const response = await fetch(buildApiUrl('/public/config'), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = await response.json().catch(() => null) as {
      supabaseUrl?: string
      supabaseAnonKey?: string
    } | null
    if (!data?.supabaseUrl || !data?.supabaseAnonKey) return null
    return { supabaseUrl: data.supabaseUrl, supabaseAnonKey: data.supabaseAnonKey }
  } catch (error) {
    console.warn('[supabase] Runtime config unavailable:', error instanceof Error ? error.message : error)
    return null
  }
}

/** Lazily creates one browser Supabase client using public config only. */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (typeof window === 'undefined') return null
  if (initialized) return client
  if (initPromise) return initPromise

  const pending = (async () => {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    if (!url || !key) {
      const runtime = await loadRuntimeConfig()
      url = url || runtime?.supabaseUrl
      key = key || runtime?.supabaseAnonKey
    }

    if (!url || !key) {
      console.warn('[supabase] Missing public Supabase URL/anon key; authentication is disabled.')
      return null
    }

    try {
      authStorageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
    } catch {
      authStorageKey = 'sb-mcu-auth-token'
    }

    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: createAuthStorage(),
      },
    })
    return client
  })().finally(() => {
    initialized = true
    initPromise = null
  })

  initPromise = pending
  return pending
}

export function isSupabaseConfigured(): boolean {
  return client !== null
}

/** Called before login so the chosen store is used for the incoming session. */
export function setRememberMe(remember: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(REMEMBER_FLAG, remember ? 'true' : 'false')
  } catch {
    // Optional in private/sandboxed contexts.
  }
  try {
    const active = activeStorage()
    const inactive = active === window.sessionStorage ? window.localStorage : window.sessionStorage
    inactive?.removeItem(authStorageKey)
  } catch {
    // Optional.
  }
}

export function clearLegacyUserData(): void {
  if (typeof window === 'undefined') return
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of LEGACY_USER_KEYS) {
      try {
        storage.removeItem(key)
      } catch {
        // Optional.
      }
    }
  }
}

/** Local-only sign-out; never blocks navigation on a network call. */
export async function clearLocalSession(): Promise<void> {
  try {
    await client?.auth.signOut({ scope: 'local' })
  } catch {
    // Already signed out.
  }
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(authStorageKey)
    window.sessionStorage.removeItem(authStorageKey)
  } catch {
    // Optional.
  }
}
