# McPherson Attendance — Asset Manifest

This application is single-tenant and uses McPherson University branding only.

## Authentic assets already in the repository

| Asset | Path | Used for | Status |
| --- | --- | --- | --- |
| Official crest / logo | `frontend/src/assets/mcu-logo.png` | Login lockup, dashboard header, ID card, admin shell | In use. Do not replace with a generated logo. |
| Campus photograph | `frontend/src/assets/mcu-campus.jpg` | Login hero, landing hero, ID-card watermark | In use. 16:9 crop; keep important architecture away from edges. |

> Before public launch, confirm reuse permission for both assets with the university. If permission is withheld, replace the photograph with a tasteful abstract navy/blue surface rather than an unrelated institution's building.

## Original illustrations created for this redesign

These are original vector illustrations, not photographs and not fabricated screenshots. They contain no personal data and do not claim that attendance was recorded.

| Intended use | File | Notes |
| --- | --- | --- |
| Attendance verification state | `frontend/src/assets/illustrations/attendance-verification.svg` | Phone with QR frame, secure device symbol, navy/blue/white language. Use beside session-code/GPS verification UI. |
| Successful check-in | `frontend/src/assets/illustrations/attendance-success.svg` | Checkmark in a circular confirmation ring with restrained accents. Only display after the backend confirms the record. |
| Empty attendance history | `frontend/src/assets/illustrations/empty-history.svg` | Calendar with empty slots. Use for empty or filtered-to-empty history states. |
| Social share card | `frontend/public/og-image.svg` | Brand card replacing the previously missing `og-image.png`. SVG renders in modern browsers; export a 1200×630 PNG when a social platform requires raster. |

## Still required from the university (do not fabricate)

| Intended use | Desired file | Requirement |
| --- | --- | --- |
| Dashboard welcome banner | `frontend/src/assets/mcu-campus-welcome.jpg` | A compact, bright, authentic campus building or walkway photograph, wide crop, natural daylight. Until supplied, reuse `mcu-campus.jpg` with a dark overlay or omit the image. |
| Additional campus contexts | `frontend/src/assets/mcu-campus-*.webp` | Authentic lecture halls, academic environment, green landscaping. Only add when supplied or licensed. Do not substitute stock photos of unrelated universities. |
| Official brand guide | `docs/brand/mcu-brand-guide.pdf` | Confirm the exact institutional colours, crest usage rules and typography. Current tokens (`#010A2A`, `#428BCA`, `#F9AC8A`, `#FFFFFF`, Inter) are the working direction. |

## Implementation notes

- Store raster assets compressed; prefer WebP with a JPEG fallback where supported.
- Use meaningful `alt` text. Decorative images use `alt=""` and `aria-hidden="true"`.
- Reserve aspect ratios to avoid layout shift; lazy-load non-critical images.
- Never expose private user-uploaded faces or documents in public directories.
- Face/biometric descriptors are stored encrypted on the backend and are never rendered as public assets.
