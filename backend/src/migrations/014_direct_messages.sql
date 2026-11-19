BEGIN;

CREATE TABLE IF NOT EXISTS public.direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_low UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_high UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT direct_conversations_distinct_participants
    CHECK (participant_low < participant_high),
  CONSTRAINT direct_conversations_unique_pair
    UNIQUE (participant_low, participant_high)
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

CREATE INDEX IF NOT EXISTS idx_direct_conversations_updated
  ON public.direct_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_conversation_members_user
  ON public.direct_conversation_members(user_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created
  ON public.direct_messages(conversation_id, created_at DESC);

ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.direct_conversations, public.direct_conversation_members, public.direct_messages
  FROM anon, authenticated;

COMMIT;
