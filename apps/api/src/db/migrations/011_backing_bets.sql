-- Social Betting: Backing bets + settlement
-- Run: psql $DATABASE_URL -f apps/api/src/db/migrations/011_backing_bets.sql

CREATE TABLE IF NOT EXISTS backing_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
  odds DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  payout_amount DECIMAL(20, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_backing_bets_game ON backing_bets(game_id);
CREATE INDEX IF NOT EXISTS idx_backing_bets_player ON backing_bets(player_id);
CREATE INDEX IF NOT EXISTS idx_backing_bets_supporter ON backing_bets(supporter_id);
CREATE INDEX IF NOT EXISTS idx_backing_bets_status ON backing_bets(status);

-- Extend transactions types for backing flow
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (
  type IN (
    'purchase', 'win', 'bet', 'fee', 'gift', 'market_sale', 'market_buy',
    'coupon', 'referral', 'referral_commission',
    'escrow_hold', 'escrow_release', 'p2p_transfer', 'oasis_mint', 'oasis_spend',
    'backing_bet', 'backing_payout', 'backing_share', 'backing_refund'
  )
);
