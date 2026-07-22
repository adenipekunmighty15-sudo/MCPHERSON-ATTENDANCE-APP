process.env.DOTENV_QUIET = 'true'
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function main() {
  const { data: sData, error: sError } = await supabase.auth.signInWithPassword({
    email: 'test-ai@mcpherson.edu',
    password: 'TestPass123!'
  })
  if (sError) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test-ai@mcpherson.edu',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: { role: 'student', full_name: 'Test User' }
    })
    if (error) { console.error(error.message); process.exit(1) }
    const { data: sData2 } = await supabase.auth.signInWithPassword({
      email: 'test-ai@mcpherson.edu',
      password: 'TestPass123!'
    })
    process.stdout.write(sData2.session.access_token)
  } else {
    process.stdout.write(sData.session.access_token)
  }
}
main()
