-- SUPABASE SETUP SCRIPT FOR SELF-SERVICE PASSWORD RECOVERY
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the public registered_users profile table if not exists
CREATE TABLE IF NOT EXISTS public.registered_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  favourite_place text NOT NULL,
  firstname_yob text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and set public select policy
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on registered_users" ON public.registered_users;
CREATE POLICY "Allow public select on registered_users" 
  ON public.registered_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on registered_users" ON public.registered_users;
CREATE POLICY "Allow public insert on registered_users" 
  ON public.registered_users FOR INSERT WITH CHECK (true);

-- 2. Sync all existing users from auth.users (extracting metadata)
INSERT INTO public.registered_users (id, username, favourite_place, firstname_yob)
SELECT 
  id, 
  coalesce(raw_user_meta_data->>'username', split_part(email, '.', 1)) as username,
  coalesce(raw_user_meta_data->>'favourite_place', 'Not Set') as favourite_place,
  coalesce(raw_user_meta_data->>'firstname_yob', 'Not Set') as firstname_yob
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
  username = EXCLUDED.username,
  favourite_place = EXCLUDED.favourite_place,
  firstname_yob = EXCLUDED.firstname_yob;

-- 3. Create the secure password reset function
CREATE OR REPLACE FUNCTION public.reset_student_password(
  target_username text,
  recovery_word1 text,
  recovery_word2 text,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated admin privileges to modify auth.users
SET search_path = public, auth
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Find the user ID matching username and recovery phrases (case-insensitive & trimmed)
  SELECT id INTO user_uuid
  FROM public.registered_users
  WHERE lower(trim(username)) = lower(trim(target_username))
    AND lower(trim(favourite_place)) = lower(trim(recovery_word1))
    AND lower(trim(firstname_yob)) = lower(trim(recovery_word2));

  -- If no matching user is found, return false
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;

  -- Update the user's password in auth.users using bcrypt encryption (crypt)
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_uuid;

  RETURN true;
END;
$$;

-- Grant execution permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text, text) TO authenticated;
