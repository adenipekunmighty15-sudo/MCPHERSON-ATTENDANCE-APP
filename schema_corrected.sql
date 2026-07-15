-- ============================================================================
-- MCPHERSON ATTENDANCE - CORRECTED DATABASE SCHEMA (SAFE RE-RUN)
-- ============================================================================
-- 1. All CREATE TABLE use IF NOT EXISTS
-- 2. All CREATE INDEX use IF NOT EXISTS
-- 3. Foreign keys added via ALTER TABLE with DO blocks that:
--    a. Clean up orphaned data first (SET NULL where possible)
--    b. Skip if constraint already exists
-- 4. All DROP POLICY IF EXISTS before CREATE POLICY
-- 5. Views use CREATE OR REPLACE
-- 6. Triggers use DROP IF EXISTS before CREATE
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.faculties (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    dean_id UUID,
    established_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT faculties_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    faculty_id UUID NOT NULL,
    description TEXT DEFAULT '',
    hod_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT departments_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    -- cleanup orphaned faculty_id references first
    UPDATE public.departments d SET faculty_id = NULL
    WHERE d.faculty_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.faculties f WHERE f.id = d.faculty_id);
    ALTER TABLE public.departments
        ADD CONSTRAINT departments_faculty_id_fkey
        FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON public.departments(faculty_id);

-- Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT academic_years_pkey PRIMARY KEY (id),
    CONSTRAINT academic_years_dates_check CHECK (start_date < end_date)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_is_current ON public.academic_years(is_current);

-- Semesters
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('first', 'second', 'summer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_start_date DATE,
    registration_end_date DATE,
    exam_start_date DATE,
    exam_end_date DATE,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT semesters_pkey PRIMARY KEY (id),
    CONSTRAINT semesters_dates_check CHECK (start_date < end_date),
    CONSTRAINT semesters_unique_name_year UNIQUE (name, academic_year_id)
);

DO $$ BEGIN
    UPDATE public.semesters SET academic_year_id = NULL
    WHERE academic_year_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.academic_years WHERE id = academic_year_id);
    ALTER TABLE public.semesters
        ADD CONSTRAINT semesters_academic_year_id_fkey
        FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_semesters_academic_year_id ON public.semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_is_current ON public.semesters(is_current);

-- Programmes
CREATE TABLE IF NOT EXISTS public.programmes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    department_id UUID NOT NULL,
    faculty_id UUID NOT NULL,
    degree_type VARCHAR(20) NOT NULL DEFAULT 'Bachelor' CHECK (degree_type IN ('Diploma', 'Bachelor', 'Master', 'PhD', 'Certificate')),
    duration_years INTEGER NOT NULL DEFAULT 4 CHECK (duration_years > 0),
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT programmes_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    UPDATE public.programmes SET department_id = NULL
    WHERE department_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.departments WHERE id = department_id);
    ALTER TABLE public.programmes
        ADD CONSTRAINT programmes_department_id_fkey
        FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.programmes SET faculty_id = NULL
    WHERE faculty_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.faculties WHERE id = faculty_id);
    ALTER TABLE public.programmes
        ADD CONSTRAINT programmes_faculty_id_fkey
        FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_programmes_department_id ON public.programmes(department_id);
CREATE INDEX IF NOT EXISTS idx_programmes_faculty_id ON public.programmes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_programmes_is_active ON public.programmes(is_active);

-- Users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL DEFAULT 'User',
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'lecturer', 'admin', 'super_admin')),
    department VARCHAR(100) DEFAULT '',
    provider VARCHAR(20) NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'google', 'github', 'microsoft')),
    face_descriptor TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login TIMESTAMPTZ NOT NULL DEFAULT now(),
    avatar_url TEXT DEFAULT '',
    admission_number VARCHAR(50) UNIQUE,
    admission_date DATE,
    expected_graduation_date DATE,
    cgpa NUMERIC(3,2) DEFAULT 0.00 CHECK (cgpa >= 0.00 AND cgpa <= 5.00),
    academic_standing VARCHAR(20) DEFAULT 'Good' CHECK (academic_standing IN ('Good', 'Probation', 'Suspended', 'Withdrawn')),
    is_active BOOLEAN DEFAULT true,
    staff_id VARCHAR(50) UNIQUE,
    faculty_id UUID,
    semester_id UUID,
    level VARCHAR(10) DEFAULT '100' CHECK (level IN ('100', '200', '300', '400', '500', '600', '700', '800')),
    programme_id UUID,
    department_id UUID,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Skip auth.users FK if it already exists or fails (auth schema is managed by Supabase)
DO $$ BEGIN
    ALTER TABLE public.users
        ADD CONSTRAINT users_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.users SET programme_id = NULL WHERE programme_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.programmes WHERE id = programme_id);
    ALTER TABLE public.users ADD CONSTRAINT users_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.users SET faculty_id = NULL WHERE faculty_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.faculties WHERE id = faculty_id);
    ALTER TABLE public.users ADD CONSTRAINT users_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.users SET semester_id = NULL WHERE semester_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = semester_id);
    ALTER TABLE public.users ADD CONSTRAINT users_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.users SET department_id = NULL WHERE department_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.departments WHERE id = department_id);
    ALTER TABLE public.users ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_faculty_id ON public.users(faculty_id);
CREATE INDEX IF NOT EXISTS idx_users_programme_id ON public.users(programme_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_semester_id ON public.users(semester_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Circular FKs (dean_id → users, hod_id → users)
DO $$ BEGIN
    UPDATE public.faculties SET dean_id = NULL WHERE dean_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = dean_id);
    ALTER TABLE public.faculties ADD CONSTRAINT faculties_dean_id_fkey FOREIGN KEY (dean_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.departments SET hod_id = NULL WHERE hod_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = hod_id);
    ALTER TABLE public.departments ADD CONSTRAINT departments_hod_id_fkey FOREIGN KEY (hod_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Grade System
CREATE TABLE IF NOT EXISTS public.grade_system (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    grade VARCHAR(2) NOT NULL UNIQUE,
    grade_point NUMERIC(3,2) NOT NULL CHECK (grade_point >= 0 AND grade_point <= 5),
    min_score INTEGER NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
    max_score INTEGER NOT NULL CHECK (max_score >= 0 AND max_score <= 100),
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT grade_system_pkey PRIMARY KEY (id),
    CONSTRAINT grade_system_scores_check CHECK (min_score <= max_score)
);

-- University Config
CREATE TABLE IF NOT EXISTS public.university_config (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT university_config_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- COURSE & ENROLLMENT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    level VARCHAR(10) NOT NULL DEFAULT '100' CHECK (level IN ('100', '200', '300', '400', '500', '600', '700', '800')),
    units INTEGER NOT NULL DEFAULT 3 CHECK (units > 0 AND units <= 6),
    department_id UUID NOT NULL,
    faculty_id UUID NOT NULL,
    lecturer_id UUID,
    semester_id UUID,
    academic_year_id UUID,
    is_elective BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'coming_soon', 'cancelled')),
    description TEXT DEFAULT '',
    prerequisite_course_id UUID,
    max_students INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT courses_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.courses WHERE department_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.departments WHERE id = department_id);
    ALTER TABLE public.courses ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.courses WHERE faculty_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.faculties WHERE id = faculty_id);
    ALTER TABLE public.courses ADD CONSTRAINT courses_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.courses SET lecturer_id = NULL WHERE lecturer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = lecturer_id);
    ALTER TABLE public.courses ADD CONSTRAINT courses_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.courses SET semester_id = NULL WHERE semester_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = semester_id);
    ALTER TABLE public.courses ADD CONSTRAINT courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.courses SET academic_year_id = NULL WHERE academic_year_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.academic_years WHERE id = academic_year_id);
    ALTER TABLE public.courses ADD CONSTRAINT courses_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.courses SET prerequisite_course_id = NULL WHERE prerequisite_course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id = prerequisite_course_id);
    ALTER TABLE public.courses ADD CONSTRAINT courses_prerequisite_fkey FOREIGN KEY (prerequisite_course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; WHEN undefined_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_courses_faculty_id ON public.courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id ON public.courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_semester_id ON public.courses(semester_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

-- Timetable
CREATE TABLE IF NOT EXISTS public.timetable (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    day VARCHAR(10) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    lecturer_id UUID,
    type VARCHAR(20) DEFAULT 'lecture' CHECK (type IN ('lecture', 'tutorial', 'lab', 'seminar', 'exam')),
    semester_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT timetable_pkey PRIMARY KEY (id),
    CONSTRAINT timetable_time_check CHECK (start_time < end_time)
);

DO $$ BEGIN
    UPDATE public.timetable SET course_id = NULL WHERE course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id = course_id);
    ALTER TABLE public.timetable ADD CONSTRAINT timetable_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.timetable SET lecturer_id = NULL WHERE lecturer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = lecturer_id);
    ALTER TABLE public.timetable ADD CONSTRAINT timetable_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.timetable SET semester_id = NULL WHERE semester_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = semester_id);
    ALTER TABLE public.timetable ADD CONSTRAINT timetable_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_timetable_course_id ON public.timetable(course_id);
CREATE INDEX IF NOT EXISTS idx_timetable_semester_id ON public.timetable(semester_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON public.timetable(day);
CREATE INDEX IF NOT EXISTS idx_timetable_lecturer_id ON public.timetable(lecturer_id);

-- Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    course_name VARCHAR(200) NOT NULL DEFAULT '',
    semester_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    enrolment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'incomplete', 'pending')),
    grade VARCHAR(2),
    grade_point NUMERIC(3,2),
    credit_units INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT enrollments_pkey PRIMARY KEY (id),
    CONSTRAINT enrollments_unique_user_course_semester UNIQUE (user_id, course_id, semester_id)
);

DO $$ BEGIN
    DELETE FROM public.enrollments WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.enrollments WHERE course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id::text = course_id);
    ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.enrollments SET semester_id = NULL WHERE semester_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = semester_id);
    ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.enrollments SET academic_year_id = NULL WHERE academic_year_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.academic_years WHERE id = academic_year_id);
    ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_semester_id ON public.enrollments(semester_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- Lecturer Courses
CREATE TABLE IF NOT EXISTS public.lecturer_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL,
    course_id UUID NOT NULL,
    course_name VARCHAR(200) DEFAULT '',
    semester_id UUID NOT NULL,
    role VARCHAR(20) DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant', 'coordinator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lecturer_courses_pkey PRIMARY KEY (id),
    CONSTRAINT lecturer_courses_unique UNIQUE (lecturer_id, course_id, semester_id)
);

DO $$ BEGIN
    DELETE FROM public.lecturer_courses WHERE lecturer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = lecturer_id);
    ALTER TABLE public.lecturer_courses ADD CONSTRAINT lecturer_courses_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.lecturer_courses WHERE course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id::text = course_id);
    ALTER TABLE public.lecturer_courses ADD CONSTRAINT lecturer_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.lecturer_courses SET semester_id = NULL WHERE semester_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = semester_id);
    ALTER TABLE public.lecturer_courses ADD CONSTRAINT lecturer_courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_lecturer_courses_lecturer_id ON public.lecturer_courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_courses_course_id ON public.lecturer_courses(course_id);

-- ============================================================================
-- ATTENDANCE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.venues (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    room_code VARCHAR(20) NOT NULL UNIQUE,
    building_name VARCHAR(100),
    floor_number INTEGER,
    capacity INTEGER DEFAULT 50 CHECK (capacity > 0),
    venue_type VARCHAR(30) DEFAULT 'Lecture Hall' CHECK (venue_type IN ('Lecture Hall', 'Lab', 'Tutorial Room', 'Seminar Room', 'Auditorium', 'Other')),
    facilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    latitude DOUBLE PRECISION DEFAULT 0,
    longitude DOUBLE PRECISION DEFAULT 0,
    radius_meters INTEGER DEFAULT 50 CHECK (radius_meters > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT venues_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_venues_room_code ON public.venues(room_code);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON public.venues(is_active);

CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL,
    course_id UUID NOT NULL,
    course_name VARCHAR(200) NOT NULL DEFAULT '',
    lecturer_id UUID NOT NULL,
    lecturer_name VARCHAR(100) NOT NULL DEFAULT 'Lecturer',
    venue_id UUID,
    room VARCHAR(100),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT live_sessions_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    UPDATE public.live_sessions SET timetable_id = NULL WHERE timetable_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.timetable WHERE id = timetable_id);
    ALTER TABLE public.live_sessions ADD CONSTRAINT live_sessions_timetable_id_fkey FOREIGN KEY (timetable_id) REFERENCES public.timetable(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.live_sessions SET course_id = NULL WHERE course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id = course_id);
    ALTER TABLE public.live_sessions ADD CONSTRAINT live_sessions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.live_sessions SET lecturer_id = NULL WHERE lecturer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = lecturer_id);
    ALTER TABLE public.live_sessions ADD CONSTRAINT live_sessions_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.live_sessions SET venue_id = NULL WHERE venue_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id);
    ALTER TABLE public.live_sessions ADD CONSTRAINT live_sessions_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_live_sessions_timetable_id ON public.live_sessions(timetable_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON public.live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON public.live_sessions(status);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    course_name VARCHAR(200) NOT NULL DEFAULT '',
    live_session_id UUID,
    timetable_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'excused', 'left_early')),
    method VARCHAR(20) DEFAULT 'manual' CHECK (method IN ('manual', 'face', 'geofence', 'qr', 'bluetooth', 'wifi', 'nfc')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    location VARCHAR(200) DEFAULT '',
    location_lat DOUBLE PRECISION DEFAULT 0,
    location_lng DOUBLE PRECISION DEFAULT 0,
    clock_in_time TIMESTAMPTZ,
    clock_out_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    session_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT attendance_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_unique_user_course_date UNIQUE (user_id, course_id, date)
);

DO $$ BEGIN
    DELETE FROM public.attendance WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id);
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.attendance WHERE course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id = course_id);
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.attendance SET live_session_id = NULL WHERE live_session_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.live_sessions WHERE id = live_session_id);
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_live_session_id_fkey FOREIGN KEY (live_session_id) REFERENCES public.live_sessions(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.attendance SET timetable_id = NULL WHERE timetable_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.timetable WHERE id = timetable_id);
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_timetable_id_fkey FOREIGN KEY (timetable_id) REFERENCES public.timetable(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_live_session_id ON public.attendance(live_session_id);

-- ============================================================================
-- STUDY & AI TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.study_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50) DEFAULT 'folder',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT study_folders_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.study_folders WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = created_by);
    ALTER TABLE public.study_folders ADD CONSTRAINT study_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_study_folders_created_by ON public.study_folders(created_by);

CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    course_id UUID,
    title VARCHAR(200) NOT NULL,
    source_text TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    key_points JSONB DEFAULT '[]',
    flashcards JSONB DEFAULT '[]',
    quiz JSONB DEFAULT '[]',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    diagrams JSONB DEFAULT '[]',
    chat_history JSONB DEFAULT '[]',
    podcast_url TEXT DEFAULT '',
    improved_note TEXT DEFAULT '',
    folder_id UUID,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT study_materials_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.study_materials WHERE course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id = course_id);
    ALTER TABLE public.study_materials ADD CONSTRAINT study_materials_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.study_materials WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = created_by);
    ALTER TABLE public.study_materials ADD CONSTRAINT study_materials_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.study_materials WHERE folder_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.study_folders WHERE id = folder_id);
    ALTER TABLE public.study_materials ADD CONSTRAINT study_materials_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.study_folders(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_study_materials_course_id ON public.study_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_created_by ON public.study_materials(created_by);
CREATE INDEX IF NOT EXISTS idx_study_materials_folder_id ON public.study_materials(folder_id);

-- Flashcards
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT flashcards_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.flashcards WHERE material_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.study_materials WHERE id = material_id);
    ALTER TABLE public.flashcards ADD CONSTRAINT flashcards_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_flashcards_material_id ON public.flashcards(material_id);

-- Flashcard Reviews
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL,
    flashcard_id UUID NOT NULL,
    user_id UUID NOT NULL,
    ease_factor NUMERIC(3,2) DEFAULT 2.5 CHECK (ease_factor >= 1.3),
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    next_review DATE DEFAULT CURRENT_DATE,
    last_reviewed TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT flashcard_reviews_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.flashcard_reviews WHERE material_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.study_materials WHERE id = material_id);
    ALTER TABLE public.flashcard_reviews ADD CONSTRAINT flashcard_reviews_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.flashcard_reviews WHERE flashcard_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.flashcards WHERE id::text = flashcard_id);
    ALTER TABLE public.flashcard_reviews ADD CONSTRAINT flashcard_reviews_flashcard_id_fkey FOREIGN KEY (flashcard_id) REFERENCES public.flashcards(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.flashcard_reviews WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id);
    ALTER TABLE public.flashcard_reviews ADD CONSTRAINT flashcard_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON public.flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON public.flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next_review ON public.flashcard_reviews(next_review);

-- Study Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL,
    user_id UUID NOT NULL,
    session_type VARCHAR(20) DEFAULT 'review' CHECK (session_type IN ('review', 'quiz', 'flashcards', 'stream', 'reading')),
    score NUMERIC(5,2) DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    stats JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT study_sessions_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.study_sessions WHERE material_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.study_materials WHERE id = material_id);
    ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DELETE FROM public.study_sessions WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id);
    ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_material_id ON public.study_sessions(material_id);

-- ============================================================================
-- CHAT & AI TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
    model VARCHAR(50) DEFAULT 'council' CHECK (model IN ('council', 'fast', 'turbo', 'gemini', 'claude')),
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chat_conversations_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.chat_conversations WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id);
    ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.chat_messages WHERE conversation_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id);
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

CREATE TABLE IF NOT EXISTS public.general_chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    file_url TEXT DEFAULT '',
    file_type TEXT DEFAULT '',
    file_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT general_chat_messages_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.general_chat_messages WHERE sender_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = sender_id);
    ALTER TABLE public.general_chat_messages ADD CONSTRAINT general_chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_general_chat_messages_sender_id ON public.general_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_general_chat_messages_created_at ON public.general_chat_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_config (
    provider VARCHAR(50) NOT NULL,
    api_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ai_config_pkey PRIMARY KEY (provider)
);

CREATE TABLE IF NOT EXISTS public.ai_embeddings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    content TEXT NOT NULL DEFAULT '',
    title VARCHAR(200) NOT NULL DEFAULT '',
    type VARCHAR(50) NOT NULL DEFAULT 'general',
    source_id TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ai_embeddings_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    UPDATE public.ai_embeddings SET user_id = NULL WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.ai_embeddings ADD CONSTRAINT ai_embeddings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_user_id ON public.ai_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_type ON public.ai_embeddings(type);

CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    risk_score NUMERIC(5,4) DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
    academic_risk NUMERIC(5,4) DEFAULT 0 CHECK (academic_risk >= 0 AND academic_risk <= 1),
    feature_vector JSONB DEFAULT '{}',
    factors JSONB DEFAULT '[]',
    user_id UUID NOT NULL,
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ai_predictions_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.ai_predictions WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.ai_predictions ADD CONSTRAINT ai_predictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_id ON public.ai_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_predicted_at ON public.ai_predictions(predicted_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    insight TEXT NOT NULL DEFAULT '',
    category VARCHAR(50) DEFAULT 'general',
    severity NUMERIC(5,4) DEFAULT 0 CHECK (severity >= 0 AND severity <= 1),
    read BOOLEAN DEFAULT false,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ai_insights_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.ai_insights WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.ai_insights ADD CONSTRAINT ai_insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_read ON public.ai_insights(read);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON public.ai_insights(category);

-- ============================================================================
-- NOTIFICATIONS & COMPLAINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'attendance', 'grade', 'announcement')),
    title VARCHAR(200) NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    data JSONB DEFAULT '{}',
    link TEXT DEFAULT '',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.notifications WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id);
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    area VARCHAR(50) NOT NULL DEFAULT '',
    title VARCHAR(200) NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT complaints_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.complaints WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id::text = user_id);
    ALTER TABLE public.complaints ADD CONSTRAINT complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    UPDATE public.complaints SET assigned_to = NULL WHERE assigned_to IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = assigned_to);
    ALTER TABLE public.complaints ADD CONSTRAINT complaints_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gamification_profiles (
    user_id UUID NOT NULL,
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_study_date DATE,
    total_study_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT gamification_profiles_pkey PRIMARY KEY (user_id)
);

DO $$ BEGIN
    DELETE FROM public.gamification_profiles WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.gamification_profiles ADD CONSTRAINT gamification_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.gamification_badges (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_id VARCHAR(50) NOT NULL DEFAULT '',
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT gamification_badges_pkey PRIMARY KEY (id),
    CONSTRAINT gamification_badges_unique UNIQUE (user_id, badge_id)
);

DO $$ BEGIN
    DELETE FROM public.gamification_badges WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.gamification_badges ADD CONSTRAINT gamification_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_gamification_badges_user_id ON public.gamification_badges(user_id);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    description TEXT DEFAULT '',
    reference_id UUID,
    reference_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.wallet_transactions WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- ============================================================================
-- GEMS & MEMORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gems (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    system_prompt TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'turbo',
    temperature NUMERIC(3,2) DEFAULT 0.3 CHECK (temperature >= 0 AND temperature <= 2),
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT gems_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    UPDATE public.gems SET user_id = NULL WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.gems ADD CONSTRAINT gems_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_gems_user_id ON public.gems(user_id);
CREATE INDEX IF NOT EXISTS idx_gems_is_public ON public.gems(is_public);

CREATE TABLE IF NOT EXISTS public.user_memory (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_memory_pkey PRIMARY KEY (id),
    CONSTRAINT user_memory_unique_key UNIQUE (user_id, key)
);

DO $$ BEGIN
    DELETE FROM public.user_memory WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.user_memory ADD CONSTRAINT user_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON public.user_memory(user_id);

-- ============================================================================
-- RESEARCH & CODE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.research_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    query TEXT NOT NULL,
    report TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    depth VARCHAR(20) DEFAULT 'standard' CHECK (depth IN ('quick', 'standard', 'deep')),
    elapsed_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT research_reports_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    DELETE FROM public.research_reports WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.research_reports ADD CONSTRAINT research_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_research_reports_user_id ON public.research_reports(user_id);

CREATE TABLE IF NOT EXISTS public.code_executions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    output TEXT,
    error TEXT,
    elapsed_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT code_executions_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
    UPDATE public.code_executions SET user_id = NULL WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id);
    ALTER TABLE public.code_executions ADD CONSTRAINT code_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_code_executions_user_id ON public.code_executions(user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT t.table_name FROM information_schema.columns c
             JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
             WHERE c.column_name = 'updated_at'
             AND c.table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
CREATE POLICY users_select ON public.users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY users_update ON public.users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS courses_select ON public.courses;
DROP POLICY IF EXISTS courses_insert ON public.courses;
DROP POLICY IF EXISTS courses_update ON public.courses;
CREATE POLICY courses_select ON public.courses FOR SELECT USING (true);
CREATE POLICY courses_insert ON public.courses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('admin', 'lecturer'))
);
CREATE POLICY courses_update ON public.courses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('admin', 'lecturer'))
);

DROP POLICY IF EXISTS enrollments_self ON public.enrollments;
CREATE POLICY enrollments_self ON public.enrollments FOR ALL USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS attendance_self ON public.attendance;
CREATE POLICY attendance_self ON public.attendance FOR ALL USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS chat_conversations_self ON public.chat_conversations;
CREATE POLICY chat_conversations_self ON public.chat_conversations FOR ALL USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS chat_messages_self ON public.chat_messages;
CREATE POLICY chat_messages_self ON public.chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND user_id::text = auth.uid()::text)
);

DROP POLICY IF EXISTS notifications_self ON public.notifications;
CREATE POLICY notifications_self ON public.notifications FOR ALL USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS study_materials_self ON public.study_materials;
CREATE POLICY study_materials_self ON public.study_materials FOR ALL USING (created_by::text = auth.uid()::text OR is_public = true);

DROP POLICY IF EXISTS gamification_self ON public.gamification_profiles;
CREATE POLICY gamification_self ON public.gamification_profiles FOR ALL USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS gamification_badges_self ON public.gamification_badges;
CREATE POLICY gamification_badges_self ON public.gamification_badges FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW public.current_semester AS
SELECT * FROM public.semesters WHERE is_current = true AND is_active = true LIMIT 1;

CREATE OR REPLACE VIEW public.user_attendance_summary AS
SELECT
    a.user_id,
    COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
    COUNT(*) FILTER (WHERE a.status = 'late') as late_count,
    COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE a.status = 'excused') as excused_count,
    COUNT(*) as total_sessions,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE a.status IN ('present', 'late')) / NULLIF(COUNT(*), 0), 2
    ) as attendance_rate
FROM public.attendance a
GROUP BY a.user_id;

CREATE OR REPLACE VIEW public.course_enrollment_counts AS
SELECT
    c.id as course_id,
    c.code,
    c.title,
    COUNT(e.id) as enrolled_students,
    COALESCE(c.max_students, 100) as max_students,
    ROUND(100.0 * COUNT(e.id) / NULLIF(COALESCE(c.max_students, 100), 0), 2) as fill_rate
FROM public.courses c
LEFT JOIN public.enrollments e ON c.id::text = e.course_id::text AND e.status = 'active'
GROUP BY c.id, c.code, c.title, c.max_students;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- DONE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Schema deployment complete!';
    RAISE NOTICE 'Tables: %', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Indexes: %', (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE 'FKs: %', (SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public');
END $$;