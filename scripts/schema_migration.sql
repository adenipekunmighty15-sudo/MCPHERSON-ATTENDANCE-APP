-- ============================================================================
-- MCPHERSON ATTENDANCE - MIGRATION: Add missing columns to existing tables
-- Run this BEFORE schema_corrected.sql
-- ============================================================================
-- Adds columns that exist in our schema but not in the existing DB.
-- Uses ADD COLUMN IF NOT EXISTS so it's safe to re-run.
-- ============================================================================

-- ============================================================================
-- COURSES: Add missing columns
-- ============================================================================
-- existing: id(text), code(text), title(text), level(text), units(text),
--   department(text), department_name(text), college(text), lecturer_id(text),
--   custom(bool), created_at(tz), faculty_id(uuid), semester_id(uuid),
--   academic_year_id(uuid), is_elective(bool), status(varchar)
-- missing: description, prerequisite_course_id, max_students, updated_at
-- NOTE: department_id(uuid) conflicts with department(text) — skip FK for now

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS prerequisite_course_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 100;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- TIMETABLE: Add missing columns
-- existing: id(text), course(text), day(text), time(text), room(text),
--   lecturer(text), type(text), user_id(text), created_at(tz)
-- missing: course_id(uuid), start_time(time), end_time(time),
--   lecturer_id(uuid), semester_id(uuid), updated_at
-- NOTE: timetable uses 'course' (text) not 'course_id' (uuid)

ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS lecturer_id UUID;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS semester_id UUID;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- ATTENDANCE: Add missing columns
-- existing: id(text), course_id(text), course_name(text), status(text),
--   method(text), date(text), user_id(text), timestamp(tz), location(text),
--   session_id(text), location_lat(dbl), location_lng(dbl),
--   clock_in_time(tz), clock_out_time(tz), duration_minutes(int)
-- missing: live_session_id, timetable_id, updated_at

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS live_session_id UUID;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS timetable_id UUID;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- LIVE_SESSIONS: Ensure UUID columns exist (existing has text IDs)
-- ============================================================================
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- COMPLAINTS: Add missing columns
-- existing: id(text), user_id(text), area(text), title(text), message(text),
--   status(text), created_at(tz), priority(text)
-- missing: assigned_to, resolved_at, updated_at

ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- ENROLLMENTS: Add missing columns
-- ============================================================================
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- LECTURER_COURSES: Add missing columns
-- ============================================================================
ALTER TABLE public.lecturer_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- VENUES: Add missing columns
-- ============================================================================
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- STUDY_MATERIALS: Add missing columns
-- existing: id(text), course_id(text), title(text), source_text(text),
--   summary(text), key_points(jsonb), flashcards(jsonb), quiz(jsonb),
--   created_by(text), created_at(tz), diagrams(jsonb), chat_history(jsonb),
--   podcast_url(text), improved_note(text), folder_id(text)
-- missing: updated_at, is_public, tags

ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================================================
-- STUDY_FOLDERS: Add missing columns
-- ============================================================================
ALTER TABLE public.study_folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- FLASHCARDS: Add missing columns
-- ============================================================================
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- STUDY_SESSIONS: Add missing columns
-- ============================================================================
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- ============================================================================
-- CHAT_MESSAGES: Add missing columns
-- ============================================================================
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- NOTIFICATIONS: Add missing columns
-- ============================================================================
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- GAMIFICATION_PROFILES: Add missing columns
-- ============================================================================
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS total_study_time_minutes INTEGER DEFAULT 0;
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- GAMIFICATION_BADGES: Fix id type (existing is integer, needs uuid)
-- ============================================================================
-- Skip — can't change type in-place. Will work with existing integer id.

-- ============================================================================
-- WALLET_TRANSACTIONS: Add missing columns
-- ============================================================================
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
