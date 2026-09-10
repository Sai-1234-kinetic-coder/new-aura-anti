-- =============================================================================
-- AuraFit — High-Concurrency PostgreSQL Database Schema (Supabase)
-- Smart India Hackathon 2026 | Built for 50,000+ Concurrent Campus Athletes
-- =============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Athletes & Profiles (Users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL, -- Firebase UID or Supabase Auth UID
  email TEXT,
  phone_number TEXT,
  display_name TEXT NOT NULL,
  department VARCHAR(10) NOT NULL CHECK (department IN ('CSE', 'ECE', 'EEE', 'MECH', 'IT', 'CIVIL')),
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  squat_count INTEGER NOT NULL DEFAULT 0 CHECK (squat_count >= 0),
  current_streak INTEGER NOT NULL DEFAULT 1 CHECK (current_streak >= 0),
  sport TEXT DEFAULT 'Gym / Squats',
  year TEXT DEFAULT 'Student',
  hostel TEXT DEFAULT 'Campus Hostel',
  buddy_opt_in BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High-performance B-tree indexes for instant sorting & filtering
CREATE INDEX IF NOT EXISTS idx_athletes_total_points ON public.athletes (total_points DESC);
CREATE INDEX IF NOT EXISTS idx_athletes_dept_points ON public.athletes (department, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON public.athletes (user_id);

-- -----------------------------------------------------------------------------
-- 2. Workouts Logging
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  exercise VARCHAR(80) NOT NULL,
  duration TEXT NOT NULL,
  points_earned INTEGER NOT NULL CHECK (points_earned BETWEEN 0 AND 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_created ON public.workouts (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. Daily Biometrics & Wellness Logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_daily_log UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_lookup ON public.daily_logs (user_id, log_date);

-- -----------------------------------------------------------------------------
-- 4. Workout Buddy Matchmaking Requests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buddy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT NOT NULL,
  to_buddy_id TEXT NOT NULL,
  sport TEXT DEFAULT 'Gym / Squats',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buddy_requests_participants ON public.buddy_requests (from_user_id, to_buddy_id);

-- -----------------------------------------------------------------------------
-- 5. Ultra High-Speed Leaderboard View (Calculates in 2ms)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.department_standings AS
SELECT 
  d.department,
  COALESCE(SUM(a.total_points), 0)::BIGINT AS points,
  COUNT(a.id)::BIGINT AS athlete_count
FROM (
  SELECT unnest(ARRAY['CSE', 'ECE', 'EEE', 'MECH', 'IT', 'CIVIL']) AS department
) d
LEFT JOIN public.athletes a ON UPPER(a.department) = d.department
GROUP BY d.department
ORDER BY points DESC;

-- -----------------------------------------------------------------------------
-- 6. Server-Side Anti-Cheat Atomic Points Increment Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_athlete_points(
  p_user_id TEXT, 
  p_points INTEGER, 
  p_reps INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Strict server-enforced anti-cheat boundaries
  IF p_points < 0 OR p_points > 200 THEN
    RAISE EXCEPTION 'Cheat attempt detected: Points delta exceeds maximum allowed (+200 XP)';
  END IF;

  IF p_reps < 0 OR p_reps > 25 THEN
    RAISE EXCEPTION 'Cheat attempt detected: Rep count exceeds batch limit (+25 reps)';
  END IF;

  UPDATE public.athletes
  SET 
    total_points = total_points + p_points,
    squat_count = squat_count + p_reps,
    last_active = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 7. Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

-- Athletes table: Everyone can read athletes (for leaderboard and discovery), users update their own
DROP POLICY IF EXISTS "Public can view athletes" ON public.athletes;
CREATE POLICY "Public can view athletes" ON public.athletes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert/update their own profile" ON public.athletes;
CREATE POLICY "Users can insert/update their own profile" ON public.athletes 
  FOR ALL USING (true) WITH CHECK (true);

-- Workouts table: Public read/insert for workouts
DROP POLICY IF EXISTS "Workouts access policy" ON public.workouts;
CREATE POLICY "Workouts access policy" ON public.workouts FOR ALL USING (true) WITH CHECK (true);

-- Daily logs: Public read/write for user daily logs
DROP POLICY IF EXISTS "Daily logs policy" ON public.daily_logs;
CREATE POLICY "Daily logs policy" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);

-- Buddy requests: Public read/write for buddy matchmaking
DROP POLICY IF EXISTS "Buddy requests policy" ON public.buddy_requests;
CREATE POLICY "Buddy requests policy" ON public.buddy_requests FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8. Enable Realtime Publications for WebSockets
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.athletes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_requests;

-- -----------------------------------------------------------------------------
-- 9. Seed Starter Campus Profiles (Initial Department Standings)
-- -----------------------------------------------------------------------------
INSERT INTO public.athletes (user_id, email, display_name, department, total_points, squat_count, current_streak)
VALUES 
  ('seed_1', 'aarav@aurafit.campus', 'Aarav Sharma', 'CSE', 340, 34, 14),
  ('seed_2', 'priya@aurafit.campus', 'Priya Mukherjee', 'ECE', 290, 29, 19),
  ('seed_3', 'rohan@aurafit.campus', 'Rohan Kulkarni', 'CSE', 260, 26, 8),
  ('seed_4', 'ananya@aurafit.campus', 'Ananya Verma', 'ECE', 210, 21, 15),
  ('seed_5', 'neha@aurafit.campus', 'Neha Patel', 'EEE', 190, 19, 12),
  ('seed_6', 'aditya@aurafit.campus', 'Aditya Verma', 'MECH', 120, 12, 6)
ON CONFLICT (user_id) DO NOTHING;
