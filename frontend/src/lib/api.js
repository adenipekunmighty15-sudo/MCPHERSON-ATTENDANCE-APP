import axios from 'axios'
import { supabase } from './supabase'

const apiUrl = import.meta.env.VITE_API_URL || '/api'

const cache = new Map()
const CACHE_TTL = 30_000

// Tracks which GET cache keys to invalidate per mutation URL base
const invalidationMap = {
  '/attendance': ['GET:/attendance'],
  '/courses': ['GET:/courses'],
  '/timetable': ['GET:/timetable'],
  '/sessions': ['GET:/sessions/active'],
  '/notifications': ['GET:/notifications'],
  '/chat': ['GET:/chats'],
  '/messages': ['GET:/messages'],
  '/venues': ['GET:/venues'],
  '/library/resources': ['GET:/library/resources'],
  '/complaints': ['GET:/complaints'],
  '/study-materials': ['GET:/study-materials', 'GET:/study-materials/stats'],
  '/study-folders': ['GET:/study-folders'],
  '/general-chat/messages': ['GET:/general-chat/messages'],
}

function getCacheKey(method, url, data, userId = 'anonymous') {
  return `${userId}:${method}:${url}:${data ? JSON.stringify(data) : ''}`
}

function invalidateCache(method, url) {
  if (method === 'GET') return
  const base = url.split('?')[0].replace(/\/+$/, '')
  const prefix = Object.entries(invalidationMap).find(([key]) => base.startsWith(key))
  if (prefix) {
    for (const cacheKeyPrefix of prefix[1]) {
      for (const key of cache.keys()) {
        if (key.startsWith(cacheKeyPrefix)) cache.delete(key)
      }
    }
  }
}

const axiosApi = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  transitional: { clarifyTimeoutError: true },
})

axiosApi.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  }
  return config
})

axiosApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const currentPath = window.location.pathname
    const isLoginPage = currentPath.startsWith('/login') || currentPath.startsWith('/admin/portal/login')

    if (err.response?.status === 401 && !currentPath.startsWith('/auth/callback') && !isLoginPage) {
      // Clear the Supabase session too — otherwise the guest guard sends the
      // user straight back and the failing request loops forever.
      try {
        const { useAuthStore } = await import('../stores/auth')
        await useAuthStore().logout()
      } catch { /* best effort: redirect still applies */ }

      const loginPath = currentPath.startsWith('/admin/portal') ? '/admin/portal/login' : '/login'
      const destination = new URL(loginPath, window.location.origin)
      destination.searchParams.set('redirect', currentPath)
      destination.searchParams.set('reason', 'session-expired')
      window.location.replace(destination.toString())
    }
    return Promise.reject(err)
  }
)

async function callApi(method, url, data, config) {
  try {
    if (method === 'GET') {
      const cacheable = !url.replace(/^\/+/, '').startsWith('messages/')
      // Most GET endpoints return user-specific data. Keep each account's
      // short-lived cache separate when accounts change in the same browser.
      const { data: { session } } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } }
      const cacheKey = getCacheKey(method, url, config?.params, session?.user?.id || 'anonymous')
      const cached = cacheable ? cache.get(cacheKey) : null
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) return { data: cached.data }
      const { data: res } = await axiosApi.get(url, config)
      if (cacheable) cache.set(cacheKey, { data: res, timestamp: Date.now() })
      return { data: res }
    }
    if (method === 'DELETE') {
      const { data: res } = await axiosApi.delete(url, { ...config, data })
      return { data: res }
    }
    if (method === 'PUT') {
      const { data: res } = await axiosApi.put(url, data, config)
      return { data: res }
    }
    if (method === 'PATCH') {
      const { data: res } = await axiosApi.patch(url, data, config)
      return { data: res }
    }
    const { data: res } = await axiosApi.post(url, data, config)
    return { data: res }
  } catch (err) {
    if (err.response) throw err
    if (err.code === 'ECONNABORTED' && method === 'POST' && url.replace(/^\/+/, '').startsWith('study-materials')) {
      err.message = 'AI generation is taking longer than expected. Please wait and try again.'
    }
    throw err
  } finally {
    invalidateCache(method, url)
  }
}

const api = {
  get: (url, config) => callApi('GET', url, null, config),
  post: (url, data, config) => callApi('POST', url, data, config),
  put: (url, data, config) => callApi('PUT', url, data, config),
  patch: (url, data, config) => callApi('PATCH', url, data, config),
  delete: (url, config) => callApi('DELETE', url, null, config),
}

export default api
