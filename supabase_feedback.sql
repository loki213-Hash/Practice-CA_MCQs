-- ==============================================================================
-- Migration: Student Feedback Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT DEFAULT 'Guest',
  course_id BIGINT REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name TEXT,
  rating INTEGER DEFAULT 5,
  category TEXT DEFAULT 'General',
  message TEXT,
  test_type TEXT DEFAULT 'take-test',
  score_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and anonymous to submit feedback
CREATE POLICY "Anyone can insert feedback" ON public.student_feedback
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own feedback
CREATE POLICY "Users can view own feedback" ON public.student_feedback
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
