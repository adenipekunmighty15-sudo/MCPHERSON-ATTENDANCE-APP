import supabaseAdmin from '../config/supabase.js'
import { randomUUID } from 'crypto'

const BUCKET = 'student-media'

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
  const filePath = `${randomUUID()}-${fileName}`
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType, upsert: true })
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
