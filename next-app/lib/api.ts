import {
  buildApiUrl,
  getSiteOrigin,
  isAuthFlowPath,
  NETWORK_ERROR_MESSAGE,
  RATE_LIMIT_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
} from './config'
import { clearLocalSession, getSupabaseClient } from './supabase'

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown
  readonly code?: string

  constructor(message: string, status: number, data?: unknown, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = code
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  params?: QueryParams
  headers?: HeadersInit
  signal?: AbortSignal
  /** Milliseconds; 0 disables the timeout (used by SSE streams). */
  timeout?: number
  /** Set false for auth endpoints that must not send a stale token. */
  auth?: boolean
  /** Explicit bearer token override. */
  token?: string
  cache?: boolean
  accept?: string
}

export interface StreamOptions extends Omit<RequestOptions, 'accept'> {
  onMessage?: (payload: unknown, event: string) => void
  onEvent?: (event: string, rawData: string) => void
}

const CACHE_TTL = 30_000
const DEFAULT_TIMEOUT = 15_000
const cache = new Map<string, { data: unknown; timestamp: number }>()

// Mutations clear the short-lived GET cache entries for related resources.
const INVALIDATION_MAP: Record<string, string[]> = {
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
  '/course-notes': ['GET:/course-notes'],
  '/ccmas': ['GET:/ccmas/overview', 'GET:/ccmas/courses'],
  '/student-courses': ['GET:/student-courses', 'GET:/courses/enrolled'],
  '/general-chat/messages': ['GET:/general-chat/messages'],
}

let unauthorizedHandler: (() => void | Promise<void>) | null = null
let unauthorizedInFlight = false

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null): void {
  unauthorizedHandler = handler
}

function currentPath(): string {
  return typeof window === 'undefined' ? '' : window.location.pathname
}

function isAuthEndpoint(url: string): boolean {
  const relative = url.replace(/^\/+/, '').split('?')[0]
  return relative.startsWith('auth/') || relative.startsWith('public/config')
}

function resolveUrl(url: string, params?: QueryParams): string {
  const absolute = /^https?:\/\//i.test(url)
  const target = absolute ? url.replace(/\/+$/, '') : buildApiUrl(url)
  const origin = absolute ? undefined : (getSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'))
  const parsed = new URL(target, origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) parsed.searchParams.set(key, String(value))
    }
  }
  return absolute ? parsed.toString() : `${parsed.pathname}${parsed.search}`
}

async function getAccessToken(options: RequestOptions): Promise<string | null> {
  if (options.auth === false) return null
  if (options.token !== undefined) return options.token
  const supabase = await getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function getCacheIdentity(): Promise<string> {
  const supabase = await getSupabaseClient()
  if (!supabase) return 'anonymous'
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id || 'anonymous'
}

function invalidateCache(method: string, url: string): void {
  if (method === 'GET') return
  const base = url.split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '')
  const matched = Object.keys(INVALIDATION_MAP).find((prefix) => base.startsWith(prefix))
  if (!matched) return
  for (const prefix of INVALIDATION_MAP[matched]) {
    for (const key of cache.keys()) {
      if (key.includes(`:${prefix}`)) cache.delete(key)
    }
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const body = data as Record<string, unknown>
  const candidate = body.error ?? body.message ?? body.error_description
  if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  if (candidate && typeof candidate === 'object') {
    const nested = (candidate as Record<string, unknown>).message
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  return fallback
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) return error.name === 'AbortError' || error.name === 'TimeoutError'
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

function httpError(status: number, data: unknown, fallback: string): ApiError {
  let message = extractMessage(data, fallback)
  if (status >= 500) message = SERVICE_UNAVAILABLE_MESSAGE
  else if (status === 429) message = RATE_LIMIT_MESSAGE
  return new ApiError(message, status, data, status >= 500 ? 'SERVER_ERROR' : undefined)
}

async function handleUnauthorized(): Promise<void> {
  if (unauthorizedInFlight || typeof window === 'undefined') return
  unauthorizedInFlight = true
  try {
    await unauthorizedHandler?.()
  } catch {
    // Redirect must still happen if session cleanup fails.
  }
  if (isAuthFlowPath(window.location.pathname)) {
    unauthorizedInFlight = false
    return
  }
  const loginPath = window.location.pathname.startsWith('/admin/portal')
    ? '/admin/portal/login'
    : '/login'
  const destination = new URL(loginPath, getSiteOrigin() || window.location.origin)
  destination.searchParams.set('redirect', window.location.pathname)
  destination.searchParams.set('reason', 'session-expired')
  window.location.replace(destination.toString())
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  const type = response.headers.get('content-type') || ''
  if (type.includes('application/json') || text.trimStart().startsWith('{') || text.trimStart().startsWith('[')) {
    return JSON.parse(text) as unknown
  }
  return text
}

async function sendRequest(method: string, url: string, body: unknown, options: RequestOptions): Promise<Response> {
  const headers = new Headers(options.headers)
  if (options.accept) headers.set('Accept', options.accept)
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && body !== null && !isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = await getAccessToken(options)
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)

  const controller = new AbortController()
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  let timer: ReturnType<typeof setTimeout> | null = null
  if (timeout > 0) {
    timer = setTimeout(() => {
      try {
        controller.abort(new DOMException('Request timeout', 'TimeoutError'))
      } catch {
        controller.abort()
      }
    }, timeout)
  }
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason)
    else options.signal.addEventListener('abort', () => controller.abort(options.signal?.reason), { once: true })
  }

  try {
    const response = await fetch(resolveUrl(url, options.params), {
      method,
      headers,
      body: body === undefined || body === null || isForm ? (body as BodyInit | undefined) : JSON.stringify(body),
      signal: controller.signal,
      credentials: 'same-origin',
    })

    if (!response.ok) {
      const data = await parseBody(response).catch(() => null)
      if (response.status === 401 && !isAuthEndpoint(url) && !isAuthFlowPath(currentPath())) {
        void handleUnauthorized()
      }
      throw httpError(response.status, data, response.statusText || `Request failed (${response.status})`)
    }
    return response
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (isAbortError(error)) throw new ApiError(TIMEOUT_ERROR_MESSAGE, 0, undefined, 'TIMEOUT')
    if (error instanceof TypeError) throw new ApiError(NETWORK_ERROR_MESSAGE, 0, undefined, 'NETWORK')
    throw new ApiError(error instanceof Error ? error.message : NETWORK_ERROR_MESSAGE, 0)
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function request<T>(method: string, url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  try {
    const response = await sendRequest(method, url, body, options)
    return (await parseBody(response)) as T
  } finally {
    invalidateCache(method, url)
  }
}

/** Fetch an SSE stream and dispatch complete `data:` blocks to callbacks. */
export async function streamSSE(url: string, body?: unknown, options: StreamOptions = {}): Promise<void> {
  const response = await sendRequest('POST', url, body, {
    ...options,
    accept: 'text/event-stream',
    timeout: options.timeout ?? 0,
    cache: false,
  })
  if (!response.body) throw new ApiError('Streaming is not supported in this browser.', 0)

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  const emit = (block: string) => {
    let event = 'message'
    const dataLines: string[] = []
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue
      const colon = line.indexOf(':')
      const field = colon === -1 ? line : line.slice(0, colon)
      let value = colon === -1 ? '' : line.slice(colon + 1)
      if (value.startsWith(' ')) value = value.slice(1)
      if (field === 'event') event = value
      else if (field === 'data') dataLines.push(value)
    }
    if (!dataLines.length) return
    const raw = dataLines.join('\n')
    options.onEvent?.(event, raw)
    let payload: unknown = raw
    try {
      payload = JSON.parse(raw) as unknown
    } catch {
      // Plain text SSE payloads are passed through unchanged.
    }
    options.onMessage?.(payload, event)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      emit(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
    }
  }
  if (buffer.trim()) emit(buffer)
}

export const api = {
  async get<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    const identity = await getCacheIdentity()
    const paramsKey = options.params ? JSON.stringify(options.params) : ''
    const cacheKey = `${identity}:GET:${url}:${paramsKey}`
    const cacheable = options.cache !== false && !url.replace(/^\/+/, '').startsWith('messages/')
    if (cacheable) {
      const hit = cache.get(cacheKey)
      if (hit && Date.now() - hit.timestamp < CACHE_TTL) return hit.data as T
    }
    const data = await request<T>('GET', url, undefined, options)
    if (cacheable) cache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  },
  post<T = unknown>(url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return request<T>('POST', url, body, options)
  },
  put<T = unknown>(url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return request<T>('PUT', url, body, options)
  },
  patch<T = unknown>(url: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return request<T>('PATCH', url, body, options)
  },
  delete<T = unknown>(url: string, options: (RequestOptions & { data?: unknown }) = {}): Promise<T> {
    return request<T>('DELETE', url, options.data, options)
  },
  /** Multipart uploads: pass FormData directly so the browser sets the boundary. */
  upload<T = unknown>(url: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    return request<T>('POST', url, formData, options)
  },
  stream: streamSSE,
}

export const clearApiCache = (): void => cache.clear()

export { clearLocalSession }
