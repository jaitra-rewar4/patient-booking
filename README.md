# Apex Health — Patient Booking

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/jaitra-rewar4/patient-booking)

A simple patient appointment booking flow with a clinic admin view, built as a take-home for Vero. The goal was to demonstrate product judgment, code quality, UX, and reliability on a realistic clinical-workflow problem within a tight timebox.

## Quick start

### Open in your browser (no install)

Click the **Open in GitHub Codespaces** badge above. GitHub spins up a Linux VM in your browser, installs dependencies (~30s), and auto-opens the running app on port 3000. The badge does everything end-to-end — `prisma generate`, `db push`, seed, `npm run dev` — via the `.devcontainer` config in this repo. You need a GitHub account; the free Codespaces tier gives 60 hours/month.

### Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

That's it. `postinstall` runs `prisma generate`, sets up the SQLite schema, and seeds the database with sample physicians, two weeks of slots, and a few example bookings — so the app is ready to use the moment `npm run dev` finishes.

Then open:

- **`http://localhost:3000`** — landing page
- **`http://localhost:3000/book`** — patient booking flow
- **`http://localhost:3000/admin`** — clinic admin view (gated by password)

The admin password is in `.env`: `ADMIN_PASSWORD=demo-admin-2026`. Visiting `/admin` redirects to a login page; once signed in you stay logged in for 24 hours via a signed cookie.

To reset the database to a clean seeded state at any time: `npm run db:reset`.

## What I built

A single Next.js 15 app with two surfaces and a shared data layer.

### Patient flow (`/book`)

A four-step flow: choose clinician → choose time → enter your details → review and submit. Submitting creates a booking in `PENDING` state; the patient lands on a confirmation screen explaining that the request still has to be confirmed by the clinic.

### Clinic admin (`/admin`)

A bookings table with status filters, clinician filter, debounced patient-name search, and four small stat cards across the top (Pending, Confirmed, Today, This week). Clicking a row on desktop opens a dialog with full patient details, Confirm / Cancel actions, and an inline email-preview toggle. Mobile users get a stacked card layout with the same actions inline. Action results surface as toasts rather than an inline error banner.

The `/admin` route is gated by a single shared staff password — a deliberately lightweight stand-in for real auth (see "Scope choices" below).

### Confirmation page (`/book/confirm`)

After submitting, patients land on a confirmation page that animates a check-in mark, recaps the request, and shows an **email preview** — a styled mockup of what the confirmation email would look like in production. No email is actually sent.

### Data model

```mermaid
erDiagram
    Physician ||--o{ Slot : "schedules"
    Physician ||--o{ Booking : "owns"
    Slot ||--o{ Booking : "fills"

    Physician {
        string id PK "cuid"
        string name
        string specialty
        string bio
        datetime createdAt
    }
    Slot {
        string id PK "cuid"
        string physicianId FK
        datetime startTime
        datetime endTime
        datetime createdAt
    }
    Booking {
        string id PK "cuid"
        string physicianId FK
        string slotId FK
        string patientName
        string patientDob "ISO date (YYYY-MM-DD)"
        string patientEmail
        string patientPhone
        string reasonForVisit
        string status "PENDING | CONFIRMED | CANCELLED"
        datetime createdAt
        datetime updatedAt
    }
```

**Indexes** — `Slot(physicianId, startTime)` for fast availability lookups; `Booking(physicianId, status)` and `Booking(slotId, status)` for the admin filters and the slot-conflict re-check inside `createBooking`.

**Invariant** — a Slot can have many historical Bookings (cancelled ones), but at most one in `PENDING` or `CONFIRMED` at a time. The state machine plus the transactional re-check in `createBooking` enforce this in code; in Postgres I'd back it up with a partial unique index `ON Booking(slotId) WHERE status != 'CANCELLED'`.

**Generation** — slots are pre-seeded per physician (weekdays, 9 AM – 5 PM, 30-min intervals, lunch hour skipped, two weeks ahead). Availability is derived: a slot is "available" if it starts in the future and has no `PENDING` or `CONFIRMED` booking. Cancelling a booking releases the slot.

**Why dates as ISO strings for DOB** — date-only fields (birthdays) shouldn't carry a timezone. Storing as `"1992-11-08"` avoids the off-by-one-day bugs you get when a `DateTime` in UTC renders as the previous day in a negative-offset timezone.

## Key technical & product decisions

**Stack: Next.js 15 (App Router) + TypeScript + Prisma + SQLite + Tailwind.** This keeps the entire app in one repo, runnable with `npm install && npm run dev` and zero infrastructure. SQLite means the grader doesn't need Docker, Postgres, or any environment setup. Server actions handle all mutations, which keeps the API surface tight and type-safe end-to-end.

**Booking *request*, not booking.** A new booking starts in `PENDING`, not `CONFIRMED`. The patient confirmation page makes this distinction explicit ("your booking has been requested … the clinic will confirm shortly"). This matches how real clinics actually work and avoids overpromising to patients — a small product call that I think matters in healthcare.

**Status as a state machine.** Transitions are defined in one place (`src/types/index.ts`): `PENDING → CONFIRMED|CANCELLED`, `CONFIRMED → CANCELLED`, `CANCELLED → ∅`. The admin UI hides actions that aren't valid from the current state, and the server action re-validates the transition before writing. Invalid states should be unrepresentable in both the UI and the data layer.

**Slot conflict handling.** Two patients can pick the same slot before either submits. I handle this with a transactional re-check inside `createBooking`: read the slot with its active bookings, fail fast if it's taken, otherwise create. If the conflict happens, the patient is bounced back to step 2 with their form data preserved and a clear message explaining what happened. SQLite's transaction semantics aren't strong enough to fully eliminate the race — see "What I'd improve" below.

**Mobile-first throughout.** Every page works on phone-sized viewports. The booking flow uses a responsive grid for the slot picker and a single-column form layout. The admin table swaps to stacked cards under `md`. Vero's JD called out cross-device behavior, and most patient bookings happen on phones.

**Reason-for-visit treated as PHI.** The form has an explicit reminder ("This information is treated as protected health information"), a sensible character limit, and the demo banner across the entire app makes the non-clinical context unambiguous.

**Server-side validation, twice.** Zod schemas live in `lib/validations.ts` and are reused by the form (for inline errors) and the server action (as the source of truth). Even if the client is bypassed, no malformed booking can be written.

**Custom UI primitives, not generic shadcn.** I wrote thin Button, Input, Label, Textarea, and StatusBadge components with a cohesive editorial look — Fraunces (display) + Geist Sans (body), warm cream + ink + forest accent palette. It signals taste without spending hours on a design system. I selectively pulled in two Radix primitives — Dialog (booking detail on desktop) and Toast (action feedback on `/admin`) — but custom-themed them to match.

**Scope choices: lightweight auth and email preview.** Vero's brief explicitly excluded full authentication and email sending. I built lightweight versions of both — a single shared staff password gate on `/admin` only, and an in-app email preview rendered on `/book/confirm` and inside the admin booking dialog — to demonstrate awareness of these production concerns without the engineering risk of building them fully in a 4-day window. The gate is a homemade HMAC-SHA256 signed cookie via Web Crypto so it works in middleware (no auth library, ~120 LOC); patient surfaces stay open. The email preview is a styled component, never sent. In production this would be SSO with role-based access for clinic staff, and transactional email via a service like Resend with a templated React-email layout.

## What I'd improve with more time

In rough priority order:

- **Real authentication.** The current admin gate is a single shared password — fine for a take-home, not for production. Real version: SSO (Google Workspace or Okta) for clinic staff with per-user accounts and roles (front-desk vs. clinician vs. admin), and magic-link email for patients with their own bookings dashboard. Patient surfaces are intentionally open in this build.
- **Hard slot conflict guarantee.** On Postgres I'd add a partial unique index `CREATE UNIQUE INDEX ON booking (slot_id) WHERE status != 'CANCELLED'`, which makes double-booking impossible at the database level. Or use row-level locking inside the transaction.
- **Audit trail / status history.** A `BookingStatusChange` table recording who changed what when, with reason. Critical for clinical software.
- **Real notifications.** The email preview shows the design but nothing is delivered. Production version: transactional email via Resend with a templated React-email layout (request received, confirmed, reminder, cancellation), plus SMS reminders the day before via Twilio.
- **Reschedule flow.** Right now a patient can only book or cancel; rescheduling means cancel + rebook. A proper reschedule action that releases the old slot and acquires a new one in one transaction.
- **Physician availability management.** An admin page to mark slots unavailable, define standard schedules, block off vacation time.
- **Tests.** Unit tests for the state machine and validation, integration tests for the booking flow against a test SQLite database.
- **Accessibility audit.** Form labels and focus management are in place, but I'd run axe and verify keyboard navigation through the entire booking flow.
- **Observability.** Even a structured `console.log` with request IDs, plus a Sentry hookup for errors.
- **Internationalization & timezone correctness.** All dates currently render in the browser's locale and timezone, which is fine for a single-clinic demo but breaks the moment you have a multi-region patient base.

## A note on healthcare context

Clinical software has a different bar than consumer software: a wrong date on a coffee order is annoying, a wrong date on a colonoscopy is a real-world problem. I tried to reflect that in small choices throughout — explicit demo-only banner, treating reason-for-visit as PHI, distinguishing requests from confirmed bookings, modelling status as a state machine, validating server-side regardless of the client. None of this is groundbreaking; it's just being deliberate about the context.

## Project structure

```
patient-booking/
├── prisma/
│   ├── schema.prisma     # Physician, Slot, Booking
│   └── seed.ts           # 4 physicians, 2 weeks of slots, 3 sample bookings
├── src/
│   ├── actions/          # Server actions (booking CRUD, physicians, sign-out)
│   ├── app/
│   │   ├── page.tsx      # Landing
│   │   ├── book/         # Patient flow + confirmation (with email preview)
│   │   └── admin/        # Clinic admin (gated by middleware)
│   │       └── login/    # Password gate
│   ├── components/
│   │   ├── ui/           # Button, Input, StatusBadge, Dialog, Toast
│   │   ├── booking-flow.tsx
│   │   ├── admin-table.tsx
│   │   ├── avatar.tsx          # Deterministic-color physician avatar
│   │   ├── email-preview.tsx   # Confirmation email mockup
│   │   └── demo-banner.tsx
│   ├── lib/
│   │   ├── db.ts         # Prisma singleton
│   │   ├── utils.ts      # cn(), date formatters
│   │   ├── validations.ts # Zod schemas
│   │   └── auth.ts       # HMAC-SHA256 session sign/verify (Web Crypto)
│   ├── middleware.ts     # /admin gate, redirects to /admin/login
│   └── types/index.ts    # BookingStatus + state machine
├── tailwind.config.ts
└── README.md
```
