-- Supabase SQL Schema for Multiplication Tables Practice App
-- Run this in your Supabase SQL Editor to set up the database

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'stopped')) DEFAULT 'in_progress',
  current_round INTEGER DEFAULT 1,
  pending_exercises JSONB DEFAULT '[]'::jsonb,
  active_exercise TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  total_time_sec DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise results table
CREATE TABLE IF NOT EXISTS exercise_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  factors JSONB NOT NULL,
  user_answer INTEGER,
  correct BOOLEAN NOT NULL,
  time_taken_sec DECIMAL(5, 2) NOT NULL,
  result TEXT CHECK (result IN ('improved', 'deteriorated', 'same', 'first')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_rounds_session_id ON rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_session_id ON exercise_results(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_round_id ON exercise_results(round_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_exercise_id ON exercise_results(exercise_id);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_results ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on rounds" ON rounds FOR ALL USING (true);
CREATE POLICY "Allow all operations on exercise_results" ON exercise_results FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on sessions
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
