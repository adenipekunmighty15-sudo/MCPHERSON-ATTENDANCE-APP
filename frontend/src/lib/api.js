import axios from 'axios'
import { supabase } from './supabase'
import { buildStudyPack } from './studyPack'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const cache = new Map()
const CACHE_TTL = 30_000
const LOCAL_STUDY_KEY = 'mcu_local_study_materials'

// Tracks which GET cache keys to invalidate per mutation URL base
const invalidationMap = {
  '/attendance': ['GET:/attendance'],
  '/courses': ['GET:/courses'],
  '/timetable': ['GET:/timetable'],
  '/sessions': ['GET:/sessions/active'],
  '/notifications': ['GET:/notifications'],
  '/chat': ['GET:/chats'],
  '/venues': ['GET:/venues'],
  '/library/resources': ['GET:/library/resources'],
  '/complaints': ['GET:/complaints'],
  '/study-materials': ['GET:/study-materials', 'GET:/study-materials/stats'],
  '/study-folders': ['GET:/study-folders'],
  '/general-chat/messages': ['GET:/general-chat/messages'],
}

function getCacheKey(method, url, data) {
  return `${method}:${url}:${data ? JSON.stringify(data) : ''}`
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

function makeId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function parseJsonish(value, fallback) {
  if (value == null || value === '') return fallback
  if (Array.isArray(value) || typeof value === 'object') return value
  try { return JSON.parse(value) } catch { return fallback }
}

function readLocalStudyMaterials() {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_STUDY_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalStudyMaterials(items) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LOCAL_STUDY_KEY, JSON.stringify(items))
}

function normalizeStudyMaterial(row, flashcards = row?.flashcards || []) {
  const cards = parseJsonish(flashcards, [])
  return {
    ...row,
    id: row.id,
    courseId: row.courseId ?? row.course_id ?? null,
    title: row.title || 'Untitled study pack',
    sourceText: row.sourceText ?? row.source_text ?? '',
    summary: row.summary || '',
    keyPoints: parseJsonish(row.keyPoints ?? row.key_points, []),
    quiz: parseJsonish(row.quiz, []),
    diagrams: parseJsonish(row.diagrams, []),
    improvedNote: row.improvedNote ?? row.improved_note ?? '',
    chatHistory: parseJsonish(row.chatHistory ?? row.chat_history, []),
    podcastUrl: row.podcastUrl ?? row.podcast_url ?? '',
    folderId: row.folderId ?? row.folder_id ?? null,
    createdBy: row.createdBy ?? row.created_by ?? 'local',
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    flashcards: cards,
    flashcardCount: row.flashcardCount ?? cards.length,
  }
}

function saveLocalStudyMaterial(material) {
  const normalized = normalizeStudyMaterial(material, material.flashcards || [])
  const existing = readLocalStudyMaterials().filter(item => item.id !== normalized.id)
  writeLocalStudyMaterials([normalized, ...existing])
  return normalized
}

function deleteLocalStudyMaterial(id) {
  const before = readLocalStudyMaterials()
  const after = before.filter(item => item.id !== id)
  if (after.length !== before.length) {
    writeLocalStudyMaterials(after)
    return true
  }
  return false
}

async function createStudyMaterialLocally(input, userId) {
  const sourceText = (input?.sourceText || '').trim()
  if (sourceText.length < 50) {
    throw new Error(input?.youtubeUrl
      ? 'I could not fetch enough text from that URL. Paste the lecture text or upload a document instead.'
      : 'Provide at least 50 characters of content.')
  }

  const flashcardCount = Math.min(Math.max(parseInt(input?.flashcardCount) || 10, 1), 50)
  const quizCount = Math.min(Math.max(parseInt(input?.quizCount) || 8, 1), 30)
  const keyPointCount = Math.min(Math.max(parseInt(input?.keyPointCount) || 6, 1), 30)
  const pack = buildStudyPack(sourceText, flashcardCount, quizCount, keyPointCount)
  const id = makeId()
  const createdAt = new Date().toISOString()
  const title = (input?.title || '').trim() || `${sourceText.split(/\s+/).slice(0, 8).join(' ')}...`
  const flashcards = (pack.flashcards || []).map((card, index) => ({
    id: makeId(),
    material_id: id,
    front: card.front,
    back: card.back,
    order_index: index,
  }))

  const material = normalizeStudyMaterial({
    id,
    courseId: input?.courseId || null,
    title,
    sourceText,
    summary: pack.summary,
    keyPoints: pack.keyPoints,
    quiz: pack.quiz,
    diagrams: pack.diagrams,
    improvedNote: pack.improvedNote,
    flashcards,
    createdBy: userId || 'local',
    createdAt,
  }, flashcards)

  if (!supabase || !userId) return saveLocalStudyMaterial(material)

  try {
    const dbRow = {
      id,
      course_id: input?.courseId || '',
      title,
      source_text: sourceText,
      summary: material.summary,
      key_points: material.keyPoints,
      quiz: material.quiz,
      diagrams: material.diagrams,
      improved_note: material.improvedNote,
      created_by: userId,
      created_at: createdAt,
    }
    const { data: inserted, error } = await supabase.from('study_materials').insert(dbRow).select().single()
    if (error) throw error

    if (flashcards.length) {
      const { error: cardError } = await supabase.from('flashcards').insert(flashcards)
      if (cardError) console.warn('[api] Flashcard save failed:', cardError.message)
    }

    return normalizeStudyMaterial(inserted || dbRow, flashcards)
  } catch (e) {
    console.warn('[api] Remote study pack save failed; using local storage:', e?.message || e)
    return saveLocalStudyMaterial(material)
  }
}

function isStudyMaterialGeneration(method, url, data) {
  return method === 'POST' && !((data instanceof FormData)) && url.replace(/^\/+/, '').replace(/\/+$/, '') === 'study-materials'
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
  (err) => {
    const requestPath = (err.config?.url || '').replace(/^\/+/, '').replace(/\/+$/, '')
    const isStudyGeneration = err.config?.method?.toUpperCase() === 'POST' && requestPath === 'study-materials'
    if (err.response?.status === 401 && !isStudyGeneration && !window.location.pathname.startsWith('/auth/callback') && window.location.pathname !== '/login') {
      localStorage.removeItem('mcu_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

async function routeToSupabase(method, url, data) {
  const trimmed = url.replace(/^\/+/, '').replace(/\/+$/, '')
  let userId
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      userId = session?.user?.id
    }
  } catch { userId = null }

  if (!supabase && !trimmed.startsWith('study-materials')) return null
  if (!userId && !trimmed.startsWith('study-materials')) return null

  if (!userId && method === 'GET' && trimmed === 'study-materials') return readLocalStudyMaterials()
  if (!userId && method === 'POST' && trimmed === 'study-materials') return createStudyMaterialLocally(data, null)

  const routes = [
    { test: /^study-materials$/, method: 'GET', handler: async () => {
      if (!userId) return readLocalStudyMaterials()
      const { data, error } = await supabase.from('study_materials').select('*').eq('created_by', userId).order('created_at', { ascending: false })
      if (error) throw error
      const remote = (data || []).map(r => normalizeStudyMaterial(r))
      return [...readLocalStudyMaterials(), ...remote].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }},
    { test: /^study-materials$/, method: 'POST', handler: async () => {
      return createStudyMaterialLocally(data, userId)
    }},
    { test: /^study-materials\/(?:stats|search-web)$/, method: 'GET', handler: async () => null },
    { test: /^study-materials\/([^/]+)$/, method: 'GET', handler: async (m) => {
      const local = readLocalStudyMaterials().find(item => item.id === m[1])
      if (local) return local
      if (!userId) return null
      const { data, error } = await supabase.from('study_materials').select('*').eq('id', m[1]).single()
      if (error) throw error
      const { data: cards, error: cardError } = await supabase
        .from('flashcards')
        .select('id, front, back, order_index')
        .eq('material_id', m[1])
        .order('order_index', { ascending: true })
      if (cardError) console.warn('[api] Flashcard load failed:', cardError.message)
      return normalizeStudyMaterial(data, cards || [])
    }},
    { test: /^study-materials\/([^/]+)$/, method: 'DELETE', handler: async (m) => {
      if (deleteLocalStudyMaterial(m[1])) return { success: true }
      if (!userId) return null
      await supabase.from('flashcards').delete().eq('material_id', m[1])
      const { error } = await supabase.from('study_materials').delete().eq('id', m[1]).eq('created_by', userId)
      if (error) throw error
      return { success: true }
    }},
    { test: /^notifications$/, method: 'GET', handler: async () => {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    }},
    { test: /^notifications\/(.+)\/read$/, method: 'PUT', handler: async (m) => {
      const { data: result, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', m[1]).select()
      if (error) throw error
      return result?.[0]
    }},
    { test: /^notifications\/read-all$/, method: 'PUT', handler: async () => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
      if (error) throw error
      return { success: true }
    }},
    { test: /^complaints$/, method: 'GET', handler: async () => {
      const { data, error } = await supabase.from('complaints').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    }},
    { test: /^complaints$/, method: 'POST', handler: async () => {
      const { data: result, error } = await supabase.from('complaints').insert({ ...data, id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8), user_id: userId, status: 'open', created_at: new Date().toISOString() }).select()
      if (error) throw error
      return result?.[0]
    }},
    { test: /^chats$/, method: 'GET', handler: async () => {
      const { data, error } = await supabase.from('chat_conversations').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    }},
    { test: /^chats$/, method: 'POST', handler: async () => {
      const { data: result, error } = await supabase.from('chat_conversations').insert({ ...data, id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8), user_id: userId, created_at: new Date().toISOString() }).select()
      if (error) throw error
      return result?.[0]
    }},
    { test: /^chats\/(.+)$/, method: 'PUT', handler: async (m) => {
      const { data: result, error } = await supabase.from('chat_conversations').update(data).eq('id', m[1]).select()
      if (error) throw error
      return result?.[0]
    }},
    { test: /^chats\/(.+)$/, method: 'DELETE', handler: async (m) => {
      await supabase.from('chat_messages').delete().eq('conversation_id', m[1])
      const { error } = await supabase.from('chat_conversations').delete().eq('id', m[1])
      if (error) throw error
      return { success: true }
    }},
    { test: /^chats\/(.+)\/messages$/, method: 'GET', handler: async (m) => {
      const { data, error } = await supabase.from('chat_messages').select('*').eq('conversation_id', m[1]).order('created_at', { ascending: true })
      if (error) throw error
      return data
    }},
    { test: /^chats\/(.+)\/messages$/, method: 'POST', handler: async (m) => {
      const { data: result, error } = await supabase.from('chat_messages').insert({ ...data, id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8), conversation_id: m[1], created_at: new Date().toISOString() }).select()
      if (error) throw error
      return result?.[0]
    }},
    { test: /^venues$/, method: 'GET', handler: async () => {
      const { data, error } = await supabase.from('venues').select('*')
      if (error) throw error
      return data
    }},
    { test: /^general-chat\/messages$/, method: 'GET', handler: async () => {
      const limit = data?.limit || 50
      const before = data?.before || null
      let query = supabase.from('general_chat_messages').select('*').order('created_at', { ascending: false }).limit(limit)
      if (before) query = query.lt('created_at', before)
      const { data: result, error } = await query
      if (error) throw error
      return result.reverse()
    }},
    { test: /^general-chat\/messages$/, method: 'POST', handler: async () => {
      const { data: result, error } = await supabase.from('general_chat_messages').insert({
        ...data, id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        sender_id: userId, created_at: new Date().toISOString()
      }).select()
      if (error) throw error
      return result?.[0]
    }},
    { test: /^general-chat\/messages\/(.+)$/, method: 'DELETE', handler: async (m) => {
      const { error } = await supabase.from('general_chat_messages').delete().eq('id', m[1]).eq('sender_id', userId)
      if (error) throw error
      return { success: true }
    }},
  ]

  for (const route of routes) {
    if (route.method !== method) continue
    const matches = trimmed.match(route.test)
    if (matches) return route.handler(matches)
  }
  return null
}

async function callWithFallback(method, url, data, config) {
  const isFormData = data instanceof FormData
  const preferBackend = isStudyMaterialGeneration(method, url, data)
  if (!isFormData && !preferBackend) {
    try {
      const result = await routeToSupabase(method, url, data)
      if (result !== null && result !== undefined) return { data: result }
    } catch (e) {
      console.warn(`[api] Supabase fallback failed for ${method} ${url}:`, e?.message || e)
    }
  }
  try {
    if (method === 'GET') {
      const cacheKey = getCacheKey(method, url, config?.params)
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) return { data: cached.data }
      const { data: res } = await axiosApi.get(url, config)
      cache.set(cacheKey, { data: res, timestamp: Date.now() })
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
    const { data: res } = await axiosApi.post(url, data, config)
    return { data: res }
  } catch (err) {
    if (!isFormData && preferBackend) {
      try {
        const result = await routeToSupabase(method, url, data)
        if (result !== null && result !== undefined) return { data: result }
      } catch (fallbackErr) {
        console.warn(`[api] Local study generation failed for ${method} ${url}:`, fallbackErr?.message || fallbackErr)
      }
    }
    if (err.response) throw err
    if (err.code === 'ECONNABORTED') {
      err.message = 'AI generation is taking longer than expected. Please wait and try again.'
    }
    throw err
  } finally {
    invalidateCache(method, url)
  }
}

const api = {
  get: (url, config) => callWithFallback('GET', url, null, config),
  post: (url, data, config) => callWithFallback('POST', url, data, config),
  put: (url, data, config) => callWithFallback('PUT', url, data, config),
  delete: (url, config) => callWithFallback('DELETE', url, null, config),
}

export default api
