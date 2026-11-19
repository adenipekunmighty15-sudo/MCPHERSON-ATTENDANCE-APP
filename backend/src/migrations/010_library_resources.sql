CREATE TABLE IF NOT EXISTS public.library_resources (
  id TEXT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  category VARCHAR(50) NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'PDF',
  description TEXT NOT NULL DEFAULT '',
  downloads INTEGER NOT NULL DEFAULT 0 CHECK (downloads >= 0),
  file_url TEXT NOT NULL DEFAULT '',
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS library_resources_uploaded_at_idx
  ON public.library_resources (uploaded_at DESC);
