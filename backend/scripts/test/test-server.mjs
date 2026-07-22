import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Test the query
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const query = (text, params) => pool.query(text, params);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Test authenticate with a real token
const token = process.argv[2];
try {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) { console.log('Auth error:', error?.message); process.exit(1); }
  console.log('User:', user.email, user.id);

  // Now run the query
  const limit = 5;
  const result = await query(`
    SELECT gc.id, gc.sender_id, gc.message, gc.file_url, gc.file_type, gc.file_name, gc.created_at AS "createdAt",
      COALESCE(u.name, '') AS "senderName", COALESCE(u.avatar_url, '') AS "senderAvatar"
    FROM public.general_chat_messages gc
    LEFT JOIN public.users u ON gc.sender_id = u.id::text
    ORDER BY gc.created_at DESC LIMIT $1
  `, [limit]);
  console.log('Query result:', JSON.stringify(result.rows, null, 2));
} catch(e) {
  console.log('Error:', e.message || e);
}

await pool.end();
