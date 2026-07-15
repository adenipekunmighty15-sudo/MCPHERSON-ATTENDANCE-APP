McPherson Attendance — Design deliverables (seed)

What I created here:

1) design/design_tokens.json
   - Color palette, fonts, spacing, radii, shadows and desktop artboard size (1440x900).

2) frontend/src/components/DesignButton.vue
   - A sample, reusable Vue component showing how to apply the design tokens / Tailwind utility classes.

3) design/FIGMA_IMPORT_INSTRUCTIONS.txt
   - Step-by-step instructions to import the tokens and assets into Figma and create artboards for each page.

Next recommended steps (automated or manual):
- Import design/design_tokens.json into the Figma Tokens plugin (or recreate tokens manually).
- Create a new Figma file and set the page size to 1440 x 900 for desktop artboards.
- Create master components in Figma for: Button, Input, Card, Table Row, Modal (Face ID), Navbar, ID Card, Badge, Metric Card.
- Create one artboard per app page (see list below) and wire them into an interactive prototype.

Pages to include as artboards (from the repo):
- Dashboard
- Attendance
- AdminDashboard
- LiveTracking
- FaceRegistration (modal)
- Timetable
- Profile
- Courses
- StudyHub / StudyPlan / StudyGroupDetail
- Auth screens (Login, Signup, ForgotPassword)
- Settings
- Messages / Chat
- NotFound

Where to find source styles:
- frontend/tailwind.config.js contains typography, spacing, radii and color tokens used by the app.
- frontend/src/assets contains campus and id-card images that can be used in mockups.

Deliverable package guidance:
- I can now generate high-fidelity PNG mockups for every artboard and scaffold Vue component templates for all major components if you want me to proceed.
- Alternatively, follow the Figma import instructions to reconstruct the design system inside Figma, then I can export components as Figma .fig or provide a ZIP of SVG assets.

Tell me which next step to run:
- Generate all high-fidelity PNG mockups and scaffold Vue templates (I will create files under design/ and frontend/src/components/)
- Create more sample components (Card, Input, Modal)
- Export SVGs for icons and UI elements
- Or upload to your Figma (requires token)

