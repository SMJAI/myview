# MyView — Knowledge Book

> **Living document.** Updated automatically whenever features are added, changed, or removed.
> Last updated: 2026-04-27

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Changelog](#2-changelog)
3. [Tech Stack](#3-tech-stack)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Role System](#6-role-system)
7. [Application Structure](#7-application-structure)
8. [Page & Feature Reference](#8-page--feature-reference)
9. [AI Features](#9-ai-features)
10. [Email Notifications](#10-email-notifications)
11. [File Uploads](#11-file-uploads)
12. [Bank Holidays & Proration](#12-bank-holidays--proration)
13. [Server Actions Reference](#13-server-actions-reference)
14. [Component Reference](#14-component-reference)
15. [Shared Libraries](#15-shared-libraries)
16. [Supabase Patterns & Gotchas](#16-supabase-patterns--gotchas)
17. [Brand & Design System](#17-brand--design-system)
18. [Deployment](#18-deployment)
19. [Feature Inventory](#19-feature-inventory)
20. [Backlog](#20-backlog)

---

## 1. Project Identity

| Field | Value |
|---|---|
| App name | MyView |
| Client | Physio Healing Hands (PHH) |
| Purpose | Internal HR absence management — leave requests, approvals, balances, AI insights |
| Users | ~5 (employees + manager + HR admin); no multi-tenancy |
| Auth | Google OAuth restricted to `physiohealinghands.com` domain only |
| Billing | Flat monthly subscription invoiced separately; no in-app payments |
| Repository | https://github.com/SMJAI/myview |
| Supabase project | https://vlrtkvlfavykxxdedqnf.supabase.co |
| Hosting | Vercel (auto-deploys from `main` branch push) |
| Domain | `myview.work` |
| Git author | SMJAI — `littledrops.sm@gmail.com` (never add Co-Authored-By lines) |

---

## 2. Changelog

| Date | Change |
|---|---|
| 2026-04-27 | Auto-seed bank holiday balances from employee start date on page load and profile save |
| 2026-04-27 | Inline ghost text autocomplete in reason textarea (Tab to accept) |
| 2026-04-27 | AI leave type suggester: silent auto-select with subtle ring confirmation |
| 2026-04-27 | Added Overview link to HR Admin sidebar nav (unlocks absence insights panel) |
| 2026-04-26 | AI features: leave type suggester, absence insights, coverage risk, draft manager notes |
| 2026-04-26 | Supporting document upload (client-side direct to Supabase Storage) |
| 2026-04-26 | Bank holiday auto-assign from start date in seedLeaveBalances |
| 2026-04-26 | Leave balances filter: only Annual Leave, Bank Holiday, Sick Leave shown (`show_in_balances`) |
| 2026-04-26 | Remove user feature with 2-step confirmation in admin panel |
| 2026-04-25 | Service role admin client (`lib/supabase/admin.ts`) to bypass RLS for admin ops |
| 2026-04-25 | Stunning login page: animated CSS blobs, glassmorphism card, deep green gradient |
| 2026-04-25 | Sidebar redesign: My Space / HR Admin segmented pill switcher, sticky sign-out |
| 2026-04-25 | Allow past dates in leave request form (retrospective submissions) |
| 2026-04-25 | PHH logo PNG + favicon (actual brand assets, not generated) |
| 2026-04-25 | Email CTA buttons moved above details table (prevents Gmail clipping) |
| 2026-04-25 | Auto-exit employee mode when navigating to manager/admin URLs |
| 2026-04-24 | Fix RLS and ambiguous FK join for hr_admin on all requests / reports |
| 2026-04-24 | 3-role system: employee, manager, hr_admin |
| 2026-04-24 | Email notifications on approve/reject (Resend) |
| 2026-04-24 | Toast notifications, skeleton loaders, donut charts, team calendar grid |
| Earlier | Initial build: Google OAuth, leave requests, approvals, balances, reports, calendar |

---

## 3. Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js App Router | 16.2.4 |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | v4 (uses `@theme` in globals.css) |
| Database | Supabase PostgreSQL | RLS enabled on all tables |
| Auth | Supabase Auth + Google OAuth | Restricted to `physiohealinghands.com` |
| Storage | Supabase Storage | Bucket: `leave-documents` |
| Supabase JS | `@supabase/ssr` | SSR-safe, cookie-based sessions |
| Admin client | `@supabase/supabase-js` | Service role key; bypasses RLS |
| AI | Anthropic Claude API | `@anthropic-ai/sdk` |
| Email | Resend | `resend` npm package |
| Icons | `lucide-react` | |
| Utilities | `clsx`, `tailwind-merge`, `date-fns` | |

---

## 4. Environment Variables

All set in `.env.local` (local) and Vercel dashboard (production). **Never commit these files.**

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS — admin operations only |
| `ANTHROPIC_API_KEY` | Server only | Claude API for all AI features |
| `RESEND_API_KEY` | Server only | Email sending via Resend |
| `RESEND_FROM` | Server only | Sender address (e.g. `noreply@myview.work`) |

---

## 5. Database Schema

### Tables

#### `profiles`
Extends `auth.users`. Auto-created by Postgres trigger `on_auth_user_created` on signup.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | FK → `auth.users.id` |
| `full_name` | text | |
| `email` | text | |
| `role` | text | `employee` \| `manager` \| `hr_admin` |
| `start_date` | date | Employment start; used for proration |
| `weekly_hours` | numeric | Default 37.5; used for part-time proration |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `leave_types`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | text | e.g. Annual Leave, Bank Holiday, Sick Leave |
| `default_days` | numeric | Full-year entitlement |
| `color` | text | Hex colour for UI |
| `is_default` | boolean | Auto-seeded when a user is created |
| `show_in_balances` | boolean | Only these types appear in balance pages. **Requires migration** (see §16) |

#### `leave_balances`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | FK → `profiles.id` |
| `leave_type_id` | uuid | FK → `leave_types.id` |
| `year` | integer | e.g. 2026 |
| `total_days` | numeric | Entitlement (editable by admin) |
| `used_days` | numeric | Deducted via `increment_used_days` RPC on approval |

#### `leave_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | FK → `profiles.id` |
| `leave_type_id` | uuid | FK → `leave_types.id` |
| `start_date` | date | |
| `end_date` | date | |
| `days_count` | numeric | Working days (weekends + bank holidays excluded) |
| `reason` | text \| null | Optional employee note |
| `document_path` | text \| null | Supabase Storage path for supporting doc |
| `status` | text | `pending` \| `approved` \| `rejected` \| `cancelled` |
| `manager_note` | text \| null | Optional manager comment on decision |
| `reviewed_by` | uuid \| null | FK → `profiles.id` |
| `reviewed_at` | timestamptz \| null | |
| `created_at` | timestamptz | |

### Key DB Behaviours
- Trigger `on_auth_user_created` → auto-creates `profiles` row on new signup
- RPC `increment_used_days(balance_id, days)` → deducts from `leave_balances.used_days` on approval
- RLS: employees see only their own rows; managers/hr_admin see all
- Joins to `profiles` must use `profiles!user_id(*)` to avoid ambiguous FK error

### Required Migration (run once in Supabase SQL Editor)
```sql
ALTER TABLE leave_types
  ADD COLUMN IF NOT EXISTS show_in_balances boolean NOT NULL DEFAULT false;

UPDATE leave_types
  SET show_in_balances = true
  WHERE name IN ('Annual Leave', 'Bank Holiday', 'Sick Leave');
```

---

## 6. Role System

### Three Roles

| Role | Description |
|---|---|
| `employee` | Standard user — submits requests, views own data |
| `manager` | Approves/rejects, sees team data, manages users |
| `hr_admin` | Same capabilities as manager; distinct label in UI |

### Feature Matrix

| Feature | Employee | Manager | HR Admin |
|---|---|---|---|
| Own dashboard (balances + requests) | ✅ | ✅ | ✅ |
| Submit leave request | ✅ | ✅ | ✅ |
| Cancel own pending request | ✅ | ✅ | ✅ |
| Team calendar | ✅ | ✅ | ✅ |
| View all requests | ❌ | ✅ | ✅ |
| Approve / reject requests | ❌ | ✅ | ✅ |
| Manager overview + AI insights | ❌ | ✅ | ✅ |
| Add / edit / remove users | ❌ | ✅ | ✅ |
| Leave balances admin | ❌ | ✅ | ✅ |
| Reports | ❌ | ✅ | ✅ |

### Sidebar Behaviour
- Employees: single My Space navigation
- Manager / HR Admin: **My Space / [Role] segmented pill switcher**
- Navigating directly to a `/dashboard/manager` or `/dashboard/admin` URL auto-switches to admin view
- View preference stored in `localStorage` key `myview_view_{userId}`
- Sidebar is `h-screen sticky top-0 overflow-hidden` — Sign Out is always visible

---

## 7. Application Structure

```
C:\SnipAI\MyView\
├── app/
│   ├── login/
│   │   └── page.tsx                  # Public login — animated blobs, Google OAuth
│   ├── globals.css                   # Tailwind @theme: brand-* tokens, blob animations
│   └── dashboard/
│       ├── layout.tsx                # Protected layout: fetches profile, renders Sidebar
│       ├── page.tsx                  # Employee dashboard: balance cards + recent requests
│       ├── ai-actions.ts             # All AI server actions (see §9)
│       ├── requests/
│       │   ├── page.tsx              # My Requests: own history + cancel
│       │   └── new/
│       │       ├── page.tsx          # Server: fetches leave types, balances, bank holidays
│       │       ├── form.tsx          # Client: AI typeahead, AI suggester, file upload
│       │       └── actions.ts        # submitLeaveRequest
│       ├── balances/
│       │   └── page.tsx             # Employee balances (show_in_balances filtered)
│       ├── calendar/
│       │   └── page.tsx             # Team calendar grid: approved absences
│       ├── manager/
│       │   ├── page.tsx             # Overview: stats + AbsenceInsights + team list
│       │   ├── requests/
│       │   │   ├── page.tsx         # All requests with status tabs
│       │   │   ├── requests-table.tsx  # Client table: doc viewer, ReviewModal trigger
│       │   │   ├── review-modal.tsx    # Approve/reject: coverage alert + AI draft notes
│       │   │   └── actions.ts          # reviewRequest, getDocumentSignedUrl
│       │   └── balances/
│       │       └── page.tsx         # Manager: team balances view
│       └── admin/
│           ├── page.tsx             # Users list: add/edit/remove
│           ├── edit-user-form.tsx   # Client: role, start_date, hours, 2-step delete
│           ├── actions.ts           # updateUserProfile, seedLeaveBalances, deleteUser
│           ├── balances/
│           │   ├── page.tsx         # Auto-seeds missing balances on load
│           │   ├── balances-table.tsx  # Per-employee entitlement editing
│           │   └── actions.ts          # updateTotalDays, upsertBalance
│           └── reports/
│               └── page.tsx         # Leave usage reports
├── components/
│   ├── sidebar.tsx                  # Pill switcher, sticky, auto role-switch
│   ├── absence-insights.tsx         # AI insights panel (client, calls detectAbsencePatterns)
│   ├── status-badge.tsx             # LeaveStatus → coloured pill
│   └── ui/
│       ├── button.tsx               # primary / secondary / danger variants
│       └── badge.tsx                # Base badge
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client (cookie-based)
│   │   └── admin.ts                # Service role client — bypasses RLS, server only
│   ├── ai.ts                       # Anthropic client + ask() helper
│   ├── types.ts                    # Shared TypeScript interfaces
│   ├── utils.ts                    # cn(), formatDate(), countWorkingDays()
│   ├── proration.ts                # prorateEntitlement(), proratedBankHolidays()
│   ├── bank-holidays.ts            # getEnglandBankHolidays() — UK gov API
│   └── toast.ts                    # Toast notification helper
├── middleware.ts                   # Session refresh + unauthenticated redirect
├── public/
│   ├── logo.png                    # Actual PHH logo PNG
│   └── favicon.ico                 # PHH logo favicon
├── supabase/
│   └── schema.sql                  # Full DB schema, RLS, trigger, seed data
├── CLAUDE.md                       # AI agent project reference (always read first)
└── KNOWLEDGE.md                    # This file — living knowledge book
```

---

## 8. Page & Feature Reference

### `/login`
- Deep forest green gradient left panel (`#041f14 → #1a9060`)
- Three animated CSS blob shapes (`@keyframes blob` in globals.css)
- Dot-grid overlay + glow orb effect
- Frosted glass sign-in card with PHH logo badge
- Google OAuth button — restricted to `physiohealinghands.com` accounts

### `/dashboard` (Employee Dashboard)
- Welcome banner with user's name, dot-grid + glow background
- Three balance cards (Annual Leave, Bank Holiday, Sick Leave) with coloured top borders
- Recent leave requests table with status badges

### `/dashboard/requests/new` (New Leave Request)
- Leave type dropdown (auto-selected by AI based on typed reason)
- Date pickers (past dates allowed for retrospective submissions)
- Working days counter (weekends + bank holidays excluded)
- **Reason textarea with inline AI:**
  - Ghost text autocomplete appears after 600ms pause (5+ chars typed)
  - Press Tab to accept the completion
  - Leave type dropdown silently auto-updates + brief green ring confirmation
- Optional supporting document upload (PDF, JPG, PNG, max 10MB)
- Client-side direct upload to Supabase Storage

### `/dashboard/manager` (Manager Overview)
- Stats: Team Members, Pending Requests, Upcoming Absences (clickable cards)
- **AI Absence Insights panel** (loads on mount, shows 3–4 bullet insights)
- Team list table

### `/dashboard/manager/requests` (All Requests)
- Status filter tabs: All / Pending / Approved / Rejected
- Table with employee, type, dates, days, status, document link
- Review button → opens ReviewModal (pending only)

### ReviewModal
- Shows employee name, leave type, days
- **Coverage risk alert:** amber if 2+ team members already approved for overlapping dates; blue info if 1 person overlaps
- Note textarea with **"Draft approve note" / "Draft reject note"** AI buttons
- Approve / Reject / Cancel actions

### `/dashboard/admin` (Users)
- List of all users with role badges
- Add user form (name, email, role, start date, weekly hours)
- Edit user form: change role, start date, hours
- Remove user: 2-step confirmation ("Are you sure?" → confirm delete)
- Removing a user deletes their auth account + profile (cascades)

### `/dashboard/admin/balances` (Leave Balances Admin)
- **Auto-seeds missing default balances on every page load** (no manual Assign needed)
- Per-employee table: entitlement / used / remaining
- Inline edit with prorated suggestion shown
- Bank holidays calculated from start date automatically

---

## 9. AI Features

All AI calls flow through `lib/ai.ts` → `app/dashboard/ai-actions.ts`.

### `lib/ai.ts` — Core Helper

```ts
ask(prompt: string, fast = true): Promise<string>
```
- `fast = true` → `claude-haiku-4-5-20251001` (low latency, cheap)
- `fast = false` → `claude-sonnet-4-6` (deeper analysis)
- `max_tokens: 512`
- Returns `''` on any error

### AI Server Actions (`app/dashboard/ai-actions.ts`)

| Function | Model | Trigger | Returns |
|---|---|---|---|
| `suggestLeaveType(reason, leaveTypes[])` | Haiku | User types 8+ chars in reason; 600ms debounce | `string \| null` — matching leave type ID |
| `autocompleteReason(text)` | Haiku | User types 5+ chars in reason; 600ms debounce | `string` — 5–8 word completion |
| `detectAbsencePatterns()` | Sonnet | Manager Overview mounts | `string[]` — 3–4 insight bullets |
| `checkCoverageRisk(start, end, requestId)` | DB only | Review modal opens | `{ risk: boolean, message: string \| null }` |
| `draftManagerNote(name, type, start, end, days, status)` | Haiku | Manager clicks Draft button | `string` — ready-to-send note |

### UX Behaviours

**Leave type suggester:**
- Fires 600ms after user stops typing (≥8 chars)
- Silently sets the leave type dropdown value
- Dropdown briefly shows green ring for 1.5s (no text, just visual cue)
- Implemented with `aiJustSelected` state + CSS `transition-all`

**Reason autocomplete:**
- Fires 600ms after user stops typing (≥5 chars) — runs in parallel with suggester
- Ghost text appears inline in textarea using overlay technique:
  - Wrapper `div` → `position: relative`
  - Background `div` → `position: absolute`, `pointer-events: none`; renders typed text (`visibility: hidden`) + ghost text (gray)
  - Textarea → `bg-transparent`, controlled (`value={reasonText}`)
- Press **Tab** to accept (appends completion to `reasonText`, re-triggers suggestions)

**Absence insights:**
- `<AbsenceInsights />` client component mounted on Manager Overview
- Calls `detectAbsencePatterns()` on mount, shows loading skeleton then bullets
- Returns `null` (renders nothing) if no insights

**Coverage risk:**
- Checks `leave_requests` for approved requests overlapping the date range
- No AI model — pure DB query
- Amber banner if 2+ overlapping; blue info if 1 overlapping; nothing if clear

**Draft manager notes:**
- Two buttons in ReviewModal: "Draft approve note" / "Draft reject note"
- Fills the note textarea with a warm, professional 1–2 sentence note
- Manager can edit before submitting

---

## 10. Email Notifications

| Event | Recipient | Content |
|---|---|---|
| Request approved | Employee | Name, leave type, dates, manager note, CTA button |
| Request rejected | Employee | Name, leave type, dates, manager note, CTA button |

- Provider: **Resend** (`resend` package)
- Sender: `RESEND_FROM` env var → fallback `onboarding@resend.dev` in dev
- Domain: `myview.work` (Resend DNS verification pending)
- CTA buttons placed **above** the details table in HTML to avoid Gmail clipping at 102KB

---

## 11. File Uploads

Employees may attach a supporting document (e.g. sick certificate) to a leave request.

### Flow
1. Employee selects file in the New Request form (PDF, JPG, PNG; max 10MB)
2. **Client-side upload:** browser calls `supabase.storage.from('leave-documents').upload(path, file)` directly — bypasses Next.js 2MB server action body limit
3. Upload path: `{userId}/{timestamp}_{safeName}` (special characters sanitised)
4. The returned Storage path is placed in a hidden `document_path` FormData field
5. Server action `submitLeaveRequest` reads `document_path` and saves it to the DB

### Manager Viewing
- Paperclip icon shown in All Requests table if `document_path` is set
- Clicking calls `getDocumentSignedUrl(path)` server action → returns a short-lived signed URL → opens in new tab

### Storage Setup
- Bucket name: `leave-documents`
- Bucket must be **private** (no public access)
- Row-level access controlled via signed URLs

---

## 12. Bank Holidays & Proration

### Data Source
`lib/bank-holidays.ts` → `getEnglandBankHolidays(): Promise<string[]>`
- Fetches England & Wales bank holidays from the UK Government API
- Returns array of ISO date strings (`YYYY-MM-DD`)
- Cached per request (Next.js fetch cache)

### Proration Functions (`lib/proration.ts`)

**`proratedBankHolidays(allBankHolidays, startDate, year)`**
- Counts how many bank holidays fall on or after the employee's start date in the given year
- Used for bank holiday entitlement calculation

**`prorateEntitlement(fullEntitlement, startDate, year, weeklyHours = 37.5)`**
- Pro-rates annual leave for part-year starters and part-time workers
- Formula: `fullEntitlement × (weeklyHours / 37.5) × (daysRemaining / daysInYear)`
- Rounds to nearest 0.5 day

### Auto-Seed Logic

**Trigger 1 — Leave Balances page load (`admin/balances/page.tsx`):**
- On every render, checks for missing default leave balances for employees with a `start_date`
- Inserts any missing ones automatically using the admin client (bypasses RLS)
- Bank holidays calculated via `proratedBankHolidays`; annual leave via `prorateEntitlement`
- Always re-fetches balances after potential seed → page always shows populated data

**Trigger 2 — Profile save (`admin/actions.ts → updateUserProfile`):**
- When `start_date` is saved for a user, immediately recalculates bank holiday entitlement for the current year
- Updates existing balance if one exists; inserts new one if not
- Preserves existing `used_days` (only `total_days` is updated)

---

## 13. Server Actions Reference

### `app/dashboard/requests/new/actions.ts`
| Action | Description |
|---|---|
| `submitLeaveRequest(formData)` | Validates, inserts leave request, sends email confirmation |

### `app/dashboard/manager/requests/actions.ts`
| Action | Description |
|---|---|
| `reviewRequest(id, status, note)` | Updates request status, deducts balance via RPC if approved, sends notification email |
| `getDocumentSignedUrl(path)` | Returns a short-lived signed URL for a Supabase Storage document |

### `app/dashboard/admin/actions.ts`
| Action | Description |
|---|---|
| `updateUserProfile(userId, { role, start_date, weekly_hours })` | Updates profile using service role client; auto-recalculates bank holiday balance if start_date set |
| `seedLeaveBalances(userId, year)` | Inserts missing default leave balances with proration |
| `deleteUser(userId)` | Deletes auth user (profile cascades via FK) |

### `app/dashboard/admin/balances/actions.ts`
| Action | Description |
|---|---|
| `updateTotalDays(balanceId, days)` | Updates entitlement for an existing balance |
| `upsertBalance(userId, leaveTypeId, year, days)` | Creates or updates a balance row |

### `app/dashboard/ai-actions.ts`
All 5 AI server actions — see §9.

---

## 14. Component Reference

### `components/sidebar.tsx`
- **Props:** `profile: Profile`, `pendingCount?: number`
- Shows My Space / HR Admin segmented pill for manager/hr_admin
- Auto-switches view based on current pathname (via `useEffect`)
- Stores view preference in `localStorage`
- `h-screen sticky top-0 overflow-hidden` — sign out always in view

### `components/absence-insights.tsx`
- Client component, no props
- Calls `detectAbsencePatterns()` on mount
- Shows loading skeleton (3 animated pulse bars) then bullet list
- Returns `null` if no insights (hides entirely)

### `components/status-badge.tsx`
- **Props:** `status: LeaveStatus`
- Maps `pending` → yellow, `approved` → green, `rejected` → red, `cancelled` → gray

### `components/ui/button.tsx`
- **Variants:** `primary` (brand green, default), `secondary` (gray outline), `danger` (red)
- **Props:** all standard button props + `variant`

---

## 15. Shared Libraries

### `lib/utils.ts`
| Export | Description |
|---|---|
| `cn(...classes)` | `clsx` + `tailwind-merge` |
| `formatDate(dateStr)` | `DD MMM YYYY` format |
| `countWorkingDays(start, end, bankHolidays[])` | Counts Mon–Fri days excluding bank holidays |

### `lib/types.ts`
```ts
type Role = 'employee' | 'manager' | 'hr_admin'
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

interface Profile { id, full_name, email, role, start_date, weekly_hours, created_at, updated_at }
interface LeaveType { id, name, default_days, color, is_default, show_in_balances }
interface LeaveBalance { id, user_id, leave_type_id, year, total_days, used_days, leave_types? }
interface LeaveRequest { id, user_id, leave_type_id, start_date, end_date, days_count,
                         reason, document_path, status, manager_note, reviewed_by,
                         reviewed_at, created_at, profiles?, leave_types?, reviewer? }

canManageUsers(role): boolean   // manager or hr_admin
canApproveLeave(role): boolean  // manager or hr_admin
```

### `lib/ai.ts`
```ts
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function ask(prompt: string, fast = true): Promise<string>
// fast=true  → claude-haiku-4-5-20251001, max_tokens: 512
// fast=false → claude-sonnet-4-6, max_tokens: 512
// Returns '' on any error
```

---

## 16. Supabase Patterns & Gotchas

### Which Client to Use

| Situation | Client | File |
|---|---|---|
| Server component data fetch | Regular server client | `lib/supabase/server.ts` |
| Server action — normal write | Regular server client | `lib/supabase/server.ts` |
| Server action — admin op (bypass RLS) | Admin service role client | `lib/supabase/admin.ts` |
| Client component (browser) | Browser client | `lib/supabase/client.ts` |

**Never use `createAdminClient()` in client components.** The service role key must remain server-only.

### RLS Policies — Known Issues
- `profiles` table RLS blocks updating another user's row — always use `createAdminClient()` in `updateUserProfile`
- `hr_admin` role must be explicitly included in every RLS policy alongside `manager`
- Joins to `profiles` from `leave_requests` must use `profiles!user_id(*)` not `profiles(*)` — avoids ambiguous FK error

### Mutation Pattern
```ts
'use server'
// 1. Authorise — verify session and role
// 2. Use correct client (admin if bypassing RLS)
// 3. Perform mutation
// 4. revalidatePath() for all affected pages
// 5. Return { error: string } or nothing (void = success)
```

### RPC for Balance Deduction
```ts
await supabase.rpc('increment_used_days', { balance_id: '...', days: n })
```
Called only on approval, not on request submission.

---

## 17. Brand & Design System

### Colour Tokens (Tailwind `brand-*`)
| Token | Hex | Usage |
|---|---|---|
| `brand-900` | `#041f14` | Login dark panel background |
| `brand-700` | `#078B5B` | Hover on primary elements |
| `brand-600` | `#1F9F70` | Primary buttons, active nav, links |
| `brand-500` | `#22c55e` | AI sparkle icons |
| `brand-100` | `#d1f0e6` | Avatar backgrounds |
| `brand-50` | `#eef9f5` | Active nav item background |

**Rule:** Never use `indigo-*`. All primary colours use `brand-*`.

### Animations (`app/globals.css`)
- `@keyframes blob` — morphing `border-radius` for login page blobs
- `animate-blob` / `animate-blob-slow` / `animate-blob-slower` — staggered blob durations
- `animate-float` — subtle vertical float

### Login Page
- Left panel: `linear-gradient(135deg, #041f14, #1a9060)` with dot-grid SVG overlay
- Three positioned `div`s with `animate-blob-*` classes
- Sign-in card: `bg-white/95 backdrop-blur-sm`, deep shadow, green accent top border

### Common UI Patterns
- Cards: `bg-white rounded-xl border border-gray-200`
- Tables: `divide-y divide-gray-100` rows, `bg-gray-50` header
- Section headers: `text-xs font-semibold text-gray-500 uppercase tracking-wide`
- Inputs: `px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500`

---

## 18. Deployment

### Vercel
- Auto-deploys on every push to `main`
- Environment variables set in Vercel dashboard (Project → Settings → Environment Variables)
- No manual deploy step needed

### Supabase
- All schema changes applied via SQL Editor (no migrations tooling)
- `supabase/schema.sql` is the source of truth — always update it after schema changes
- Storage bucket `leave-documents` must be created manually with private access

### First-Time Setup (new environment)
1. Clone repo; copy `.env.local` with all env vars
2. Run `supabase/schema.sql` in Supabase SQL Editor
3. Run the `show_in_balances` migration (§5)
4. Create `leave-documents` storage bucket (private)
5. Set Google OAuth provider in Supabase → restrict to `physiohealinghands.com`
6. Create first user in Supabase Auth → set `role = 'hr_admin'` in profiles table
7. `npm run dev` → http://localhost:3000

---

## 19. Feature Inventory

### Built ✅
- [x] Google OAuth login restricted to PHH domain
- [x] 3-role system: employee / manager / hr_admin
- [x] Employee: submit leave requests (with past date support)
- [x] Employee: cancel own pending requests
- [x] Employee: view own leave balances (filtered to 3 types)
- [x] Employee: team calendar (approved absences)
- [x] Manager/HR Admin: approve / reject requests with notes
- [x] Manager/HR Admin: view all requests with status filter tabs
- [x] Manager/HR Admin: manage users (add, edit role/start_date/hours, remove)
- [x] Manager/HR Admin: leave balances admin with proration suggestions
- [x] Bank holiday entitlement auto-calculated from start date
- [x] Bank holiday balances auto-seeded on page load and profile save
- [x] Supporting document upload (PDF/JPG/PNG, client-side direct to Supabase Storage)
- [x] Manager view attached documents via signed URL
- [x] Email notifications on approve/reject (Resend)
- [x] Toast notifications
- [x] AI: leave type auto-selection from typed reason (silent, 600ms debounce)
- [x] AI: reason autocomplete ghost text inline in textarea (Tab to accept)
- [x] AI: absence pattern insights on manager dashboard
- [x] AI: coverage risk alert in review modal
- [x] AI: draft approve/reject manager notes
- [x] Sidebar: My Space / HR Admin pill switcher
- [x] Sidebar: auto-switches view on admin URL navigation
- [x] Sidebar: sticky, always-visible sign out
- [x] Animated login page (CSS blobs, glassmorphism)
- [x] PHH logo PNG + favicon (actual brand assets)
- [x] Reports page

---

## 20. Backlog

Features not yet built — in rough priority order:

| # | Feature | Notes |
|---|---|---|
| 1 | Password reset flow | Currently Google OAuth only; no email/password fallback |
| 2 | Edit leave request after submission | Currently can only cancel and resubmit |
| 3 | Multi-year balance view + carry-over | Currently year-by-year only |
| 4 | Mobile responsive layout | Desktop-first currently; sidebar collapses needed |
| 5 | Leave request export (CSV/PDF) | For payroll/HR record-keeping |
| 6 | Slack / Teams integration | Approval notifications in team chat |
| 7 | Push / in-app notifications | Real-time status updates |
| 8 | Public holiday calendar UI | Visual calendar showing all bank holidays |
| 9 | Multi-tenancy | If app expands beyond PHH |
