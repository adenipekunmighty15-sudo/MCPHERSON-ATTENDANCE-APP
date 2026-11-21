-- Backfill only the objects the consolidated portal reads. Every statement is
-- additive and idempotent so it is safe to re-run against the hosted database.
SET statement_timeout = '30s';
SET lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES public.timetable(id) ON DELETE SET NULL,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name VARCHAR(200) NOT NULL DEFAULT '',
  lecturer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  lecturer_name VARCHAR(100) NOT NULL DEFAULT 'Lecturer',
  venue_id TEXT,
  room VARCHAR(100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON public.live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON public.live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_lecturer_id ON public.live_sessions(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_timetable_id ON public.live_sessions(timetable_id);

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS live_session_id UUID REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS timetable_id UUID,
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clock_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clock_out_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_live_session_id ON public.attendance(live_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timetable_id ON public.attendance(timetable_id);

ALTER TABLE public.study_materials
  ADD COLUMN IF NOT EXISTS diagrams JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS chat_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS podcast_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS improved_note TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS folder_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  front TEXT NOT NULL DEFAULT '',
  back TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_material_id ON public.flashcards(material_id);

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area VARCHAR(50) NOT NULL DEFAULT '',
  title VARCHAR(200) NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  handled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  admin_response TEXT NOT NULL DEFAULT '',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS admin_response TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);

CREATE TABLE IF NOT EXISTS public.direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_low UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_high UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT direct_conversations_distinct_participants CHECK (participant_low < participant_high),
  CONSTRAINT direct_conversations_unique_pair UNIQUE (participant_low, participant_high)
);

CREATE TABLE IF NOT EXISTS public.direct_conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_conversations_updated ON public.direct_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_conversation_members_user ON public.direct_conversation_members(user_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created ON public.direct_messages(conversation_id, created_at DESC);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.live_sessions, public.flashcards, public.complaints,
  public.direct_conversations, public.direct_conversation_members,
  public.direct_messages FROM anon, authenticated;
