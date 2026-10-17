# Haven fresh prototype

A clean React + TypeScript prototype for Haven daily rentals. It is separate from the existing app.

## Run locally

```powershell
cd haven-fresh
npm install
npm run dev
```

## Included

- Responsive stay discovery with destination, check-in/check-out, guest counter, maximum nightly price, and Instant Book filters.
- Sample property detail and price summary dialog with a split action for booking, saving, and copying a stay link.
- A demo sign-in dialog that clearly indicates Supabase Auth is not connected in this standalone prototype.
- GSAP ScrollSmoother on larger viewports, a restrained photo crossfade/parallax treatment, and a reduced-motion fallback.
- An accessible split action on the stay detail view for continuing, saving, or copying the stay link.

All stay names, prices, and locations are sample inventory. The Unsplash property photos are placeholders for verified Haven photography. The sign-in and booking actions are UI prototypes and need Supabase and a payment provider before launch.

ScrollSmoother, ScrollToPlugin, and ScrollTrigger are loaded from the GSAP CDN scripts in `index.html` in the order from the supplied demo. A native-scroll fallback remains when motion is reduced, the viewport is small, or the CDN is unavailable. The Aceternity parallax-hero package is not included: its pointer-driven movement duplicates the requested scroll parallax and would add a Tailwind setup that this focused prototype does not otherwise need.
