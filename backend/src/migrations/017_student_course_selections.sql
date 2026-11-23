-- Student course selections from CCMAS catalog. Additive and idempotent.
CREATE TABLE IF NOT EXISTS public.student_course_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ccmas_course_id TEXT NOT NULL,
  course_code TEXT NOT NULL DEFAULT '',
  course_title TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  level INTEGER,
  units INTEGER,
  source TEXT NOT NULL DEFAULT 'ccmas',
  status TEXT NOT NULL DEFAULT 'selected' CHECK (status IN ('selected', 'dropped', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ccmas_course_id)
);

CREATE INDEX IF NOT EXISTS idx_student_course_selections_user_id ON public.student_course_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_student_course_selections_course ON public.student_course_selections(ccmas_course_id);
CREATE INDEX IF NOT EXISTS idx_student_course_selections_dept ON public.student_course_selections(department);
