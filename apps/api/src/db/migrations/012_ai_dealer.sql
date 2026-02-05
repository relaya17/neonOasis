-- AI Dealer: player events + profile snapshot
-- Run: psql $DATABASE_URL -f apps/api/src/db/migrations/012_ai_dealer.sql

CREATE TABLE IF NOT EXISTS ai_dealer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('roll', 'move')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_dealer_events_user ON ai_dealer_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_dealer_events_game ON ai_dealer_events(game_id);
CREATE INDEX IF NOT EXISTS idx_ai_dealer_events_time ON ai_dealer_events(created_at);

CREATE TABLE IF NOT EXISTS ai_dealer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_rolls INTEGER NOT NULL DEFAULT 0,
  doubles INTEGER NOT NULL DEFAULT 0,
  fast_moves INTEGER NOT NULL DEFAULT 0,
  last_roll_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
