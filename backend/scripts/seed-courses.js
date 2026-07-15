import 'dotenv/config'
import pg from 'pg'
import { generateCourses } from '../lib/db.js'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function seed() {
  try {
    console.log('Generating courses and departments...')
    const { courses } = generateCourses()

    console.log(`Preparing to seed ${courses.length} courses...`)

    // We'll use a transaction for safety
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Optional: Clear existing non-custom courses if you want a fresh start
      // await client.query('DELETE FROM public.courses WHERE custom = false')

      for (const c of courses) {
        await client.query(
          `INSERT INTO public.courses (id, code, title, level, units, department, department_name, college, custom, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
           ON CONFLICT (id) DO UPDATE SET
             code = EXCLUDED.code,
             title = EXCLUDED.title,
             level = EXCLUDED.level,
             units = EXCLUDED.units,
             department = EXCLUDED.department,
             department_name = EXCLUDED.department_name,
             college = EXCLUDED.college`,
          [c.id, c.code, c.title, c.level, c.units, c.department, c.department_name, c.college]
        )
      }

      await client.query('COMMIT')
      console.log('Seeding successful!')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Seeding failed:', err.message)
  } finally {
    await pool.end()
  }
}

seed().catch(err => { console.error('Seed fatal:', err); process.exit(1) })
