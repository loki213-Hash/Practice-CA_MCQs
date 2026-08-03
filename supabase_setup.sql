-- SELF-SERVICE PASSWORD RESET FUNCTION USING SECURITY RECOVERY WORDS
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

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
  -- 1. Find the user ID matching username and recovery phrases (case-insensitive & trimmed)
  SELECT id INTO user_uuid
  FROM public.registered_users
  WHERE lower(trim(username)) = lower(trim(target_username))
    AND lower(trim(favourite_place)) = lower(trim(recovery_word1))
    AND lower(trim(firstname_yob)) = lower(trim(recovery_word2));

  -- 2. If no matching user is found, return false
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;

  -- 3. Update the user's password in auth.users using bcrypt encryption (crypt)
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_uuid;

  RETURN true;
END;
$$;

-- Grant execution permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.reset_student_password(text, text, text, text) TO authenticated;
