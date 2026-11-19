import 'dotenv/config'
import pg from 'pg'

// Adds the identifier columns and race-condition-safe uniqueness guarantees
// used by /api/auth/signup. Partial indexes ignore the empty default so legacy
// rows with no identifier remain valid.
const statements = [
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS matric_number TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS staff_id TEXT NOT NULL DEFAULT ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_matric_number_unique
     ON public.users (lower(matric_number)) WHERE matric_number <> ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_staff_id_unique
     ON public.users (lower(staff_id)) WHERE staff_id <> ''`,
]

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  for (const sql of statements) await pool.query(sql)
  console.log(`Created/verified ${statements.length} auth constraint statements`)
} finally {
  await pool.end()
}
