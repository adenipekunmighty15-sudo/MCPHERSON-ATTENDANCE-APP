DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.attendance
    WHERE course_id IS NOT NULL AND course_id::text <> ''
    GROUP BY user_id, course_id, date
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate user/course/date attendance rows exist; resolve them before applying 007_attendance_checkin_uniqueness.sql';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.attendance
    WHERE session_id IS NOT NULL AND session_id::text <> ''
    GROUP BY user_id, session_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate user/session attendance rows exist; resolve them before applying 007_attendance_checkin_uniqueness.sql';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_user_course_date_unique
  ON public.attendance (user_id, course_id, date)
  WHERE course_id IS NOT NULL AND course_id::text <> '';

CREATE UNIQUE INDEX IF NOT EXISTS attendance_user_session_unique
  ON public.attendance (user_id, session_id)
  WHERE session_id IS NOT NULL AND session_id::text <> '';
