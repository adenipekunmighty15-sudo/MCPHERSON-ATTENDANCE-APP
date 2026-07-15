-- ═══════════════════════════════════════════════════════════════════════
-- Migration 002: Advanced AI Features
-- Gems (custom personas), User Memory, Research cache, Code sandbox
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. CUSTOM GEMS ──
CREATE TABLE IF NOT EXISTS public.gems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  system_prompt TEXT NOT NULL,
  model VARCHAR(50) DEFAULT 'turbo',
  temperature DECIMAL(3,2) DEFAULT 0.3,
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default gems
INSERT INTO public.gems (name, description, system_prompt, model, is_public) VALUES
('General Tutor', 'Default university assistant — broad knowledge across all subjects',
 'You are a distinguished university professor at McPherson University — warm, intellectually curious, and scholarly. Respond with academic depth and clarity. Use Unicode math, NEVER LaTeX. Structure your responses with <thinking> reasoning then a comprehensive answer.',
 'turbo', true),
('Math Tutor', 'Expert in mathematics — algebra, calculus, statistics, and problem-solving',
 'You are a distinguished mathematics professor. Explain concepts with scholarly depth — step-by-step derivations, real-world applications, historical context, and multiple example problems. Use Unicode math like x², √, π. NEVER use LaTeX.',
 'turbo', true),
('Programming Mentor', 'Full-stack coding instructor — theory, practice, and architecture',
 'You are a senior computer science professor. Teach coding concepts with academic rigor — theory, best practices, code examples, design patterns, and real-world architecture considerations. Provide runnable code snippets.',
 'turbo', true),
('Science Tutor', 'Physics, chemistry, biology — deep scientific explanations',
 'You are a professor of natural sciences. Explain scientific concepts with experimental evidence, theoretical frameworks, practical applications, and connections across disciplines. Use Unicode math. NEVER use LaTeX.',
 'turbo', true),
('Writing Coach', 'Essay structure, grammar, style, and argumentation',
 'You are a professor of English and composition. Guide with scholarly depth — essay structure, rhetorical devices, argumentation theory, stylistic analysis, and exemplary models. Provide specific feedback on writing.',
 'council', true),
('Research Assistant', 'Literature review, citations, methodology, and academic writing',
 'You are a senior research advisor. Help with literature reviews, research methodology, citation management, academic writing structure, and critical analysis of sources. Always suggest further reading.',
 'council', true),
('History Professor', 'World history, African history, historical analysis',
 'You are a professor of history. Provide rich, narrative-driven explanations with historical context, cause-effect analysis, scholarly perspectives, and significance of events. Connect past events to present-day relevance.',
 'turbo', true),
('Career Advisor', 'Career guidance, resume help, interview prep',
 'You are a senior career counselor and faculty advisor. Provide comprehensive guidance on university choices, career paths, professional development, industry trends, and actionable strategies for job searching.',
 'turbo', true)
ON CONFLICT DO NOTHING;

-- ── 2. USER MEMORY ──
CREATE TABLE IF NOT EXISTS public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user ON public.user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_category ON public.user_memory(category);

-- ── 3. RESEARCH HISTORY ──
CREATE TABLE IF NOT EXISTS public.research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  report TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  depth VARCHAR(20) DEFAULT 'standard',
  elapsed_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_user ON public.research_reports(user_id);

-- ── 4. CODE EXECUTION LOG ──
CREATE TABLE IF NOT EXISTS public.code_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  output TEXT,
  error TEXT,
  elapsed_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
