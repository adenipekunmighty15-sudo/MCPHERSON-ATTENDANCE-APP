ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS created_by UUID
  REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS venues_created_by_idx
  ON public.venues (created_by);
