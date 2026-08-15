-- SUPABASE SETUP SCRIPT FOR SELF-SERVICE PASSWORD RECOVERY
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure pgcrypto extension is installed in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Create the public registered_users profile table if not exists
CREATE TABLE IF NOT EXISTS public.registered_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  favourite_place text NOT NULL,
  firstname_yob text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and set public policies
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on registered_users" ON public.registered_users;
CREATE POLICY "Allow public select on registered_users" 
  ON public.registered_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on registered_users" ON public.registered_users;
CREATE POLICY "Allow public insert on registered_users" 
  ON public.registered_users FOR INSERT WITH CHECK (true);

-- 3. Sync all existing users from auth.users (extracting metadata)
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

-- 4. Create the secure password reset function supporting 7-character recovery code or legacy phrases
CREATE OR REPLACE FUNCTION public.reset_student_password(
  target_username text,
  provided_code text,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated admin privileges to modify auth.users
SET search_path = public, auth, extensions
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Find the user ID matching username and 7-char recovery_code or legacy recovery phrases
  SELECT id INTO user_uuid
  FROM public.registered_users
  WHERE lower(trim(username)) = lower(trim(target_username))
    AND (
      (recovery_code IS NOT NULL AND recovery_code = trim(provided_code))
      OR lower(trim(favourite_place)) = lower(trim(provided_code))
      OR lower(trim(firstname_yob)) = lower(trim(provided_code))
    );

  -- Fallback: check auth.users directly by email or user metadata
  IF user_uuid IS NULL THEN
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE lower(trim(split_part(email, '.', 1))) = lower(trim(target_username))
       OR lower(trim(raw_user_meta_data->>'username')) = lower(trim(target_username));
  END IF;

  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;

  -- Update the user's password in auth.users using bcrypt encryption from extensions schema
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf'))
  WHERE id = user_uuid;

  RETURN true;
END;
$$;

-- Overload for backwards compatibility with legacy 4-parameter calls
CREATE OR REPLACE FUNCTION public.reset_student_password(
  target_username text,
  recovery_word1 text,
  recovery_word2 text,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  RETURN public.reset_student_password(target_username, recovery_word1, new_password);
END;
$$;

-- Grant execution permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text, text) TO authenticated;
