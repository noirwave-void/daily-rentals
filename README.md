# Haven MVP

A Vite + React single-page MVP for Haven's daily-rentals experience. It intentionally uses a small custom component and CSS-token layer rather than a UI-kit dependency, keeping the first release quick to iterate on and easy to audit for accessibility.

## Run it

```powershell
npm install
npm run dev
```

## Included flows

- Search results with a large labeled search form, optional filters, property list, and visible map view.
- Listing detail with gallery, clear amenities, full price summary, and a direct continuation button.
- Booking review and a plain-language confirmation dialog before a booking is committed.

## Accessibility choices

- `#FAF6EF`, `#1F4D3D`, `#B98A3F`, and `#262220` are centralized as CSS custom properties.
- Fraunces is used for headlines and Inter for UI copy; body copy begins at 16px.
- All interactive controls have a 44px-or-larger height or equivalent hit target.
- Every form control has a visible label. The persistent Help bar includes a tap-to-call phone number.
- Navigation stays visible and labeled; the flow provides explicit back controls and no gesture-only actions.

## Supabase setup

The user data schema is in `supabase/migrations/202609220001_haven_schema.sql`. It creates protected profiles, saved listings, and bookings tables, plus a profile trigger for new authenticated users. Create a Supabase project, copy `.env.example` to `.env.local`, set its URL and anon key, and apply the migration using the Supabase SQL editor or CLI. A live project cannot be created from this workspace without the project/account credentials.
"# daily-rentals" 
