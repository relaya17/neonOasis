-- Migration 008: Tournament System
-- Adds tournament tables for organizing competitions

-- 1. טבלת טורנירים
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL DEFAULT 'backgammon',
  entry_fee DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  prize_pool DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (prize_pool >= 0),
  max_participants INTEGER NOT NULL DEFAULT 8 CHECK (max_participants IN (2, 4, 8, 16, 32)),
  current_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game_type ON tournaments(game_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_time ON tournaments(start_time);

-- 2. טבלת משתתפים בטורנירים
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed INTEGER NOT NULL CHECK (seed > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'winner')),
  current_round INTEGER NOT NULL DEFAULT 1,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id),
  UNIQUE(tournament_id, seed)
);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);

-- 3. טבלת משחקים בטורנירים
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL CHECK (round >= 1),
  match_number INTEGER NOT NULL CHECK (match_number >= 1),
  player1_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  game_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);

-- 4. טבלת פרסים בטורנירים
CREATE TABLE IF NOT EXISTS tournament_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  placement INTEGER NOT NULL CHECK (placement > 0),
  prize_amount DECIMAL(20, 8) NOT NULL CHECK (prize_amount >= 0),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, placement)
);

CREATE INDEX IF NOT EXISTS idx_tournament_prizes_tournament ON tournament_prizes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_prizes_user ON tournament_prizes(user_id);

-- עדכון עמלות Admin לכלול טורנירים
ALTER TABLE admin_revenues 
  DROP CONSTRAINT IF EXISTS admin_revenues_source_type_check;

ALTER TABLE admin_revenues 
  ADD CONSTRAINT admin_revenues_source_type_check 
  CHECK (source_type IN ('game', 'market', 'tournament', 'iap'));

COMMENT ON TABLE tournaments IS 'טורנירים - תחרויות מאורגנות עם כרטיס כניסה ופרסים';
COMMENT ON TABLE tournament_participants IS 'רשימת משתתפים בכל טורניר';
COMMENT ON TABLE tournament_matches IS 'משחקים בטורניר - brackets';
COMMENT ON TABLE tournament_prizes IS 'חלוקת פרסים - 1st, 2nd, 3rd place';
