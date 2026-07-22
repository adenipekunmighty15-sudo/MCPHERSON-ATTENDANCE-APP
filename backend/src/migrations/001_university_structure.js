import { query } from '../../lib/db.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SQL = readFileSync(join(__dirname, '001_university_structure.sql'), 'utf8')

export async function up() {
  console.log('Running migration 001: University Structure...')
  const statements = SQL.split(';').filter(s => s.trim())
  let ok = 0, fail = 0
  for (const stmt of statements) {
    try {
      await query(stmt)
      ok++
    } catch (err) {
      console.error('  FAIL:', err.message?.slice(0, 120))
      fail++
    }
  }
  console.log(`Migration 001 complete. ${ok} ok, ${fail} failed.`)
}

export async function down() {
  console.log('Rolling back migration 001...')
  const tables = ['enrollments', 'lecturer_courses', 'programmes', 'departments', 'grade_system', 'semesters', 'academic_years', 'faculties', 'university_config']
  for (const t of tables) {
    try { await query(`DROP TABLE IF EXISTS public.${t} CASCADE`) } catch {}
  }
  console.log('Rollback 001 complete.')
}

if (process.argv[1]?.endsWith('001_university_structure.js')) {
  const action = process.argv[2] || 'up'
  if (action === 'up') up().then(() => process.exit())
  else down().then(() => process.exit())
}