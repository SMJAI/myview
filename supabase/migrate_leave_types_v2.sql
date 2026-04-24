-- ============================================================
-- Migration: Correct leave type data + add Neonatal Care Leave
-- Run in Supabase SQL Editor AFTER migrate_roles.sql
-- ============================================================

-- Sick Leave: no enforced cap; entitlement added per employee manually when needed
UPDATE leave_types
SET default_days = 0,
    color = '#EF4444'
WHERE name = 'Sick Leave';

-- Fix Parental Bereavement: was 14 days, correct is 2 weeks = 10 working days
UPDATE leave_types
SET default_days = 10
WHERE name = 'Parental Bereavement';

-- Add Neonatal Care Leave (new statutory right, babies born on/after 6 Apr 2025)
INSERT INTO leave_types (name, default_days, color, is_default)
VALUES ('Neonatal Care Leave', 60, '#06B6D4', false)
ON CONFLICT (name) DO UPDATE SET
  default_days = excluded.default_days,
  color        = excluded.color,
  is_default   = excluded.is_default;

-- Add Unpaid Parental Leave (18 weeks per child, distinct from ad-hoc Unpaid Leave)
INSERT INTO leave_types (name, default_days, color, is_default)
VALUES ('Unpaid Parental Leave', 90, '#7A7A7A', false)
ON CONFLICT (name) DO UPDATE SET
  default_days = excluded.default_days,
  color        = excluded.color,
  is_default   = excluded.is_default;

-- Update Shared Parental Leave comment (no data change needed, just clarify)
-- Up to 50 weeks available when mother curtails maternity leave at 2 weeks

-- Add Time Off in Lieu (TOIL)
INSERT INTO leave_types (name, default_days, color, is_default)
VALUES ('Time Off in Lieu (TOIL)', 0, '#8B5CF6', false)
ON CONFLICT (name) DO UPDATE SET
  default_days = excluded.default_days,
  color        = excluded.color,
  is_default   = excluded.is_default;

-- NOTE: Existing leave_balances for Sick Leave will keep their current total_days.
-- Update them manually per employee if needed via the Leave Balances page.
-- TOIL balances start at 0 — assign days per employee on the Leave Balances page
-- each time they work a weekend or bank holiday.
