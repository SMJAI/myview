-- ============================================================
-- MyView - Absence Management System
-- Physio Healing Hands
-- Run this in Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('employee', 'manager')) default 'employee',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Leave types
create table if not exists leave_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  default_days integer not null default 20,
  color text not null default '#1F9F70',
  is_default boolean not null default true,
  created_at timestamptz default now()
);

-- Leave balances (per user, per leave type, per year)
create table if not exists leave_balances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  leave_type_id uuid references leave_types(id) on delete cascade not null,
  year integer not null,
  total_days integer not null,
  used_days integer not null default 0,
  created_at timestamptz default now(),
  unique(user_id, leave_type_id, year)
);

-- Leave requests
create table if not exists leave_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  leave_type_id uuid references leave_types(id) not null,
  start_date date not null,
  end_date date not null,
  days_count integer not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  manager_note text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table leave_types enable row level security;
alter table leave_balances enable row level security;
alter table leave_requests enable row level security;

-- Profiles
create policy "profiles_select" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- Leave types (read-only for all authenticated)
create policy "leave_types_select" on leave_types
  for select using (auth.role() = 'authenticated');

create policy "leave_types_manage" on leave_types
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  );

-- Leave balances
create policy "balances_select" on leave_balances
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  );

create policy "balances_manage" on leave_balances
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  );

-- Leave requests
create policy "requests_select" on leave_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  );

create policy "requests_insert" on leave_requests
  for insert with check (auth.uid() = user_id);

create policy "requests_update_own_pending" on leave_requests
  for update using (
    (auth.uid() = user_id and status = 'pending')
    or exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  );

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Seed default leave types
-- ============================================================

-- is_default = true  → auto-seeded for every new user
-- is_default = false → available but set manually per employee by manager
insert into leave_types (name, default_days, color, is_default) values
  -- Auto-seeded defaults (every employee gets these)
  ('Annual Leave',              20,  '#1F9F70', true),   -- UK statutory: 20 days (excl. bank holidays; 28 days incl. BH)
  ('Bank Holiday',               8,  '#078B5B', true),   -- 8 UK public holidays
  ('Sick Leave',                 0,  '#EF4444', true),   -- No cap enforced; entitlement set per employee when needed
  ('Compassionate Leave',        5,  '#6B7280', true),   -- Employer discretion, common practice

  -- Statutory entitlements (set per employee when relevant)
  ('Maternity Leave',          260,  '#EC4899', false),  -- 52 weeks (SMP: weeks 1-6 @ 90%, weeks 7-39 @ £187.18/wk)
  ('Paternity Leave',           10,  '#3B82F6', false),  -- 1-2 weeks (SPP: £194.32/wk or 90% earnings)
  ('Shared Parental Leave',    250,  '#8B5CF6', false),  -- Up to 50 weeks if mother takes 2 wks maternity
  ('Adoption Leave',           260,  '#F59E0B', false),  -- 52 weeks (SAP: weeks 1-6 @ 90%, weeks 7-39 @ £194.32/wk)
  ('Parental Bereavement',      10,  '#9CA3AF', false),  -- 2 weeks; child under 18 or stillbirth after 24 wks
  ('Neonatal Care Leave',       60,  '#06B6D4', false),  -- Up to 12 weeks; babies born on/after 6 Apr 2025 in neonatal care ≥7 days
  ('Unpaid Parental Leave',     90,  '#7A7A7A', false),  -- 18 weeks per child (to age 18); max 4 weeks/year per child; unpaid

  -- Employer discretion / unpaid statutory rights
  ('Time Off in Lieu (TOIL)',    0,  '#8B5CF6', false),  -- Earned when working weekends/bank holidays; HR sets balance manually
  ('Marriage/Civil Partnership', 3,  '#F97316', false),  -- Not statutory; employer discretion
  ('Unpaid Leave',               0,  '#94A3B8', false),  -- Ad-hoc unpaid; manager approval required
  ('Emergency Dependants',       0,  '#6B7280', false)   -- Statutory unpaid right (ERA 1996 s.57A); reasonable time only
on conflict (name) do update set
  default_days = excluded.default_days,
  color        = excluded.color,
  is_default   = excluded.is_default;

-- ============================================================
-- RPC: increment used days on approval
-- ============================================================

create or replace function public.increment_used_days(
  p_user_id uuid,
  p_leave_type_id uuid,
  p_year integer,
  p_days integer
)
returns void
language plpgsql
security definer
as $$
begin
  update public.leave_balances
  set used_days = used_days + p_days
  where user_id = p_user_id
    and leave_type_id = p_leave_type_id
    and year = p_year;
end;
$$;
