-- JUPEB Attendance Requirements Migration (idempotent)
-- Each step wrapped in DO block so failures don't block others

-- 1. Add clock_in/out columns (IF NOT EXISTS)
DO $$ BEGIN
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS clock_in_time TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS clock_out_time TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
  RAISE NOTICE 'OK: clock columns added';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: clock columns - %', SQLERRM;
END $$;

-- 2. Drop trigger & function first, then recreate
DROP TRIGGER IF EXISTS update_attendance_duration ON public.attendance;

CREATE OR REPLACE FUNCTION calculate_attendance_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_out_time IS NOT NULL AND NEW.clock_in_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.clock_out_time - NEW.clock_in_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attendance_duration
BEFORE UPDATE OF clock_out_time ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_attendance_duration();

-- 3. Create/replace eligibility view
DROP VIEW IF EXISTS jupeb_eligibility_status;

CREATE VIEW jupeb_eligibility_status AS
SELECT 
    user_id,
    course_id,
    COUNT(*) as total_classes,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as classes_attended,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as classes_late,
    ROUND(
        (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)::numeric + 
        (SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END)::numeric * 0.5)) 
        / NULLIF(COUNT(*), 0) * 100
    , 2) as attendance_percentage,
    CASE 
        WHEN ROUND(
            (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)::numeric + 
            (SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END)::numeric * 0.5)) 
            / NULLIF(COUNT(*), 0) * 100
        , 2) >= 75.00 THEN true
        ELSE false
    END as is_eligible_for_exam
FROM public.attendance
GROUP BY user_id, course_id;
