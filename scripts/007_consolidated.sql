-- ═══════════════════════════════════════════════════════════════════════════════
-- MCPHERSON ATTENDANCE — Migration 007: Complete schema alignment (consolidated)
-- Merges 007 + 007b + 007c + 007d + additional NOT NULL fixes.
-- Run this once in your Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- PART 1: NEW TABLE — ai_config
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_config (
  provider text NOT NULL,
  api_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_config_pkey PRIMARY KEY (provider)
);

-- ============================================================================
-- PART 2: ADD MISSING COLUMNS TO users WITH CONSTRAINTS
-- ============================================================================

-- admission_number (nullable, UNIQUE)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admission_number character varying;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_admission_number_key UNIQUE (admission_number);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- admission_date (nullable)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admission_date date;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- cgpa (NOT NULL, DEFAULT 0, CHECK 0-5)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cgpa numeric DEFAULT 0.00;
  UPDATE public.users SET cgpa = 0.00 WHERE cgpa IS NULL;
  ALTER TABLE public.users ALTER COLUMN cgpa SET NOT NULL;
  ALTER TABLE public.users ALTER COLUMN cgpa SET DEFAULT 0.00;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_cgpa_check CHECK (cgpa >= 0.00 AND cgpa <= 5.00);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- academic_standing (NOT NULL, DEFAULT 'Good', CHECK)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS academic_standing character varying DEFAULT 'Good';
  UPDATE public.users SET academic_standing = 'Good' WHERE academic_standing IS NULL;
  ALTER TABLE public.users ALTER COLUMN academic_standing SET NOT NULL;
  ALTER TABLE public.users ALTER COLUMN academic_standing SET DEFAULT 'Good';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_academic_standing_check
    CHECK (academic_standing IN ('Good', 'Probation', 'Suspended', 'Withdrawn'));
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- is_active (NOT NULL, DEFAULT true)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
  UPDATE public.users SET is_active = true WHERE is_active IS NULL;
  ALTER TABLE public.users ALTER COLUMN is_active SET NOT NULL;
  ALTER TABLE public.users ALTER COLUMN is_active SET DEFAULT true;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- staff_id (nullable, UNIQUE)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS staff_id character varying;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_staff_id_key UNIQUE (staff_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- faculty_id (nullable)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS faculty_id uuid;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- semester_id (nullable)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS semester_id uuid;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- level (NOT NULL, DEFAULT '100', CHECK)
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level character varying DEFAULT '100';
  UPDATE public.users SET level = '100' WHERE level IS NULL;
  ALTER TABLE public.users ALTER COLUMN level SET NOT NULL;
  ALTER TABLE public.users ALTER COLUMN level SET DEFAULT '100';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_level_check
    CHECK (level IN ('100', '200', '300', '400', '500', '600', '700', '800'));
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 3: ADD MISSING COLUMNS TO OTHER TABLES
-- ============================================================================

-- venues: building_id, building_name, floor_number, capacity, venue_type, facilities, is_active
DO $$ BEGIN
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS building_id uuid;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS building_name character varying;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS floor_number integer;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 50;
  UPDATE public.venues SET capacity = 50 WHERE capacity IS NULL;
  ALTER TABLE public.venues ALTER COLUMN capacity SET NOT NULL;
  ALTER TABLE public.venues ALTER COLUMN capacity SET DEFAULT 50;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS venue_type character varying DEFAULT 'Lecture Hall';
  UPDATE public.venues SET venue_type = 'Lecture Hall' WHERE venue_type IS NULL;
  ALTER TABLE public.venues ALTER COLUMN venue_type SET NOT NULL;
  ALTER TABLE public.venues ALTER COLUMN venue_type SET DEFAULT 'Lecture Hall';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS facilities text[] DEFAULT ARRAY[]::text[];
  UPDATE public.venues SET facilities = ARRAY[]::text[] WHERE facilities IS NULL;
  ALTER TABLE public.venues ALTER COLUMN facilities SET NOT NULL;
  ALTER TABLE public.venues ALTER COLUMN facilities SET DEFAULT ARRAY[]::text[];
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
  UPDATE public.venues SET is_active = true WHERE is_active IS NULL;
  ALTER TABLE public.venues ALTER COLUMN is_active SET NOT NULL;
  ALTER TABLE public.venues ALTER COLUMN is_active SET DEFAULT true;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- study_materials: podcast_status, difficulty_level, estimated_study_time
DO $$ BEGIN
  ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS podcast_status character varying DEFAULT 'none';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS difficulty_level character varying DEFAULT 'intermediate';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS estimated_study_time integer;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- flashcards: difficulty, category
DO $$ BEGIN
  ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS difficulty integer DEFAULT 3;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS category character varying DEFAULT 'concept';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- enrollments: credit_units (NOT NULL)
DO $$ BEGIN
  ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS credit_units integer DEFAULT 0;
  UPDATE public.enrollments SET credit_units = 0 WHERE credit_units IS NULL;
  ALTER TABLE public.enrollments ALTER COLUMN credit_units SET NOT NULL;
  ALTER TABLE public.enrollments ALTER COLUMN credit_units SET DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- flashcard_reviews: last_reviewed, created_at (NOT NULL)
DO $$ BEGIN
  ALTER TABLE public.flashcard_reviews ADD COLUMN IF NOT EXISTS last_reviewed timestamp with time zone DEFAULT now();
  UPDATE public.flashcard_reviews SET last_reviewed = now() WHERE last_reviewed IS NULL;
  ALTER TABLE public.flashcard_reviews ALTER COLUMN last_reviewed SET NOT NULL;
  ALTER TABLE public.flashcard_reviews ALTER COLUMN last_reviewed SET DEFAULT now();
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.flashcard_reviews ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
  UPDATE public.flashcard_reviews SET created_at = now() WHERE created_at IS NULL;
  ALTER TABLE public.flashcard_reviews ALTER COLUMN created_at SET NOT NULL;
  ALTER TABLE public.flashcard_reviews ALTER COLUMN created_at SET DEFAULT now();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- attendance: clock_in_time, clock_out_time, duration_minutes (NOT NULL, no default)
DO $$ BEGIN
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS clock_in_time timestamp with time zone;
  UPDATE public.attendance SET clock_in_time = timestamp WHERE clock_in_time IS NULL;
  ALTER TABLE public.attendance ALTER COLUMN clock_in_time SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS clock_out_time timestamp with time zone;
  UPDATE public.attendance SET clock_out_time = timestamp WHERE clock_out_time IS NULL;
  ALTER TABLE public.attendance ALTER COLUMN clock_out_time SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS duration_minutes integer;
  UPDATE public.attendance SET duration_minutes = 0 WHERE duration_minutes IS NULL;
  ALTER TABLE public.attendance ALTER COLUMN duration_minutes SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- gamification_profiles: last_study_date (NOT NULL, no default)
DO $$ BEGIN
  ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS last_study_date timestamp without time zone;
  UPDATE public.gamification_profiles SET last_study_date = now() WHERE last_study_date IS NULL;
  ALTER TABLE public.gamification_profiles ALTER COLUMN last_study_date SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 4: FIX NOT NULL ON COLUMNS ADDED BY M06 THAT MISSED IT
-- ============================================================================

-- courses
DO $$ BEGIN UPDATE public.courses SET description = '' WHERE description IS NULL; ALTER TABLE public.courses ALTER COLUMN description SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.courses SET max_students = 100 WHERE max_students IS NULL; ALTER TABLE public.courses ALTER COLUMN max_students SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.courses SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.courses ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- timetable
DO $$ BEGIN UPDATE public.timetable SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.timetable ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- attendance
DO $$ BEGIN UPDATE public.attendance SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.attendance ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- live_sessions
DO $$ BEGIN UPDATE public.live_sessions SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.live_sessions ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- complaints
DO $$ BEGIN UPDATE public.complaints SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.complaints ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- enrollments
DO $$ BEGIN UPDATE public.enrollments SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.enrollments ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- venues
DO $$ BEGIN UPDATE public.venues SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.venues ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- study_materials
DO $$ BEGIN UPDATE public.study_materials SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.study_materials ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_materials SET is_public = false WHERE is_public IS NULL; ALTER TABLE public.study_materials ALTER COLUMN is_public SET NOT NULL; ALTER TABLE public.study_materials ALTER COLUMN is_public SET DEFAULT false; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_materials SET tags = ARRAY[]::text[] WHERE tags IS NULL; ALTER TABLE public.study_materials ALTER COLUMN tags SET NOT NULL; ALTER TABLE public.study_materials ALTER COLUMN tags SET DEFAULT ARRAY[]::text[]; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- study_folders
DO $$ BEGIN UPDATE public.study_folders SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.study_folders ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- flashcards
DO $$ BEGIN UPDATE public.flashcards SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.flashcards ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- chat_messages
DO $$ BEGIN UPDATE public.chat_messages SET metadata = '{}'::jsonb WHERE metadata IS NULL; ALTER TABLE public.chat_messages ALTER COLUMN metadata SET NOT NULL; ALTER TABLE public.chat_messages ALTER COLUMN metadata SET DEFAULT '{}'::jsonb; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- notifications
DO $$ BEGIN UPDATE public.notifications SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.notifications ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- gamification_profiles
DO $$ BEGIN UPDATE public.gamification_profiles SET level = 1 WHERE level IS NULL; ALTER TABLE public.gamification_profiles ALTER COLUMN level SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.gamification_profiles SET total_study_time_minutes = 0 WHERE total_study_time_minutes IS NULL; ALTER TABLE public.gamification_profiles ALTER COLUMN total_study_time_minutes SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.gamification_profiles SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.gamification_profiles ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.gamification_profiles SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.gamification_profiles ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 5: MAKE EXISTING COLUMNS NOT NULL (from 006 schema_migration)
-- ============================================================================

-- study_sessions.duration_minutes
DO $$ BEGIN
  UPDATE public.study_sessions SET duration_minutes = 0 WHERE duration_minutes IS NULL;
  ALTER TABLE public.study_sessions ALTER COLUMN duration_minutes SET NOT NULL;
  ALTER TABLE public.study_sessions ALTER COLUMN duration_minutes SET DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- wallet_transactions.reference_id, reference_type
DO $$ BEGIN
  UPDATE public.wallet_transactions SET reference_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE reference_id IS NULL;
  ALTER TABLE public.wallet_transactions ALTER COLUMN reference_id SET NOT NULL;
  ALTER TABLE public.wallet_transactions ALTER COLUMN reference_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.wallet_transactions SET reference_type = 'unknown' WHERE reference_type IS NULL;
  ALTER TABLE public.wallet_transactions ALTER COLUMN reference_type SET NOT NULL;
  ALTER TABLE public.wallet_transactions ALTER COLUMN reference_type SET DEFAULT 'unknown';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 6: NOT NULL ON M001 CREATED TABLES (programmes, enrollments, lecturer_courses)
-- ============================================================================

-- programmes
DO $$ BEGIN UPDATE public.programmes SET description = '' WHERE description IS NULL; ALTER TABLE public.programmes ALTER COLUMN description SET NOT NULL; ALTER TABLE public.programmes ALTER COLUMN description SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.programmes SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.programmes ALTER COLUMN updated_at SET NOT NULL; ALTER TABLE public.programmes ALTER COLUMN updated_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- enrollments
DO $$ BEGIN UPDATE public.enrollments SET semester_id = (SELECT id FROM public.semesters LIMIT 1) WHERE semester_id IS NULL; ALTER TABLE public.enrollments ALTER COLUMN semester_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.enrollments SET academic_year_id = (SELECT id FROM public.academic_years LIMIT 1) WHERE academic_year_id IS NULL; ALTER TABLE public.enrollments ALTER COLUMN academic_year_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.enrollments SET grade = '' WHERE grade IS NULL; ALTER TABLE public.enrollments ALTER COLUMN grade SET NOT NULL; ALTER TABLE public.enrollments ALTER COLUMN grade SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.enrollments SET grade_point = 0.00 WHERE grade_point IS NULL; ALTER TABLE public.enrollments ALTER COLUMN grade_point SET NOT NULL; ALTER TABLE public.enrollments ALTER COLUMN grade_point SET DEFAULT 0.00; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- lecturer_courses
DO $$ BEGIN UPDATE public.lecturer_courses SET role = 'instructor' WHERE role IS NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN role SET NOT NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN role SET DEFAULT 'instructor'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.lecturer_courses SET is_active = true WHERE is_active IS NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN is_active SET NOT NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN is_active SET DEFAULT true; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.lecturer_courses SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN created_at SET NOT NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN created_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.lecturer_courses SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN updated_at SET NOT NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN updated_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.lecturer_courses SET semester_id = (SELECT id FROM public.semesters LIMIT 1) WHERE semester_id IS NULL; ALTER TABLE public.lecturer_courses ALTER COLUMN semester_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 7: ADD FOREIGN KEYS
-- ============================================================================

-- users
DO $$ BEGIN ALTER TABLE public.users ADD CONSTRAINT users_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.users ADD CONSTRAINT users_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- venues
DO $$ BEGIN ALTER TABLE public.venues ADD CONSTRAINT venues_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.campus_buildings(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- timetable
DO $$ BEGIN ALTER TABLE public.timetable ADD CONSTRAINT timetable_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.timetable ADD CONSTRAINT timetable_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- complaints
DO $$ BEGIN ALTER TABLE public.complaints ADD CONSTRAINT complaints_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 8: ADD MISSING INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_admission_number ON public.users(admission_number);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON public.users(staff_id);
CREATE INDEX IF NOT EXISTS idx_users_faculty_id ON public.users(faculty_id);
CREATE INDEX IF NOT EXISTS idx_users_semester_id ON public.users(semester_id);
CREATE INDEX IF NOT EXISTS idx_users_programme_id ON public.users(programme_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_level ON public.users(level);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_credit_units ON public.enrollments(credit_units);
CREATE INDEX IF NOT EXISTS idx_study_materials_podcast_status ON public.study_materials(podcast_status);
CREATE INDEX IF NOT EXISTS idx_study_materials_difficulty ON public.study_materials(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_flashcards_difficulty ON public.flashcards(difficulty);
CREATE INDEX IF NOT EXISTS idx_flashcards_category ON public.flashcards(category);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_last_reviewed ON public.flashcard_reviews(last_reviewed);
CREATE INDEX IF NOT EXISTS idx_attendance_clock_in ON public.attendance(clock_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_duration ON public.attendance(duration_minutes);
CREATE INDEX IF NOT EXISTS idx_venues_venue_type ON public.venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON public.venues(is_active);
CREATE INDEX IF NOT EXISTS idx_venues_capacity ON public.venues(capacity);
