-- ═══════════════════════════════════════════════════════════════════════════════
-- MCPHERSON ATTENDANCE — Migration 008: NOT NULL on key FK/operational columns
-- Run this in Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- TIMETABLE (course_id, start_time, end_time, lecturer_id, semester_id)
-- ============================================================================
DO $$ BEGIN UPDATE public.timetable SET course_id = (SELECT id FROM public.courses LIMIT 1) WHERE course_id IS NULL; ALTER TABLE public.timetable ALTER COLUMN course_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.timetable SET start_time = '08:00:00'::time WHERE start_time IS NULL; ALTER TABLE public.timetable ALTER COLUMN start_time SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.timetable SET end_time = '09:00:00'::time WHERE end_time IS NULL; ALTER TABLE public.timetable ALTER COLUMN end_time SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.timetable SET lecturer_id = (SELECT id FROM public.users LIMIT 1) WHERE lecturer_id IS NULL; ALTER TABLE public.timetable ALTER COLUMN lecturer_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.timetable SET semester_id = (SELECT id FROM public.semesters LIMIT 1) WHERE semester_id IS NULL; ALTER TABLE public.timetable ALTER COLUMN semester_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- ATTENDANCE (live_session_id, timetable_id)
-- ============================================================================
DO $$ BEGIN
  UPDATE public.attendance SET live_session_id = (SELECT id FROM public.live_sessions LIMIT 1) WHERE live_session_id IS NULL;
  ALTER TABLE public.attendance ALTER COLUMN live_session_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.attendance SET timetable_id = (SELECT id FROM public.timetable LIMIT 1) WHERE timetable_id IS NULL;
  ALTER TABLE public.attendance ALTER COLUMN timetable_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- COURSES (faculty_id, semester_id, academic_year_id)
-- ============================================================================
DO $$ BEGIN
  UPDATE public.courses SET faculty_id = (SELECT id FROM public.faculties LIMIT 1) WHERE faculty_id IS NULL;
  ALTER TABLE public.courses ALTER COLUMN faculty_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.courses SET semester_id = (SELECT id FROM public.semesters LIMIT 1) WHERE semester_id IS NULL;
  ALTER TABLE public.courses ALTER COLUMN semester_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.courses SET academic_year_id = (SELECT id FROM public.academic_years LIMIT 1) WHERE academic_year_id IS NULL;
  ALTER TABLE public.courses ALTER COLUMN academic_year_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- USERS (faculty_id, semester_id, programme_id, department_id)
-- ============================================================================
DO $$ BEGIN
  UPDATE public.users SET faculty_id = (SELECT id FROM public.faculties LIMIT 1) WHERE faculty_id IS NULL;
  ALTER TABLE public.users ALTER COLUMN faculty_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.users SET semester_id = (SELECT id FROM public.semesters LIMIT 1) WHERE semester_id IS NULL;
  ALTER TABLE public.users ALTER COLUMN semester_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.users SET programme_id = (SELECT id FROM public.programmes LIMIT 1) WHERE programme_id IS NULL;
  ALTER TABLE public.users ALTER COLUMN programme_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.users SET department_id = (SELECT id FROM public.departments LIMIT 1) WHERE department_id IS NULL;
  ALTER TABLE public.users ALTER COLUMN department_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- COMPLAINTS (assigned_to, resolved_at)
-- ============================================================================
DO $$ BEGIN
  UPDATE public.complaints SET assigned_to = (SELECT id FROM public.users LIMIT 1) WHERE assigned_to IS NULL;
  ALTER TABLE public.complaints ALTER COLUMN assigned_to SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.complaints SET resolved_at = now() WHERE resolved_at IS NULL;
  ALTER TABLE public.complaints ALTER COLUMN resolved_at SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- GEMS (user_id)
-- ============================================================================
DO $$ BEGIN
  UPDATE public.gems SET user_id = (SELECT id FROM public.users LIMIT 1) WHERE user_id IS NULL;
  ALTER TABLE public.gems ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- USERS (admission_number, admission_date, expected_graduation_date, staff_id)
-- ============================================================================
DO $$ BEGIN
  UPDATE public.users SET admission_number = 'TEMP-' || id WHERE admission_number IS NULL;
  ALTER TABLE public.users ALTER COLUMN admission_number SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.users SET admission_date = CURRENT_DATE WHERE admission_date IS NULL;
  ALTER TABLE public.users ALTER COLUMN admission_date SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.users SET expected_graduation_date = CURRENT_DATE + INTERVAL '4 years' WHERE expected_graduation_date IS NULL;
  ALTER TABLE public.users ALTER COLUMN expected_graduation_date SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  UPDATE public.users SET staff_id = 'TEMP-' || id WHERE staff_id IS NULL;
  ALTER TABLE public.users ALTER COLUMN staff_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- FLASHCARDS (difficulty, category)
-- ============================================================================
DO $$ BEGIN UPDATE public.flashcards SET difficulty = 3 WHERE difficulty IS NULL; ALTER TABLE public.flashcards ALTER COLUMN difficulty SET NOT NULL; ALTER TABLE public.flashcards ALTER COLUMN difficulty SET DEFAULT 3; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.flashcards SET category = 'concept' WHERE category IS NULL; ALTER TABLE public.flashcards ALTER COLUMN category SET NOT NULL; ALTER TABLE public.flashcards ALTER COLUMN category SET DEFAULT 'concept'; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STUDY_MATERIALS (podcast_status, difficulty_level, estimated_study_time)
-- ============================================================================
DO $$ BEGIN UPDATE public.study_materials SET podcast_status = 'none' WHERE podcast_status IS NULL; ALTER TABLE public.study_materials ALTER COLUMN podcast_status SET NOT NULL; ALTER TABLE public.study_materials ALTER COLUMN podcast_status SET DEFAULT 'none'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_materials SET difficulty_level = 'intermediate' WHERE difficulty_level IS NULL; ALTER TABLE public.study_materials ALTER COLUMN difficulty_level SET NOT NULL; ALTER TABLE public.study_materials ALTER COLUMN difficulty_level SET DEFAULT 'intermediate'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_materials SET estimated_study_time = 0 WHERE estimated_study_time IS NULL; ALTER TABLE public.study_materials ALTER COLUMN estimated_study_time SET NOT NULL; ALTER TABLE public.study_materials ALTER COLUMN estimated_study_time SET DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- DEPARTMENTS (faculty_id, description, hod_id, is_active, created_at, updated_at)
-- ============================================================================
DO $$ BEGIN UPDATE public.departments SET faculty_id = (SELECT id FROM public.faculties LIMIT 1) WHERE faculty_id IS NULL; ALTER TABLE public.departments ALTER COLUMN faculty_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.departments SET description = '' WHERE description IS NULL; ALTER TABLE public.departments ALTER COLUMN description SET NOT NULL; ALTER TABLE public.departments ALTER COLUMN description SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.departments SET hod_id = (SELECT id FROM public.users LIMIT 1) WHERE hod_id IS NULL; ALTER TABLE public.departments ALTER COLUMN hod_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.departments SET is_active = true WHERE is_active IS NULL; ALTER TABLE public.departments ALTER COLUMN is_active SET NOT NULL; ALTER TABLE public.departments ALTER COLUMN is_active SET DEFAULT true; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.departments SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.departments ALTER COLUMN created_at SET NOT NULL; ALTER TABLE public.departments ALTER COLUMN created_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.departments SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.departments ALTER COLUMN updated_at SET NOT NULL; ALTER TABLE public.departments ALTER COLUMN updated_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- POSITIONS (accuracy, source, timestamp)
-- ============================================================================
DO $$ BEGIN UPDATE public.positions SET accuracy = 0 WHERE accuracy IS NULL; ALTER TABLE public.positions ALTER COLUMN accuracy SET NOT NULL; ALTER TABLE public.positions ALTER COLUMN accuracy SET DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.positions SET source = 'gps' WHERE source IS NULL; ALTER TABLE public.positions ALTER COLUMN source SET NOT NULL; ALTER TABLE public.positions ALTER COLUMN source SET DEFAULT 'gps'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.positions SET timestamp = now() WHERE timestamp IS NULL; ALTER TABLE public.positions ALTER COLUMN timestamp SET NOT NULL; ALTER TABLE public.positions ALTER COLUMN timestamp SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PODCASTS (script, audio_url, status, duration_seconds, created_at, updated_at)
-- ============================================================================
DO $$ BEGIN UPDATE public.podcasts SET script = '' WHERE script IS NULL; ALTER TABLE public.podcasts ALTER COLUMN script SET NOT NULL; ALTER TABLE public.podcasts ALTER COLUMN script SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.podcasts SET audio_url = '' WHERE audio_url IS NULL; ALTER TABLE public.podcasts ALTER COLUMN audio_url SET NOT NULL; ALTER TABLE public.podcasts ALTER COLUMN audio_url SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.podcasts SET status = 'pending' WHERE status IS NULL; ALTER TABLE public.podcasts ALTER COLUMN status SET NOT NULL; ALTER TABLE public.podcasts ALTER COLUMN status SET DEFAULT 'pending'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.podcasts SET duration_seconds = 0 WHERE duration_seconds IS NULL; ALTER TABLE public.podcasts ALTER COLUMN duration_seconds SET NOT NULL; ALTER TABLE public.podcasts ALTER COLUMN duration_seconds SET DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.podcasts SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.podcasts ALTER COLUMN created_at SET NOT NULL; ALTER TABLE public.podcasts ALTER COLUMN created_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.podcasts SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.podcasts ALTER COLUMN updated_at SET NOT NULL; ALTER TABLE public.podcasts ALTER COLUMN updated_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STUDY_GROUPS (description, course_id, member_count, created_at, updated_at)
-- ============================================================================
DO $$ BEGIN UPDATE public.study_groups SET description = '' WHERE description IS NULL; ALTER TABLE public.study_groups ALTER COLUMN description SET NOT NULL; ALTER TABLE public.study_groups ALTER COLUMN description SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_groups SET course_id = (SELECT id FROM public.courses LIMIT 1) WHERE course_id IS NULL; ALTER TABLE public.study_groups ALTER COLUMN course_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_groups SET member_count = 1 WHERE member_count IS NULL; ALTER TABLE public.study_groups ALTER COLUMN member_count SET NOT NULL; ALTER TABLE public.study_groups ALTER COLUMN member_count SET DEFAULT 1; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_groups SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.study_groups ALTER COLUMN created_at SET NOT NULL; ALTER TABLE public.study_groups ALTER COLUMN created_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.study_groups SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.study_groups ALTER COLUMN updated_at SET NOT NULL; ALTER TABLE public.study_groups ALTER COLUMN updated_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- FACULTIES (description, dean_id, established_date, is_active, created_at, updated_at)
-- ============================================================================
DO $$ BEGIN UPDATE public.faculties SET description = '' WHERE description IS NULL; ALTER TABLE public.faculties ALTER COLUMN description SET NOT NULL; ALTER TABLE public.faculties ALTER COLUMN description SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.faculties SET dean_id = (SELECT id FROM public.users LIMIT 1) WHERE dean_id IS NULL; ALTER TABLE public.faculties ALTER COLUMN dean_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.faculties SET established_date = CURRENT_DATE WHERE established_date IS NULL; ALTER TABLE public.faculties ALTER COLUMN established_date SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.faculties SET is_active = true WHERE is_active IS NULL; ALTER TABLE public.faculties ALTER COLUMN is_active SET NOT NULL; ALTER TABLE public.faculties ALTER COLUMN is_active SET DEFAULT true; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.faculties SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.faculties ALTER COLUMN created_at SET NOT NULL; ALTER TABLE public.faculties ALTER COLUMN created_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.faculties SET updated_at = now() WHERE updated_at IS NULL; ALTER TABLE public.faculties ALTER COLUMN updated_at SET NOT NULL; ALTER TABLE public.faculties ALTER COLUMN updated_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- SEMESTERS (registration_start_date, registration_end_date, exam_start_date, exam_end_date)
-- ============================================================================
DO $$ BEGIN UPDATE public.semesters SET registration_start_date = start_date WHERE registration_start_date IS NULL; ALTER TABLE public.semesters ALTER COLUMN registration_start_date SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.semesters SET registration_end_date = end_date WHERE registration_end_date IS NULL; ALTER TABLE public.semesters ALTER COLUMN registration_end_date SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.semesters SET exam_start_date = start_date + INTERVAL '3 months' WHERE exam_start_date IS NULL; ALTER TABLE public.semesters ALTER COLUMN exam_start_date SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.semesters SET exam_end_date = end_date WHERE exam_end_date IS NULL; ALTER TABLE public.semesters ALTER COLUMN exam_end_date SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- COURSES (prerequisite_course_id — user wants NOT NULL)
-- ============================================================================
DO $$ BEGIN UPDATE public.courses SET prerequisite_course_id = (SELECT id FROM public.courses LIMIT 1) WHERE prerequisite_course_id IS NULL; ALTER TABLE public.courses ALTER COLUMN prerequisite_course_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- VENUES (building_name, floor_number, building_id)
-- ============================================================================
DO $$ BEGIN UPDATE public.venues SET building_name = '' WHERE building_name IS NULL; ALTER TABLE public.venues ALTER COLUMN building_name SET NOT NULL; ALTER TABLE public.venues ALTER COLUMN building_name SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.venues SET floor_number = 0 WHERE floor_number IS NULL; ALTER TABLE public.venues ALTER COLUMN floor_number SET NOT NULL; ALTER TABLE public.venues ALTER COLUMN floor_number SET DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.venues SET building_id = (SELECT id FROM public.campus_buildings LIMIT 1) WHERE building_id IS NULL; ALTER TABLE public.venues ALTER COLUMN building_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- CAMPUS_BUILDINGS (floors, description, image_url, is_active, created_at)
-- ============================================================================
DO $$ BEGIN UPDATE public.campus_buildings SET floors = 1 WHERE floors IS NULL; ALTER TABLE public.campus_buildings ALTER COLUMN floors SET NOT NULL; ALTER TABLE public.campus_buildings ALTER COLUMN floors SET DEFAULT 1; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.campus_buildings SET description = '' WHERE description IS NULL; ALTER TABLE public.campus_buildings ALTER COLUMN description SET NOT NULL; ALTER TABLE public.campus_buildings ALTER COLUMN description SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.campus_buildings SET image_url = '' WHERE image_url IS NULL; ALTER TABLE public.campus_buildings ALTER COLUMN image_url SET NOT NULL; ALTER TABLE public.campus_buildings ALTER COLUMN image_url SET DEFAULT ''; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.campus_buildings SET is_active = true WHERE is_active IS NULL; ALTER TABLE public.campus_buildings ALTER COLUMN is_active SET NOT NULL; ALTER TABLE public.campus_buildings ALTER COLUMN is_active SET DEFAULT true; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.campus_buildings SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.campus_buildings ALTER COLUMN created_at SET NOT NULL; ALTER TABLE public.campus_buildings ALTER COLUMN created_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- CLASSROOM_ANCHORS (floor, status, last_seen, created_at)
-- ============================================================================
DO $$ BEGIN UPDATE public.classroom_anchors SET floor = 1 WHERE floor IS NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN floor SET NOT NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN floor SET DEFAULT 1; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.classroom_anchors SET status = 'active' WHERE status IS NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN status SET NOT NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN status SET DEFAULT 'active'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.classroom_anchors SET last_seen = now() WHERE last_seen IS NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN last_seen SET NOT NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN last_seen SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN UPDATE public.classroom_anchors SET created_at = now() WHERE created_at IS NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN created_at SET NOT NULL; ALTER TABLE public.classroom_anchors ALTER COLUMN created_at SET DEFAULT now(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
