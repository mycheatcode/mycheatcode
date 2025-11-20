-- Create analytics_events table for user behavior tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'engagement', 'activation', 'retention', 'feature_usage'
  properties JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_category ON public.analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON public.analytics_events(user_id, created_at DESC);

-- Create GIN index for JSONB properties for fast property queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON public.analytics_events USING GIN (properties);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can track their own events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own events (for debugging)
CREATE POLICY "Users can view own events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.analytics_events IS 'User behavior analytics and event tracking';
COMMENT ON COLUMN public.analytics_events.event_name IS 'Specific event name (e.g., cheat_code_created, game_completed)';
COMMENT ON COLUMN public.analytics_events.event_category IS 'High-level category: engagement, activation, retention, feature_usage';
COMMENT ON COLUMN public.analytics_events.properties IS 'Event-specific data stored as JSON (e.g., {cheat_code_id: "123", scenario: "airball"})';
COMMENT ON COLUMN public.analytics_events.session_id IS 'Browser session ID for grouping events into sessions';
