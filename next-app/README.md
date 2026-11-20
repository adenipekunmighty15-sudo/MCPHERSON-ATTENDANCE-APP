# McPherson Next shell

The primary Next.js + TypeScript + Tailwind + Lenis entry surface for McPherson University. It links into the working Vue attendance portal and does **not** replace or duplicate the attendance backend workflows.

## Run

```powershell
cd next-app
npm install
npm run dev
```

Open `http://localhost:3000`. Set `NEXT_PUBLIC_PORTAL_URL` to the Vue portal origin before building for production, for example `https://mcpherson-attendance-app-pe1c.vercel.app`.

## Verify

```powershell
npm run typecheck
npm run lint
npm run build
```

## Interactions

- Flip-book hero card with click/keyboard page turn, pointer tilt, glare and springy press response.
- Pointer-parallax campus image, magnetic calls to action and a low-opacity cursor spotlight.
- Lenis scroll smoothing plus a fixed scroll-progress line.
- Scroll-synced three-chapter story with active index, progress rail and a rotating interactive object.
- Scrambled text animation on the hero headline, with reduced-motion and focus replay support.

The Vue portal remains available as the working legacy attendance app; this app is the primary entry surface, not a replacement backend.

## Assets

The crest and campus photograph are copied from the existing authenticated repository assets. See `../docs/ASSET_MANIFEST.md` for provenance and outstanding university-supplied assets.
