import 'dotenv/config'
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  try {
    console.log('Starting migration...')
    await pool.query(`
      ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS diagrams JSONB DEFAULT '[]';
      ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]';
      ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS podcast_url TEXT DEFAULT '';
    `)
    console.log('Migration successful!')
  } catch (err) {
    console.error('Migration failed:', err.message)
  } finally {
    await pool.end()
  }
}

migrate().catch(err => { console.error('Migration fatal:', err); process.exit(1) })
