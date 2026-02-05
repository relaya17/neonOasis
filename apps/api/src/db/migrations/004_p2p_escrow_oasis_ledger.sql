-- P2P Skill-Economy: Escrow, Ledger, Oasis Token, Anti-Fraud
-- Run: psql $DATABASE_URL -f apps/api/src/db/migrations/004_p2p_escrow_oasis_ledger.sql

-- 1. Oasis Token balance on users (מטבע פנימי — כרייה דרך ניצחונות)
ALTER TABLE users ADD COLUMN IF NOT EXISTS oasis_balance DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (oasis_balance >= 0);

-- 2. Escrow holds — נעילת כספים בתחילת משחק, שחרור/החזרה בסיום
CREATE TABLE IF NOT EXISTS escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_game ON escrow_holds(game_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_user ON escrow_holds(user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON escrow_holds(status) WHERE status = 'held';

-- 3. Transaction types: add P2P / Escrow / Oasis
-- (PostgreSQL: alter check or use new types; minimal: allow new type strings in app, schema.sql has CHECK)
-- If transactions.type has CHECK, add: escrow_hold, escrow_release, p2p_transfer, oasis_mint, oasis_spend
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (
  type IN (
    'purchase', 'win', 'bet', 'fee', 'gift', 'market_sale', 'market_buy',
    'coupon', 'referral', 'referral_commission',
    'escrow_hold', 'escrow_release', 'p2p_transfer', 'oasis_mint', 'oasis_spend'
  )
);

-- 4. Game sessions — Anti-Fraud: IP + timestamps (מניעת Chip Dumping)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  game_kind TEXT NOT NULL DEFAULT 'backgammon',
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stake_amount DECIMAL(20, 8) NOT NULL CHECK (stake_amount >= 0),
  ip_address INET,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_players ON game_sessions(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started ON game_sessions(started_at);
