-- ============================================================
-- Migration: Add hr_admin role + start_date to profiles
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Expand role constraint to include hr_admin
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('employee', 'manager', 'hr_admin'));

-- 2. Add start_date column (employment start date for proration)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS start_date date;

-- 3. Update leave_types manage policy
DROP POLICY IF EXISTS "leave_types_manage" ON leave_types;
CREATE POLICY "leave_types_manage" ON leave_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'hr_admin'))
  );

-- 4. Update leave_balances policies
DROP POLICY IF EXISTS "balances_select" ON leave_balances;
DROP POLICY IF EXISTS "balances_manage" ON leave_balances;
CREATE POLICY "balances_select" ON leave_balances
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'hr_admin'))
  );
CREATE POLICY "balances_manage" ON leave_balances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'hr_admin'))
  );

-- 5. Update leave_requests policies
DROP POLICY IF EXISTS "requests_select" ON leave_requests;
DROP POLICY IF EXISTS "requests_update_own_pending" ON leave_requests;
CREATE POLICY "requests_select" ON leave_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'hr_admin'))
  );
CREATE POLICY "requests_update_own_pending" ON leave_requests
  FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'pending')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'hr_admin'))
  );
