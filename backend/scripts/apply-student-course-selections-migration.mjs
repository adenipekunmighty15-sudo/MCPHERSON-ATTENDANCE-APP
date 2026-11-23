import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const migrationPath = fileURLToPath(new URL('../src/migrations/017_student_course_selections.sql', import.meta.url))
const sql = await readFile(migrationPath, 'utf8')
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  await client.query(sql)
  const { rows } = await client.query("SELECT to_regclass('public.student_course_selections') AS table_name")
  console.log('Student course selections migration applied:', rows[0]?.table_name || 'missing')
} finally {
  await client.end()
}
