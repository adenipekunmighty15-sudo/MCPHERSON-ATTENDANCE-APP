import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  const r = await p.query(`
    SELECT proname, prokind FROM pg_proc 
    WHERE pronamespace = 'public'::regnamespace 
      AND proname IN ('calculate_gpa', 'update_academic_standing')
  `);
  console.log(JSON.stringify(r.rows, null, 2));
  
  // Also check trigger
  const r2 = await p.query(`
    SELECT trigger_name, event_manipulation, event_object_table 
    FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_academic_standing'
  `);
  console.log('Triggers:', JSON.stringify(r2.rows, null, 2));
} catch (e) {
  console.log('ERR:', e.message);
}
await p.end();
