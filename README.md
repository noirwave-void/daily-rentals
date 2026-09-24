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

The migrations in `supabase/migrations/` create protected profiles, inventory, availability, reviews, saved listings, bookings, and transactions. They also add the atomic `book_listing` function, which prevents overlapping confirmed/pending reservations.

1. Create a Supabase project and enable Email/Password authentication.
2. Copy `.env.example` to `.env.local` and set its URL and anon key.
3. Apply migrations in order using the Supabase SQL editor or `supabase db push`.
4. Deploy the functions: `supabase functions deploy create-payment-intent stripe-webhook send-booking-email`.
5. Add the server secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `MAIL_FROM`.

Configure Stripe to send `payment_intent.succeeded` events to the `stripe-webhook` function. The webhook marks both the payment transaction and booking as confirmed. `send-booking-email` is ready to send a confirmation after the payment completes.

The application deliberately uses mock listings until Supabase is connected. The live data operations are in `src/rental-api.js`; use them as the integration layer when swapping the demonstration inventory for database queries.
"# daily-rentals" 
