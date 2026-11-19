import supabaseAdmin from '../config/supabase.js'
import { randomUUID } from 'crypto'

const BUCKET = 'student-media'

// Extensions are derived exclusively from this MIME allowlist. HTML, SVG,
// JavaScript and other executable types are absent, so an object served from
// the public bucket can never be rendered/executed as a script.
export const MIME_TO_EXTENSION = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
})

export function extensionForMime(contentType) {
  return MIME_TO_EXTENSION[contentType] || null
}

// Only known, server-controlled folders are preserved. Any other path from a
// caller (including the original filename) is discarded entirely.
const SAFE_FOLDER_PREFIXES = new Set(['profile-pictures'])

function buildObjectPath(fileName, extension) {
  const raw = typeof fileName === 'string' ? fileName : ''
  const slash = raw.lastIndexOf('/')
  const folder = slash >= 0 ? raw.slice(0, slash) : ''
  const prefix = SAFE_FOLDER_PREFIXES.has(folder) ? `${folder}/` : ''
  return `${prefix}${randomUUID()}${extension}`
}

async function ensureBucket() {
  if (!supabaseAdmin) return
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    }
  } catch { /* bucket may already exist */ }
}
await ensureBucket()

async function uploadFile(buffer, fileName, contentType) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured — cannot upload to cloud storage')
  }
  const extension = extensionForMime(contentType)
  if (!extension) {
    throw new Error('Unsupported file type')
  }
  // The object key is always a fresh UUID + validated extension. The caller's
  // filename is never used verbatim, preventing path traversal and executable
  // uploads even when the bucket is public.
  const filePath = buildObjectPath(fileName, extension)
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType,
      // Best-effort download header where the storage client honors it; the
      // MIME/extension allowlist above is the primary script-execution guard.
      contentDisposition: 'attachment',
      headers: { 'Content-Disposition': 'attachment' },
      upsert: true,
    })
  if (error) throw error
  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath)
  return { filePath, publicUrl: urlData.publicUrl }
}

async function getPublicUrl(filePath) {
  if (!supabaseAdmin) return ''
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

export { uploadFile, getPublicUrl }
