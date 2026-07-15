import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  const client = await pool.connect()
  try {
    const fixes = [
      // ── public.users ──
      `UPDATE public.users SET email = '' WHERE email IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN email SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN email SET DEFAULT ''`,

      `UPDATE public.users SET name = 'User' WHERE name IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN name SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN name SET DEFAULT 'User'`,

      `UPDATE public.users SET role = 'student' WHERE role IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN role SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'student'`,

      `UPDATE public.users SET department = 'Computer Science' WHERE department IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN department SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN department SET DEFAULT 'Computer Science'`,

      `UPDATE public.users SET provider = 'email' WHERE provider IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN provider SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN provider SET DEFAULT 'email'`,

      `UPDATE public.users SET face_descriptor = '' WHERE face_descriptor IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN face_descriptor SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN face_descriptor SET DEFAULT ''`,

      `UPDATE public.users SET avatar_url = '' WHERE avatar_url IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN avatar_url SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN avatar_url SET DEFAULT ''`,

      `ALTER TABLE public.users ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT NOW()`,

      `UPDATE public.users SET last_login = NOW() WHERE last_login IS NULL`,
      `ALTER TABLE public.users ALTER COLUMN last_login SET NOT NULL`,
      `ALTER TABLE public.users ALTER COLUMN last_login SET DEFAULT NOW()`,

      // ── public.courses ──
      `UPDATE public.courses SET code = '' WHERE code IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN code SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN code SET DEFAULT ''`,

      `UPDATE public.courses SET title = '' WHERE title IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN title SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN title SET DEFAULT ''`,

      `UPDATE public.courses SET level = '100' WHERE level IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN level SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN level SET DEFAULT '100'`,

      `UPDATE public.courses SET units = 3 WHERE units IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN units SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN units SET DEFAULT 3`,

      `UPDATE public.courses SET department = '' WHERE department IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN department SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN department SET DEFAULT ''`,

      `UPDATE public.courses SET department_name = '' WHERE department_name IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN department_name SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN department_name SET DEFAULT ''`,

      `UPDATE public.courses SET college = '' WHERE college IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN college SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN college SET DEFAULT ''`,

      `UPDATE public.courses SET lecturer_id = '' WHERE lecturer_id IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN lecturer_id SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN lecturer_id SET DEFAULT ''`,

      `UPDATE public.courses SET custom = false WHERE custom IS NULL`,
      `ALTER TABLE public.courses ALTER COLUMN custom SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN custom SET DEFAULT false`,

      `ALTER TABLE public.courses ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.courses ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.timetable ──
      `UPDATE public.timetable SET course = '' WHERE course IS NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN course SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN course SET DEFAULT ''`,

      `UPDATE public.timetable SET day = '' WHERE day IS NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN day SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN day SET DEFAULT ''`,

      `UPDATE public.timetable SET time = '' WHERE time IS NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN time SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN time SET DEFAULT ''`,

      `UPDATE public.timetable SET room = '' WHERE room IS NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN room SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN room SET DEFAULT ''`,

      `UPDATE public.timetable SET lecturer = '' WHERE lecturer IS NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN lecturer SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN lecturer SET DEFAULT ''`,

      `UPDATE public.timetable SET type = 'lecture' WHERE type IS NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN type SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN type SET DEFAULT 'lecture'`,

      `UPDATE public.timetable SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE public.timetable ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.timetable ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.attendance ──
      `UPDATE public.attendance SET course_id = '' WHERE course_id IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN course_id SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN course_id SET DEFAULT ''`,

      `UPDATE public.attendance SET course_name = '' WHERE course_name IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN course_name SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN course_name SET DEFAULT ''`,

      `UPDATE public.attendance SET status = 'present' WHERE status IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN status SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN status SET DEFAULT 'present'`,

      `UPDATE public.attendance SET method = 'manual' WHERE method IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN method SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN method SET DEFAULT 'manual'`,

      `UPDATE public.attendance SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN user_id SET DEFAULT ''`,

      `UPDATE public.attendance SET date = CURRENT_DATE WHERE date IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN date SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN date SET DEFAULT CURRENT_DATE`,

      `ALTER TABLE public.attendance ALTER COLUMN timestamp SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN timestamp SET DEFAULT NOW()`,

      `UPDATE public.attendance SET location = '' WHERE location IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN location SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN location SET DEFAULT ''`,

      `UPDATE public.attendance SET session_id = '' WHERE session_id IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN session_id SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN session_id SET DEFAULT ''`,

      `UPDATE public.attendance SET location_lat = 0 WHERE location_lat IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN location_lat SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN location_lat SET DEFAULT 0`,

      `UPDATE public.attendance SET location_lng = 0 WHERE location_lng IS NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN location_lng SET NOT NULL`,
      `ALTER TABLE public.attendance ALTER COLUMN location_lng SET DEFAULT 0`,

      // ── public.live_sessions ──
      `UPDATE public.live_sessions SET course_name = '' WHERE course_name IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN course_name SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN course_name SET DEFAULT ''`,

      `UPDATE public.live_sessions SET lecturer_id = '' WHERE lecturer_id IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN lecturer_id SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN lecturer_id SET DEFAULT ''`,

      `UPDATE public.live_sessions SET lecturer_name = '' WHERE lecturer_name IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN lecturer_name SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN lecturer_name SET DEFAULT ''`,

      `UPDATE public.live_sessions SET timetable_id = '' WHERE timetable_id IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN timetable_id SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN timetable_id SET DEFAULT ''`,

      `UPDATE public.live_sessions SET course_id = '' WHERE course_id IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN course_id SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN course_id SET DEFAULT ''`,

      `UPDATE public.live_sessions SET venue_id = '' WHERE venue_id IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN venue_id SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN venue_id SET DEFAULT ''`,

      `UPDATE public.live_sessions SET room = '' WHERE room IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN room SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN room SET DEFAULT ''`,

      `UPDATE public.live_sessions SET ended_at = NOW() WHERE ended_at IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN ended_at SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN ended_at SET DEFAULT NOW()`,

      `ALTER TABLE public.live_sessions ALTER COLUMN started_at SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN started_at SET DEFAULT NOW()`,

      `UPDATE public.live_sessions SET status = 'active' WHERE status IS NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN status SET NOT NULL`,
      `ALTER TABLE public.live_sessions ALTER COLUMN status SET DEFAULT 'active'`,

      // ── public.venues ──
      `UPDATE public.venues SET name = '' WHERE name IS NULL`,
      `ALTER TABLE public.venues ALTER COLUMN name SET NOT NULL`,
      `ALTER TABLE public.venues ALTER COLUMN name SET DEFAULT ''`,

      `UPDATE public.venues SET room_code = '' WHERE room_code IS NULL`,
      `ALTER TABLE public.venues ALTER COLUMN room_code SET NOT NULL`,
      `ALTER TABLE public.venues ALTER COLUMN room_code SET DEFAULT ''`,

      `UPDATE public.venues SET latitude = 0 WHERE latitude IS NULL`,
      `ALTER TABLE public.venues ALTER COLUMN latitude SET NOT NULL`,
      `ALTER TABLE public.venues ALTER COLUMN latitude SET DEFAULT 0`,

      `UPDATE public.venues SET longitude = 0 WHERE longitude IS NULL`,
      `ALTER TABLE public.venues ALTER COLUMN longitude SET NOT NULL`,
      `ALTER TABLE public.venues ALTER COLUMN longitude SET DEFAULT 0`,

      `UPDATE public.venues SET radius_meters = 50 WHERE radius_meters IS NULL`,
      `ALTER TABLE public.venues ALTER COLUMN radius_meters SET NOT NULL`,
      `ALTER TABLE public.venues ALTER COLUMN radius_meters SET DEFAULT 50`,

      `ALTER TABLE public.venues ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.venues ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.notifications ──
      `UPDATE public.notifications SET type = 'info' WHERE type IS NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN type SET NOT NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN type SET DEFAULT 'info'`,

      `UPDATE public.notifications SET title = '' WHERE title IS NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN title SET NOT NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN title SET DEFAULT ''`,

      `UPDATE public.notifications SET message = '' WHERE message IS NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN message SET NOT NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN message SET DEFAULT ''`,

      `UPDATE public.notifications SET link = '' WHERE link IS NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN link SET NOT NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN link SET DEFAULT ''`,

      `UPDATE public.notifications SET data = '{}'::jsonb WHERE data IS NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN data SET NOT NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN data SET DEFAULT '{}'::jsonb`,

      `UPDATE public.notifications SET read = false WHERE read IS NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN read SET NOT NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN read SET DEFAULT false`,

      `ALTER TABLE public.notifications ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.notifications ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.complaints ──
      `UPDATE public.complaints SET area = '' WHERE area IS NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN area SET NOT NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN area SET DEFAULT ''`,

      `UPDATE public.complaints SET title = '' WHERE title IS NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN title SET NOT NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN title SET DEFAULT ''`,

      `UPDATE public.complaints SET message = '' WHERE message IS NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN message SET NOT NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN message SET DEFAULT ''`,

      `UPDATE public.complaints SET priority = 'medium' WHERE priority IS NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN priority SET NOT NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN priority SET DEFAULT 'medium'`,

      `UPDATE public.complaints SET status = 'open' WHERE status IS NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN status SET NOT NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN status SET DEFAULT 'open'`,

      `UPDATE public.complaints SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE public.complaints ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.complaints ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.study_materials ──
      `UPDATE public.study_materials SET title = '' WHERE title IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN title SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN title SET DEFAULT ''`,

      `UPDATE public.study_materials SET source_text = '' WHERE source_text IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN source_text SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN source_text SET DEFAULT ''`,

      `UPDATE public.study_materials SET summary = '' WHERE summary IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN summary SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN summary SET DEFAULT ''`,

      `UPDATE public.study_materials SET course_id = '' WHERE course_id IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN course_id SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN course_id SET DEFAULT ''`,

      `UPDATE public.study_materials SET created_by = '' WHERE created_by IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN created_by SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN created_by SET DEFAULT ''`,

      `UPDATE public.study_materials SET key_points = '[]'::jsonb WHERE key_points IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN key_points SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN key_points SET DEFAULT '[]'::jsonb`,

      `UPDATE public.study_materials SET quiz = '[]'::jsonb WHERE quiz IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN quiz SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN quiz SET DEFAULT '[]'::jsonb`,

      `UPDATE public.study_materials SET diagrams = '[]'::jsonb WHERE diagrams IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN diagrams SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN diagrams SET DEFAULT '[]'::jsonb`,

      `UPDATE public.study_materials SET chat_history = '[]'::jsonb WHERE chat_history IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN chat_history SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN chat_history SET DEFAULT '[]'::jsonb`,

      `UPDATE public.study_materials SET podcast_url = '' WHERE podcast_url IS NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN podcast_url SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN podcast_url SET DEFAULT ''`,

      `ALTER TABLE public.study_materials ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.study_materials ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.flashcards ──
      `UPDATE public.flashcards SET front = '' WHERE front IS NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN front SET NOT NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN front SET DEFAULT ''`,

      `UPDATE public.flashcards SET back = '' WHERE back IS NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN back SET NOT NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN back SET DEFAULT ''`,

      `UPDATE public.flashcards SET order_index = 0 WHERE order_index IS NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN order_index SET NOT NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN order_index SET DEFAULT 0`,

      `UPDATE public.flashcards SET material_id = '' WHERE material_id IS NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN material_id SET NOT NULL`,
      `ALTER TABLE public.flashcards ALTER COLUMN material_id SET DEFAULT ''`,

      // ── public.flashcard_reviews ──
      `UPDATE public.flashcard_reviews SET ease_factor = 2.5 WHERE ease_factor IS NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN ease_factor SET NOT NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN ease_factor SET DEFAULT 2.5`,

      `UPDATE public.flashcard_reviews SET interval_days = 0 WHERE interval_days IS NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN interval_days SET NOT NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN interval_days SET DEFAULT 0`,

      `UPDATE public.flashcard_reviews SET repetitions = 0 WHERE repetitions IS NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN repetitions SET NOT NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN repetitions SET DEFAULT 0`,

      `UPDATE public.flashcard_reviews SET next_review = CURRENT_DATE WHERE next_review IS NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN next_review SET NOT NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN next_review SET DEFAULT CURRENT_DATE`,

      `UPDATE public.flashcard_reviews SET material_id = '' WHERE material_id IS NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN material_id SET NOT NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN material_id SET DEFAULT ''`,

      `UPDATE public.flashcard_reviews SET flashcard_id = '' WHERE flashcard_id IS NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN flashcard_id SET NOT NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN flashcard_id SET DEFAULT ''`,

      `UPDATE public.flashcard_reviews SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.flashcard_reviews ALTER COLUMN user_id SET DEFAULT ''`,

      // ── public.study_sessions ──
      `UPDATE public.study_sessions SET session_type = 'review' WHERE session_type IS NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN session_type SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN session_type SET DEFAULT 'review'`,

      `UPDATE public.study_sessions SET score = 0 WHERE score IS NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN score SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN score SET DEFAULT 0`,

      `UPDATE public.study_sessions SET total_questions = 0 WHERE total_questions IS NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN total_questions SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN total_questions SET DEFAULT 0`,

      `UPDATE public.study_sessions SET correct_answers = 0 WHERE correct_answers IS NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN correct_answers SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN correct_answers SET DEFAULT 0`,

      `UPDATE public.study_sessions SET stats = '{}'::jsonb WHERE stats IS NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN stats SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN stats SET DEFAULT '{}'::jsonb`,

      `UPDATE public.study_sessions SET material_id = '' WHERE material_id IS NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN material_id SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN material_id SET DEFAULT ''`,

      `UPDATE public.study_sessions SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE public.study_sessions ALTER COLUMN started_at SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN started_at SET DEFAULT NOW()`,

      `ALTER TABLE public.study_sessions ALTER COLUMN ended_at SET NOT NULL`,
      `ALTER TABLE public.study_sessions ALTER COLUMN ended_at SET DEFAULT NOW()`,

      // ── public.study_folders ──
      `UPDATE public.study_folders SET name = '' WHERE name IS NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN name SET NOT NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN name SET DEFAULT ''`,

      `UPDATE public.study_folders SET color = '#6366f1' WHERE color IS NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN color SET NOT NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN color SET DEFAULT '#6366f1'`,

      `UPDATE public.study_folders SET icon = 'folder' WHERE icon IS NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN icon SET NOT NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN icon SET DEFAULT 'folder'`,

      `UPDATE public.study_folders SET created_by = '' WHERE created_by IS NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN created_by SET NOT NULL`,
      `ALTER TABLE public.study_folders ALTER COLUMN created_by SET DEFAULT ''`,

      // ── public.chat_conversations ──
      `UPDATE public.chat_conversations SET title = 'New Chat' WHERE title IS NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN title SET NOT NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN title SET DEFAULT 'New Chat'`,

      `UPDATE public.chat_conversations SET model = 'council' WHERE model IS NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN model SET NOT NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN model SET DEFAULT 'council'`,

      `UPDATE public.chat_conversations SET context = '{}'::jsonb WHERE context IS NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN context SET NOT NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN context SET DEFAULT '{}'::jsonb`,

      `UPDATE public.chat_conversations SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE public.chat_conversations ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN created_at SET DEFAULT NOW()`,

      `ALTER TABLE public.chat_conversations ALTER COLUMN updated_at SET NOT NULL`,
      `ALTER TABLE public.chat_conversations ALTER COLUMN updated_at SET DEFAULT NOW()`,

      // ── public.chat_messages ──
      `UPDATE public.chat_messages SET role = 'user' WHERE role IS NULL`,
      `ALTER TABLE public.chat_messages ALTER COLUMN role SET NOT NULL`,
      `ALTER TABLE public.chat_messages ALTER COLUMN role SET DEFAULT 'user'`,

      `UPDATE public.chat_messages SET content = '' WHERE content IS NULL`,
      `ALTER TABLE public.chat_messages ALTER COLUMN content SET NOT NULL`,
      `ALTER TABLE public.chat_messages ALTER COLUMN content SET DEFAULT ''`,

      `UPDATE public.chat_messages SET conversation_id = '' WHERE conversation_id IS NULL`,
      `ALTER TABLE public.chat_messages ALTER COLUMN conversation_id SET NOT NULL`,
      `ALTER TABLE public.chat_messages ALTER COLUMN conversation_id SET DEFAULT ''`,

      `ALTER TABLE public.chat_messages ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.chat_messages ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.general_chat_messages ──
      `UPDATE public.general_chat_messages SET message = '' WHERE message IS NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN message SET NOT NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN message SET DEFAULT ''`,

      `UPDATE public.general_chat_messages SET file_url = '' WHERE file_url IS NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN file_url SET NOT NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN file_url SET DEFAULT ''`,

      `UPDATE public.general_chat_messages SET file_type = '' WHERE file_type IS NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN file_type SET NOT NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN file_type SET DEFAULT ''`,

      `UPDATE public.general_chat_messages SET file_name = '' WHERE file_name IS NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN file_name SET NOT NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN file_name SET DEFAULT ''`,

      `UPDATE public.general_chat_messages SET sender_id = '' WHERE sender_id IS NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN sender_id SET NOT NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN sender_id SET DEFAULT ''`,

      `ALTER TABLE public.general_chat_messages ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.general_chat_messages ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── wallet_transactions ──
      `UPDATE wallet_transactions SET description = '' WHERE description IS NULL`,
      `ALTER TABLE wallet_transactions ALTER COLUMN description SET NOT NULL`,
      `ALTER TABLE wallet_transactions ALTER COLUMN description SET DEFAULT ''`,

      `UPDATE wallet_transactions SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE wallet_transactions ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE wallet_transactions ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE wallet_transactions ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE wallet_transactions ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── gamification_profiles ──
      `UPDATE gamification_profiles SET xp = 0 WHERE xp IS NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN xp SET NOT NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN xp SET DEFAULT 0`,

      `UPDATE gamification_profiles SET current_streak = 0 WHERE current_streak IS NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN current_streak SET NOT NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN current_streak SET DEFAULT 0`,

      `UPDATE gamification_profiles SET longest_streak = 0 WHERE longest_streak IS NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN longest_streak SET NOT NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN longest_streak SET DEFAULT 0`,

      `UPDATE gamification_profiles SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE gamification_profiles ALTER COLUMN user_id SET DEFAULT ''`,

      // ── gamification_badges ──
      `UPDATE gamification_badges SET badge_id = '' WHERE badge_id IS NULL`,
      `ALTER TABLE gamification_badges ALTER COLUMN badge_id SET NOT NULL`,
      `ALTER TABLE gamification_badges ALTER COLUMN badge_id SET DEFAULT ''`,

      `UPDATE gamification_badges SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE gamification_badges ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE gamification_badges ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE gamification_badges ALTER COLUMN earned_at SET NOT NULL`,
      `ALTER TABLE gamification_badges ALTER COLUMN earned_at SET DEFAULT NOW()`,

      // ── public.ai_embeddings ──
      `UPDATE public.ai_embeddings SET content = '' WHERE content IS NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN content SET NOT NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN content SET DEFAULT ''`,

      `UPDATE public.ai_embeddings SET title = '' WHERE title IS NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN title SET NOT NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN title SET DEFAULT ''`,

      `UPDATE public.ai_embeddings SET type = 'general' WHERE type IS NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN type SET NOT NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN type SET DEFAULT 'general'`,

      `UPDATE public.ai_embeddings SET source_id = '' WHERE source_id IS NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN source_id SET NOT NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN source_id SET DEFAULT ''`,

      `UPDATE public.ai_embeddings SET metadata = '{}'::jsonb WHERE metadata IS NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN metadata SET NOT NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN metadata SET DEFAULT '{}'::jsonb`,

      `UPDATE public.ai_embeddings SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE public.ai_embeddings ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.ai_embeddings ALTER COLUMN created_at SET DEFAULT NOW()`,

      // ── public.ai_predictions ──
      `UPDATE public.ai_predictions SET risk_score = 0 WHERE risk_score IS NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN risk_score SET NOT NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN risk_score SET DEFAULT 0`,

      `UPDATE public.ai_predictions SET academic_risk = 0 WHERE academic_risk IS NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN academic_risk SET NOT NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN academic_risk SET DEFAULT 0`,

      `UPDATE public.ai_predictions SET feature_vector = '{}'::jsonb WHERE feature_vector IS NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN feature_vector SET NOT NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN feature_vector SET DEFAULT '{}'::jsonb`,

      `UPDATE public.ai_predictions SET factors = '[]'::jsonb WHERE factors IS NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN factors SET NOT NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN factors SET DEFAULT '[]'::jsonb`,

      `UPDATE public.ai_predictions SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE public.ai_predictions ALTER COLUMN predicted_at SET NOT NULL`,
      `ALTER TABLE public.ai_predictions ALTER COLUMN predicted_at SET DEFAULT NOW()`,

      // ── public.ai_insights ──
      `UPDATE public.ai_insights SET insight = '' WHERE insight IS NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN insight SET NOT NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN insight SET DEFAULT ''`,

      `UPDATE public.ai_insights SET category = 'general' WHERE category IS NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN category SET NOT NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN category SET DEFAULT 'general'`,

      `UPDATE public.ai_insights SET severity = 0 WHERE severity IS NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN severity SET NOT NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN severity SET DEFAULT 0`,

      `UPDATE public.ai_insights SET read = false WHERE read IS NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN read SET NOT NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN read SET DEFAULT false`,

      `UPDATE public.ai_insights SET user_id = '' WHERE user_id IS NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN user_id SET NOT NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN user_id SET DEFAULT ''`,

      `ALTER TABLE public.ai_insights ALTER COLUMN created_at SET NOT NULL`,
      `ALTER TABLE public.ai_insights ALTER COLUMN created_at SET DEFAULT NOW()`,
    ]

    for (const sql of fixes) {
      try {
        await client.query(sql)
        console.log(`OK: ${sql.slice(0, 100)}`)
      } catch (err) {
        console.error(`FAIL: ${sql.slice(0, 100)}`)
        if (!err.message.includes('does not exist') && !err.message.includes('cannot be cast')) {
          console.error(`  ${err.message}`)
        }
      }
    }

    console.log('\nDone! All columns are now NOT NULL.')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
