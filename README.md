# Raffu

Raffle night, with grace.

A Next.js 14 app (App Router, TypeScript, Tailwind) powering **raffu.xyz** — a
minimalist raffle product with scan-to-enter QR codes, a theatrical draw
stage, and live winner reveals.

---

## What's in this build (v1.0)

- Marketing landing page (`/`)
- Admin signup with 30-day free trial (`/signup`)
- Admin login (`/login`)
- Protected dashboard (`/dashboard`)
- Supabase Auth + `profiles` table auto-populated via DB trigger
- Resend-powered welcome email
- Middleware-refreshed sessions and gated routes
- Full Postgres schema for raffles / entries / winners **already migrated** —
  ready for v1.1 without further migrations

## What's next (v1.1)

- Raffle creation + admin UI (ports the Lotl runner into authenticated routes)
- Public entry page at `/r/[slug]` with Supabase Realtime for live entries
- DB-persisted draws + winners

## What's after that (v1.2)

- Stripe for the £10/mo Pro plan (currently labelled "Coming soon")
- Team seats / co-host invites
- CSV export

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript, Server Actions) |
| Styling | Tailwind CSS with Earthy Editorial design tokens |
| Auth | Supabase Auth via `@supabase/ssr` |
| Database | Supabase Postgres with RLS |
| Email | Resend (via server-side SDK only) |
| Hosting | Vercel |

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration in
   `supabase/migrations/20260423000001_init.sql` — this creates the tables,
   RLS policies, and the auth trigger
3. Grab your **Project URL** and **anon key** from Settings → API
4. (Optional but recommended) In **Authentication → Providers → Email**,
   decide if you want email confirmations on or off for local dev. If off,
   new signups log in immediately. If on, users get a confirmation link.

### 3. Resend

1. Sign up at [resend.com](https://resend.com)
2. Add and verify the `raffu.xyz` domain (DNS records in your registrar)
3. Create an API key
4. Optional but highly recommended: in Supabase → Authentication → Email
   Templates, configure Resend as your SMTP provider so confirmation and
   password-reset emails also ship from your domain. Resend publishes the
   SMTP host, port, and credentials to copy in.

### 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=re_<your-key>
RESEND_FROM_EMAIL="Raffu <hello@raffu.xyz>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Deploying to raffu.xyz on Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Raffu v1.0"
git remote add origin git@github.com:<you>/raffu.git
git push -u origin main
```

### 2. Import to Vercel

1. Vercel dashboard → **Add New Project** → import the repo
2. Framework preset auto-detects as Next.js
3. Add the same environment variables from `.env.local`, **except change**:
   `NEXT_PUBLIC_APP_URL=https://raffu.xyz`
4. Deploy

### 3. Point raffu.xyz at Vercel

1. Vercel → Settings → Domains → add `raffu.xyz` and `www.raffu.xyz`
2. In your domain registrar (where you bought raffu.xyz):
   - Add an **A record**: `@` → `76.76.21.21`
   - Add a **CNAME**: `www` → `cname.vercel-dns.com`
3. Wait for DNS propagation (usually a few minutes). Vercel will auto-issue
   an SSL cert.

### 4. Update Supabase redirect URLs

Supabase → Authentication → URL Configuration:
- **Site URL**: `https://raffu.xyz`
- **Redirect URLs** (add): `https://raffu.xyz/auth/callback`

Without this, the confirmation email link will bounce.

---

## Project structure

```
CLAUDE.md                   # Claude Code entry — imports the three below
AGENTS.md                   # project context + architecture gotchas + DO NOTs
SKILLS.md                   # skill triggers for agents
LOOP.md                     # the plan → implement → verify dev workflow
app/
  layout.tsx              # fonts + metadata
  globals.css             # Tailwind + design tokens
  page.tsx                # landing page
  signup/
    page.tsx              # signup form (client)
    actions.ts            # server action: signUp + welcome email
  login/
    page.tsx
    actions.ts            # server action: signInWithPassword
  dashboard/
    layout.tsx            # protected shell (nav, trial banner)
    page.tsx              # raffle list / empty state
  auth/
    callback/route.ts     # email confirmation handler
    signout/route.ts      # clears session
lib/
  supabase/
    client.ts             # browser client
    server.ts             # server client
    middleware.ts         # session refresher + route guards
  emails/
    welcome.ts            # Resend welcome template + send
  resend.ts               # SDK singleton
components/
  brand-mark.tsx
  trial-banner.tsx
middleware.ts             # runs updateSession on every request
supabase/
  migrations/
    20260423000001_init.sql
```

---

## How signup actually works

1. User submits the `/signup` form → client calls the `signupAction` server action
2. Server validates, calls `supabase.auth.signUp` with `first_name`/`last_name`
   in `user_metadata`
3. The `on_auth_user_created` trigger (in the migration) runs inside Postgres
   and inserts a matching row into `public.profiles`, setting `trial_ends_at`
   to `now() + 30 days`
4. Server action calls `sendWelcomeEmail` via Resend — fails soft if Resend
   errors, so signup still succeeds
5. If Supabase returns a session (email confirmations off) → redirect to
   `/dashboard`. Otherwise → show the "check your email" state

The middleware then guards all `/dashboard/*` routes and bounces signed-in
users away from `/login` and `/signup`.

---

## Design system

- **Palette**: Earthy Editorial — Shadow Grey `#272727`, Sandy Clay `#D4AA7D`,
  Off-White `#F5F0E8`
- **Type**: Playfair Display (display) + Inter (body), loaded via `next/font`
- **Grid**: 8pt spacing, hairline `#E4DCCE` borders, no gradients, no shadows

Per-raffle branding (admin picks 2 colours + logo) will override these
tokens at runtime in v1.1, just like the Lotl artifact did.

---

## Useful commands

```bash
npm run dev          # local dev
npm run build        # production build
npm run start        # run production build locally
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
```

---

## License

Private. © Raffu.
