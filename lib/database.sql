-- Memory Layer V1 Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections enum (static values used in code)
CREATE TYPE section_type AS ENUM ('pre_game', 'in_game', 'post_game', 'locker_room', 'off_court');
CREATE TYPE color_type AS ENUM ('red', 'orange', 'yellow', 'green');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE code_status AS ENUM ('active', 'archived');

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section section_type NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ NULL,
    is_active BOOLEAN DEFAULT true
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Codes table
CREATE TABLE codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section section_type NOT NULL,
    name TEXT NOT NULL,
    one_line TEXT NOT NULL,
    status code_status DEFAULT 'active',
    power_pct INTEGER DEFAULT 0 CHECK (power_pct >= 0 AND power_pct <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs table
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID REFERENCES codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section section_type NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    counted BOOLEAN DEFAULT true
);

-- Section progress table
CREATE TABLE section_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section section_type NOT NULL,
    section_score INTEGER DEFAULT 0 CHECK (section_score >= 0 AND section_score <= 100),
    color color_type DEFAULT 'red',
    total_valid_logs INTEGER DEFAULT 0,
    unique_codes_used INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    grace_started_at TIMESTAMPTZ NULL,
    streak_days_7 INTEGER DEFAULT 0,
    green_hold_started_at TIMESTAMPTZ NULL,
    longest_green_hold_sec INTEGER DEFAULT 0,
    UNIQUE(user_id, section)
);

-- Radar state table
CREATE TABLE radar_state (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    pre_game_score INTEGER DEFAULT 0 CHECK (pre_game_score >= 0 AND pre_game_score <= 100),
    in_game_score INTEGER DEFAULT 0 CHECK (in_game_score >= 0 AND in_game_score <= 100),
    post_game_score INTEGER DEFAULT 0 CHECK (post_game_score >= 0 AND post_game_score <= 100),
    locker_room_score INTEGER DEFAULT 0 CHECK (locker_room_score >= 0 AND locker_room_score <= 100),
    off_court_score INTEGER DEFAULT 0 CHECK (off_court_score >= 0 AND off_court_score <= 100),
    radar_score INTEGER DEFAULT 0 CHECK (radar_score >= 0 AND radar_score <= 100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_section_active ON sessions(user_id, section, is_active);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_codes_user_section_status ON codes(user_id, section, status);
CREATE INDEX idx_logs_code_timestamp ON logs(code_id, timestamp);
CREATE INDEX idx_logs_user_section_timestamp ON logs(user_id, section, timestamp);
CREATE INDEX idx_section_progress_user ON section_progress(user_id);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_state ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM sessions WHERE sessions.id = session_id)
);
CREATE POLICY "Users can create own messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM sessions WHERE sessions.id = session_id)
);

CREATE POLICY "Users can view own codes" ON codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own codes" ON codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codes" ON codes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own logs" ON logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own section progress" ON section_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own section progress" ON section_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own section progress" ON section_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own radar state" ON radar_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own radar state" ON radar_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own radar state" ON radar_state FOR UPDATE USING (auth.uid() = user_id);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_codes_updated_at BEFORE UPDATE ON codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_radar_state_updated_at BEFORE UPDATE ON radar_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();