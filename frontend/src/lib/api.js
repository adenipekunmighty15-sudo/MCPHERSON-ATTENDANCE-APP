import axios from 'axios'
import { supabase } from './supabase'
import { buildStudyPack } from './studyPack'

const apiUrl = import.meta.env.VITE_API_URL || '/api'

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

  return saveLocalStudyMaterial(material)
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
  const isStudyList = method === 'GET' && trimmed === 'study-materials'
  const isStudyCreate = method === 'POST' && trimmed === 'study-materials'
  const materialMatch = trimmed.match(/^study-materials\/([^/]+)$/)
  const isLocalStudyRead = method === 'GET' && materialMatch
  const isLocalStudyDelete = method === 'DELETE' && materialMatch

  if (!isStudyList && !isStudyCreate && !isLocalStudyRead && !isLocalStudyDelete) return null

  if (supabase) {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (data.session?.user) return null
  }

  if (isStudyList) return readLocalStudyMaterials()
  if (isStudyCreate) return createStudyMaterialLocally(data, null)
  if (isLocalStudyRead) {
    return readLocalStudyMaterials().find(item => item.id === materialMatch[1]) || null
  }
  if (isLocalStudyDelete) {
    return deleteLocalStudyMaterial(materialMatch[1]) ? { success: true } : null
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
