# Implementation status — McPherson attendance redesign

Branch: `redesign/mcpherson-attendance-experience`
Scope: single university (McPherson University), Cubbes-inspired workflow, original McPherson identity.

## What was actually executed and verified

- Repository audit completed for both frontend and backend (read-only subagents).
- `frontend`: `npm run build` passes. No compile errors. Only known Rollup chunk-size/dynamic-import warnings remain.
- `backend`: `npm test` passes, including new assertions for authenticated/scoped live sessions, enrollment verification, required GPS accuracy and endpoint rate limits.
- No deployment, no production data changes, no migrations executed. All work is committed and pushed on `redesign/mcpherson-attendance-experience`.

## Completed in this pass

| Area | Result |
| --- | --- |
| Single-tenant identity | One McPherson configuration; no university selector. Legacy config-shaped helpers remain for maintenance only. |
| 3D ID card | Slim beveled card, raised resting position with reserved layout space, scroll parallax that returns to origin, pointer tilt, glare/sheen, press compress, click/keyboard flip, idle float, double-click verified pulse, focus ring, reduced-motion static mode. |
| Premium interaction layer | `v-reveal`, `v-tilt`, `v-parallax`, `v-magnetic`, `v-ripple`, `v-spotlight`, `SpatialScene`, `SpatialImage`, `SpatialRail`, `ScrollProgress`. Now used on Landing, Dashboard, Login showcase/auth actions and Attendance. |
| Attendance security | Authenticated/scoped `/api/sessions/active`; enrollment verified server-side at check-in; required GPS accuracy; dedicated rate limits for check-in/session/code endpoints with `Retry-After`. |
| Attendance UI | McPherson palette and Inter typography applied to Attendance; original verification, success and empty-history illustrations wired into real states. |
| Assets | Authentic crest and campus photo retained; original SVG illustration set and social share card created; `docs/ASSET_MANIFEST.md` documents what still needs the university. |
| Documentation | README updated with check-in rules; this status report separates verified work from external dependencies. |
| Motion principles | Reusable directives for exaggeration, origin awareness, staggering, squash/stretch, rubber banding, anticipation, arcs, follow-through, secondary action, peak-end emphasis, frequency of use and Doherty-threshold timing. Applied to Landing, Dashboard, Attendance, Login and the ID card. |
| Companion stack | `next-app/` is now the primary entry surface using Next.js App Router, TypeScript, Tailwind CSS and Lenis. It adds a flip-book hero, pointer-parallax campus art, magnetic actions, cursor spotlight, scroll progress, scroll-synced storytelling index, an interactive 3D object and scrambled text. The Vue portal remains as the working legacy attendance app until its flows are ported. |

## Stack note

The attendance portal remains Vue 3 + Vite + Tailwind with Lenis smooth scrolling, GSAP, Motion-v and Three.js. A separate `next-app/` companion surface uses Next.js App Router, TypeScript, Tailwind and Lenis; it links into the Vue portal and does not replace it. The original framework choice was kept deliberately because a full portal rewrite is a separate, high-risk migration.

## Motion principle mapping

| Principle | Implementation |
| --- | --- |
| Exaggeration, squash/stretch, rubber banding | `v-squash` with compressed press and cancelable spring release; ID card press compression. |
| Origin awareness | `v-origin` pointer-relative transform origin; ID card pivots from the touched point. |
| Staggering | `v-stagger` with `IntersectionObserver` and per-child delay. |
| Anticipation | `v-anticipate` wind-up before settling. |
| Arcs | `v-arc` curved path using the independent `translate` property so parallax/tilt still compose. |
| Follow-through, secondary action | `v-follow` delayed motion trail; ID card shadow settles after the card. |
| Von Restorff effect, peak-end rule | `v-peak` single coral emphasis pulse on the highest-value element. |
| Doherty threshold, timing, slow-in/slow-out | 90 ms primary feedback, shared easing tokens, interruptible animations. |
| Fitts's law, frequency of use | `ux-touch-target` 44 px minimum on coarse pointers; strong response on primary actions, quiet response on secondary actions. |
| Hick's law | Secondary actions stay visually quiet until hover/focus. |
| Solid drawing | `ux-solid` and `preserve-3d` keep the ID card and hero art volumetric through motion. |

## Already present in the repository (audited, not rebuilt)

Student dashboard with backend metrics, timetable, courses, quick actions; attendance history and filters; lecturer session controls with rotating code; admin portal and university-admin tabs; auth with Supabase, Remember Me, forgot/reset password, Google OAuth callback, role guards and logout; study hub, messaging, complaints and live tracking.

## Requires external configuration or approval

- QR check-in, WebAuthn/biometric check-in, virtual session types and lecturer manual corrections with audit log are **not implemented** in the backend. The current verified path is rotating code + GPS geofence. Do not present the others as working.
- Notifications tab in `UniversityAdmin.vue` is explicitly unavailable; delivery mechanisms need a backend decision.
- `gmail.com` remains an allowed signup domain and admin/super-admin accounts bypass the domain allowlist. Tighten only after ICT confirms staff accounts.
- Rate-limit counters are in-memory. Shared Redis storage is required if the API runs on multiple instances.
- Geofence is skipped when a lecturer starts a session with no venue. Require a venue for physical sessions before relying on location verification.
- One attendance row per course/day blocks multiple sessions of the same course on one day. Schema change needs an explicit, reviewed migration — not executed here.
- Destructive `DROP TABLE ... CASCADE` statements exist in some re-runnable SQL scripts; consolidate before any migration run.
- Authentic campus welcome photograph and official brand guide were not obtainable from the repository. See `docs/ASSET_MANIFEST.md`. No stock university imagery was substituted.
- Screenshots were not captured because this environment has no browser automation tool. Visual review must be done manually with `npm run dev`.
- Live login/logout, GPS check-in and role flows were not exercised against the production Supabase project. Use a development project and test accounts before release.

## Local run

```powershell
cd backend
npm install
npm run dev
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Set backend secrets in `backend/.env` and `VITE_API_URL` for the frontend as described in `README.md`.

## Deployment (not performed)

Deploy the API on Render and the static frontend on Vercel, configure the exact `CORS_ORIGINS`/`VITE_API_URL` pair, and keep all service keys on the API host. Do not deploy until the outstanding items above are triaged and manual visual/QA checks pass.
