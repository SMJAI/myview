-- ============================================================
-- Migration: Avatar URL + Notifications
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add avatar_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Update trigger to capture avatar_url from Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 3. Backfill avatar_url for existing users from Google OAuth metadata
UPDATE public.profiles p
SET avatar_url = (
  SELECT au.raw_user_meta_data->>'avatar_url'
  FROM auth.users au
  WHERE au.id = p.id
)
WHERE p.avatar_url IS NULL;

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications for any user (used from server actions)
DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
CREATE POLICY "notifications_insert_service" ON notifications
  FOR INSERT WITH CHECK (true);
