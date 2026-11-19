import 'dotenv/config'

// Optional one-time project settings fix. Add SUPABASE_ACCESS_TOKEN to the
// gitignored backend/.env, then run this script. The token is never printed.
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.log('SUPABASE_ACCESS_TOKEN is not set; no project setting was changed')
  process.exit(0)
}

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !anonKey) {
  console.log('Missing Supabase URL or anon key; no project setting was changed')
  process.exit(1)
}

const ref = process.env.SUPABASE_PROJECT_REF || new URL(url).hostname.split('.')[0]

const update = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ mailer_autoconfirm: true }),
})

if (!update.ok) {
  console.log(`Supabase auth config update failed with status ${update.status}`)
  process.exitCode = 1
} else {
  console.log('Supabase Confirm email setting disabled')
}

const verify = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
})
const settings = await verify.json().catch(() => ({}))
console.log(`verified_mailer_autoconfirm=${settings.mailer_autoconfirm}`)
