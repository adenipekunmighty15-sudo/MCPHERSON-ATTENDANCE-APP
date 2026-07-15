import { query } from '../../lib/db.js'

const SQL = `
-- ============================================================
-- MIGRATION 001: University Structure (handles existing state)
-- ============================================================

-- 1. FACULTIES
CREATE TABLE IF NOT EXISTS public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  dean_id UUID DEFAULT NULL,
  established_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS (drop old format first, then create new)
DROP TABLE IF EXISTS public.departments CASCADE;
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  hod_id UUID DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROGRAMMES
CREATE TABLE IF NOT EXISTS public.programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  degree_type VARCHAR(50) NOT NULL DEFAULT 'Bachelor',
  duration_years INTEGER NOT NULL DEFAULT 4,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SEMESTERS
CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('first', 'second', 'summer')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_start_date DATE,
  registration_end_date DATE,
  exam_start_date DATE,
  exam_end_date DATE,
  is_current BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(academic_year_id, type)
);

-- 6. GRADE SYSTEM
CREATE TABLE IF NOT EXISTS public.grade_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade VARCHAR(5) NOT NULL UNIQUE,
  grade_point DECIMAL(3,2) NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  description VARCHAR(255) DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. UNIVERSITY CONFIG
CREATE TABLE IF NOT EXISTS public.university_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ENHANCE USERS TABLE (safe ADD COLUMN)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS programme_id UUID REFERENCES public.programmes(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expected_graduation_date DATE;

-- 9. ENROLLMENTS TABLE (course_id is text to match courses.id type)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_name TEXT DEFAULT '',
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  enrolment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'incomplete')),
  grade VARCHAR(5) DEFAULT '',
  grade_point DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, semester_id)
);

-- 10. LECTURER COURSES (course_id is text to match courses.id type)
CREATE TABLE IF NOT EXISTS public.lecturer_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_name TEXT DEFAULT '',
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  role VARCHAR(50) DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant', 'coordinator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lecturer_id, course_id, semester_id)
);

-- 11. Seed default grade system
INSERT INTO public.grade_system (grade, grade_point, min_score, max_score, description) VALUES
  ('A', 4.00, 70, 100, 'Excellent'),
  ('B', 3.33, 60, 69, 'Very Good'),
  ('C', 2.67, 50, 59, 'Good'),
  ('D', 2.00, 45, 49, 'Fair'),
  ('E', 1.33, 40, 44, 'Pass'),
  ('F', 0.00, 0, 39, 'Fail')
ON CONFLICT (grade) DO NOTHING;

-- 12. Seed university config
INSERT INTO public.university_config (key, value, description) VALUES
  ('institution_name', '"McPherson University"', 'Official university name'),
  ('institution_motto', '"To build a People of Excellence and Integrity for Service"', 'University motto'),
  ('institution_tagline', '"Citadel of Champions"', 'University tagline'),
  ('academic_calendar', '{"current_year": null, "current_semester": null}', 'Current academic year and semester tracking'),
  ('grading', '{"pass_mark": 40, "max_gpa": 4.0}', 'Grading configuration')
ON CONFLICT (key) DO NOTHING;

-- 13. Seed MCU faculties (only if table is empty)
INSERT INTO public.faculties (name, code, description)
SELECT * FROM (VALUES
  ('College of Natural and Applied Sciences', 'COLNAS', 'Natural and Applied Sciences'),
  ('College of Computing', 'COLCOM', 'Computing and Technology'),
  ('College of Humanities, Social and Management Sciences', 'COHSMAS', 'Humanities, Social and Management Sciences'),
  ('College of Law', 'LAW', 'Legal Studies'),
  ('College of Nursing', 'NURSING', 'Nursing and Health Sciences'),
  ('Postgraduate Studies', 'POSTGRAD', 'Postgraduate Programmes')
) AS v(name, code, description)
WHERE NOT EXISTS (SELECT 1 FROM public.faculties LIMIT 1)
ON CONFLICT (code) DO NOTHING;

-- 14. Seed departments (only if departments table is empty)
INSERT INTO public.departments (name, code, faculty_id, description)
SELECT v.name, v.code, f.id, v.desc_text
FROM (VALUES
  ('Biochemistry and Molecular Biology', 'BCH', 'COLNAS', 'Biochemistry and Molecular Biology'),
  ('Biotechnology', 'BTH', 'COLNAS', 'Biotechnology'),
  ('Industrial Chemistry', 'ICH', 'COLNAS', 'Industrial Chemistry'),
  ('Industrial Mathematics', 'IMT', 'COLNAS', 'Industrial Mathematics'),
  ('Microbiology', 'MCB', 'COLNAS', 'Microbiology'),
  ('Physics with Electronics', 'PHY', 'COLNAS', 'Physics with Electronics'),
  ('Statistics', 'STA', 'COLNAS', 'Statistics'),
  ('Medical Laboratory Science', 'MLS', 'COLNAS', 'Medical Laboratory Science'),
  ('Public Health', 'PHT', 'COLNAS', 'Public Health'),
  ('Health Information Management', 'HIM', 'COLNAS', 'Health Information Management'),
  ('Computer Science', 'CSC', 'COLCOM', 'Computer Science'),
  ('Cyber Security', 'CYS', 'COLCOM', 'Cyber Security'),
  ('Information Technology', 'IFT', 'COLCOM', 'Information Technology'),
  ('Software Engineering', 'SWE', 'COLCOM', 'Software Engineering'),
  ('Data Science', 'DTS', 'COLCOM', 'Data Science'),
  ('Accounting', 'ACC', 'COHSMAS', 'Accounting'),
  ('Banking and Finance', 'BNF', 'COHSMAS', 'Banking and Finance'),
  ('Business Administration', 'BUS', 'COHSMAS', 'Business Administration'),
  ('Economics', 'ECO', 'COHSMAS', 'Economics'),
  ('English and Literary Studies', 'ENG', 'COHSMAS', 'English and Literary Studies'),
  ('Finance', 'FIN', 'COHSMAS', 'Finance'),
  ('History and International Studies', 'HIS', 'COHSMAS', 'History and International Studies'),
  ('International Relations', 'IRS', 'COHSMAS', 'International Relations'),
  ('Marketing', 'MKT', 'COHSMAS', 'Marketing'),
  ('Mass Communication', 'MAC', 'COHSMAS', 'Mass Communication'),
  ('Religion and Peace Studies', 'RLS', 'COHSMAS', 'Religion and Peace Studies'),
  ('Law', 'LAW', 'LAW', 'Law'),
  ('Nursing Science', 'NUR', 'NURSING', 'Nursing Science'),
  ('Postgraduate Studies', 'PGS', 'POSTGRAD', 'Postgraduate Studies')
) AS v(name, code, fcode, desc_text)
JOIN public.faculties f ON f.code = v.fcode
WHERE NOT EXISTS (SELECT 1 FROM public.departments LIMIT 1)
ON CONFLICT (code) DO NOTHING;

-- 15. Create academic year if none exists
INSERT INTO public.academic_years (name, start_date, end_date, is_current)
SELECT '2025/2026', '2025-09-01', '2026-08-31', true
WHERE NOT EXISTS (SELECT 1 FROM public.academic_years WHERE is_current = true);

-- 16. Create current semester
INSERT INTO public.semesters (academic_year_id, name, type, start_date, end_date, is_current)
SELECT ay.id, 'First Semester 2025/2026', 'first', '2025-09-01', '2026-01-31', true
FROM public.academic_years ay WHERE ay.is_current = true
AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE is_current = true);
`

export async function up() {
  console.log('Running migration 001: University Structure...')
  const statements = SQL.split(';').filter(s => s.trim())
  let ok = 0, fail = 0
  for (const stmt of statements) {
    try {
      await query(stmt)
      ok++
    } catch (err) {
      console.error('  FAIL:', err.message?.slice(0, 120))
      fail++
    }
  }
  console.log(`Migration 001 complete. ${ok} ok, ${fail} failed.`)
}

export async function down() {
  console.log('Rolling back migration 001...')
  const tables = ['enrollments', 'lecturer_courses', 'programmes', 'departments', 'grade_system', 'semesters', 'academic_years', 'faculties', 'university_config']
  for (const t of tables) {
    try { await query(`DROP TABLE IF EXISTS public.${t} CASCADE`) } catch {}
  }
  console.log('Rollback 001 complete.')
}

if (process.argv[1]?.endsWith('001_university_structure.js')) {
  const action = process.argv[2] || 'up'
  if (action === 'up') up().then(() => process.exit())
  else down().then(() => process.exit())
}