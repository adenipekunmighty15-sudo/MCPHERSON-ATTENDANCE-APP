-- Personal notes attached to CCMAS course codes. Additive and idempotent.
CREATE TABLE IF NOT EXISTS public.course_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT 'Untitled note',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_notes_user_id ON public.course_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_course_notes_course_code ON public.course_notes(course_code);
CREATE INDEX IF NOT EXISTS idx_course_notes_user_course ON public.course_notes(user_id, course_code);
