import 'dotenv/config'
import pg from 'pg'
import { randomUUID } from 'crypto'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function test() {
  const userId = randomUUID()
  try {
    // Test user upsert
    await pool.query(
      'INSERT INTO public.users (id, email, name) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING',
      [userId, 'test@mcpherson.edu', 'Test']
    )
    console.log('User upsert OK')

    // Test study_materials insert with null course_id
    const materialId = randomUUID()
    await pool.query(
      `INSERT INTO public.study_materials
        (id, course_id, title, source_text, summary, key_points, quiz, diagrams, improved_note, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [materialId, null, 'Test Title', 'Test content', 'Test summary', '[]', '[]', '[]', 'Test note', userId]
    )
    console.log('Study material insert OK (course_id=null)')

    // Cleanup
    await pool.query('DELETE FROM public.study_materials WHERE id = $1', [materialId])
    await pool.query('DELETE FROM public.users WHERE id = $1', [userId])
    console.log('Cleanup OK')
    console.log('ALL TESTS PASSED')
  } catch (e) {
    console.error('FAILED:', e.message)
    console.error('STACK:', e.stack)
  }
  process.exit(0)
}

test()
