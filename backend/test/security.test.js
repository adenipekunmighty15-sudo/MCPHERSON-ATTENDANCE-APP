import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  isDuplicateAccountError,
  isSafeRedirect,
  normalizeAccountIdentifier,
  validatePassword,
} from '../src/services/authPolicy.js'

const root = join(import.meta.dirname, '..')
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8')

test('server does not register the arbitrary code execution route', () => {
  const server = read('server.js')
  assert.doesNotMatch(server, /codeRoutes/)
  assert.doesNotMatch(server, /\/api\/ai\/execute/)
})

test('code execution service no longer shells out to user input', () => {
  const servicePath = 'src/services/codeService.js'
  let service = ''
  try {
    service = read(servicePath)
  } catch {
    return
  }
  assert.doesNotMatch(service, /execSync|exec\(|spawn\(/)
})

test('deploy script reads DATABASE_URL from the environment', () => {
  const script = read('scripts/deploy_schema.js')
  assert.match(script, /process\.env\.DATABASE_URL/)
  assert.doesNotMatch(script, /postgresql:\/\/[^'"`\s]+:[^'"`\s]+@/)
})

test('DB-loaded AI keys use the real env var names consumed by ai.js', () => {
  const server = read('server.js')
  assert.match(server, /envKeyForProvider/)
  assert.doesNotMatch(server, /keyMap/)
  assert.doesNotMatch(server, /replace\(-\/g, '_'\)/)
})

test('CORS default uses the real production domain and trust proxy is enabled', () => {
  const server = read('server.js')
  assert.match(server, /mcpherson-attendance-app\.vercel\.app/)
  assert.doesNotMatch(server, /['"]https:\/\/mcpherson-attendance\.vercel\.app['"]/)
  assert.match(server, /app\.set\(['"]trust proxy['"]/)
})

test('study diagnostic is not exposed without authentication from study routes', () => {
  const studyRoutes = read('src/routes/study.routes.js')
  assert.doesNotMatch(studyRoutes, /router\.get\(['"]\/api\/study\/diagnostic['"]/)
})

test('attendance check-in requires a session and computes status on the server', () => {
  const attendance = read('src/routes/attendance.routes.js')
  assert.match(attendance, /valid active session ID is required/)
  assert.match(attendance, /Date\.now\(\) - startedAt/)
  assert.doesNotMatch(attendance, /const validStatus = status/)
})

test('friend-facing gems cannot be updated through a public-gem condition', () => {
  const gems = read('src/services/gemsService.js')
  assert.doesNotMatch(gems, /user_id = \$1 OR is_public = false/)
  assert.match(gems, /WHERE id = \$1 AND user_id = \$2/)
})

test('wallet funding and arbitrary XP awards are disabled', () => {
  const wallet = read('src/routes/wallet.routes.js')
  const gamification = read('src/routes/gamification.routes.js')
  assert.match(wallet, /Wallet funding is unavailable/)
  assert.match(gamification, /XP awards are disabled/)
})

test('profile creation ignores client-supplied role and user id', () => {
  const auth = read('src/routes/auth.routes.js')
  const profileRoute = auth.slice(
    auth.indexOf("router.post('/api/auth/create-user-profile'"),
    auth.indexOf("router.post('/api/auth/", auth.indexOf("router.post('/api/auth/create-user-profile'") + 10)
  )
  assert.match(profileRoute, /req\.user\.id/)
  assert.match(profileRoute, /'student'/)
  assert.doesNotMatch(profileRoute, /userRole/)
})

test('user schema supplies the columns required by token authentication', () => {
  const script = read('scripts/create-university-structure.mjs')
  assert.match(script, /is_active BOOLEAN NOT NULL DEFAULT true/)
  assert.match(script, /avatar_url TEXT NOT NULL DEFAULT ''/)
  assert.match(script, /face_consent_at TIMESTAMPTZ NOT NULL DEFAULT/)
  const middleware = read('src/middleware/auth.js')
  assert.match(middleware, /is_active AS "isActive"/)
})

test('Supabase email rate-limit text is hidden from users', () => {
  const store = read('../frontend/src/stores/auth.js')
  assert.match(store, /over_email_send_rate_limit/)
  assert.match(store, /email rate limit exceeded/)
  assert.match(store, /That service is temporarily busy/)
})

test('registration auto-confirms allowed domains and signs the user straight in', () => {
  const auth = read('src/routes/auth.routes.js')
  const start = auth.indexOf('async function registerHandler')
  const end = auth.indexOf("router.post('/api/auth/confirm-signup'")
  const route = auth.slice(start, end)
  assert.match(route, /validateRegistration\(req\.body/)
  assert.match(route, /email_confirm:\s*true/)
  assert.match(route, /isDuplicateAccountError\(error\)/)
  assert.match(route, /verifyPassword\(email, password\)/)
  assert.match(route, /email_confirm:\s*true,\s*password/)
  assert.match(route, /'student'/)
  assert.doesNotMatch(route, /body\.role/)
  assert.match(auth, /router\.post\('\/api\/auth\/signup', registerHandler\)/)

  const limiter = read('src/middleware/limiter.js')
  assert.match(limiter, /\/api\/auth\/register/)
  assert.match(limiter, /\/api\/auth\/signup/)

  const store = read('../frontend/src/stores/auth.js')
  const signUp = store.slice(store.indexOf('async function signUp'), store.indexOf('async function signInWithOAuth'))
  assert.match(signUp, /\/auth\/signup/)
  assert.match(signUp, /signInWithPassword/)
  assert.doesNotMatch(signUp, /needsConfirmation/)

  const loginPage = read('../frontend/src/pages/Login.vue')
  const signupHandler = loginPage.slice(
    loginPage.indexOf('async function handleSignup'),
    loginPage.indexOf('async function handleForgot')
  )
  assert.match(signupHandler, /name: 'Dashboard'/)
})

test('auth policy normalizes identifiers and enforces the full password rules', () => {
  assert.equal(normalizeAccountIdentifier('  MCU123 '), 'mcu123@undergraduate.mcu.edu.ng')
  assert.equal(normalizeAccountIdentifier('STU.DENT@GMAIL.COM'), 'stu.dent@gmail.com')
  assert.equal(normalizeAccountIdentifier('bad id'), '')
  assert.equal(validatePassword('Short1!').valid, false)
  assert.equal(validatePassword('alllower1!').valid, false)
  assert.equal(validatePassword('LongEnough1!').valid, true)
})

test('duplicate account errors are detected across GoTrue message variants', () => {
  assert.equal(isDuplicateAccountError({ message: 'A user with this email address has already been registered' }), true)
  assert.equal(isDuplicateAccountError({ message: 'User already registered' }), true)
  assert.equal(isDuplicateAccountError({ message: 'A user with this email already exists' }), true)
  assert.equal(isDuplicateAccountError({ code: 'email_exists' }), true)
  assert.equal(isDuplicateAccountError({ message: 'network timeout' }), false)
  assert.equal(isDuplicateAccountError(null), false)
})

test('redirect validator rejects open redirects and auth-loop paths', () => {
  assert.equal(isSafeRedirect('/study-hub?tab=notes'), true)
  assert.equal(isSafeRedirect('//evil.example'), false)
  assert.equal(isSafeRedirect('/\\evil.example'), false)
  assert.equal(isSafeRedirect('https://evil.example'), false)
  assert.equal(isSafeRedirect('/login?reason=expired'), false)
  assert.equal(isSafeRedirect('/welcome'), false)
})

test('login and logout endpoints use generic errors and revoke the session', () => {
  const auth = read('src/routes/auth.routes.js')
  assert.match(auth, /router\.post\('\/api\/auth\/login'/)
  assert.match(auth, /router\.post\('\/api\/auth\/logout', authenticate/)
  assert.match(auth, /auth\.admin\.signOut\(token, 'local'\)/)
  assert.match(auth, /grant_type=password/)

  const login = auth.slice(
    auth.indexOf("router.post('/api/auth/login'"),
    auth.indexOf("router.post('/api/auth/logout'"),
  )
  assert.match(login, /Invalid email or password\. Please try again\./)
  assert.doesNotMatch(login, /res\.status\([^)]*\)\.json\(\{ error: [^}]*\.message/)

  const limiter = read('src/middleware/limiter.js')
  assert.match(limiter, /\/api\/auth\/login/)
  assert.match(limiter, /login:\$\{ipKey\(req\)\}/)
})

test('frontend stores sessions deliberately and signs out through the API', () => {
  const store = read('../frontend/src/stores/auth.js')
  const signIn = store.slice(store.indexOf('async function signIn'), store.indexOf('async function signUp'))
  assert.match(signIn, /api\.post\('\/auth\/login'/)
  assert.match(signIn, /supabase\.auth\.setSession/)
  assert.doesNotMatch(signIn, /signInWithPassword/)

  const logoutStart = store.indexOf('async function logout')
  const logout = store.slice(logoutStart, store.indexOf('return {', logoutStart))
  assert.match(logout, /\/auth\/logout/)
  assert.match(logout, /signOut\(\{ scope: 'local' \}\)/)

  const supabaseLib = read('../frontend/src/lib/supabase.js')
  assert.match(supabaseLib, /setRememberMe/)
  assert.match(supabaseLib, /sessionStorage/)

  const loginPage = read('../frontend/src/pages/Login.vue')
  assert.match(loginPage, /rememberMe/)
  assert.match(loginPage, /Lowercase/)
  assert.match(loginPage, /session-expired/)
})

test('frontend check-in uses the active session and server-supported GPS fields', () => {
  const page = read('../frontend/src/pages/Attendance.vue')
  assert.match(page, /sessionId: activeSession\.value\.id/)
  assert.match(page, /locationLat: latitude/)
  assert.match(page, /locationLng: longitude/)
  assert.match(page, /method: 'GPS'/)
  assert.match(page, /verificationCode: checkinCode\.value\.trim\(\)/)
  assert.doesNotMatch(page, /PHY101/)
  assert.doesNotMatch(page, /data\.value\.unshift/)
})

test('dashboard does not ship invented attendance numbers', () => {
  const page = read('../frontend/src/pages/Dashboard.vue')
  assert.doesNotMatch(page, /attendance: 92/)
  assert.doesNotMatch(page, /attendance: 68/)
  assert.match(page, /api\.get\('\/attendance'\)/)
})

test('direct messages are authenticated and scoped to conversation members', () => {
  const server = read('server.js')
  const routes = read('src/routes/messages.routes.js')
  const migration = read('src/migrations/014_direct_messages.sql')
  assert.match(server, /messagesRoutes/)
  assert.match(routes, /router\.get\('\/api\/messages\/contacts', authenticate, requireChatRole/)
  assert.match(routes, /router\.post\('\/api\/messages\/conversations\/:conversationId\/messages', authenticate, requireChatRole/)
  assert.match(routes, /conversation_id = \$1 AND user_id = \$2/)
  assert.match(routes, /senderId: row\.sender_id === currentUserId \? 'me'/)
  assert.match(migration, /UNIQUE \(participant_low, participant_high\)/)
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/)
})

test('messages and study packs do not fall back to local demo content', () => {
  const messages = read('../frontend/src/stores/messaging.js')
  const api = read('../frontend/src/lib/api.js')
  const adminDashboard = read('../frontend/src/pages/AdminDashboard.vue')
  const studyRoutes = read('src/routes/study.routes.js')
  const studyPackService = read('src/services/studyPack.js')
  assert.match(messages, /api\.post\('\/messages\/conversations'/)
  assert.doesNotMatch(messages, /localStorage|Math\.random|simulateReply/)
  assert.doesNotMatch(api, /mcu_local_study_materials|buildStudyPack|createStudyMaterialLocally/)
  assert.doesNotMatch(adminDashboard, /Showing sample data|Oluwaseun Adebayo|28400/)
  assert.doesNotMatch(studyRoutes, /pack = buildStudyPack/)
  assert.match(studyRoutes, /status\(503\)\.json\(\{ error: 'AI study-pack generation is temporarily unavailable/)
  assert.doesNotMatch(studyPackService, /buildStudyPack|buildFlashcards|buildQuiz/)
})

test('study dashboard reports errors instead of showing an empty-state success', () => {
  const dashboard = read('../frontend/src/components/study/StudyDashboard.vue')
  assert.match(dashboard, /const result = response\.data/)
  assert.match(dashboard, /class="dashboard-error" role="alert"/)
  assert.doesNotMatch(dashboard, /Great job! No weak areas detected/)
})

test('service worker uses network-first navigation instead of cache-first index.html', () => {
  const sw = read('../frontend/public/sw.js')
  assert.match(sw, /networkFirst/)
  assert.match(sw, /request\.mode === 'navigate'/)
  assert.doesNotMatch(sw, /PRECACHE_URLS/)
})

test('costly voice/image endpoints are rate limited', () => {
  const limiter = read('src/middleware/limiter.js')
  for (const route of [
    '/api/ai/generate-image', '/api/voice/stt', '/api/voice/chat',
    '/api/voice/tts', '/api/tts',
  ]) {
    assert.match(limiter, new RegExp(`app\\.use\\(['"]${route.replace(/\//g, '\\/')}['"]`))
  }
})

test('voice routes do not reflect raw upstream errors to clients', () => {
  const voice = read('src/routes/voice.routes.js')
  assert.doesNotMatch(voice, /' \+ err\.message/)
  assert.doesNotMatch(voice, /`[^`]*\$\{err\.message\}/)
  assert.doesNotMatch(voice, /authenticateToken/)
  assert.match(voice, /\.slice\(0, 2000\)/)
})

test('CORS rejection does not disclose the allowed-origin list', () => {
  const server = read('server.js')
  assert.doesNotMatch(server, /Allowed: \$\{ALLOWED_ORIGINS/)
  assert.match(server, /\{ error: ['"]Forbidden['"] \}/)
})

test('study deck save does not leak raw DB errors', () => {
  const study = read('src/routes/study.routes.js')
  assert.doesNotMatch(study, /'Failed to save deck: ' \+ err\.message/)
})

test('AI fallback HTML-escapes reflected user text', () => {
  const ai = read('src/services/aiService.js')
  assert.match(ai, /escapeHtml|replace\(\/[<>&]["']\/g/)
})

test('AI safe mode cannot return simulated chat answers or random retrieval embeddings', () => {
  const ai = read('src/services/aiService.js')
  const aiRoutes = read('src/routes/ai.routes.js')
  const rag = read('src/services/ragService.js')
  assert.doesNotMatch(ai, /AI_SAFE_MODE|simulated response/i)
  assert.doesNotMatch(aiRoutes, /AI_SAFE_MODE|simulated response/i)
  assert.doesNotMatch(rag, /AI_SAFE_MODE|Math\.random/)
})

test('gmail.com is an allowed email domain', () => {
  const middleware = read('src/middleware/auth.js')
  const envExample = read('.env.example')
  assert.match(middleware, /@gmail\.com/)
  assert.match(envExample, /@gmail\.com/)
})
