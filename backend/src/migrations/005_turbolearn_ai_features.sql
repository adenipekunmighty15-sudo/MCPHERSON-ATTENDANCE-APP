-- ═══════════════════════════════════════════════════════════════════════
-- Migration 005: TurboLearn AI Features
-- Podcasts, Study Groups, Collaboration
-- ═══════════════════════════════════════════════════════════════════════

-- 0. Drop old tables if they exist with wrong types (from previous JS migration)
-- Drop old tables + old FK constraints that may have wrong types
DROP TABLE IF EXISTS public.group_shared_materials CASCADE;
DROP TABLE IF EXISTS public.study_group_members CASCADE;
DROP TABLE IF EXISTS public.study_groups CASCADE;
DROP TABLE IF EXISTS public.podcasts CASCADE;

-- 1. PODCASTS TABLE
-- Note: material_id is TEXT to match study_materials.id type on the database
CREATE TABLE IF NOT EXISTS public.podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  script TEXT,
  audio_url VARCHAR(512),
  status VARCHAR(50) DEFAULT 'pending',
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_podcast_per_material UNIQUE(material_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON public.podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_material_id ON public.podcasts(material_id);

-- 2. STUDY GROUPS TABLE
-- Note: course_id is TEXT to match courses.id type on the database
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  course_id TEXT,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON public.study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_course ON public.study_groups(course_id);

-- 3. STUDY GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_member_per_group UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id);

-- 4. GROUP SHARED MATERIALS TABLE
-- Note: material_id is TEXT to match study_materials.id type on the database
CREATE TABLE IF NOT EXISTS public.group_shared_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL,
  shared_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  shared_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_shared_material UNIQUE(group_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_group_shared_materials_group ON public.group_shared_materials(group_id);
CREATE INDEX IF NOT EXISTS idx_group_shared_materials_material ON public.group_shared_materials(material_id);

-- 5. ADD ENHANCED FIELDS TO study_materials (safe)
DO $$ BEGIN
  ALTER TABLE public.study_materials
    ADD COLUMN IF NOT EXISTS podcast_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS podcast_status VARCHAR(50) DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    ADD COLUMN IF NOT EXISTS estimated_study_time INT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. ADD FIELDS TO flashcards (safe)
DO $$ BEGIN
  ALTER TABLE public.flashcards
    ADD COLUMN IF NOT EXISTS difficulty INT DEFAULT 3,
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'concept';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
