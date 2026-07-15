/**
 * Migration: Add TurboLearn AI Features
 * Creates tables for podcast generation, study groups, and collaboration
 */

export async function up(db) {
  // Podcasts table - stores podcast generation metadata
  await db.query(`
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

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id)
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_podcasts_material_id ON podcasts(material_id)
  `)

  // Study Groups table - for collaborative learning
  await db.query(`
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

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id)
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_study_groups_course ON study_groups(course_id)
  `)

  // Study Group Members table
  await db.query(`
    CREATE TABLE IF NOT EXISTS study_group_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member', -- creator, moderator, member
      joined_at TIMESTAMP DEFAULT NOW(),
      
      CONSTRAINT unique_member_per_group UNIQUE(group_id, user_id)
    )
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id)
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id)
  `)

  // Group Shared Materials table
  await db.query(`
    CREATE TABLE IF NOT EXISTS group_shared_materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      material_id TEXT NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
      shared_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      shared_at TIMESTAMP DEFAULT NOW(),
      
      CONSTRAINT unique_shared_material UNIQUE(group_id, material_id)
    )
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_group_shared_materials_group ON group_shared_materials(group_id)
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_group_shared_materials_material ON group_shared_materials(material_id)
  `)

  // Add enhanced fields to existing study_materials table if not exist
  try {
    await db.query(`
      ALTER TABLE study_materials 
      ADD COLUMN IF NOT EXISTS podcast_url VARCHAR(512),
      ADD COLUMN IF NOT EXISTS podcast_status VARCHAR(50) DEFAULT 'none', -- none, pending, ready
      ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, advanced
      ADD COLUMN IF NOT EXISTS estimated_study_time INT -- in minutes
    `)
  } catch (e) {
    console.log('Columns may already exist:', e.message)
  }

  // Add fields to flashcards table for better pedagogy
  try {
    await db.query(`
      ALTER TABLE flashcards 
      ADD COLUMN IF NOT EXISTS difficulty INT DEFAULT 3, -- 1-5 scale
      ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'concept' -- concept, application, comparison, analysis, synthesis
    `)
  } catch (e) {
    console.log('Columns may already exist:', e.message)
  }
}

export async function down(db) {
  // Drop tables in reverse order of creation
  await db.query(`DROP TABLE IF EXISTS group_shared_materials`)
  await db.query(`DROP TABLE IF EXISTS study_group_members`)
  await db.query(`DROP TABLE IF EXISTS study_groups`)
  await db.query(`DROP TABLE IF EXISTS podcasts`)
  
  // Remove new columns
  try {
    await db.query(`
      ALTER TABLE study_materials 
      DROP COLUMN IF EXISTS podcast_url,
      DROP COLUMN IF EXISTS podcast_status,
      DROP COLUMN IF EXISTS difficulty_level,
      DROP COLUMN IF EXISTS estimated_study_time
    `)
  } catch (e) {
    console.log('Columns may not exist:', e.message)
  }
  
  try {
    await db.query(`
      ALTER TABLE flashcards 
      DROP COLUMN IF EXISTS difficulty,
      DROP COLUMN IF EXISTS category
    `)
  } catch (e) {
    console.log('Columns may not exist:', e.message)
  }
}
