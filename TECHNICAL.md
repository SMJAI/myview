# MyView — Technical Knowledge Book
**Physio Healing Hands | Internal Absence Management System**
*Last updated: April 2026*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [All Applications & Services Used](#2-all-applications--services-used)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [File Structure](#5-file-structure)
6. [Database Design](#6-database-design)
7. [Authentication & Security](#7-authentication--security)
8. [Role & Permission System](#8-role--permission-system)
9. [Business Logic](#9-business-logic)
10. [Email Notifications](#10-email-notifications)
11. [Feature Documentation](#11-feature-documentation)
12. [UI Component Library](#12-ui-component-library)
13. [Environment Variables](#13-environment-variables)
14. [Local Development Setup](#14-local-development-setup)
15. [Deployment Process](#15-deployment-process)
16. [DNS & Domain Setup](#16-dns--domain-setup)
17. [Key Conventions & Patterns](#17-key-conventions--patterns)
18. [Known Limitations & Future Work](#18-known-limitations--future-work)

---

## 1. Project Overview

**MyView** is a private, internal web application built for **Physio Healing Hands** — a physiotherapy practice. It replaces manual leave tracking (spreadsheets, email chains) with a clean digital system.

### What it does
- Employees submit leave/absence requests online
- Managers approve or reject requests with optional notes
- HR Admin manages user accounts, leave balances, and generates reports
- All team members can view a shared calendar of approved absences
- Email notifications alert the right people at the right time

### Who uses it
| User | Role | What they can do |
|---|---|---|
| Keziya | Employee | Submit requests, view own balances |
| Joshua | Employee | Submit requests, view own balances |
| Sonia | Manager | All employee features + approve/reject requests, view team |
| Simmy | HR Admin | Everything — including managing users, balances, and reports |

### Live URL
**https://www.myview.work**

---

## 2. All Applications & Services Used

### Development & Hosting

| Application | Website | Purpose | Cost |
|---|---|---|---|
| **GitHub** | github.com | Source code version control. All code lives in the `SMJAI/myview` repository. Every push to `main` automatically triggers a Vercel deployment. | Free |
| **Vercel** | vercel.com | Hosts and runs the Next.js web application. Handles SSL (HTTPS), automatic deployments from GitHub, and environment variable storage. | Free (Hobby plan) |
| **GoDaddy** | godaddy.com | Domain registrar. Owns and manages the `myview.work` domain. DNS records here point the domain to Vercel's servers. | ~£10/year |

### Backend & Database

| Application | Website | Purpose | Cost |
|---|---|---|---|
| **Supabase** | supabase.com | Provides the PostgreSQL database, user authentication, and Row Level Security. The app's backend. Project URL: `vlrtkvlfavykxxdedqnf.supabase.co` | Free (up to 500MB, 50,000 monthly active users) |

### Email

| Application | Website | Purpose | Cost |
|---|---|---|---|
| **Resend** | resend.com | Sends transactional emails. When a leave request is submitted, managers get an email. When approved/rejected, the employee gets an email. Domain `myview.work` is verified here. | Free (3,000 emails/month) |

### Authentication

| Application | Website | Purpose | Cost |
|---|---|---|---|
| **Google Cloud Console** | console.cloud.google.com | Manages the Google OAuth "app" (called an OAuth client). Allows users to sign in with their `@physiohealinghands.com` Google Workspace accounts. Configured to only allow the company domain. | Free |

### External Data

| Service | URL | Purpose |
|---|---|---|
| **GOV.UK Bank Holidays API** | `https://www.gov.uk/bank-holidays.json` | Free official UK government API. Fetched on-demand to exclude bank holidays when calculating working days. Cached for 24 hours. |

### Development Tools

| Tool | Purpose |
|---|---|
| **VS Code** | Code editor used to write and edit the application |
| **Node.js** | JavaScript runtime required to run Next.js locally |
| **npm** | Package manager — installs all project dependencies |

---

## 3. Technology Stack

### Frontend Framework
**Next.js 16.2.4** — A React framework that handles both the frontend UI and backend logic. Uses the **App Router** (the modern routing system introduced in Next.js 13).

Key Next.js features used:
- **Server Components** — Pages that render on the server, fetch data directly from the database, and send plain HTML to the browser. Faster and more secure.
- **Client Components** (`'use client'`) — Interactive parts that run in the browser (modals, dropdowns, toggles).
- **Server Actions** (`'use server'`) — Functions that run on the server when a form is submitted or a button is clicked. Used for all data mutations (creating/updating records).
- **Loading UI** (`loading.tsx`) — Automatic skeleton screens shown while pages are loading.
- **Middleware** — Runs on every request to check authentication and redirect unauthenticated users to `/login`.

### Language
**TypeScript** — A typed version of JavaScript. Catches bugs before they reach production by enforcing types on all data (e.g., a `Profile` must have a `full_name` string).

### Styling
**Tailwind CSS v4** — A utility-first CSS framework. Instead of writing separate CSS files, styles are applied directly in the HTML using class names like `bg-brand-600`, `rounded-xl`, `text-sm`.

Custom brand colours are defined in `app/globals.css`:
```css
--color-brand-600: #1F9F70;  /* Main green */
--color-brand-700: #078B5B;  /* Hover green */
--color-brand-800: #065C3D;  /* Dark green (login panel) */
```

### Database ORM
**Supabase JS Client** (`@supabase/supabase-js` + `@supabase/ssr`) — JavaScript library to query the database. Uses a query-builder syntax:
```typescript
supabase.from('leave_requests').select('*').eq('user_id', user.id)
```
The `@supabase/ssr` package handles cookies for server-side authentication (required for Next.js App Router).

### Key Libraries
| Library | Version | Purpose |
|---|---|---|
| `resend` | 6.12.2 | Sending emails |
| `lucide-react` | 1.9.0 | Icons (all the small icons throughout the UI) |
| `clsx` | 2.1.1 | Conditionally combining CSS class names |
| `tailwind-merge` | 3.5.0 | Merges Tailwind classes without conflicts |
| `date-fns` | 4.1.0 | Date formatting utilities |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                       │
│  Visits www.myview.work                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (CDN + Compute)                   │
│                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────┐  │
│  │  Middleware   │    │    Next.js App (Server + Client)  │  │
│  │  (auth check) │───▶│                                  │  │
│  └──────────────┘    │  Server Components:               │  │
│                      │  - Fetch data from Supabase       │  │
│                      │  - Render HTML                    │  │
│                      │                                   │  │
│                      │  Server Actions:                  │  │
│                      │  - Handle form submissions        │  │
│                      │  - Write to database              │  │
│                      │  - Send emails via Resend         │  │
│                      └──────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
┌─────────────────────┐      ┌─────────────────────────────┐
│   SUPABASE          │      │   RESEND                    │
│   - PostgreSQL DB   │      │   - Email delivery          │
│   - Auth (OAuth)    │      │   - Sends from              │
│   - Row Level Sec.  │      │     notifications@myview.work│
└─────────────────────┘      └─────────────────────────────┘
         │
         │ Auth redirect
         ▼
┌─────────────────────┐
│   GOOGLE OAUTH      │
│   - Verifies        │
│     @physiohealingha│
│     nds.com accounts│
└─────────────────────┘
```

### Request Flow — Employee Submitting a Leave Request

1. Employee clicks "New Request" in the browser
2. Browser renders the form (client component)
3. Employee fills in dates and clicks Submit
4. Next.js **Server Action** runs on the server:
   - Validates the input
   - Fetches UK bank holidays from GOV.UK API
   - Calculates working days
   - Checks the employee has sufficient balance
   - Inserts a new row into `leave_requests` table in Supabase
   - Queries all managers/hr_admins from `profiles` table
   - Sends notification email via Resend to each manager
5. Page redirects to "My Requests" list
6. Manager sees a **red badge** on their sidebar showing pending count

### Request Flow — Manager Approving

1. Manager opens "All Requests", sees pending request
2. Clicks "Review", a modal appears (client component)
3. Optionally adds a note, clicks "Approve"
4. Server Action runs:
   - Updates `leave_requests.status` to `'approved'`
   - Calls `increment_used_days` RPC to deduct from employee's balance
   - Sends approval email to employee via Resend
5. Modal shows green checkmark animation, then closes
6. Table re-renders with updated status

---

## 5. File Structure

```
myview/
│
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root HTML layout (fonts, metadata)
│   ├── page.tsx                  # Root redirect → /dashboard or /login
│   ├── globals.css               # Global styles + Tailwind brand colours
│   ├── icon.svg                  # Favicon (green circle with white hands)
│   │
│   ├── login/
│   │   └── page.tsx              # Split-panel login page (Google OAuth button)
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler (exchanges code for session)
│   │
│   └── dashboard/
│       ├── layout.tsx            # Protected layout: fetches profile, pending count, renders sidebar
│       ├── page.tsx              # Employee dashboard: welcome banner + donut charts + recent requests
│       ├── loading.tsx           # Skeleton screen shown while dashboard loads
│       │
│       ├── requests/
│       │   ├── page.tsx          # "My Requests" — employee's request history with timeline
│       │   ├── loading.tsx       # Skeleton for requests page
│       │   ├── cancel-button.tsx # "Cancel" button (client component)
│       │   ├── actions.ts        # cancelRequest server action
│       │   └── new/
│       │       ├── page.tsx      # New request form page
│       │       ├── form.tsx      # Interactive form with live working-day preview
│       │       └── actions.ts    # submitLeaveRequest server action (+ email to managers)
│       │
│       ├── balances/
│       │   └── page.tsx          # Employee's own leave balances table
│       │
│       ├── calendar/
│       │   ├── page.tsx          # Calendar page (server: fetches data, builds dayMap)
│       │   └── calendar-grid.tsx # Interactive monthly grid (client: prev/next navigation)
│       │
│       ├── manager/
│       │   ├── page.tsx          # Manager overview: stats cards + team list
│       │   ├── requests/
│       │   │   ├── page.tsx      # All requests table
│       │   │   ├── loading.tsx   # Skeleton for manager requests
│       │   │   ├── requests-table.tsx  # Filterable table (client component)
│       │   │   ├── review-modal.tsx    # Approve/reject modal with animation
│       │   │   └── actions.ts    # reviewRequest server action (+ email to employee)
│       │   └── balances/
│       │       └── page.tsx      # Team balances grid (read-only)
│       │
│       └── admin/
│           ├── page.tsx          # Users admin page
│           ├── edit-user-form.tsx # Modal to edit role/hours/start date
│           ├── actions.ts        # updateUserProfile, seedLeaveBalances actions
│           ├── balances/
│           │   ├── page.tsx      # HR Admin: edit leave balances per user
│           │   ├── balances-table.tsx # Editable table with proration hints
│           │   └── actions.ts    # upsertBalance action
│           └── reports/
│               ├── page.tsx      # Reports page (requests or balances snapshot)
│               └── report-filters.tsx # Filter bar + CSV export (client component)
│
├── components/                   # Reusable UI components
│   ├── sidebar.tsx               # Navigation sidebar (role-aware, pending badge)
│   ├── status-badge.tsx          # Coloured badge: pending/approved/rejected/cancelled
│   ├── skeleton.tsx              # Skeleton loader building blocks
│   ├── donut-chart.tsx           # SVG circular progress chart
│   ├── toaster.tsx               # Floating toast notification UI
│   └── ui/
│       ├── button.tsx            # Base button (primary/danger/secondary variants)
│       └── badge.tsx             # Base badge component
│
├── lib/                          # Shared utilities and services
│   ├── supabase/
│   │   ├── client.ts             # Browser-side Supabase client
│   │   └── server.ts             # Server-side Supabase client (cookie auth)
│   ├── types.ts                  # TypeScript types: Profile, LeaveRequest, LeaveBalance, etc.
│   ├── utils.ts                  # cn(), formatDate(), countWorkingDays(), getStatusColor()
│   ├── bank-holidays.ts          # Fetches England & Wales bank holidays from GOV.UK API
│   ├── proration.ts              # Prorates leave for mid-year starters and part-timers
│   ├── email.ts                  # Resend email functions
│   └── toast.ts                  # Toast event bus (browser-side notification trigger)
│
├── public/                       # Static files served as-is
│   └── logo.svg                  # Full PHH circular logo (used in sidebar + login)
│
├── supabase/                     # Database scripts (run manually in Supabase SQL Editor)
│   ├── schema.sql                # Full DB schema, RLS, trigger, seed data
│   ├── migrate_roles.sql         # Added hr_admin role + start_date column
│   ├── migrate_leave_types_v2.sql# Updated leave type days and added new types
│   └── migrate_halfdays.sql      # Changed balance columns to numeric for half-day support
│
├── middleware.ts                 # Auth guard: unauthenticated → /login
├── next.config.ts                # Next.js config (React Compiler enabled)
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
├── .env.local                    # Secret environment variables (never committed to Git)
├── .gitignore                    # Files excluded from Git
├── CLAUDE.md                     # Instructions for AI assistants working on this project
└── TECHNICAL.md                  # This document
```

---

## 6. Database Design

The database runs on **PostgreSQL** hosted by Supabase.

### Tables

#### `profiles`
Extends Supabase's built-in `auth.users` table. Created automatically when a user signs in for the first time via a database trigger.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` (PK) | Matches `auth.users.id` exactly |
| `full_name` | `text` | From Google account name |
| `email` | `text` | From Google account email |
| `role` | `text` | `'employee'` / `'manager'` / `'hr_admin'` |
| `start_date` | `date` | Employment start date (used for proration) |
| `weekly_hours` | `numeric(4,1)` | Working hours per week (default 37.5 for full-time) |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-set |

#### `leave_types`
Defines all types of leave available. Seeded with UK statutory types.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `name` | `text` | E.g. "Annual Leave", "Sick Leave" |
| `default_days` | `integer` | Standard entitlement. `0` = uncapped (e.g. Sick Leave) |
| `color` | `text` | Hex colour for calendar display |
| `is_default` | `boolean` | `true` = auto-assigned to every employee; `false` = HR assigns manually |

**Default leave types (auto-assigned to all employees):**
- Annual Leave — 20 days
- Bank Holiday — 8 days
- Sick Leave — 0 (uncapped)
- Compassionate Leave — 5 days

**Non-default types (HR assigns as needed):**
Maternity Leave (260d), Paternity Leave (10d), Shared Parental Leave (250d), Adoption Leave (260d), Parental Bereavement (10d), Neonatal Care Leave (60d), Unpaid Parental Leave (90d), TOIL (0d), Marriage/Civil Partnership (3d), Unpaid Leave (0d), Emergency Dependants (0d)

#### `leave_balances`
Tracks each employee's entitlement and usage per leave type per year.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `user_id` | `uuid` (FK → profiles) | Which employee |
| `leave_type_id` | `uuid` (FK → leave_types) | Which leave type |
| `year` | `integer` | Calendar year (e.g. 2026) |
| `total_days` | `numeric(6,1)` | Entitlement (supports half-days) |
| `used_days` | `numeric(6,1)` | Days used so far |
| Unique constraint | | One row per (user, leave_type, year) |

#### `leave_requests`
Every leave request ever submitted.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `user_id` | `uuid` (FK → profiles) | Who submitted it |
| `leave_type_id` | `uuid` (FK → leave_types) | Type of leave |
| `start_date` | `date` | First day of leave |
| `end_date` | `date` | Last day of leave |
| `days_count` | `numeric` | Working days (bank holidays excluded) |
| `reason` | `text` | Optional employee note |
| `status` | `text` | `pending` / `approved` / `rejected` / `cancelled` |
| `manager_note` | `text` | Optional note from manager on review |
| `reviewed_by` | `uuid` (FK → profiles) | Manager who reviewed |
| `reviewed_at` | `timestamptz` | When reviewed |
| `created_at` | `timestamptz` | When submitted |

### Database Trigger

When a new user signs in via Google OAuth for the first time, Supabase automatically calls a PostgreSQL function `handle_new_user()` which creates a row in `profiles`. This means user management is zero-effort — no manual user creation needed.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### RPC Function

`increment_used_days` — called when a request is approved to atomically deduct days from the employee's balance. Using an RPC (Remote Procedure Call) instead of a client-side update prevents race conditions.

### Row Level Security (RLS)

Every table has RLS enabled. This means the database itself enforces access rules regardless of what the application code does.

| Table | Employee can | Manager/HR Admin can |
|---|---|---|
| `profiles` | Read all, update own | Read all, update all |
| `leave_types` | Read only | Read + manage |
| `leave_balances` | Read own only | Read all + manage all |
| `leave_requests` | Read own, insert own, cancel own | Read all, update all |

---

## 7. Authentication & Security

### Google OAuth (Sign-in method)
Users do **not** have passwords. They sign in exclusively with their `@physiohealinghands.com` Google Workspace account.

**Flow:**
1. User clicks "Sign in with Google" on the login page
2. Browser redirects to Google's OAuth consent page
3. The `hd: 'physiohealinghands.com'` parameter restricts the picker to company accounts only
4. The `prompt: 'select_account'` parameter shows account selection (prevents auto-login)
5. Google redirects to `https://vlrtkvlfavykxxdedqnf.supabase.co/auth/v1/callback`
6. Supabase validates the token and creates a session
7. Supabase redirects to `https://www.myview.work/auth/callback`
8. The app's callback route exchanges the code for a cookie-based session
9. User is redirected to `/dashboard`

**Google Cloud Console project:** Contains the OAuth 2.0 Client ID. The following are registered as authorised redirect URIs:
- `https://vlrtkvlfavykxxdedqnf.supabase.co/auth/v1/callback` ← Supabase (critical — do not remove)
- `https://www.myview.work/auth/callback`
- `https://myview.work/auth/callback`

### Session Management
Sessions are stored in **cookies** (not localStorage) using `@supabase/ssr`. This is required for Next.js server components to read the session. The middleware refreshes the session cookie on every request.

### Middleware
`middleware.ts` runs on **every request** before the page loads:
- If the user is not authenticated and tries to visit any page except `/login` or `/auth/*` → redirect to `/login`
- If the user is authenticated and visits `/login` → redirect to `/dashboard`

---

## 8. Role & Permission System

Three roles, stacked (higher roles include lower role access):

```
hr_admin  ──▶  Can do everything
   │
manager   ──▶  Can do everything employee can + approve requests + view team
   │
employee  ──▶  Can submit requests, view own data, view team calendar
```

### Role Assignment
- All new users start as `employee` (set by the database trigger)
- Simmy (HR Admin) goes to **Admin → Users**, clicks **Edit** on any user, and changes their role
- Role changes take effect immediately on next page load

### Sidebar Navigation
The sidebar is role-aware. Users with `manager` or `hr_admin` roles see an additional section:

**Manager section:**
- Manager Overview
- All Requests *(with red pending count badge)*
- Team Balances

**HR Admin section (replaces manager section):**
- All Requests *(with red pending count badge)*
- Leave Balances *(edit entitlements)*
- Reports *(CSV export)*
- Users *(manage roles)*

### Employee Mode Toggle
Managers and HR Admins can click **"Employee view only"** at the bottom of the sidebar to hide their elevated navigation. This preference is saved to `localStorage` per user so it persists across sessions.

---

## 9. Business Logic

### Working Day Calculation
`lib/utils.ts → countWorkingDays(start, end, bankHolidays)`

Iterates through every calendar day between start and end, excluding:
- Saturdays (day 6)
- Sundays (day 0)
- Any date in the bank holidays array

Example: A request from Monday 21 April 2025 to Friday 25 April 2025, where Thursday 24th is Easter Bank Holiday = **4 working days** (not 5).

### Bank Holidays
`lib/bank-holidays.ts → getEnglandBankHolidays()`

Fetches from the official GOV.UK API: `https://www.gov.uk/bank-holidays.json`

Returns only England & Wales events (the `england-and-wales` key). The result is cached for **24 hours** by Next.js (`{ next: { revalidate: 86400 } }`), so the API is not called on every request.

### Proration
`lib/proration.ts`

Two scenarios where leave is prorated rather than given as a full year entitlement:

**Mid-year starters** (`prorateEntitlement`):
An employee who starts on 1 July gets roughly half the annual entitlement. The formula:
```
remaining_days_in_year / total_days_in_year × full_entitlement
```
Result is rounded to the nearest **0.5 days**.

**Bank Holiday proration** (`proratedBankHolidays`):
Counts only the bank holidays that fall **on or after** the employee's start date.

**Part-time workers** (`prorateEntitlement` with `weeklyHours`):
An employee working 20 hours/week on a 37.5-hour full-time equivalent:
```
full_entitlement × (weeklyHours / 37.5)
```

The Leave Balances admin page shows "(prorated: Xd)" hints next to unassigned balances to guide HR when setting up new employees.

### Balance Deduction Timing
Balances are **only deducted when a request is approved**, not when submitted. This means:
- A pending request does not reduce the displayed balance
- If a pending request is cancelled, no balance adjustment is needed
- If a request is rejected, no balance adjustment is needed

---

## 10. Email Notifications

### Service: Resend
- **Website:** resend.com
- **API Key:** Stored in Vercel environment variable `RESEND_API_KEY`
- **Sending domain:** `myview.work` (must be verified in Resend with DNS records in GoDaddy)
- **From address:** Controlled by env var `RESEND_FROM` (falls back to `onboarding@resend.dev` for testing)

### Triggers

| Event | Who receives | Subject |
|---|---|---|
| Employee submits leave request | All users with `manager` or `hr_admin` role | "New leave request from [Name]" |
| Manager approves request | The employee who submitted | "✅ Your leave request has been approved" |
| Manager rejects request | The employee who submitted | "Your leave request was not approved" |

### Email Content
Both email types include a details table (leave type, dates, days count, reason/note) and a call-to-action button linking back to the app.

### Failure Handling
All email sends are wrapped in `try/catch`. If Resend is unavailable or the domain isn't verified, the email fails silently — the leave request submission or approval still completes successfully. Errors are logged to Vercel's function logs.

---

## 11. Feature Documentation

### Login Page (`/login`)
Split-panel design:
- **Left panel** (desktop only): Dark green gradient, PHH logo, tagline, feature bullets
- **Right panel**: "Welcome back" form with Google OAuth button
- Mobile: Stacked layout (logo on top, form below)

### Employee Dashboard (`/dashboard`)
- **Welcome banner**: Time-based greeting (morning/afternoon/evening), "New Request" button
- **Leave balance cards**: One card per assigned leave type, showing a **donut chart** (SVG circle, coloured by leave type colour). Low balances (≤2 days) turn red with "Running low" label. Uncapped types show "no cap" ring.
- **Recent requests table**: Last 5 requests with type, dates, days, status badge

### My Requests (`/dashboard/requests`)
Table of all the employee's requests with:
- Leave type (colour dot + name)
- From/To dates
- Days count
- **Status badge** + **mini timeline** (submitted date → reviewed date)
- Manager note (italic)
- Cancel button for pending requests

### New Request Form (`/dashboard/requests/new`)
- Leave type selector (only types with a balance are shown)
- Date pickers (from/to)
- Live working-day counter updates as dates change (shows "weekends & bank holidays excluded")
- Optional reason text area
- Validates: sufficient balance, no past dates, end ≥ start, at least 1 working day

### My Balances (`/dashboard/balances`)
Full table showing all assigned leave types with entitlement, used, remaining, and a horizontal progress bar.

### Team Calendar (`/dashboard/calendar`)
A proper monthly grid calendar:
- Previous/next month navigation (URL param `?month=YYYY-MM`)
- Today highlighted with green circle
- Weekend columns shaded
- Each day cell shows coloured chips (employee initial + first name) for approved leaves
- "On leave this month" legend below the grid

### Manager Overview (`/dashboard/manager`)
Three stat cards (team members, pending requests, upcoming approved absences), each linking to the relevant section. Below: a table of all team members.

### All Requests — Manager (`/dashboard/manager/requests`)
Filterable table of all leave requests across all employees:
- Filter by status (All / Pending / Approved / Rejected)
- "Review" button on pending rows opens the **Review Modal**
- Review Modal: note textarea, Approve/Reject buttons, animated success/rejection screen before auto-closing

### Team Balances — Manager (`/dashboard/manager/balances`)
Read-only grid: rows = employees, columns = default leave types. Each cell shows "remaining / entitlement". Low balances in red.

### Leave Balances — Admin (`/dashboard/admin/balances`)
HR Admin editable version of the balances grid. Each cell can be clicked to set the entitlement. Shows proration suggestions for mid-year starters and part-timers.

### Reports — Admin (`/dashboard/admin/reports`)
Two report modes:
- **Leave Requests**: Filterable by leave type, employee, and date range. Shows count + total days.
- **Balances Snapshot**: Current year balances for all employees.
- **Export CSV**: Downloads filtered data as a CSV file (client-side Blob).

### Users — Admin (`/dashboard/admin`)
Table of all users with name, email, role badge (colour-coded), start date, weekly hours. Edit button opens a modal to change role, start date, and weekly hours. After saving, missing default leave balances are auto-seeded for the current year.

---

## 12. UI Component Library

### `Sidebar` (`components/sidebar.tsx`)
Client component. Receives `profile` and `pendingCount` as props from the server layout.
- Role-aware navigation
- Logo image (`public/logo.svg`)
- Red pending badge on "All Requests"
- Employee mode toggle (localStorage)
- Sign-out button

### `StatusBadge` (`components/status-badge.tsx`)
Displays a coloured pill for request status:
- Pending → yellow
- Approved → green
- Rejected → red
- Cancelled → grey

### `DonutChart` (`components/donut-chart.tsx`)
Pure SVG circular progress chart. Takes `used`, `total`, and `color` props. The circle rotates from the top (using CSS `-rotate-90`).

### `Toaster` (`components/toaster.tsx`)
Listens to the toast event bus (`lib/toast.ts`). Renders floating toast cards in the top-right corner. Each toast auto-dismisses after 4 seconds and has an animated slide-in entrance.

### `Skeleton` components (`components/skeleton.tsx`)
Used in `loading.tsx` files for each route:
- `SkeletonCard` — mimics a balance card
- `SkeletonTable` — mimics a data table
- `SkeletonBanner` — mimics the dashboard welcome banner

### `CalendarGrid` (`app/dashboard/calendar/calendar-grid.tsx`)
Client component. Receives year, month, and a `dayMap` (date string → array of requests). Handles prev/next month navigation by updating the URL search param.

### `Button` (`components/ui/button.tsx`)
Three variants: `primary` (green), `danger` (red), `secondary` (grey).

---

## 13. Environment Variables

These are secrets stored in Vercel (Settings → Environment Variables) and locally in `.env.local` (never committed to Git).

| Variable | Where to get it | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API | Public API key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API | Admin key (never expose client-side) |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | Authorises email sending |
| `RESEND_FROM` | Set manually | Override sender address once domain is verified: `MyView <notifications@myview.work>` |

---

## 14. Local Development Setup

### Prerequisites
- Node.js 18+ installed
- Git installed
- Access to the GitHub repository

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/SMJAI/myview.git
cd myview

# 2. Install dependencies
npm install

# 3. Create environment variables file
# Copy the values from Vercel or ask the project owner
cp .env.example .env.local
# Edit .env.local and fill in the 3 Supabase variables

# 4. Start the development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

The development server hot-reloads on file changes. The app connects to the **same production Supabase database** — there is no separate dev database. Be careful with test data.

### Useful Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production (catches TypeScript errors)
npm run lint     # Run ESLint code quality checks
```

---

## 15. Deployment Process

### Automatic Deployment (normal workflow)
Every `git push` to the `main` branch on GitHub automatically triggers a Vercel deployment. No manual steps needed.

```bash
git add .
git commit -m "Your change description"
git push
# Vercel deploys automatically within ~60 seconds
```

### Checking Deployment Status
Go to [vercel.com](https://vercel.com) → sign in → find the `myview` project → "Deployments" tab. Each deployment shows build logs and whether it succeeded.

### Manual Re-deployment
If environment variables are changed in Vercel, you need to redeploy for them to take effect. In Vercel: Deployments → three-dot menu on latest deployment → "Redeploy".

### Build Errors
If a deployment fails, check the build logs in Vercel. Common causes:
- TypeScript type errors
- Missing environment variables
- Import errors

Run `npm run build` locally before pushing to catch errors early.

---

## 16. DNS & Domain Setup

The domain `myview.work` is registered on **GoDaddy** and points to **Vercel**.

### Vercel DNS Records (in GoDaddy)

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` (Vercel's IP) |
| `CNAME` | `www` | `cname.vercel-dns.com` |

### Resend DNS Records (for email sending)

These records authorise Resend to send emails from `notifications@myview.work`:

| Type | Name | Value |
|---|---|---|
| `TXT` | `resend._domainkey` | DKIM key (from Resend Domains page) |
| `MX` | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority: 10) |
| `TXT` | `send` | SPF record (from Resend Domains page) |

### Supabase OAuth URLs (in Google Cloud Console)

These must be registered as **Authorised Redirect URIs** in the Google OAuth client:
- `https://vlrtkvlfavykxxdedqnf.supabase.co/auth/v1/callback` ← **critical, never remove**
- `https://www.myview.work/auth/callback`
- `https://myview.work/auth/callback`

---

## 17. Key Conventions & Patterns

### Data Fetching
- **Server components** fetch data directly using the server Supabase client — no API routes needed
- **Client components** do not fetch data (except for auth logout)
- Data flows: Server Component → props → Client Component

### Mutations (form submissions, button clicks that change data)
All mutations use **Next.js Server Actions** defined in `actions.ts` files. Pattern:
```typescript
'use server'
export async function doSomething(formData: FormData) {
  const supabase = await createClient()
  // 1. Verify auth
  // 2. Verify authorisation (check role)
  // 3. Validate input
  // 4. Perform DB operation
  // 5. revalidatePath() to refresh the UI
  // 6. redirect() or return { error: 'message' }
}
```

### Role Guards
Every protected page checks the user's role server-side:
```typescript
const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
if (!canManageUsers(profile.role)) redirect('/dashboard')
```

### Path Aliases
`@/` maps to the project root. So `@/lib/utils` = `./lib/utils.ts`. Configured in `tsconfig.json`.

### Brand Colours
Never use Tailwind's built-in colour names (e.g. `green-600`, `indigo-500`) for brand elements. Always use `brand-*` classes defined in `globals.css`.

### Commits
All commits are authored by **SMJAI** (`littledrops.sm@gmail.com`). Never add Co-Authored-By AI attribution lines.

---

## 18. Known Limitations & Future Work

### Current Limitations
| Item | Detail |
|---|---|
| No password login | Google OAuth only — users must have a `@physiohealinghands.com` Google Workspace account |
| No mobile app | Web only, but the UI is functional on mobile browsers |
| No edit after submit | Employees cannot edit a submitted request — they must cancel and resubmit |
| Single organisation | No multi-tenancy — built for Physio Healing Hands only |
| No real-time updates | Managers must refresh to see new requests (no WebSocket/live updates) |
| Bank holidays | England & Wales only — does not handle Scottish or Northern Irish bank holidays |

### Potential Future Features
| Feature | Notes |
|---|---|
| Edit leave request | Allow employee to change dates on a pending request |
| Leave request notifications (realtime) | Use Supabase Realtime to push live updates |
| Mobile notifications | Push notifications via browser service workers |
| iCal / Google Calendar sync | Export approved leave to personal calendar |
| Carry-over leave | Track unused leave carried into the next year |
| Attachment support | Upload fit notes / doctor certificates for sick leave |
| Half-day requests | Submit a half-day morning or afternoon off |
| Team absence dashboard for managers | Visual overview of who's off when |
| Audit log | Full history of all changes made to balances and requests |
| Automated annual balance reset | Supabase CRON job to create new year's balances on 1 January |

---

*This document should be updated whenever significant changes are made to the application. It is the single source of truth for how MyView works.*
