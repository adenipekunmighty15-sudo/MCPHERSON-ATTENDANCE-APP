import { createClient } from '@supabase/supabase-js'

const apiUrl = import.meta.env.VITE_API_URL || '/api'

let client = null
let initPromise = null

// Live ESM binding: importers see this flip to true once boot config resolves.
export let supabaseConfigured = false

function wrap(value) {
  if (!value || typeof value !== 'object') return value
  return new Proxy(value, {
    get(target, prop, receiver) {
      const result = Reflect.get(target, prop, receiver)
      if (typeof result === 'function') return result.bind(target)
      if (result && typeof result === 'object') return wrap(result)
      return result
    },
  })
}

// Stable facade so existing `supabase.auth.*` imports keep working even when
// the real client is created after the module graph has loaded.
const facade = {}
export const supabase = new Proxy(facade, {
  get(_target, prop) {
    const source = client || facade
    const result = Reflect.get(source, prop, source)
    if (typeof result === 'function') return result.bind(source)
    if (result && typeof result === 'object') return wrap(result)
    return result
  },
  has(_target, prop) {
    return prop in (client || facade)
  },
})

async function loadRuntimeConfig() {
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/public/config`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const data = await response.json()
    if (!data?.supabaseUrl || !data?.supabaseAnonKey) return null
    return data
  } catch (error) {
    console.warn('[supabase] Runtime config unavailable:', error?.message || error)
    return null
  }
}

export async function initSupabase() {
  if (client) return client
  if (!initPromise) {
    initPromise = (async () => {
      let url = import.meta.env.VITE_SUPABASE_URL
      let key = import.meta.env.VITE_SUPABASE_ANON_KEY

      // Vercel only injects VITE_API_URL, so the browser asks the API for the
      // two public Supabase values at boot. The service key is never exposed.
      if (!url || !key) {
        const runtime = await loadRuntimeConfig()
        url = runtime?.supabaseUrl
        key = runtime?.supabaseAnonKey
      }

      if (url && key) {
        client = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
        supabaseConfigured = true
      }
      return client
    })().finally(() => {
      initPromise = null
    })
  }
  return initPromise
}
