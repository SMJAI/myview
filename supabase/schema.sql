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
  color text not null default '#3B82F6',
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

insert into leave_types (name, default_days, color) values
  ('Annual Leave', 20, '#1F9F70'),
  ('Sick Leave', 10, '#EF4444'),
  ('Unpaid Leave', 0, '#7A7A7A'),
  ('Parental Leave', 90, '#078B5B')
on conflict (name) do nothing;

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
