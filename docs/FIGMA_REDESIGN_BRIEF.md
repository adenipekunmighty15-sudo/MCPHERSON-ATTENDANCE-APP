# McPherson portal redesign brief

## Connected Figma file

- [McPherson University Portal Redesign](https://www.figma.com/design/X4wie2LLKcMBXB32MyqURC)
- The file contains a project overview, the foundations board, shared component samples, and a desktop student dashboard.
- The connected Starter plan limits this file to three pages and blocked further Figma MCP calls during this session. The remaining app flows are covered by the shared code design system, but still need dedicated Figma frames.

## Goal

Create a cohesive, responsive Figma design for the McPherson University portal that keeps the existing student, AI study, and administration workflows recognizable. Use the current parchment, forest, and clay palette as the starting point, with light and dark modes and accessible contrast.

## App surfaces

- `next-app/` is the Next.js entry surface: marketing/welcome, sign in, sign up, password recovery, and the Next.js dashboard shell.
- `frontend/` is the Vue portal with the working student and admin workflows.

The Figma file should make the shared brand and navigation clear across both surfaces while preserving their route-specific features.

## Requested Figma coverage

1. **Foundations** — color and type variables, spacing, radii, elevation, focus states, light/dark modes.
2. **Student portal** — desktop and mobile dashboard, course list/detail, attendance log/check-in, timetable, profile, and settings.
3. **Study and AI** — Study Hub workspace, materials library, flashcard/quiz review, study plan, AI chat empty state, active conversation, and narrow-screen chat.
4. **Administration** — admin dashboard, university administration tables, filters, forms, empty/error/loading states, and mobile navigation.
5. **Entry and authentication** — welcome screen, login, signup, forgot/reset password, and callback/loading states.
6. **Components** — shared app shell, sidebar/mobile navigation, page header, buttons, fields, cards, status badges, tables, dialogs, toasts, and chat composer.

## Existing code references

- Shared Vue color and typography tokens: `frontend/src/design-kit/tokens.css`
- Student shell and navigation: `frontend/src/components/Layout.vue`
- Admin shell and navigation: `frontend/src/layouts/AdminLayout.vue`
- Study Hub and focus timer: `frontend/src/pages/StudyHub.vue`
- Attendance workflow: `frontend/src/pages/Attendance.vue`
- Course workflow: `frontend/src/pages/Courses.vue`
- AI conversation surface: `next-app/components/chat/AIChatWorkspace.tsx` and `next-app/components/chat/chat.module.css`
- Next.js entry/auth surfaces: `next-app/app/`

## Design constraints

- Design desktop and mobile states for high-use student screens; do not treat the desktop frame as a scaled mobile design.
- Keep attendance check-in, course enrollment context, AI status, attachments, conversation history, and admin actions visible in the relevant states.
- Include loading, empty, error, disabled, focus, and success states for data-backed screens.
- Preserve keyboard focus indicators, readable contrast, and reduced-motion behavior.
- Reuse available Figma library components and variables if present. If the connected file has no applicable library, create local variables and reusable components before composing screens.

## Suggested starting frames

- Student dashboard: 1440 px desktop and 390 px mobile.
- Attendance: 1440 px desktop and 390 px mobile, including active-session and no-session states.
- Study Hub: 1440 px desktop and 390 px mobile.
- AI chat: 1440 px desktop, 390 px mobile, and active conversation with attachments.
- Admin dashboard: 1440 px desktop and 390 px mobile.
- Login: 1440 px desktop and 390 px mobile.
