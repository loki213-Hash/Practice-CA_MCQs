-- ============================================================
-- CA Quiz Platform — Mistake Vault & Bookmarks Setup
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. MISTAKE VAULT TABLE
-- Stores wrong/skipped questions persistently across all test sessions.
CREATE TABLE IF NOT EXISTS public.student_mistake_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  chapter_id text,
  question_text text DEFAULT '',
  option_a text DEFAULT '',
  option_b text DEFAULT '',
  option_c text DEFAULT '',
  option_d text DEFAULT '',
  correct_option text DEFAULT 'A',
  explanation text DEFAULT '',
  topic text DEFAULT 'General',
  is_priority boolean DEFAULT false,
  attempt_count integer DEFAULT 1,
  last_wrong_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.student_mistake_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vault" ON public.student_mistake_vault;
CREATE POLICY "Users can view own vault"
  ON public.student_mistake_vault FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vault" ON public.student_mistake_vault;
CREATE POLICY "Users can insert own vault"
  ON public.student_mistake_vault FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vault" ON public.student_mistake_vault;
CREATE POLICY "Users can update own vault"
  ON public.student_mistake_vault FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vault" ON public.student_mistake_vault;
CREATE POLICY "Users can delete own vault"
  ON public.student_mistake_vault FOR DELETE
  USING (auth.uid() = user_id);

-- 2. STUDENT BOOKMARKS TABLE
-- Stores bookmarked questions with optional personal sticky notes.
CREATE TABLE IF NOT EXISTS public.student_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  chapter_id text,
  question_text text DEFAULT '',
  option_a text DEFAULT '',
  option_b text DEFAULT '',
  option_c text DEFAULT '',
  option_d text DEFAULT '',
  correct_option text DEFAULT 'A',
  explanation text DEFAULT '',
  topic text DEFAULT 'General',
  sticky_note text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.student_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.student_bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON public.student_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.student_bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON public.student_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookmarks" ON public.student_bookmarks;
CREATE POLICY "Users can update own bookmarks"
  ON public.student_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.student_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON public.student_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Done! Both tables created with proper RLS policies.
-- Students can only see, edit, and delete their own vault/bookmark records.
