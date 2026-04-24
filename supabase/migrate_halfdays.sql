-- ============================================================
-- Migration: Support half-day leave balances + weekly_hours
-- Run in Supabase SQL Editor
-- ============================================================

-- Allow decimal values (e.g. 15.5 days) in leave balances
ALTER TABLE leave_balances
  ALTER COLUMN total_days TYPE numeric(6,1),
  ALTER COLUMN used_days  TYPE numeric(6,1);

-- Add weekly_hours to profiles (37.5 = full time)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_hours numeric(4,1) DEFAULT 37.5;

-- Update the RPC to accept numeric days
CREATE OR REPLACE FUNCTION public.increment_used_days(
  p_user_id uuid,
  p_leave_type_id uuid,
  p_year integer,
  p_days numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.leave_balances
  SET used_days = used_days + p_days
  WHERE user_id = p_user_id
    AND leave_type_id = p_leave_type_id
    AND year = p_year;
END;
$$;
