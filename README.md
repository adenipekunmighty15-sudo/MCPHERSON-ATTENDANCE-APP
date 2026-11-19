# McPherson Attendance App

Vue/Vite frontend with an Express API backed by Supabase/PostgreSQL.

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

Authentication uses Supabase Auth. The frontend signs users in directly with
Supabase using the public **anon** key; the backend verifies the access token
with the private **service_role** key and reads the authoritative role from
`public.users`.

1. In Supabase → Project Settings → API, copy the Project URL, anon key and
   service_role key.
2. `backend/.env`: set `VITE_SUPABASE_URL` (the project URL) and
   `SUPABASE_SERVICE_KEY` (the service_role key — never the anon key), plus
   `DATABASE_URL`.
3. `frontend/.env`: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   In production these must also be set in the Vercel project because Vite
   inlines them at build time.
4. In Supabase → Authentication → URL Configuration, add the deployed origin
   plus `/auth/callback` and `/reset-password` as redirect URLs. Enable the
   Google provider only if you use the Google sign-in button.
5. Allowed email domains default to `@mcu.edu.ng`,
   `@undergraduate.mcu.edu.ng`, `@mcpherson.edu` and `@gmail.com`. Override
   them with `ALLOWED_EMAIL_DOMAINS` (comma separated) in `backend/.env`.
   Admin and super-admin accounts are exempt.

With no credentials configured, the UI shows readable "authentication is not
configured" messages and protected API routes return 503. Guest logins and
invented accounts are not accepted.

## Deployment

Deploy the API on Render and the static frontend on Vercel. Set `VITE_API_URL`
in the Vercel project to the Render API origin ending in `/api`, and set `CORS_ORIGINS` on Render
to the Vercel application origin. Configure secrets in each provider's
environment-variable settings; do not put credentials in this repository.

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
`backend/.env` or the process environment.

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
