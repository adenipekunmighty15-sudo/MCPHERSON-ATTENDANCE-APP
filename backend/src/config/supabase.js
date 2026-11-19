import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// This file lives at backend/src/config/, so the real env file is two levels up.
// The old path resolved to backend/src/.env (which does not exist), so the
// admin client was always null on local/dev runs even with valid credentials.
dotenv.config({ path: join(__dirname, '..', '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseServiceKey && 'SUPABASE_SERVICE_KEY',
  ].filter(Boolean).join(', ')
  console.warn(`[auth] Supabase admin is not configured (missing ${missing}). Protected API routes will return 503 until backend/.env is filled.`)
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export const supabaseConfigured = !!supabaseAdmin
export default supabaseAdmin
