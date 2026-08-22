-- ==============================================================================
-- CA QUIZ PLATFORM — DAILY USER METRICS & HISTORICAL LOGS SETUP
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create table for persistent daily user metrics logs
CREATE TABLE IF NOT EXISTS public.daily_user_metrics (
  id BIGSERIAL PRIMARY KEY,
  log_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  day_number INTEGER DEFAULT 1,
  new_users_registered INTEGER DEFAULT 0,
  new_users_list JSONB DEFAULT '[]'::jsonb,
  total_visitors INTEGER DEFAULT 0,
  cumulative_visitors INTEGER DEFAULT 0,
  logged_in_users INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_time_spent_seconds INTEGER DEFAULT 0,
  user_time_spent_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_user_metrics(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_day ON public.daily_user_metrics(day_number);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.daily_user_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public insert on daily_user_metrics" ON public.daily_user_metrics;
CREATE POLICY "Allow public insert on daily_user_metrics" 
  ON public.daily_user_metrics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on daily_user_metrics" ON public.daily_user_metrics;
CREATE POLICY "Allow public update on daily_user_metrics" 
  ON public.daily_user_metrics FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on daily_user_metrics" ON public.daily_user_metrics;
CREATE POLICY "Allow public select on daily_user_metrics" 
  ON public.daily_user_metrics FOR SELECT USING (true);

-- 3. Enable Realtime for daily_user_metrics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'daily_user_metrics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_user_metrics;
  END IF;
END $$;
