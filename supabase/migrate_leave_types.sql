-- ============================================================
-- Migration: Update leave types to UK statutory standard
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- ============================================================

-- Step 1: Add is_default column if it doesn't exist
alter table leave_types
  add column if not exists is_default boolean not null default true;

-- Step 2: Remove old placeholder types
delete from leave_types where name in ('Parental Leave');

-- Step 3: Upsert full UK statutory leave types
insert into leave_types (name, default_days, color, is_default) values
  ('Annual Leave',              20,  '#1F9F70', true),
  ('Bank Holiday',               8,  '#078B5B', true),
  ('Sick Leave',                28,  '#EF4444', true),
  ('Compassionate Leave',        5,  '#6B7280', true),
  ('Maternity Leave',          260,  '#EC4899', false),
  ('Paternity Leave',           10,  '#3B82F6', false),
  ('Shared Parental Leave',    250,  '#8B5CF6', false),
  ('Adoption Leave',           260,  '#F59E0B', false),
  ('Parental Bereavement',      14,  '#9CA3AF', false),
  ('Marriage/Civil Partnership', 3,  '#F97316', false),
  ('Unpaid Leave',               0,  '#7A7A7A', false),
  ('Emergency Dependants',       0,  '#6B7280', false)
on conflict (name) do update set
  default_days = excluded.default_days,
  color        = excluded.color,
  is_default   = excluded.is_default;

-- Done. Verify with:
-- select name, default_days, is_default from leave_types order by is_default desc, name;
