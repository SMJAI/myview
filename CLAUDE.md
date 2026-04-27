@AGENTS.md

# MyView — Project Reference (Canonical)

> Last updated: 2026-04-27

> **IMPORTANT FOR AI AGENTS:** After every feature addition, change, or removal — update **both** `CLAUDE.md` (§16 feature inventory) **and** `KNOWLEDGE.md` (§2 changelog + relevant sections). `KNOWLEDGE.md` is the living knowledge book shared with the team. Never leave it stale.

---

## 1. Identity & Git

- All commits must be authored as **SMJAI** (`littledrops.sm@gmail.com`)
- Never add `Co-Authored-By: Claude` or any AI attribution lines to commits
- Remote: https://github.com/SMJAI/myview
- Hosting: Vercel (auto-deploys from `main` branch)

---

## 2. Project Overview

| Field | Value |
|---|---|
| App name | MyView |
| Client | Physio Healing Hands |
| Purpose | Internal absence management — leave requests, approvals, balances, AI insights |
| Users | ~5 users (employees + manager + HR admin); no multi-tenancy |
| Auth | Google OAuth restricted to `physiohealinghands.com` domain only |
| Billing | Flat monthly subscription invoiced separately; no in-app payments |

---

## 3. Brand Colours

Sourced from https://physiohealinghands.com. Defined as `brand-*` in Tailwind via `globals.css @theme`.

| Token | Hex | Usage |
|---|---|---|
| `brand-900` | `#041f14` | Login page dark panel |
| `brand-600` | `#1F9F70` | Primary buttons, active nav, links, logo text |
| `brand-700` | `#078B5B` | Hover state for primary elements |
| `brand-500` | `#22c55e` | Sparkles / AI indicators |
| `brand-50` | `#eef9f5` | Light tint backgrounds (active nav bg) |
| `brand-100` | `#d1f0e6` | Avatar backgrounds, badge tints |

Never use `indigo-*` — all primary colour classes must use `brand-*`.

---

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth + Supabase Storage) |
| Supabase client | `@supabase/ssr` (SSR-safe, cookie-based sessions) |
| Admin client | `@supabase/supabase-js` (service role, bypasses RLS) |
| AI | `@anthropic-ai/sdk` — Haiku for fast calls, Sonnet for analysis |
| Email | Resend (`resend` package) |
| Icons | `lucide-react` |
| Utilities | `clsx`, `tailwind-merge`, `date-fns` |

---

## 5. Environment Variables

All set in `.env.local` (local) and Vercel dashboard (production). **Never commit these.**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — bypasses RLS (server only) |
| `ANTHROPIC_API_KEY` | Claude API for AI features |
| `RESEND_API_KEY` | Email sending via Resend |
| `RESEND_FROM` | Sender address (e.g. `noreply@myview.work`) |

---

## 6. Supabase

- **Project URL:** `https://vlrtkvlfavykxxdedqnf.supabase.co`
- **Storage bucket:** `leave-documents` (public read disabled; signed URLs used)
- **Schema file:** `supabase/schema.sql` — run in SQL Editor to set up or reset
- **Admin SQL needed:**
  ```sql
  ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS show_in_balances boolean NOT NULL DEFAULT false;
  UPDATE leave_types SET show_in_balances = true WHERE name IN ('Annual Leave', 'Bank Holiday', 'Sick Leave');
  ```

---

## 7. Database Tables

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | `id, full_name, email, role, start_date, weekly_hours` | Extends `auth.users`; trigger auto-creates row on signup |
| `leave_types` | `id, name, default_days, color, is_default, show_in_balances` | `show_in_balances` filters what appears in balance pages |
| `leave_balances` | `id, user_id, leave_type_id, year, total_days, used_days` | Per user × per type × per year |
| `leave_requests` | `id, user_id, leave_type_id, start_date, end_date, days_count, reason, document_path, status, manager_note` | `document_path` is Supabase Storage path |

**Key DB behaviours:**
- Postgres trigger `on_auth_user_created` auto-creates a `profiles` row on signup
- `increment_used_days` RPC deducts balance when a request is approved
- RLS ensures employees only see their own data; managers/hr_admin see everything
- `profiles!user_id(*)` must be used in joins (not `profiles(*)`) to avoid ambiguous FK

---

## 8. App Structure

```
app/
  login/page.tsx              — Glassmorphism login: animated blobs, green gradient panel, Google OAuth
  dashboard/
    layout.tsx                — Protected layout: fetches profile server-side, renders <Sidebar>
    page.tsx                  — Employee dashboard: coloured balance cards, recent requests, dot-grid banner
    requests/
      page.tsx                — Employee's own request history + cancel button
      new/
        page.tsx              — Server page: fetches leave types, balances, bank holidays
        form.tsx              — Client form: date picker, AI typeahead in reason, AI leave type suggester,
                                file upload direct to Supabase Storage, working days counter
        actions.ts            — submitLeaveRequest server action
    balances/page.tsx         — Employee's own balances (filtered to show_in_balances types only)
    calendar/page.tsx         — Team calendar: approved absences grid view
    notifications/page.tsx    — Notification list; marks all as read on open
    manager/
      page.tsx                — Manager overview: stats cards + AbsenceInsights + team list
      requests/
        page.tsx              — Server page: all requests with status filter tabs
        requests-table.tsx    — Client table: review button, doc viewer, ReviewModal
        review-modal.tsx      — Approve/reject with coverage risk alert + AI draft note buttons
        actions.ts            — reviewRequest, getDocumentSignedUrl server actions
      balances/page.tsx       — Manager: team balances view
    admin/
      page.tsx                — Users list: add user form, edit user form, remove user
      edit-user-form.tsx      — Client form: role, start_date, weekly_hours; 2-step delete confirm
      actions.ts              — updateUserProfile (service role), seedLeaveBalances, deleteUser,
                                auto-upserts bank holiday balance when start_date saved
      balances/
        page.tsx              — Admin balances: auto-seeds missing default balances on load
        balances-table.tsx    — Per-employee table: edit entitlements, prorated suggestions
        actions.ts            — updateTotalDays, upsertBalance server actions
      reports/page.tsx        — Leave usage reports
    ai-actions.ts             — All AI server actions (see §10)

components/
  sidebar.tsx                 — My Space / HR Admin segmented pill switcher; sticky h-screen;
                                auto-switches to admin view on admin routes; pending badge; bell icon
  avatar.tsx                  — <Avatar avatarUrl name size> — shows Google photo or initials fallback
  absence-insights.tsx        — AI insights panel (client component, calls detectAbsencePatterns)
  status-badge.tsx            — LeaveStatus → coloured pill
  ui/button.tsx               — Base button (primary / secondary / danger variants)
  ui/badge.tsx                — Base badge

lib/
  supabase/client.ts          — Browser Supabase client
  supabase/server.ts          — Server Supabase client (cookie-based)
  supabase/admin.ts           — Service role client (bypasses RLS) — server only
  ai.ts                       — Anthropic client + ask() helper (Haiku fast / Sonnet deep)
  types.ts                    — Shared TypeScript interfaces
  utils.ts                    — cn(), formatDate(), countWorkingDays()
  proration.ts                — prorateEntitlement(), proratedBankHolidays()
  bank-holidays.ts            — getEnglandBankHolidays() — fetches from gov.uk API
  toast.ts                    — Toast notification helper
  notifications.ts            — createNotification(), createNotificationsForManagers() server helpers

middleware.ts                 — Session refresh + redirect unauthenticated → /login
supabase/schema.sql           — Full DB schema, RLS policies, trigger, seed data
public/logo.png               — PHH logo (actual PNG, used in sidebar + login)
public/favicon.ico            — PHH logo favicon
```

---

## 9. Role System

Three roles: `employee`, `manager`, `hr_admin`

| Feature | Employee | Manager | HR Admin |
|---|---|---|---|
| Dashboard (own balances + requests) | ✅ | ✅ | ✅ |
| Submit leave request | ✅ | ✅ | ✅ |
| Cancel own pending request | ✅ | ✅ | ✅ |
| Team calendar | ✅ | ✅ | ✅ |
| Approve / reject requests | ❌ | ✅ | ✅ |
| Manager overview + AI insights | ❌ | ✅ | ✅ |
| View all requests | ❌ | ✅ | ✅ |
| Manage users (add/edit/remove) | ❌ | ✅ | ✅ |
| Leave balances admin | ❌ | ✅ | ✅ |
| Reports | ❌ | ✅ | ✅ |

**Sidebar behaviour:** Manager and HR Admin see a **My Space / HR Admin** pill switcher. Navigating to an admin/manager URL auto-switches to admin view. Sign-out is always visible (sticky sidebar, `h-screen overflow-hidden`).

---

## 10. AI Features

All AI calls go through `lib/ai.ts` → `app/dashboard/ai-actions.ts` (server actions).

| Feature | Function | Model | Where |
|---|---|---|---|
| Leave type suggester | `suggestLeaveType(reason, leaveTypes)` | Haiku | New request form: debounced 600ms, auto-selects dropdown silently |
| Reason autocomplete | `autocompleteReason(text)` | Haiku | New request form: ghost text inline in textarea, Tab to accept |
| Absence pattern insights | `detectAbsencePatterns()` | Sonnet | Manager Overview page: bullet points on load |
| Coverage risk check | `checkCoverageRisk(start, end, requestId)` | — (DB only) | Review modal: amber/blue alert on open |
| Draft manager note | `draftManagerNote(...)` | Haiku | Review modal: "Draft approve note" / "Draft reject note" buttons |

`ask(prompt, fast=true)`: `fast=true` → Haiku (`claude-haiku-4-5-20251001`), `fast=false` → Sonnet (`claude-sonnet-4-6`), `max_tokens: 512`.

---

## 11. Email Notifications

Sent via Resend when a request is approved or rejected. Email includes employee name, leave type, dates, manager note, and a CTA button (placed above details so Gmail doesn't clip it).

Sender configured via `RESEND_FROM` env var; falls back to `onboarding@resend.dev` in dev.
Domain: `myview.work` (verification status: pending).

---

## 12. File Uploads

Employees can attach supporting documents (PDF, JPG, PNG, max 10MB) to leave requests.

- Upload happens **client-side** directly to Supabase Storage bucket `leave-documents` (bypasses Next.js 2MB server action body limit)
- Path format: `{userId}/{timestamp}_{safeName}`
- `document_path` column on `leave_requests` stores the Storage path
- Managers view documents via signed URL: `getDocumentSignedUrl(path)` server action

---

## 13. Bank Holidays & Proration

- `lib/bank-holidays.ts` → `getEnglandBankHolidays()`: fetches England & Wales bank holidays from the UK government API, cached per request
- `lib/proration.ts`:
  - `proratedBankHolidays(allBankHolidays, startDate, year)`: counts bank holidays on/after start date in the given year
  - `prorateEntitlement(fullEntitlement, startDate, year, weeklyHours)`: pro-rates annual leave for part-year starters and part-time workers (rounds to nearest half-day)
- **Auto-seed logic:** When admin saves a user's `start_date`, bank holiday entitlement is auto-calculated and saved (or updated). When the Leave Balances page loads, any missing default balances for employees with a start date are automatically created — no manual "Assign" step needed.

---

## 14. Key Conventions

- Server components fetch data directly via `lib/supabase/server.ts`
- Use `lib/supabase/admin.ts` (service role) for admin mutations that need to bypass RLS
- Client components use `lib/supabase/client.ts` only (browser-side)
- Mutations go through Next.js Server Actions (`'use server'`) in colocated `actions.ts` files
- `revalidatePath()` called after every mutation to refresh server-rendered data
- Role guard: fetch `profiles.role` in server component → `redirect()` if not authorised
- Working days calculated in `countWorkingDays()` — excludes weekends and bank holidays
- Leave balance deducted via `increment_used_days` RPC only on approval, not on submission
- Past dates are allowed in leave request form (retrospective submissions)

---

## 15. First-Time Setup (after cloning)

1. Copy `.env.local` with all env vars (see §5)
2. Run `supabase/schema.sql` in Supabase SQL Editor
3. Run the `show_in_balances` migration (see §6)
4. Create Supabase Storage bucket `leave-documents` (private)
5. Set Google OAuth provider in Supabase → restrict to `physiohealinghands.com`
6. Create first user in Supabase Auth → set `role = 'hr_admin'` in profiles
7. `npm run dev` → http://localhost:3000

---

## 16. Feature Inventory

### Built ✅
- Google OAuth login restricted to PHH domain
- 3-role system: employee / manager / hr_admin
- Employee: submit requests, cancel pending, view balances, team calendar
- Manager/HR Admin: approve/reject with notes, view all requests, manage users
- Leave balances admin with proration suggestions
- Bank holiday auto-calculation from start date (auto-seeded on page load + profile save)
- Supporting document upload (client-side to Supabase Storage)
- Email notifications on approve/reject (Resend)
- AI leave type suggester (silent, auto-selects dropdown)
- AI reason autocomplete (inline ghost text, Tab to accept)
- AI absence pattern insights on manager dashboard
- AI coverage risk alerts in review modal
- AI draft manager notes (approve/reject)
- Toast notifications
- Donut charts on balance cards
- Team calendar grid
- Reports page
- Responsive sidebar with My Space / HR Admin switcher
- Animated login page (CSS blobs, glassmorphism)
- PHH logo + favicon (actual PNG)

- Google profile pictures (avatar_url from OAuth, auto-backfilled, fallback to initials)
- In-app notifications (bell icon in sidebar, notification list page at /dashboard/notifications)
- Notifications sent on: new leave submission (→ managers), approve/reject (→ employee)

### Not Yet Built ❌
- Password reset flow (Google OAuth only currently)
- Edit a leave request after submission
- Multi-year balance view / carry-over
- Mobile responsive layout
- Leave request export to CSV/PDF
- Slack or Teams integration
