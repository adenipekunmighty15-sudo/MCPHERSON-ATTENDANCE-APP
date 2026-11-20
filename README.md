# McPherson Attendance App

Vue 3 + Vite + Tailwind frontend with Lenis smooth scrolling, GSAP, Motion-v and Three.js, backed by an Express API and Supabase/PostgreSQL.

## Live app

**[Open the deployed app](https://mcpherson-attendance-app-pe1c.vercel.app/welcome?redirect=/)**

## Local development

1. Install Node.js 20 or later.
2. Create `backend/.env` with the server credentials. Never commit this file.
3. Install dependencies in `backend` and `frontend`:

   ```powershell
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

4. Start the API with `npm run dev` from `backend`.
5. In another terminal, start the UI with `npm run dev` from `frontend`.
6. Set `VITE_API_URL` to the API origin for the frontend build.

The API requires `DATABASE_URL`, `VITE_SUPABASE_URL`, and `SUPABASE_SERVICE_KEY`.
Face registration additionally requires a private 32-byte hexadecimal
`FACE_ENCRYPTION_KEY`. Existing unencrypted face descriptors are not returned;
users must delete them and re-enroll after applying the face-data migration.
Generate the key with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
and store it only in the API host's secret environment settings.
Session check-in additionally requires a separate private 32-byte hexadecimal
`SESSION_CHECKIN_SECRET`, generated the same way. Session creation and check-in
are disabled until it is configured; lecturers then display the rotating
six-digit code for students to enter with their GPS location.
Configure only the AI provider keys needed by enabled features. Set `CORS_ORIGINS`
to the exact frontend origins and `TRUST_PROXY=true` when running behind Render's
proxy. `ATTENDANCE_LATE_AFTER_MINUTES` controls the check-in grace period (15
minutes by default).

## Authentication setup

Authentication uses Supabase Auth as the credential and session authority. The
frontend fetches the public Project URL and anon key at runtime from
`GET /api/public/config`. The browser calls `POST /api/auth/signup` or
`POST /api/auth/login`; the API re-validates input, applies account policy, and
hands the short-lived Supabase session back to the browser. Every protected API
request is verified with the private **service_role** key, and the authoritative
role and active flag are read from `public.users`.

1. In Supabase → Project Settings → API, copy the Project URL, anon key and
   service_role key.
2. `backend/.env`: set `VITE_SUPABASE_URL` (the project URL),
   `VITE_SUPABASE_ANON_KEY` (the public anon key returned by the bootstrap
   endpoint), and `SUPABASE_SERVICE_KEY` (the service_role key — never the anon
   key), plus `DATABASE_URL`.
3. In production these values belong on the API host (Render), not Vercel.
   The browser never receives the service_role key or any AI key.
4. In Supabase → Authentication → URL Configuration, add the deployed origin
   plus `/auth/callback` and `/reset-password` as redirect URLs. Enable the
   Google provider only if you use the Google sign-in button.
5. Allowed email domains default to `@mcu.edu.ng`,
   `@undergraduate.mcu.edu.ng`, `@mcpherson.edu` and `@gmail.com`. Override
   them with `ALLOWED_EMAIL_DOMAINS` (comma separated) in `backend/.env`.
   Admin and super-admin accounts are exempt.
6. Sign-up is self-service for allowed domains: `POST /api/auth/signup` (with
   `/api/auth/register` kept as a compatibility alias) validates the payload,
   creates the Supabase user with `email_confirm: true`, writes the
   `public.users` profile with role `student`, and the frontend immediately
   starts a session. There is no confirmation-email step for new accounts. If
   an older unconfirmed account exists, signing up again resends its
   confirmation email instead of changing the account. After confirming, the
   user can choose a new password with Forgot password. Client-supplied roles
   are ignored.
7. `POST /api/auth/login` verifies the password through Supabase's salted,
   slow hash, checks `public.users.is_active`, updates `last_login`, and
   returns only safe profile fields. Wrong credentials always produce the same
   generic `401`; signup/signin/logout have independent rate limits.
8. `POST /api/auth/logout` revokes the current refresh token server-side and
   the browser clears its local session. Access tokens remain valid until
   their short expiry; expired API calls return the user to sign-in with a
   session-expired notice. "Remember me" chooses persistent vs. tab-scoped
   session storage. Redirect parameters are restricted to safe same-origin
   paths.
9. To also disable Supabase's project-level "Confirm email" switch (so no direct
   client call can spend the built-in email allowance), add a Supabase personal
   access token as `SUPABASE_ACCESS_TOKEN` in the gitignored `backend/.env` and
   run `node scripts/disable-supabase-email-confirmation.mjs` once. The token is
   never printed or committed.

With no credentials configured, the UI shows readable "authentication is not
configured" messages and protected API routes return 503. Guest logins and
invented accounts are not accepted.

## Attendance check-in rules

- The live-session list is authenticated. Students only receive sessions for
  courses where they have an `active` row in `public.enrollments`; lecturers see
  their own sessions; administrators see all sessions.
- Check-in requires an active session, a valid rotating six-digit code, device
  GPS coordinates with accuracy of 100 m or better, and an active enrollment for
  the session's course. Student-supplied role, course, status and enrollment are
  never trusted.
- A student must have an active enrollment row before check-in will succeed. If
  legacy data has missing enrollments, import them first — do not bypass this
  check.
- Check-in attempts and session/code endpoints have dedicated in-memory rate
  limits with `Retry-After`. For multiple backend instances, replace the
  in-memory stores with a shared Redis-backed store.

## Deployment

Deploy the API on Render and the static frontend on Vercel. Set `VITE_API_URL`
in the Vercel project to the Render API origin ending in `/api`, and set `CORS_ORIGINS` on Render
to the Vercel application origin. Configure secrets in each provider's
environment-variable settings; do not put credentials in this repository.

### Environment variables for the live deployment

Vercel (frontend):

- `VITE_API_URL` — already set in `vercel.json`. Supabase URL and anon key are
  fetched at runtime from `GET /api/public/config`, so a missing Vite env value
  cannot put authentication into maintenance mode.

Render/API host (private secrets — **do not** add these to Vercel, because Vite
inlines `VITE_*` values into the browser bundle):

- `DATABASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` — public value used by the browser bootstrap endpoint
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY` — optional Claude Messages API key. The chat uses Claude Sonnet 5.5 when configured.
- `ANTHROPIC_MODEL` — optional model override; defaults to `claude-sonnet-5-5`.
- `NVIDIA_API_KEY` — master NVIDIA key. Reaches any NVIDIA-hosted model and is
  used for generation, image understanding, and as the Kimi fallback.
- `NVIDIA_MODEL` — defaults to `nvidia/nemotron-3.5-lightning-30b-a3b`.
- `NVIDIA_VISION_MODEL` — defaults to `nvidia/nemotron-3.5-super-vl-120b-a12b`.
- `NVIDIA_PARAKEET_KEY` — lecture transcription/notetaker key (Riva gRPC).
- `KIMI_KEY` — optional dedicated Kimi key; the master NVIDIA key is used when absent.
- `KIMI_MODEL` — defaults to `moonshotai/kimi-k3.1-pro`.

All of these stay on the API host. The browser only receives the two public
Supabase values from `GET /api/public/config`; no AI key is ever sent to it.
Changing those API-host values does not require a frontend rebuild.

## Database updates

Initialize an empty database from `backend/scripts/schema_corrected.sql`, then
apply each numbered SQL update in `backend/src/migrations` once, in order.
Migrations 007–014 add attendance protections, venue ownership, complaint and
library features, face-data privacy, Data API lockdown, study-group invites,
and private direct messaging.
Migration 012 disables direct Supabase Data API access to public tables; the application
uses the authenticated backend API for database operations. The
attendance uniqueness migration stops if existing duplicate check-ins need
resolution; resolve those records before applying it. These SQL updates are not
run automatically by the API.

The schema deployment scripts require `DATABASE_URL` and read it from
`backend/.env` or the process environment. To enforce the strict "no nullable
application data" rule on a live database, run:

```powershell
cd backend
node scripts/enforce-public-not-null.mjs
```

This creates the chat tables if missing, backfills existing NULLs with safe
defaults, sets every `public` application column to `NOT NULL`, and verifies the
result. It does not alter Supabase-managed schemas (`auth`, `storage`,
`realtime`, `vault`, `extensions`).

The identifier columns and uniqueness constraints used by sign-up are applied
separately (safe to re-run; existing empty identifiers are ignored):

```powershell
cd backend
node scripts/create-auth-constraints.mjs
```

The university structure (faculties, departments, programmes, academic years,
semesters, grade system, enrolments and lecturer/course links) is created
separately. It is seeded from the canonical catalogue in
`frontend/src/data/university.js` and never drops existing tables:

```powershell
cd backend
node scripts/create-university-structure.mjs
```

## Security notes

- Rotate any database credential that has appeared in source control, then
  update the hosting environment variables. Removing it from the current file
  does not remove copies from Git history.
- Browser GPS is a location signal, not proof of physical presence. Use a
  lecturer-controlled rotating code or a verified attendance provider before
  treating location alone as strong identity verification.
- Face, QR, and NFC check-in are not currently verified by the server.
- Wallet funding and client-triggered XP awards remain disabled until trusted
  payment events and server-verified activity are implemented.
