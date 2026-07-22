-- ═══════════════════════════════════════════════════════════════════════════════
-- MCPHERSON ATTENDANCE — Migration 006: Schema Fix + Missing Columns
-- Run this in your Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- PART 1: ADD MISSING COLUMNS (schema_migration.sql)
-- ============================================================================

-- COURSES
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS prerequisite_course_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 100;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- TIMETABLE
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS lecturer_id UUID;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS semester_id UUID;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ATTENDANCE
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS live_session_id UUID;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS timetable_id UUID;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- LIVE_SESSIONS
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- COMPLAINTS
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ENROLLMENTS
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- LECTURER_COURSES
ALTER TABLE public.lecturer_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- VENUES
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- STUDY_MATERIALS
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- STUDY_FOLDERS
ALTER TABLE public.study_folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- FLASHCARDS
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- STUDY_SESSIONS
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- CHAT_MESSAGES
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- NOTIFICATIONS
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- GAMIFICATION_PROFILES
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS total_study_time_minutes INTEGER DEFAULT 0;
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.gamification_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- WALLET_TRANSACTIONS
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- PART 2: NOT NULL CONSTRAINTS + SENSIBLE DEFAULTS (supabase_schema_fix.sql)
-- ============================================================================

-- ── 1. public.users ──
DO $$ BEGIN
  UPDATE public.users SET name = COALESCE(name, 'User'), role = COALESCE(role, 'student'), department = COALESCE(department, 'Computer Science'), provider = COALESCE(provider, 'email'), email = COALESCE(email, '') WHERE name IS NULL OR role IS NULL OR department IS NULL OR provider IS NULL OR email IS NULL;
  UPDATE public.users SET face_descriptor = '' WHERE face_descriptor IS NULL;
  UPDATE public.users SET avatar_url = '' WHERE avatar_url IS NULL;
  UPDATE public.users SET created_at = NOW() WHERE created_at IS NULL;
  UPDATE public.users SET last_login = NOW() WHERE last_login IS NULL;
  ALTER TABLE public.users ALTER COLUMN email SET NOT NULL, ALTER COLUMN name SET NOT NULL, ALTER COLUMN role SET NOT NULL, ALTER COLUMN department SET NOT NULL, ALTER COLUMN provider SET NOT NULL, ALTER COLUMN email SET DEFAULT '', ALTER COLUMN name SET DEFAULT 'User', ALTER COLUMN role SET DEFAULT 'student', ALTER COLUMN department SET DEFAULT 'Computer Science', ALTER COLUMN provider SET DEFAULT 'email';
  ALTER TABLE public.users ALTER COLUMN face_descriptor SET DEFAULT '', ALTER COLUMN avatar_url SET DEFAULT '', ALTER COLUMN created_at SET DEFAULT NOW(), ALTER COLUMN last_login SET DEFAULT NOW();
  BEGIN ALTER TABLE public.users ALTER COLUMN face_descriptor SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.users ALTER COLUMN avatar_url SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.users ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.users ALTER COLUMN last_login SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.users';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.users — %', SQLERRM;
END $$;

-- ── 2. public.attendance ──
DO $$ BEGIN
  UPDATE public.attendance SET course_id = COALESCE(course_id, ''), course_name = COALESCE(course_name, ''), status = COALESCE(status, 'present'), method = COALESCE(method, 'manual'), date = COALESCE(date, CURRENT_DATE), location = COALESCE(location, ''), session_id = COALESCE(session_id, ''), location_lat = COALESCE(location_lat, 0), location_lng = COALESCE(location_lng, 0), user_id = COALESCE(user_id, '') WHERE course_id IS NULL OR course_name IS NULL OR status IS NULL OR method IS NULL OR date IS NULL OR location IS NULL OR session_id IS NULL OR user_id IS NULL;
  ALTER TABLE public.attendance ALTER COLUMN course_id SET DEFAULT '', ALTER COLUMN course_name SET DEFAULT '', ALTER COLUMN status SET DEFAULT 'present', ALTER COLUMN method SET DEFAULT 'manual', ALTER COLUMN date SET DEFAULT CURRENT_DATE, ALTER COLUMN timestamp SET DEFAULT NOW(), ALTER COLUMN location SET DEFAULT '', ALTER COLUMN session_id SET DEFAULT '', ALTER COLUMN location_lat SET DEFAULT 0, ALTER COLUMN location_lng SET DEFAULT 0;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN course_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN course_name SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN status SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN method SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN date SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN timestamp SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN location SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN session_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN location_lat SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.attendance ALTER COLUMN location_lng SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.attendance';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.attendance — %', SQLERRM;
END $$;

-- ── 3. public.live_sessions ──
DO $$ BEGIN
  UPDATE public.live_sessions SET course_name = COALESCE(course_name, ''), lecturer_id = COALESCE(lecturer_id, ''), lecturer_name = COALESCE(lecturer_name, ''), timetable_id = COALESCE(timetable_id, ''), course_id = COALESCE(course_id, ''), venue_id = COALESCE(venue_id, ''), room = COALESCE(room, ''), status = COALESCE(status, 'active') WHERE course_name IS NULL OR lecturer_id IS NULL OR lecturer_name IS NULL OR status IS NULL;
  UPDATE public.live_sessions SET ended_at = NOW() WHERE ended_at IS NULL;
  ALTER TABLE public.live_sessions ALTER COLUMN timetable_id SET DEFAULT '', ALTER COLUMN course_id SET DEFAULT '', ALTER COLUMN venue_id SET DEFAULT '', ALTER COLUMN room SET DEFAULT '', ALTER COLUMN lecturer_name SET DEFAULT 'Lecturer', ALTER COLUMN ended_at SET DEFAULT NOW(), ALTER COLUMN status SET DEFAULT 'active';
  BEGIN ALTER TABLE public.live_sessions ALTER COLUMN course_name SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.live_sessions ALTER COLUMN lecturer_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.live_sessions ALTER COLUMN lecturer_name SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.live_sessions ALTER COLUMN started_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.live_sessions ALTER COLUMN ended_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.live_sessions ALTER COLUMN status SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.live_sessions';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.live_sessions — %', SQLERRM;
END $$;

-- ── 4. public.courses ──
DO $$ BEGIN
  UPDATE public.courses SET code = COALESCE(code, ''), title = COALESCE(title, ''), level = COALESCE(level, '100'), units = COALESCE(units, 3), department = COALESCE(department, ''), department_name = COALESCE(department_name, ''), college = COALESCE(college, ''), lecturer_id = COALESCE(lecturer_id, ''), custom = COALESCE(custom, false), created_at = COALESCE(created_at, NOW()) WHERE code IS NULL OR title IS NULL OR level IS NULL;
  ALTER TABLE public.courses ALTER COLUMN code SET DEFAULT '', ALTER COLUMN title SET DEFAULT '', ALTER COLUMN level SET DEFAULT '100', ALTER COLUMN units SET DEFAULT 3, ALTER COLUMN department SET DEFAULT '', ALTER COLUMN department_name SET DEFAULT '', ALTER COLUMN college SET DEFAULT '', ALTER COLUMN lecturer_id SET DEFAULT '', ALTER COLUMN custom SET DEFAULT false, ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.courses ALTER COLUMN code SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN title SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN level SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN units SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN department SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN department_name SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN college SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN lecturer_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN custom SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.courses ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.courses';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.courses — %', SQLERRM;
END $$;

-- ── 5. public.timetable ──
DO $$ BEGIN
  UPDATE public.timetable SET course = COALESCE(course, ''), day = COALESCE(day, ''), time = COALESCE(time, ''), room = COALESCE(room, ''), lecturer = COALESCE(lecturer, ''), type = COALESCE(type, 'lecture'), user_id = COALESCE(user_id, ''), created_at = COALESCE(created_at, NOW()) WHERE course IS NULL OR day IS NULL OR time IS NULL OR user_id IS NULL;
  ALTER TABLE public.timetable ALTER COLUMN course SET DEFAULT '', ALTER COLUMN day SET DEFAULT '', ALTER COLUMN time SET DEFAULT '', ALTER COLUMN room SET DEFAULT '', ALTER COLUMN lecturer SET DEFAULT '', ALTER COLUMN type SET DEFAULT 'lecture', ALTER COLUMN user_id SET DEFAULT '', ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.timetable ALTER COLUMN course SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.timetable ALTER COLUMN day SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.timetable ALTER COLUMN time SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.timetable ALTER COLUMN room SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.timetable ALTER COLUMN lecturer SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.timetable ALTER COLUMN type SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.timetable ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.timetable ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.timetable';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.timetable — %', SQLERRM;
END $$;

-- ── 6. public.notifications ──
DO $$ BEGIN
  UPDATE public.notifications SET type = COALESCE(type, 'info'), title = COALESCE(title, ''), message = COALESCE(message, ''), link = COALESCE(link, ''), read = COALESCE(read, false), data = COALESCE(data, '{}'::jsonb), user_id = COALESCE(user_id, ''), created_at = COALESCE(created_at, NOW()) WHERE type IS NULL OR title IS NULL OR message IS NULL OR link IS NULL OR read IS NULL OR user_id IS NULL;
  ALTER TABLE public.notifications ALTER COLUMN type SET DEFAULT 'info', ALTER COLUMN title SET DEFAULT '', ALTER COLUMN message SET DEFAULT '', ALTER COLUMN data SET DEFAULT '{}'::jsonb, ALTER COLUMN link SET DEFAULT '', ALTER COLUMN read SET DEFAULT false, ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.notifications ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.notifications ALTER COLUMN type SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.notifications ALTER COLUMN title SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.notifications ALTER COLUMN message SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.notifications ALTER COLUMN data SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.notifications ALTER COLUMN link SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.notifications ALTER COLUMN read SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.notifications ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.notifications';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.notifications — %', SQLERRM;
END $$;

-- ── 7. public.complaints ──
DO $$ BEGIN
  UPDATE public.complaints SET area = COALESCE(area, ''), title = COALESCE(title, ''), message = COALESCE(message, ''), priority = COALESCE(priority, 'medium'), status = COALESCE(status, 'open'), user_id = COALESCE(user_id, ''), created_at = COALESCE(created_at, NOW()) WHERE area IS NULL OR message IS NULL OR priority IS NULL OR status IS NULL OR user_id IS NULL;
  ALTER TABLE public.complaints ALTER COLUMN area SET DEFAULT '', ALTER COLUMN title SET DEFAULT '', ALTER COLUMN message SET DEFAULT '', ALTER COLUMN priority SET DEFAULT 'medium', ALTER COLUMN status SET DEFAULT 'open', ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.complaints ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.complaints ALTER COLUMN area SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.complaints ALTER COLUMN title SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.complaints ALTER COLUMN message SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.complaints ALTER COLUMN priority SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.complaints ALTER COLUMN status SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.complaints ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.complaints';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.complaints — %', SQLERRM;
END $$;

-- ── 8. public.study_materials ──
DO $$ BEGIN
  UPDATE public.study_materials SET title = COALESCE(title, ''), source_text = COALESCE(source_text, ''), summary = COALESCE(summary, ''), course_id = COALESCE(course_id, ''), created_by = COALESCE(created_by, ''), key_points = COALESCE(key_points, '[]'::jsonb), quiz = COALESCE(quiz, '[]'::jsonb), diagrams = COALESCE(diagrams, '[]'::jsonb), chat_history = COALESCE(chat_history, '[]'::jsonb), podcast_url = COALESCE(podcast_url, ''), created_at = COALESCE(created_at, NOW()) WHERE title IS NULL OR source_text IS NULL OR summary IS NULL OR created_by IS NULL;
  ALTER TABLE public.study_materials ALTER COLUMN title SET DEFAULT '', ALTER COLUMN source_text SET DEFAULT '', ALTER COLUMN summary SET DEFAULT '', ALTER COLUMN course_id SET DEFAULT '', ALTER COLUMN created_by SET DEFAULT '', ALTER COLUMN key_points SET DEFAULT '[]'::jsonb, ALTER COLUMN quiz SET DEFAULT '[]'::jsonb, ALTER COLUMN diagrams SET DEFAULT '[]'::jsonb, ALTER COLUMN chat_history SET DEFAULT '[]'::jsonb, ALTER COLUMN podcast_url SET DEFAULT '', ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN title SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN source_text SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN summary SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN course_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN created_by SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN key_points SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN quiz SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN diagrams SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN chat_history SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN podcast_url SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_materials ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.study_materials';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.study_materials — %', SQLERRM;
END $$;

-- ── 9. public.flashcards ──
DO $$ BEGIN
  UPDATE public.flashcards SET front = COALESCE(front, ''), back = COALESCE(back, ''), order_index = COALESCE(order_index, 0), material_id = COALESCE(material_id, '') WHERE front IS NULL OR back IS NULL OR order_index IS NULL OR material_id IS NULL;
  ALTER TABLE public.flashcards ALTER COLUMN material_id SET DEFAULT '', ALTER COLUMN front SET DEFAULT '', ALTER COLUMN back SET DEFAULT '', ALTER COLUMN order_index SET DEFAULT 0;
  BEGIN ALTER TABLE public.flashcards ALTER COLUMN material_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcards ALTER COLUMN front SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcards ALTER COLUMN back SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcards ALTER COLUMN order_index SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.flashcards';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.flashcards — %', SQLERRM;
END $$;

-- ── 10. public.flashcard_reviews ──
DO $$ BEGIN
  UPDATE public.flashcard_reviews SET ease_factor = COALESCE(ease_factor, 2.5), interval_days = COALESCE(interval_days, 0), repetitions = COALESCE(repetitions, 0), next_review = COALESCE(next_review, CURRENT_DATE), material_id = COALESCE(material_id, ''), flashcard_id = COALESCE(flashcard_id, ''), user_id = COALESCE(user_id, '') WHERE ease_factor IS NULL OR interval_days IS NULL OR repetitions IS NULL OR next_review IS NULL OR material_id IS NULL OR flashcard_id IS NULL OR user_id IS NULL;
  ALTER TABLE public.flashcard_reviews ALTER COLUMN material_id SET DEFAULT '', ALTER COLUMN flashcard_id SET DEFAULT '', ALTER COLUMN user_id SET DEFAULT '', ALTER COLUMN ease_factor SET DEFAULT 2.5, ALTER COLUMN interval_days SET DEFAULT 0, ALTER COLUMN repetitions SET DEFAULT 0, ALTER COLUMN next_review SET DEFAULT CURRENT_DATE;
  BEGIN ALTER TABLE public.flashcard_reviews ALTER COLUMN material_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcard_reviews ALTER COLUMN flashcard_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcard_reviews ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcard_reviews ALTER COLUMN ease_factor SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcard_reviews ALTER COLUMN interval_days SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcard_reviews ALTER COLUMN repetitions SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.flashcard_reviews ALTER COLUMN next_review SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.flashcard_reviews';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.flashcard_reviews — %', SQLERRM;
END $$;

-- ── 11. public.study_sessions ──
DO $$ BEGIN
  UPDATE public.study_sessions SET session_type = COALESCE(session_type, 'review'), score = COALESCE(score, 0), total_questions = COALESCE(total_questions, 0), correct_answers = COALESCE(correct_answers, 0), stats = COALESCE(stats, '{}'::jsonb), material_id = COALESCE(material_id, ''), user_id = COALESCE(user_id, ''), started_at = COALESCE(started_at, NOW()), ended_at = COALESCE(ended_at, NOW()) WHERE session_type IS NULL OR score IS NULL OR total_questions IS NULL OR correct_answers IS NULL OR stats IS NULL OR material_id IS NULL OR user_id IS NULL;
  ALTER TABLE public.study_sessions ALTER COLUMN material_id SET DEFAULT '', ALTER COLUMN user_id SET DEFAULT '', ALTER COLUMN session_type SET DEFAULT 'review', ALTER COLUMN score SET DEFAULT 0, ALTER COLUMN total_questions SET DEFAULT 0, ALTER COLUMN correct_answers SET DEFAULT 0, ALTER COLUMN stats SET DEFAULT '{}'::jsonb, ALTER COLUMN started_at SET DEFAULT NOW(), ALTER COLUMN ended_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN material_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN session_type SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN score SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN total_questions SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN correct_answers SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN stats SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN started_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_sessions ALTER COLUMN ended_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.study_sessions';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.study_sessions — %', SQLERRM;
END $$;

-- ── 12. public.chat_conversations ──
DO $$ BEGIN
  UPDATE public.chat_conversations SET title = COALESCE(title, 'New Chat'), model = COALESCE(model, 'council'), context = COALESCE(context, '{}'::jsonb), user_id = COALESCE(user_id, ''), created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW()) WHERE title IS NULL OR model IS NULL OR context IS NULL OR user_id IS NULL;
  ALTER TABLE public.chat_conversations ALTER COLUMN user_id SET DEFAULT '', ALTER COLUMN title SET DEFAULT 'New Chat', ALTER COLUMN model SET DEFAULT 'council', ALTER COLUMN context SET DEFAULT '{}'::jsonb, ALTER COLUMN created_at SET DEFAULT NOW(), ALTER COLUMN updated_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.chat_conversations ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_conversations ALTER COLUMN title SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_conversations ALTER COLUMN model SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_conversations ALTER COLUMN context SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_conversations ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_conversations ALTER COLUMN updated_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.chat_conversations';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.chat_conversations — %', SQLERRM;
END $$;

-- ── 13. public.chat_messages ──
DO $$ BEGIN
  UPDATE public.chat_messages SET role = COALESCE(role, 'user'), content = COALESCE(content, ''), conversation_id = COALESCE(conversation_id, ''), created_at = COALESCE(created_at, NOW()) WHERE role IS NULL OR content IS NULL OR conversation_id IS NULL;
  ALTER TABLE public.chat_messages ALTER COLUMN conversation_id SET DEFAULT '', ALTER COLUMN role SET DEFAULT 'user', ALTER COLUMN content SET DEFAULT '', ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.chat_messages ALTER COLUMN conversation_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_messages ALTER COLUMN role SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_messages ALTER COLUMN content SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.chat_messages ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.chat_messages';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.chat_messages — %', SQLERRM;
END $$;

-- ── 14. public.general_chat_messages ──
DO $$ BEGIN
  UPDATE public.general_chat_messages SET message = COALESCE(message, ''), file_url = COALESCE(file_url, ''), file_type = COALESCE(file_type, ''), file_name = COALESCE(file_name, ''), sender_id = COALESCE(sender_id, ''), created_at = COALESCE(created_at, NOW()) WHERE message IS NULL OR file_url IS NULL OR file_type IS NULL OR file_name IS NULL OR sender_id IS NULL;
  ALTER TABLE public.general_chat_messages ALTER COLUMN sender_id SET DEFAULT '', ALTER COLUMN message SET DEFAULT '', ALTER COLUMN file_url SET DEFAULT '', ALTER COLUMN file_type SET DEFAULT '', ALTER COLUMN file_name SET DEFAULT '', ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.general_chat_messages ALTER COLUMN sender_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.general_chat_messages ALTER COLUMN message SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.general_chat_messages ALTER COLUMN file_url SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.general_chat_messages ALTER COLUMN file_type SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.general_chat_messages ALTER COLUMN file_name SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.general_chat_messages ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.general_chat_messages';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.general_chat_messages — %', SQLERRM;
END $$;

-- ── 15. public.venues ──
DO $$ BEGIN
  UPDATE public.venues SET name = COALESCE(name, ''), room_code = COALESCE(room_code, ''), latitude = COALESCE(latitude, 0), longitude = COALESCE(longitude, 0), radius_meters = COALESCE(radius_meters, 50), created_at = COALESCE(created_at, NOW()) WHERE name IS NULL OR room_code IS NULL OR latitude IS NULL OR longitude IS NULL OR radius_meters IS NULL;
  ALTER TABLE public.venues ALTER COLUMN name SET DEFAULT '', ALTER COLUMN room_code SET DEFAULT '', ALTER COLUMN latitude SET DEFAULT 0, ALTER COLUMN longitude SET DEFAULT 0, ALTER COLUMN radius_meters SET DEFAULT 50, ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.venues ALTER COLUMN name SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.venues ALTER COLUMN room_code SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.venues ALTER COLUMN latitude SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.venues ALTER COLUMN longitude SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.venues ALTER COLUMN radius_meters SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.venues ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.venues';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.venues — %', SQLERRM;
END $$;

-- ── 16. public.study_folders ──
DO $$ BEGIN
  UPDATE public.study_folders SET name = COALESCE(name, ''), color = COALESCE(color, '#6366f1'), icon = COALESCE(icon, 'folder'), created_by = COALESCE(created_by, '') WHERE name IS NULL OR color IS NULL OR icon IS NULL OR created_by IS NULL;
  ALTER TABLE public.study_folders ALTER COLUMN name SET DEFAULT '', ALTER COLUMN color SET DEFAULT '#6366f1', ALTER COLUMN icon SET DEFAULT 'folder', ALTER COLUMN created_by SET DEFAULT '';
  BEGIN ALTER TABLE public.study_folders ALTER COLUMN name SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_folders ALTER COLUMN color SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_folders ALTER COLUMN icon SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.study_folders ALTER COLUMN created_by SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.study_folders';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.study_folders — %', SQLERRM;
END $$;

-- ── 17. gamification_profiles ──
DO $$ BEGIN
  UPDATE gamification_profiles SET xp = COALESCE(xp, 0), current_streak = COALESCE(current_streak, 0), longest_streak = COALESCE(longest_streak, 0), user_id = COALESCE(user_id, '') WHERE xp IS NULL OR current_streak IS NULL OR longest_streak IS NULL OR user_id IS NULL;
  ALTER TABLE gamification_profiles ALTER COLUMN user_id SET DEFAULT '', ALTER COLUMN xp SET DEFAULT 0, ALTER COLUMN current_streak SET DEFAULT 0, ALTER COLUMN longest_streak SET DEFAULT 0;
  BEGIN ALTER TABLE gamification_profiles ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE gamification_profiles ALTER COLUMN xp SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE gamification_profiles ALTER COLUMN current_streak SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE gamification_profiles ALTER COLUMN longest_streak SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: gamification_profiles';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: gamification_profiles — %', SQLERRM;
END $$;

-- ── 18. gamification_badges ──
DO $$ BEGIN
  UPDATE gamification_badges SET user_id = COALESCE(user_id, ''), badge_id = COALESCE(badge_id, ''), earned_at = COALESCE(earned_at, NOW()) WHERE user_id IS NULL OR badge_id IS NULL OR earned_at IS NULL;
  ALTER TABLE gamification_badges ALTER COLUMN earned_at SET DEFAULT NOW();
  BEGIN ALTER TABLE gamification_badges ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE gamification_badges ALTER COLUMN badge_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE gamification_badges ALTER COLUMN earned_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: gamification_badges';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: gamification_badges — %', SQLERRM;
END $$;

-- ── 19. wallet_transactions ──
DO $$ BEGIN
  UPDATE wallet_transactions SET description = COALESCE(description, ''), user_id = COALESCE(user_id, ''), created_at = COALESCE(created_at, NOW()) WHERE description IS NULL OR user_id IS NULL;
  ALTER TABLE wallet_transactions ALTER COLUMN description SET DEFAULT '', ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE wallet_transactions ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE wallet_transactions ALTER COLUMN amount SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE wallet_transactions ALTER COLUMN type SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE wallet_transactions ALTER COLUMN description SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE wallet_transactions ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: wallet_transactions';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: wallet_transactions — %', SQLERRM;
END $$;

-- ── 20. public.ai_embeddings ──
DO $$ BEGIN
  UPDATE public.ai_embeddings SET content = COALESCE(content, ''), title = COALESCE(title, ''), type = COALESCE(type, 'general'), source_id = COALESCE(source_id, ''), metadata = COALESCE(metadata, '{}'::jsonb), user_id = COALESCE(user_id, ''), created_at = COALESCE(created_at, NOW()) WHERE content IS NULL OR title IS NULL OR type IS NULL OR source_id IS NULL OR metadata IS NULL OR user_id IS NULL;
  ALTER TABLE public.ai_embeddings ALTER COLUMN content SET DEFAULT '', ALTER COLUMN title SET DEFAULT '', ALTER COLUMN type SET DEFAULT 'general', ALTER COLUMN source_id SET DEFAULT '', ALTER COLUMN metadata SET DEFAULT '{}'::jsonb, ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.ai_embeddings ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_embeddings ALTER COLUMN content SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_embeddings ALTER COLUMN title SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_embeddings ALTER COLUMN type SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_embeddings ALTER COLUMN source_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_embeddings ALTER COLUMN metadata SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_embeddings ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.ai_embeddings';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.ai_embeddings — %', SQLERRM;
END $$;

-- ── 21. public.ai_predictions ──
DO $$ BEGIN
  UPDATE public.ai_predictions SET risk_score = COALESCE(risk_score, 0), academic_risk = COALESCE(academic_risk, 0), feature_vector = COALESCE(feature_vector, '{}'::jsonb), factors = COALESCE(factors, '[]'::jsonb), user_id = COALESCE(user_id, ''), predicted_at = COALESCE(predicted_at, NOW()) WHERE risk_score IS NULL OR academic_risk IS NULL OR feature_vector IS NULL OR factors IS NULL OR user_id IS NULL;
  ALTER TABLE public.ai_predictions ALTER COLUMN risk_score SET DEFAULT 0, ALTER COLUMN academic_risk SET DEFAULT 0, ALTER COLUMN feature_vector SET DEFAULT '{}'::jsonb, ALTER COLUMN factors SET DEFAULT '[]'::jsonb, ALTER COLUMN predicted_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.ai_predictions ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_predictions ALTER COLUMN risk_score SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_predictions ALTER COLUMN academic_risk SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_predictions ALTER COLUMN feature_vector SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_predictions ALTER COLUMN factors SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_predictions ALTER COLUMN predicted_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.ai_predictions';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.ai_predictions — %', SQLERRM;
END $$;

-- ── 22. public.ai_insights ──
DO $$ BEGIN
  UPDATE public.ai_insights SET insight = COALESCE(insight, ''), category = COALESCE(category, 'general'), severity = COALESCE(severity, 0), read = COALESCE(read, false), user_id = COALESCE(user_id, ''), created_at = COALESCE(created_at, NOW()) WHERE insight IS NULL OR category IS NULL OR severity IS NULL OR read IS NULL OR user_id IS NULL;
  ALTER TABLE public.ai_insights ALTER COLUMN insight SET DEFAULT '', ALTER COLUMN category SET DEFAULT 'general', ALTER COLUMN severity SET DEFAULT 0, ALTER COLUMN read SET DEFAULT false, ALTER COLUMN created_at SET DEFAULT NOW();
  BEGIN ALTER TABLE public.ai_insights ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_insights ALTER COLUMN insight SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_insights ALTER COLUMN category SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_insights ALTER COLUMN severity SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_insights ALTER COLUMN read SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  BEGIN ALTER TABLE public.ai_insights ALTER COLUMN created_at SET NOT NULL; EXCEPTION WHEN OTHERS THEN END;
  RAISE NOTICE 'OK: public.ai_insights';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL: public.ai_insights — %', SQLERRM;
END $$;
