BEGIN;

ALTER TABLE public.study_groups
  ADD COLUMN IF NOT EXISTS invite_code UUID;

UPDATE public.study_groups
SET invite_code = gen_random_uuid()
WHERE invite_code IS NULL;

ALTER TABLE public.study_groups
  ALTER COLUMN invite_code SET DEFAULT gen_random_uuid(),
  ALTER COLUMN invite_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS study_groups_invite_code_unique
  ON public.study_groups (invite_code);

COMMIT;
