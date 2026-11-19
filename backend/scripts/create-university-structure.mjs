import 'dotenv/config'
import pg from 'pg'
import {
  colleges,
  departments as catalogueDepartments,
  getDepartmentByName,
} from '../../frontend/src/data/university.js'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// Everything is NOT NULL by construction. No DROP TABLE, no destructive rewrites.
const statements = [
  `CREATE TABLE IF NOT EXISTS public.faculties (
     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
     name TEXT NOT NULL UNIQUE,
     code TEXT NOT NULL UNIQUE,
     description TEXT NOT NULL DEFAULT '',
     dean_id TEXT NOT NULL DEFAULT '',
     established_date DATE NOT NULL DEFAULT CURRENT_DATE,
     is_active BOOLEAN NOT NULL DEFAULT true,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS public.departments (
     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
     name TEXT NOT NULL UNIQUE,
     code TEXT NOT NULL UNIQUE,
     faculty_id TEXT NOT NULL DEFAULT '',
     description TEXT NOT NULL DEFAULT '',
     hod_id TEXT NOT NULL DEFAULT '',
     is_active BOOLEAN NOT NULL DEFAULT true,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS public.programmes (
     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
     name TEXT NOT NULL,
     code TEXT NOT NULL UNIQUE,
     department_id TEXT NOT NULL DEFAULT '',
     faculty_id TEXT NOT NULL DEFAULT '',
     degree_type TEXT NOT NULL DEFAULT 'Bachelor',
     duration_years INTEGER NOT NULL DEFAULT 4,
     description TEXT NOT NULL DEFAULT '',
     is_active BOOLEAN NOT NULL DEFAULT true,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS public.academic_years (
     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
     name TEXT NOT NULL UNIQUE,
     start_date DATE NOT NULL DEFAULT CURRENT_DATE,
     end_date DATE NOT NULL DEFAULT CURRENT_DATE,
     is_current BOOLEAN NOT NULL DEFAULT false,
     is_active BOOLEAN NOT NULL DEFAULT true,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS public.semesters (
     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
     academic_year_id TEXT NOT NULL DEFAULT '',
     name TEXT NOT NULL,
     type TEXT NOT NULL CHECK (type IN ('first','second','summer')),
     start_date DATE NOT NULL DEFAULT CURRENT_DATE,
     end_date DATE NOT NULL DEFAULT CURRENT_DATE,
     registration_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
     registration_end_date DATE NOT NULL DEFAULT CURRENT_DATE,
     exam_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
     exam_end_date DATE NOT NULL DEFAULT CURRENT_DATE,
     is_current BOOLEAN NOT NULL DEFAULT false,
     is_active BOOLEAN NOT NULL DEFAULT true,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS public.grade_system (
     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
     grade TEXT NOT NULL UNIQUE,
     grade_point NUMERIC(3,2) NOT NULL DEFAULT 0,
     min_score INTEGER NOT NULL DEFAULT 0,
     max_score INTEGER NOT NULL DEFAULT 0,
     description TEXT NOT NULL DEFAULT '',
     is_active BOOLEAN NOT NULL DEFAULT true,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS public.university_config (
     id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
     key TEXT NOT NULL UNIQUE,
     value JSONB NOT NULL DEFAULT '{}'::jsonb,
     description TEXT NOT NULL DEFAULT '',
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS public.enrollments (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
     course_id TEXT NOT NULL DEFAULT '',
     course_name TEXT NOT NULL DEFAULT '',
     semester_id TEXT NOT NULL DEFAULT '',
     academic_year_id TEXT NOT NULL DEFAULT '',
     enrolment_date DATE NOT NULL DEFAULT CURRENT_DATE,
     status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped','incomplete')),
     grade TEXT NOT NULL DEFAULT '',
     grade_point NUMERIC(3,2) NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (user_id, course_id, semester_id)
   )`,
  `CREATE TABLE IF NOT EXISTS public.lecturer_courses (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     lecturer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
     course_id TEXT NOT NULL DEFAULT '',
     course_name TEXT NOT NULL DEFAULT '',
     semester_id TEXT NOT NULL DEFAULT '',
     role TEXT NOT NULL DEFAULT 'instructor' CHECK (role IN ('instructor','assistant','coordinator')),
     is_active BOOLEAN NOT NULL DEFAULT true,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (lecturer_id, course_id, semester_id)
   )`,
  // Existing tables need the id columns the API joins on.
  `ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS department_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS faculty_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS programme_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expected_graduation_date DATE NOT NULL DEFAULT CURRENT_DATE`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS face_consent_at TIMESTAMPTZ NOT NULL DEFAULT TIMESTAMPTZ '1970-01-01 00:00:00+00'`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS matric_number TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS staff_id TEXT NOT NULL DEFAULT ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_matric_number_unique
     ON public.users (lower(matric_number)) WHERE matric_number <> ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_staff_id_unique
     ON public.users (lower(staff_id)) WHERE staff_id <> ''`,
  // Indexes for every relationship the API filters/joins on.
  `CREATE INDEX IF NOT EXISTS idx_faculties_code ON public.faculties(code)`,
  `CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON public.departments(faculty_id)`,
  `CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code)`,
  `CREATE INDEX IF NOT EXISTS idx_programmes_department_id ON public.programmes(department_id)`,
  `CREATE INDEX IF NOT EXISTS idx_programmes_faculty_id ON public.programmes(faculty_id)`,
  `CREATE INDEX IF NOT EXISTS idx_academic_years_is_current ON public.academic_years(is_current)`,
  `CREATE INDEX IF NOT EXISTS idx_semesters_academic_year_id ON public.semesters(academic_year_id)`,
  `CREATE INDEX IF NOT EXISTS idx_semesters_is_current ON public.semesters(is_current)`,
  `CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id)`,
  `CREATE INDEX IF NOT EXISTS idx_courses_faculty_id ON public.courses(faculty_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_programme_id ON public.users(programme_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enrollments_semester_id ON public.enrollments(semester_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lecturer_courses_lecturer_id ON public.lecturer_courses(lecturer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lecturer_courses_course_id ON public.lecturer_courses(course_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lecturer_courses_semester_id ON public.lecturer_courses(semester_id)`,
]

const client = await pool.connect()
try {
  await client.query('BEGIN')

  for (const sql of statements) {
    await client.query(sql)
  }
  console.log(`Created/verified ${statements.length} schema statements`)

  for (const college of colleges) {
    await client.query(
      `INSERT INTO public.faculties (id, name, code)
       VALUES ($1,$2,$3)
       ON CONFLICT (code) DO NOTHING`,
      [college.code, college.name, college.code]
    )
  }

  for (const department of catalogueDepartments) {
    await client.query(
      `INSERT INTO public.departments (id, name, code, faculty_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (code) DO NOTHING`,
      [department.id, department.name, department.code, department.college]
    )
  }
  console.log(`Seeded ${colleges.length} colleges and ${catalogueDepartments.length} departments`)

  const { rows: courses } = await client.query(
    `SELECT id, department FROM public.courses WHERE department_id = ''`
  )
  let backfilled = 0
  for (const course of courses) {
    const match = getDepartmentByName(course.department)
    if (!match) continue
    await client.query(
      `UPDATE public.courses SET department_id = $1, faculty_id = $2 WHERE id = $3`,
      [match.id, match.college, course.id]
    )
    backfilled++
  }
  await client.query(
    `UPDATE public.users SET department_id = $1
     WHERE department_id = '' AND lower(department) = 'computer science'`,
    ['cs']
  )
  console.log(`Backfilled ${backfilled} existing course(s)`)

  const grades = [
    ['A', 4.0, 70, 100, 'Excellent'],
    ['B', 3.33, 60, 69, 'Very Good'],
    ['C', 2.67, 50, 59, 'Good'],
    ['D', 2.0, 45, 49, 'Fair'],
    ['E', 1.33, 40, 44, 'Pass'],
    ['F', 0.0, 0, 39, 'Fail'],
  ]
  for (const [grade, point, min, max, description] of grades) {
    await client.query(
      `INSERT INTO public.grade_system (grade, grade_point, min_score, max_score, description)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (grade) DO NOTHING`,
      [grade, point, min, max, description]
    )
  }

  const config = [
    ['institution_name', { value: 'McPherson University' }, 'Official university name'],
    ['institution_motto', { value: 'To build a People of Excellence and Integrity for Service' }, 'University motto'],
    ['institution_tagline', { value: 'Citadel of Champions' }, 'University tagline'],
    ['grading', { pass_mark: 40, max_gpa: 4.0 }, 'Grading configuration'],
  ]
  for (const [key, value, description] of config) {
    await client.query(
      `INSERT INTO public.university_config (key, value, description)
       VALUES ($1,$2::jsonb,$3) ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(value), description]
    )
  }

  const { rows: yearRows } = await client.query(
    `INSERT INTO public.academic_years (name, start_date, end_date, is_current)
     SELECT '2025/2026', DATE '2025-09-01', DATE '2026-08-31', true
     WHERE NOT EXISTS (SELECT 1 FROM public.academic_years WHERE is_current = true)
     RETURNING id`
  )
  if (yearRows.length) {
    await client.query(
      `INSERT INTO public.semesters (academic_year_id, name, type, start_date, end_date, is_current)
       SELECT $1, 'First Semester 2025/2026', 'first', DATE '2025-09-01', DATE '2026-01-31', true
       WHERE NOT EXISTS (SELECT 1 FROM public.semesters WHERE is_current = true)`,
      [yearRows[0].id]
    )
  }
  console.log('Seeded grade system, config, academic year and semester')

  const { rows: nullable } = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND is_nullable = 'YES'
     ORDER BY table_name, ordinal_position`
  )
  if (nullable.length) {
    throw new Error(`Nullable columns remain: ${nullable.map((c) => `${c.table_name}.${c.column_name}`).join(', ')}`)
  }

  await client.query('COMMIT')
  console.log('University structure ready: all public columns NOT NULL')
} catch (error) {
  await client.query('ROLLBACK')
  console.error('Migration rolled back:', error.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
