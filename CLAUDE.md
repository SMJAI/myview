@AGENTS.md

# MyView — Project Reference

## Identity & Git
- All commits must be authored as **SMJAI** (`littledrops.sm@gmail.com`)
- Never add `Co-Authored-By: Claude` or any AI attribution lines to commits
- Remote: https://github.com/SMJAI/myview

## Project Overview
- **App name:** MyView
- **Client:** Physio Healing Hands
- **Purpose:** Internal absence management system (leave requests, approvals, balances)
- **Users:** 4 employees + 1 manager (small team, no multi-tenancy needed)

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Supabase client | `@supabase/ssr` (SSR-safe cookie-based sessions) |
| Icons | `lucide-react` |
| Utilities | `clsx`, `tailwind-merge`, `date-fns` |
| Hosting (planned) | Vercel |

## Supabase
- Project URL: `https://vlrtkvlfavykxxdedqnf.supabase.co`
- Env vars live in `.env.local` (gitignored — never commit this file)
- Schema + RLS policies: `supabase/schema.sql` — run in Supabase SQL Editor to set up or reset the DB

## Database Tables
| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` — full_name, email, role (employee/manager) |
| `leave_types` | Annual Leave, Sick Leave, Unpaid Leave, Parental Leave |
| `leave_balances` | Per user × per leave type × per year (total_days, used_days) |
| `leave_requests` | Leave requests with status: pending / approved / rejected / cancelled |

Key DB behaviours:
- A Postgres trigger (`on_auth_user_created`) auto-creates a `profiles` row on signup
- `increment_used_days` RPC deducts balance when a request is approved
- RLS ensures employees only see their own data; managers see everything

## App Structure
```
app/
  login/               — public login page (email + password)
  dashboard/
    layout.tsx         — protected layout with sidebar (fetches profile server-side)
    page.tsx           — employee dashboard: balance cards + recent requests
    requests/
      page.tsx         — employee's own request history + cancel
      new/             — submit new leave request form
    manager/
      page.tsx         — manager overview (stats + team list)
      requests/        — all requests table with approve/reject modal
    calendar/          — approved absences for next 3 months
    admin/             — create users (manager only); auto-seeds leave balances
components/
  sidebar.tsx          — client component; nav + logout
  status-badge.tsx     — maps LeaveStatus → coloured badge
  ui/badge.tsx         — base badge component
  ui/button.tsx        — base button component
lib/
  supabase/client.ts   — browser Supabase client
  supabase/server.ts   — server Supabase client (cookie-based)
  types.ts             — shared TypeScript types (Profile, LeaveRequest, etc.)
  utils.ts             — cn(), formatDate(), countWorkingDays(), getStatusColor()
middleware.ts          — session refresh + redirect unauthenticated → /login
supabase/schema.sql    — full DB schema, RLS, trigger, seed data
```

## Key Conventions
- Server components fetch data directly via `lib/supabase/server.ts`
- Client components use `lib/supabase/client.ts` only for auth (logout)
- Mutations go through Next.js Server Actions (`'use server'`) in `actions.ts` files
- `revalidatePath()` called after mutations to refresh server-rendered data
- Role guard pattern: fetch `profiles.role` in server component → `redirect()` if not authorised
- Working days only (weekends excluded) calculated in `countWorkingDays()`
- Leave balance is deducted via RPC only on approval, not on submission

## Role Behaviour
| Feature | Employee | Manager |
|---|---|---|
| Dashboard (own balances + requests) | ✅ | ✅ |
| Submit leave request | ✅ | ✅ |
| Cancel own pending request | ✅ | ✅ |
| Team calendar | ✅ | ✅ |
| Approve / reject requests | ❌ | ✅ |
| Manager overview | ❌ | ✅ |
| Add / manage users | ❌ | ✅ |

## First-Time Setup (after cloning)
1. Copy `.env.local` with Supabase URL + keys (never commit this)
2. Run `supabase/schema.sql` in Supabase SQL Editor
3. Create the manager user in Supabase Auth → set `role = 'manager'` in profiles table
4. Log in as manager → Users → Add employees (leave balances auto-seeded)
5. `npm run dev` → http://localhost:3000

## What's Not Built Yet
- Email notifications (approval/rejection emails to employee)
- Password reset flow
- Edit leave request after submission
- Leave balance override per individual user
- Public holidays calendar
