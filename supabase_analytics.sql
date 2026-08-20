-- ==============================================================================
-- CA QUIZ PLATFORM — REAL-TIME ANALYTICS & 24-HOUR TRAFFIC METRICS SETUP
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create table for persistent visitor session records & live heartbeats
CREATE TABLE IF NOT EXISTS public.site_analytics_visits (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT DEFAULT 'Guest',
  is_authenticated BOOLEAN DEFAULT FALSE,
  session_id TEXT,
  entry_path TEXT DEFAULT '/',
  current_path TEXT DEFAULT '/',
  device_type TEXT DEFAULT 'Desktop',
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast analytics aggregation queries
CREATE INDEX IF NOT EXISTS idx_site_visits_last_seen ON public.site_analytics_visits(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_id ON public.site_analytics_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_user_id ON public.site_analytics_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_is_auth ON public.site_analytics_visits(is_authenticated);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_analytics_visits(created_at DESC);

-- Each browser tab/session must have one row only. Earlier tracker versions
-- used a read-then-insert sequence, so React Strict Mode and slow networks
-- could insert the same session several times and inflate session/device totals.
-- Preserve the newest heartbeat before adding the uniqueness guarantee.
DELETE FROM public.site_analytics_visits AS older
USING public.site_analytics_visits AS newer
WHERE older.visitor_id = newer.visitor_id
  AND older.session_id = newer.session_id
  AND older.session_id IS NOT NULL
  AND (
    older.last_seen_at < newer.last_seen_at
    OR (older.last_seen_at = newer.last_seen_at AND older.id < newer.id)
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_analytics_visits_visitor_session_key'
      AND conrelid = 'public.site_analytics_visits'::regclass
  ) THEN
    ALTER TABLE public.site_analytics_visits
      ADD CONSTRAINT site_analytics_visits_visitor_session_key
      UNIQUE (visitor_id, session_id);
  END IF;
END $$;

-- 2. Create table for recording 24-hour and historical concurrent peak records
CREATE TABLE IF NOT EXISTS public.site_traffic_peaks (
  id BIGSERIAL PRIMARY KEY,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  peak_type TEXT NOT NULL, -- 'logged_in_concurrent' | 'total_concurrent'
  peak_count INTEGER NOT NULL,
  date_key DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_site_peaks_recorded_at ON public.site_traffic_peaks(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_peaks_type_date ON public.site_traffic_peaks(peak_type, recorded_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.site_analytics_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_traffic_peaks ENABLE ROW LEVEL SECURITY;

-- Policies for public.site_analytics_visits (Allow visitors & students to insert and update heartbeats)
DROP POLICY IF EXISTS "Allow public insert on site_analytics_visits" ON public.site_analytics_visits;
CREATE POLICY "Allow public insert on site_analytics_visits" 
  ON public.site_analytics_visits FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on site_analytics_visits" ON public.site_analytics_visits;
CREATE POLICY "Allow public update on site_analytics_visits" 
  ON public.site_analytics_visits FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on site_analytics_visits" ON public.site_analytics_visits;
CREATE POLICY "Allow public select on site_analytics_visits" 
  ON public.site_analytics_visits FOR SELECT USING (true);

-- Policies for public.site_traffic_peaks
DROP POLICY IF EXISTS "Allow public insert on site_traffic_peaks" ON public.site_traffic_peaks;
CREATE POLICY "Allow public insert on site_traffic_peaks" 
  ON public.site_traffic_peaks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on site_traffic_peaks" ON public.site_traffic_peaks;
CREATE POLICY "Allow public select on site_traffic_peaks" 
  ON public.site_traffic_peaks FOR SELECT USING (true);

-- 4. Enable Supabase Realtime for table changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'site_analytics_visits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_analytics_visits;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'site_traffic_peaks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_traffic_peaks;
  END IF;
END $$;
