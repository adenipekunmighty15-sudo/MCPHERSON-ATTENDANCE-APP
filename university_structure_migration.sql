-- ═══════════════════════════════════════════════════════════════════════════════
-- University Structure Migration for McPherson Attendance System
-- This migration adds comprehensive university management capabilities
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. UNIVERSITY STRUCTURE TABLES ──

-- Faculties (e.g., Faculty of Science, Faculty of Arts)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    dean_name VARCHAR(255),
    description TEXT,
    established_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_faculties_code ON public.faculties(code);
  CREATE INDEX IF NOT EXISTS idx_faculties_active ON public.faculties(is_active);
  
  RAISE NOTICE 'OK: faculties table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: faculties - %', SQLERRM;
END $$;

-- Enhanced Departments with faculty relationship
DO $$ BEGIN
  -- Add faculty_id to existing departments table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departments' AND column_name = 'faculty_id'
  ) THEN
    ALTER TABLE public.departments ADD COLUMN faculty_id UUID;
    ALTER TABLE public.departments ADD COLUMN head_of_department VARCHAR(255);
    ALTER TABLE public.departments ADD COLUMN description TEXT;
    ALTER TABLE public.departments ADD COLUMN is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.departments ADD COLUMN established_date DATE;
    
    CREATE INDEX IF NOT EXISTS idx_departments_faculty ON public.departments(faculty_id);
    CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);
    
    RAISE NOTICE 'OK: departments table enhanced';
  ELSE
    RAISE NOTICE 'SKIP: departments already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: departments enhancement - %', SQLERRM;
END $$;

-- Programmes (e.g., B.Sc Computer Science, B.A Economics)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    degree_type VARCHAR(50) NOT NULL, -- B.Sc, B.A, B.Eng, M.Sc, PhD, etc.
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
    duration_years INTEGER DEFAULT 4,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_programmes_code ON public.programmes(code);
  CREATE INDEX IF NOT EXISTS idx_programmes_department ON public.programmes(department_id);
  CREATE INDEX IF NOT EXISTS idx_programmes_faculty ON public.programmes(faculty_id);
  CREATE INDEX IF NOT EXISTS idx_programmes_active ON public.programmes(is_active);
  
  RAISE NOTICE 'OK: programmes table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: programmes - %', SQLERRM;
END $$;

-- Academic Years (e.g., 2023/2024, 2024/2025)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) UNIQUE NOT NULL, -- e.g., "2023/2024"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_academic_years_name ON public.academic_years(name);
  CREATE INDEX IF NOT EXISTS idx_academic_years_current ON public.academic_years(is_current);
  CREATE INDEX IF NOT EXISTS idx_academic_years_active ON public.academic_years(is_active);
  
  RAISE NOTICE 'OK: academic_years table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: academic_years - %', SQLERRM;
END $$;

-- Semesters (First, Second, Summer)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL, -- First Semester, Second Semester, Summer
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON public.semesters(academic_year_id);
  CREATE INDEX IF NOT EXISTS idx_semesters_current ON public.semesters(is_current);
  CREATE INDEX IF NOT EXISTS idx_semesters_active ON public.semesters(is_active);
  
  RAISE NOTICE 'OK: semesters table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: semesters - %', SQLERRM;
END $$;

-- ── 2. ENHANCED USERS TABLE ──

-- Add university-specific fields to users table
DO $$ BEGIN
  -- Add programme_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'programme_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN programme_id UUID REFERENCES public.programmes(id) ON DELETE SET NULL;
    ALTER TABLE public.users ADD COLUMN admission_number VARCHAR(50) UNIQUE;
    ALTER TABLE public.users ADD COLUMN admission_date DATE;
    ALTER TABLE public.users ADD COLUMN expected_graduation_date DATE;
    ALTER TABLE public.users ADD COLUMN cgpa DECIMAL(4,3) DEFAULT 0.000;
    ALTER TABLE public.users ADD COLUMN academic_standing VARCHAR(50) DEFAULT 'Good'; -- Good, Probation, Suspension, etc.
    ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.users ADD COLUMN staff_id VARCHAR(50); -- For lecturers/admin
    
    CREATE INDEX IF NOT EXISTS idx_users_programme ON public.users(programme_id);
    CREATE INDEX IF NOT EXISTS idx_users_admission_number ON public.users(admission_number);
    CREATE INDEX IF NOT EXISTS idx_users_staff_id ON public.users(staff_id);
    CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
    
    RAISE NOTICE 'OK: users table enhanced with university fields';
  ELSE
    RAISE NOTICE 'SKIP: users already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: users enhancement - %', SQLERRM;
END $$;

-- ── 3. ENHANCED COURSES TABLE ──

DO $$ BEGIN
  -- Add university-specific fields to courses table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;
    ALTER TABLE public.courses ADD COLUMN academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;
    ALTER TABLE public.courses ADD COLUMN course_type VARCHAR(50) DEFAULT 'Core'; -- Core, Elective, General
    ALTER TABLE public.courses ADD COLUMN prerequisite_course_ids UUID[] DEFAULT ARRAY[]::UUID[];
    ALTER TABLE public.courses ADD COLUMN is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.courses ADD COLUMN max_students INTEGER DEFAULT 100;
    ALTER TABLE public.courses ADD COLUMN current_enrollment INTEGER DEFAULT 0;
    
    CREATE INDEX IF NOT EXISTS idx_courses_semester ON public.courses(semester_id);
    CREATE INDEX IF NOT EXISTS idx_courses_academic_year ON public.courses(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_courses_type ON public.courses(course_type);
    CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(is_active);
    
    RAISE NOTICE 'OK: courses table enhanced with university fields';
  ELSE
    RAISE NOTICE 'SKIP: courses already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: courses enhancement - %', SQLERRM;
END $$;

-- ── 4. ENHANCED ENROLLMENTS TABLE ──

DO $$ BEGIN
  -- Add semester and academic year to enrollments if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE public.enrollments ADD COLUMN semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;
    ALTER TABLE public.enrollments ADD COLUMN academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;
    ALTER TABLE public.enrollments ADD COLUMN enrollment_status VARCHAR(50) DEFAULT 'Active'; -- Active, Dropped, Completed, Failed
    ALTER TABLE public.enrollments ADD COLUMN grade VARCHAR(10); -- A, B, C, D, E, F
    ALTER TABLE public.enrollments ADD COLUMN grade_point DECIMAL(4,3); -- 5.0, 4.0, 3.0, etc.
    ALTER TABLE public.enrollments ADD COLUMN credit_units INTEGER;
    
    CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON public.enrollments(semester_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year ON public.enrollments(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(enrollment_status);
    
    RAISE NOTICE 'OK: enrollments table enhanced';
  ELSE
    RAISE NOTICE 'SKIP: enrollments already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: enrollments enhancement - %', SQLERRM;
END $$;

-- Add missing credit_units column (needed by GPA trigger)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'credit_units'
  ) THEN
    ALTER TABLE public.enrollments ADD COLUMN credit_units INTEGER DEFAULT 0;
    RAISE NOTICE 'OK: enrollments.credit_units added';
  ELSE
    RAISE NOTICE 'SKIP: enrollments.credit_units already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: enrollments.credit_units - %', SQLERRM;
END $$;

-- ── 5. GRADES AND GPA SYSTEM ──

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.grade_system (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade VARCHAR(10) UNIQUE NOT NULL, -- A, B, C, D, E, F
    grade_point DECIMAL(4,3) NOT NULL, -- 5.0, 4.0, 3.0, etc.
    lower_bound INTEGER NOT NULL, -- 70, 60, 50, etc.
    upper_bound INTEGER NOT NULL, -- 100, 69, 59, etc.
    description VARCHAR(255),
    is_passing BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_grade_system_grade ON public.grade_system(grade);
  
  RAISE NOTICE 'OK: grade_system table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: grade_system - %', SQLERRM;
END $$;

-- ── 6. CLASS SCHEDULES AND VENUES ──

DO $$ BEGIN
  -- Enhance venues with more university context
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'venues' AND column_name = 'building_name'
  ) THEN
    ALTER TABLE public.venues ADD COLUMN building_name VARCHAR(255);
    ALTER TABLE public.venues ADD COLUMN floor_number INTEGER;
    ALTER TABLE public.venues ADD COLUMN capacity INTEGER DEFAULT 50;
    ALTER TABLE public.venues ADD COLUMN venue_type VARCHAR(50) DEFAULT 'Lecture Hall'; -- Lecture Hall, Lab, Seminar Room
    ALTER TABLE public.venues ADD COLUMN facilities TEXT[] DEFAULT ARRAY[]::TEXT[]; -- Projector, AC, Computers, etc.
    ALTER TABLE public.venues ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    CREATE INDEX IF NOT EXISTS idx_venues_type ON public.venues(venue_type);
    CREATE INDEX IF NOT EXISTS idx_venues_active ON public.venues(is_active);
    
    RAISE NOTICE 'OK: venues table enhanced';
  ELSE
    RAISE NOTICE 'SKIP: venues already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: venues enhancement - %', SQLERRM;
END $$;

-- ── 7. UNIVERSITY CONFIGURATION ──

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.university_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50), -- academic, attendance, grading, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_university_config_key ON public.university_config(config_key);
  CREATE INDEX IF NOT EXISTS idx_university_config_category ON public.university_config(category);
  CREATE INDEX IF NOT EXISTS idx_university_config_active ON public.university_config(is_active);
  
  RAISE NOTICE 'OK: university_config table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: university_config - %', SQLERRM;
END $$;

-- ── 8. INSERT DEFAULT DATA ──

-- Insert default grade system
DO $$ BEGIN
  INSERT INTO public.grade_system (grade, grade_point, lower_bound, upper_bound, description, is_passing)
  VALUES 
    ('A', 5.0, 70, 100, 'Excellent', true),
    ('B', 4.0, 60, 69, 'Very Good', true),
    ('C', 3.0, 50, 59, 'Good', true),
    ('D', 2.0, 45, 49, 'Fair', true),
    ('E', 1.0, 40, 44, 'Poor', true),
    ('F', 0.0, 0, 39, 'Fail', false)
  ON CONFLICT (grade) DO NOTHING;
  
  RAISE NOTICE 'OK: Default grade system inserted';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: Default grade system - %', SQLERRM;
END $$;

-- Insert default university configuration
DO $$ BEGIN
  INSERT INTO public.university_config (config_key, config_value, description, category)
  VALUES 
    ('university_name', 'McPherson University', 'Name of the university', 'general'),
    ('attendance_threshold', '75', 'Minimum attendance percentage required for exam eligibility', 'attendance'),
    ('max_course_units', '24', 'Maximum course units per semester', 'academic'),
    ('min_course_units', '15', 'Minimum course units per semester', 'academic'),
    ('gpa_calculation_method', 'weighted', 'Method for GPA calculation (weighted or simple)', 'grading'),
    ('current_semester', 'First Semester', 'Current active semester', 'academic'),
    ('current_academic_year', '2024/2025', 'Current academic year', 'academic')
  ON CONFLICT (config_key) DO NOTHING;
  
  RAISE NOTICE 'OK: Default university configuration inserted';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: Default university configuration - %', SQLERRM;
END $$;

-- ── 9. CREATE VIEWS FOR REPORTING ──

DO $$ BEGIN
  -- View for student academic performance
  CREATE OR REPLACE VIEW student_academic_performance AS
  SELECT 
    u.id as user_id,
    u.name,
    u.admission_number,
    u.programme_id,
    p.name as programme_name,
    p.code as programme_code,
    u.level,
    u.cgpa,
    u.academic_standing,
    COUNT(DISTINCT e.course_id) as total_courses_enrolled,
    SUM(CASE WHEN e.grade_point IS NOT NULL THEN e.credit_units ELSE 0 END) as total_credit_units,
    AVG(e.grade_point) as semester_gpa
  FROM public.users u
  LEFT JOIN public.programmes p ON u.programme_id = p.id
  LEFT JOIN public.enrollments e ON u.id = e.user_id
  WHERE u.role = 'student'
  GROUP BY u.id, u.name, u.admission_number, u.programme_id, p.name, p.code, u.level, u.cgpa, u.academic_standing;
  
  RAISE NOTICE 'OK: student_academic_performance view created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: student_academic_performance view - %', SQLERRM;
END $$;

DO $$ BEGIN
  -- View for lecturer workload
  CREATE OR REPLACE VIEW lecturer_workload AS
  SELECT 
    u.id as lecturer_id,
    u.name as lecturer_name,
    u.staff_id,
    u.department,
    COUNT(DISTINCT c.id) as total_courses_assigned,
    COUNT(DISTINCT t.id) as total_timetable_slots,
    SUM(c.units) as total_credit_units
  FROM public.users u
  LEFT JOIN public.courses c ON u.id = c.lecturer_id
  LEFT JOIN public.timetable t ON c.id = t.course_id
  WHERE u.role = 'lecturer'
  GROUP BY u.id, u.name, u.staff_id, u.department;
  
  RAISE NOTICE 'OK: lecturer_workload view created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: lecturer_workload view - %', SQLERRM;
END $$;

DO $$ BEGIN
  -- View for department statistics
  CREATE OR REPLACE VIEW department_statistics AS
  SELECT 
    d.id as department_id,
    d.code as department_code,
    d.name as department_name,
    f.name as faculty_name,
    COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as total_students,
    COUNT(DISTINCT CASE WHEN u.role = 'lecturer' THEN u.id END) as total_lecturers,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT p.id) as total_programmes
  FROM public.departments d
  LEFT JOIN public.faculties f ON d.faculty_id = f.id
  LEFT JOIN public.users u ON d.code = u.department
  LEFT JOIN public.courses c ON d.code = c.department
  LEFT JOIN public.programmes p ON d.id = p.department_id
  GROUP BY d.id, d.code, d.name, f.name;
  
  RAISE NOTICE 'OK: department_statistics view created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: department_statistics view - %', SQLERRM;
END $$;

-- ── 10. CREATE FUNCTIONS FOR GPA CALCULATION ──

DO $body$
BEGIN
  CREATE OR REPLACE FUNCTION calculate_gpa(user_id UUID)
  RETURNS DECIMAL(4,3) AS $func$
  DECLARE
    total_grade_points DECIMAL(10,3);
    total_credit_units INTEGER;
    calculated_gpa DECIMAL(4,3);
  BEGIN
    SELECT 
      SUM(e.grade_point * e.credit_units),
      SUM(e.credit_units)
    INTO total_grade_points, total_credit_units
    FROM public.enrollments e
    WHERE e.user_id = user_id 
      AND e.grade_point IS NOT NULL 
      AND e.credit_units IS NOT NULL;
    
    IF total_credit_units > 0 THEN
      calculated_gpa := total_grade_points / total_credit_units;
    ELSE
      calculated_gpa := 0.000;
    END IF;
    
    RETURN calculated_gpa;
  END;
  $func$ LANGUAGE plpgsql;
  
  RAISE NOTICE 'OK: calculate_gpa function created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: calculate_gpa - %', SQLERRM;
END $body$;

DO $body$
BEGIN
  CREATE OR REPLACE FUNCTION update_academic_standing()
  RETURNS TRIGGER AS $trig$
  BEGIN
    -- Update CGPA whenever enrollments change
    UPDATE public.users 
    SET cgpa = calculate_gpa(NEW.user_id),
        academic_standing = CASE 
          WHEN calculate_gpa(NEW.user_id) >= 3.5 THEN 'First Class'
          WHEN calculate_gpa(NEW.user_id) >= 3.0 THEN 'Second Class Upper'
          WHEN calculate_gpa(NEW.user_id) >= 2.5 THEN 'Second Class Lower'
          WHEN calculate_gpa(NEW.user_id) >= 2.0 THEN 'Third Class'
          WHEN calculate_gpa(NEW.user_id) >= 1.5 THEN 'Pass'
          ELSE 'Probation'
        END
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END;
  $trig$ LANGUAGE plpgsql;
  
  -- Create trigger
  DROP TRIGGER IF EXISTS trigger_update_academic_standing ON public.enrollments;
  CREATE TRIGGER trigger_update_academic_standing
  AFTER INSERT OR UPDATE OF grade_point, credit_units ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_standing();
  
  RAISE NOTICE 'OK: update_academic_standing trigger created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: update_academic_standing trigger - %', SQLERRM;
END $body$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════-- ═══════════════════════════════════════════════════════════════════════════════
-- University Structure Migration for McPherson Attendance System
-- This migration adds comprehensive university management capabilities
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. UNIVERSITY STRUCTURE TABLES ──

-- Faculties (e.g., Faculty of Science, Faculty of Arts)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    dean_name VARCHAR(255),
    description TEXT,
    established_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_faculties_code ON public.faculties(code);
  CREATE INDEX IF NOT EXISTS idx_faculties_active ON public.faculties(is_active);
  
  RAISE NOTICE 'OK: faculties table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: faculties - %', SQLERRM;
END $$;

-- Enhanced Departments with faculty relationship
DO $$ BEGIN
  -- Add faculty_id to existing departments table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departments' AND column_name = 'faculty_id'
  ) THEN
    ALTER TABLE public.departments ADD COLUMN faculty_id UUID;
    ALTER TABLE public.departments ADD COLUMN head_of_department VARCHAR(255);
    ALTER TABLE public.departments ADD COLUMN description TEXT;
    ALTER TABLE public.departments ADD COLUMN is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.departments ADD COLUMN established_date DATE;
    
    CREATE INDEX IF NOT EXISTS idx_departments_faculty ON public.departments(faculty_id);
    CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);
    
    RAISE NOTICE 'OK: departments table enhanced';
  ELSE
    RAISE NOTICE 'SKIP: departments already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: departments enhancement - %', SQLERRM;
END $$;

-- Programmes (e.g., B.Sc Computer Science, B.A Economics)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    degree_type VARCHAR(50) NOT NULL, -- B.Sc, B.A, B.Eng, M.Sc, PhD, etc.
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
    duration_years INTEGER DEFAULT 4,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_programmes_code ON public.programmes(code);
  CREATE INDEX IF NOT EXISTS idx_programmes_department ON public.programmes(department_id);
  CREATE INDEX IF NOT EXISTS idx_programmes_faculty ON public.programmes(faculty_id);
  CREATE INDEX IF NOT EXISTS idx_programmes_active ON public.programmes(is_active);
  
  RAISE NOTICE 'OK: programmes table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: programmes - %', SQLERRM;
END $$;

-- Academic Years (e.g., 2023/2024, 2024/2025)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) UNIQUE NOT NULL, -- e.g., "2023/2024"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_academic_years_name ON public.academic_years(name);
  CREATE INDEX IF NOT EXISTS idx_academic_years_current ON public.academic_years(is_current);
  CREATE INDEX IF NOT EXISTS idx_academic_years_active ON public.academic_years(is_active);
  
  RAISE NOTICE 'OK: academic_years table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: academic_years - %', SQLERRM;
END $$;

-- Semesters (First, Second, Summer)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL, -- First Semester, Second Semester, Summer
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON public.semesters(academic_year_id);
  CREATE INDEX IF NOT EXISTS idx_semesters_current ON public.semesters(is_current);
  CREATE INDEX IF NOT EXISTS idx_semesters_active ON public.semesters(is_active);
  
  RAISE NOTICE 'OK: semesters table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: semesters - %', SQLERRM;
END $$;

-- ── 2. ENHANCED USERS TABLE ──

-- Add university-specific fields to users table
DO $$ BEGIN
  -- Add programme_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'programme_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN programme_id UUID REFERENCES public.programmes(id) ON DELETE SET NULL;
    ALTER TABLE public.users ADD COLUMN admission_number VARCHAR(50) UNIQUE;
    ALTER TABLE public.users ADD COLUMN admission_date DATE;
    ALTER TABLE public.users ADD COLUMN expected_graduation_date DATE;
    ALTER TABLE public.users ADD COLUMN cgpa DECIMAL(4,3) DEFAULT 0.000;
    ALTER TABLE public.users ADD COLUMN academic_standing VARCHAR(50) DEFAULT 'Good'; -- Good, Probation, Suspension, etc.
    ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.users ADD COLUMN staff_id VARCHAR(50); -- For lecturers/admin
    
    CREATE INDEX IF NOT EXISTS idx_users_programme ON public.users(programme_id);
    CREATE INDEX IF NOT EXISTS idx_users_admission_number ON public.users(admission_number);
    CREATE INDEX IF NOT EXISTS idx_users_staff_id ON public.users(staff_id);
    CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
    
    RAISE NOTICE 'OK: users table enhanced with university fields';
  ELSE
    RAISE NOTICE 'SKIP: users already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: users enhancement - %', SQLERRM;
END $$;

-- ── 3. ENHANCED COURSES TABLE ──

DO $$ BEGIN
  -- Add university-specific fields to courses table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;
    ALTER TABLE public.courses ADD COLUMN academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;
    ALTER TABLE public.courses ADD COLUMN course_type VARCHAR(50) DEFAULT 'Core'; -- Core, Elective, General
    ALTER TABLE public.courses ADD COLUMN prerequisite_course_ids UUID[] DEFAULT ARRAY[]::UUID[];
    ALTER TABLE public.courses ADD COLUMN is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.courses ADD COLUMN max_students INTEGER DEFAULT 100;
    ALTER TABLE public.courses ADD COLUMN current_enrollment INTEGER DEFAULT 0;
    
    CREATE INDEX IF NOT EXISTS idx_courses_semester ON public.courses(semester_id);
    CREATE INDEX IF NOT EXISTS idx_courses_academic_year ON public.courses(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_courses_type ON public.courses(course_type);
    CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(is_active);
    
    RAISE NOTICE 'OK: courses table enhanced with university fields';
  ELSE
    RAISE NOTICE 'SKIP: courses already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: courses enhancement - %', SQLERRM;
END $$;

-- ── 4. ENHANCED ENROLLMENTS TABLE ──

DO $$ BEGIN
  -- Add semester and academic year to enrollments if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE public.enrollments ADD COLUMN semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;
    ALTER TABLE public.enrollments ADD COLUMN academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;
    ALTER TABLE public.enrollments ADD COLUMN enrollment_status VARCHAR(50) DEFAULT 'Active'; -- Active, Dropped, Completed, Failed
    ALTER TABLE public.enrollments ADD COLUMN grade VARCHAR(10); -- A, B, C, D, E, F
    ALTER TABLE public.enrollments ADD COLUMN grade_point DECIMAL(4,3); -- 5.0, 4.0, 3.0, etc.
    ALTER TABLE public.enrollments ADD COLUMN credit_units INTEGER;
    
    CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON public.enrollments(semester_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year ON public.enrollments(academic_year_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(enrollment_status);
    
    RAISE NOTICE 'OK: enrollments table enhanced';
  ELSE
    RAISE NOTICE 'SKIP: enrollments already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: enrollments enhancement - %', SQLERRM;
END $$;

-- Add missing credit_units column (needed by GPA trigger)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'credit_units'
  ) THEN
    ALTER TABLE public.enrollments ADD COLUMN credit_units INTEGER DEFAULT 0;
    RAISE NOTICE 'OK: enrollments.credit_units added';
  ELSE
    RAISE NOTICE 'SKIP: enrollments.credit_units already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: enrollments.credit_units - %', SQLERRM;
END $$;

-- ── 5. GRADES AND GPA SYSTEM ──

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.grade_system (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade VARCHAR(10) UNIQUE NOT NULL, -- A, B, C, D, E, F
    grade_point DECIMAL(4,3) NOT NULL, -- 5.0, 4.0, 3.0, etc.
    lower_bound INTEGER NOT NULL, -- 70, 60, 50, etc.
    upper_bound INTEGER NOT NULL, -- 100, 69, 59, etc.
    description VARCHAR(255),
    is_passing BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_grade_system_grade ON public.grade_system(grade);
  
  RAISE NOTICE 'OK: grade_system table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: grade_system - %', SQLERRM;
END $$;

-- ── 6. CLASS SCHEDULES AND VENUES ──

DO $$ BEGIN
  -- Enhance venues with more university context
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'venues' AND column_name = 'building_name'
  ) THEN
    ALTER TABLE public.venues ADD COLUMN building_name VARCHAR(255);
    ALTER TABLE public.venues ADD COLUMN floor_number INTEGER;
    ALTER TABLE public.venues ADD COLUMN capacity INTEGER DEFAULT 50;
    ALTER TABLE public.venues ADD COLUMN venue_type VARCHAR(50) DEFAULT 'Lecture Hall'; -- Lecture Hall, Lab, Seminar Room
    ALTER TABLE public.venues ADD COLUMN facilities TEXT[] DEFAULT ARRAY[]::TEXT[]; -- Projector, AC, Computers, etc.
    ALTER TABLE public.venues ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    CREATE INDEX IF NOT EXISTS idx_venues_type ON public.venues(venue_type);
    CREATE INDEX IF NOT EXISTS idx_venues_active ON public.venues(is_active);
    
    RAISE NOTICE 'OK: venues table enhanced';
  ELSE
    RAISE NOTICE 'SKIP: venues already enhanced';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: venues enhancement - %', SQLERRM;
END $$;

-- ── 7. UNIVERSITY CONFIGURATION ──

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.university_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50), -- academic, attendance, grading, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_university_config_key ON public.university_config(config_key);
  CREATE INDEX IF NOT EXISTS idx_university_config_category ON public.university_config(category);
  CREATE INDEX IF NOT EXISTS idx_university_config_active ON public.university_config(is_active);
  
  RAISE NOTICE 'OK: university_config table created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: university_config - %', SQLERRM;
END $$;

-- ── 8. INSERT DEFAULT DATA ──

-- Insert default grade system
DO $$ BEGIN
  INSERT INTO public.grade_system (grade, grade_point, lower_bound, upper_bound, description, is_passing)
  VALUES 
    ('A', 5.0, 70, 100, 'Excellent', true),
    ('B', 4.0, 60, 69, 'Very Good', true),
    ('C', 3.0, 50, 59, 'Good', true),
    ('D', 2.0, 45, 49, 'Fair', true),
    ('E', 1.0, 40, 44, 'Poor', true),
    ('F', 0.0, 0, 39, 'Fail', false)
  ON CONFLICT (grade) DO NOTHING;
  
  RAISE NOTICE 'OK: Default grade system inserted';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: Default grade system - %', SQLERRM;
END $$;

-- Insert default university configuration
DO $$ BEGIN
  INSERT INTO public.university_config (config_key, config_value, description, category)
  VALUES 
    ('university_name', 'McPherson University', 'Name of the university', 'general'),
    ('attendance_threshold', '75', 'Minimum attendance percentage required for exam eligibility', 'attendance'),
    ('max_course_units', '24', 'Maximum course units per semester', 'academic'),
    ('min_course_units', '15', 'Minimum course units per semester', 'academic'),
    ('gpa_calculation_method', 'weighted', 'Method for GPA calculation (weighted or simple)', 'grading'),
    ('current_semester', 'First Semester', 'Current active semester', 'academic'),
    ('current_academic_year', '2024/2025', 'Current academic year', 'academic')
  ON CONFLICT (config_key) DO NOTHING;
  
  RAISE NOTICE 'OK: Default university configuration inserted';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: Default university configuration - %', SQLERRM;
END $$;

-- ── 9. CREATE VIEWS FOR REPORTING ──

DO $$ BEGIN
  -- View for student academic performance
  CREATE OR REPLACE VIEW student_academic_performance AS
  SELECT 
    u.id as user_id,
    u.name,
    u.admission_number,
    u.programme_id,
    p.name as programme_name,
    p.code as programme_code,
    u.level,
    u.cgpa,
    u.academic_standing,
    COUNT(DISTINCT e.course_id) as total_courses_enrolled,
    SUM(CASE WHEN e.grade_point IS NOT NULL THEN e.credit_units ELSE 0 END) as total_credit_units,
    AVG(e.grade_point) as semester_gpa
  FROM public.users u
  LEFT JOIN public.programmes p ON u.programme_id = p.id
  LEFT JOIN public.enrollments e ON u.id = e.user_id
  WHERE u.role = 'student'
  GROUP BY u.id, u.name, u.admission_number, u.programme_id, p.name, p.code, u.level, u.cgpa, u.academic_standing;
  
  RAISE NOTICE 'OK: student_academic_performance view created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: student_academic_performance view - %', SQLERRM;
END $$;

DO $$ BEGIN
  -- View for lecturer workload
  CREATE OR REPLACE VIEW lecturer_workload AS
  SELECT 
    u.id as lecturer_id,
    u.name as lecturer_name,
    u.staff_id,
    u.department,
    COUNT(DISTINCT c.id) as total_courses_assigned,
    COUNT(DISTINCT t.id) as total_timetable_slots,
    SUM(c.units) as total_credit_units
  FROM public.users u
  LEFT JOIN public.courses c ON u.id = c.lecturer_id
  LEFT JOIN public.timetable t ON c.id = t.course_id
  WHERE u.role = 'lecturer'
  GROUP BY u.id, u.name, u.staff_id, u.department;
  
  RAISE NOTICE 'OK: lecturer_workload view created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: lecturer_workload view - %', SQLERRM;
END $$;

DO $$ BEGIN
  -- View for department statistics
  CREATE OR REPLACE VIEW department_statistics AS
  SELECT 
    d.id as department_id,
    d.code as department_code,
    d.name as department_name,
    f.name as faculty_name,
    COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as total_students,
    COUNT(DISTINCT CASE WHEN u.role = 'lecturer' THEN u.id END) as total_lecturers,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT p.id) as total_programmes
  FROM public.departments d
  LEFT JOIN public.faculties f ON d.faculty_id = f.id
  LEFT JOIN public.users u ON d.code = u.department
  LEFT JOIN public.courses c ON d.code = c.department
  LEFT JOIN public.programmes p ON d.id = p.department_id
  GROUP BY d.id, d.code, d.name, f.name;
  
  RAISE NOTICE 'OK: department_statistics view created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: department_statistics view - %', SQLERRM;
END $$;

-- ── 10. CREATE FUNCTIONS FOR GPA CALCULATION ──

DO $body$
BEGIN
  CREATE OR REPLACE FUNCTION calculate_gpa(user_id UUID)
  RETURNS DECIMAL(4,3) AS $func$
  DECLARE
    total_grade_points DECIMAL(10,3);
    total_credit_units INTEGER;
    calculated_gpa DECIMAL(4,3);
  BEGIN
    SELECT 
      SUM(e.grade_point * e.credit_units),
      SUM(e.credit_units)
    INTO total_grade_points, total_credit_units
    FROM public.enrollments e
    WHERE e.user_id = user_id 
      AND e.grade_point IS NOT NULL 
      AND e.credit_units IS NOT NULL;
    
    IF total_credit_units > 0 THEN
      calculated_gpa := total_grade_points / total_credit_units;
    ELSE
      calculated_gpa := 0.000;
    END IF;
    
    RETURN calculated_gpa;
  END;
  $func$ LANGUAGE plpgsql;
  
  RAISE NOTICE 'OK: calculate_gpa function created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: calculate_gpa - %', SQLERRM;
END $body$;

DO $body$
BEGIN
  CREATE OR REPLACE FUNCTION update_academic_standing()
  RETURNS TRIGGER AS $trig$
  BEGIN
    -- Update CGPA whenever enrollments change
    UPDATE public.users 
    SET cgpa = calculate_gpa(NEW.user_id),
        academic_standing = CASE 
          WHEN calculate_gpa(NEW.user_id) >= 3.5 THEN 'First Class'
          WHEN calculate_gpa(NEW.user_id) >= 3.0 THEN 'Second Class Upper'
          WHEN calculate_gpa(NEW.user_id) >= 2.5 THEN 'Second Class Lower'
          WHEN calculate_gpa(NEW.user_id) >= 2.0 THEN 'Third Class'
          WHEN calculate_gpa(NEW.user_id) >= 1.5 THEN 'Pass'
          ELSE 'Probation'
        END
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END;
  $trig$ LANGUAGE plpgsql;
  
  -- Create trigger
  DROP TRIGGER IF EXISTS trigger_update_academic_standing ON public.enrollments;
  CREATE TRIGGER trigger_update_academic_standing
  AFTER INSERT OR UPDATE OF grade_point, credit_units ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_standing();
  
  RAISE NOTICE 'OK: update_academic_standing trigger created';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: update_academic_standing trigger - %', SQLERRM;
END $body$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════