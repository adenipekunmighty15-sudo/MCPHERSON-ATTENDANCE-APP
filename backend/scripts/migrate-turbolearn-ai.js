import 'dotenv/config'
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  try {
    console.log('Starting TurboLearn AI migration...')

    // Podcasts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS podcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        material_id TEXT NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        script TEXT,
        audio_url VARCHAR(512),
        status VARCHAR(50) DEFAULT 'pending',
        duration_seconds INT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_podcast_per_material UNIQUE(material_id, user_id)
      )
    `)
    console.log('Created podcasts table')

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_podcasts_material_id ON podcasts(material_id)`)
    console.log('Created podcasts indexes')

    // Study Groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('Created study_groups table')

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_groups_course ON study_groups(course_id)`)
    console.log('Created study_groups indexes')

    // Study Group Members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_member_per_group UNIQUE(group_id, user_id)
      )
    `)
    console.log('Created study_group_members table')

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id)`)
    console.log('Created study_group_members indexes')

    // Group Shared Materials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_shared_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
        material_id TEXT NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
        shared_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        shared_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_shared_material UNIQUE(group_id, material_id)
      )
    `)
    console.log('Created group_shared_materials table')

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_group_shared_materials_group ON group_shared_materials(group_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_group_shared_materials_material ON group_shared_materials(material_id)`)
    console.log('Created group_shared_materials indexes')

    // Enhanced fields for study_materials
    try {
      await pool.query(`
        ALTER TABLE study_materials
        ADD COLUMN IF NOT EXISTS podcast_url VARCHAR(512),
        ADD COLUMN IF NOT EXISTS podcast_status VARCHAR(50) DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'intermediate',
        ADD COLUMN IF NOT EXISTS estimated_study_time INT
      `)
      console.log('Enhanced study_materials table')
    } catch (e) {
      console.log('Columns may already exist:', e.message)
    }

    // Enhanced fields for flashcards
    try {
      await pool.query(`
        ALTER TABLE flashcards
        ADD COLUMN IF NOT EXISTS difficulty INT DEFAULT 3,
        ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'concept'
      `)
      console.log('Enhanced flashcards table')
    } catch (e) {
      console.log('Columns may already exist:', e.message)
    }

    console.log('Migration completed successfully!')
    console.log('New tables created: podcasts, study_groups, study_group_members, group_shared_materials')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate().catch(err => { console.error('Migration fatal:', err); process.exit(1) })
