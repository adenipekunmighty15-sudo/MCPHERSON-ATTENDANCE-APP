import 'dotenv/config'
import supabase from './frontend/src/lib/supabase.js'

;(async () => {
  // First init supabase
  await supabase.initSupabase()
  
  // Check tables
  const tables = ['departments', 'faculties', 'courses', 'enrollments', 'users', 'study_materials']
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(3)
      if (error) console.log(`${t}: ERROR - ${error.message}`)
      else console.log(`${t}:`, JSON.stringify(data))
    } catch (e) {
      console.log(`${t}: EXCEPTION - ${e.message}`)
    }
  }
})()