-- Game-Fi Core: Double-Entry Ledger, ELO/MMR, Oasis Daily Cap
-- Run: psql $DATABASE_URL -f apps/api/src/db/migrations/005_double_entry_elo_mint_cap.sql

-- 1. Double-Entry Bookkeeping — כל תנועה: מאיזה ארנק, לאיזה ארנק, כמה עמלה לבית
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(20, 8) NOT NULL CHECK (amount >= 0),
  fee_to_house DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (fee_to_house >= 0),
  asset_type TEXT NOT NULL DEFAULT 'chips' CHECK (asset_type IN ('chips', 'oasis')),
  reference_type TEXT NOT NULL DEFAULT 'p2p_settlement' CHECK (reference_type IN ('p2p_settlement', 'oasis_mint', 'escrow_refund', 'escrow_forfeit')),
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_from ON ledger_entries(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_to ON ledger_entries(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger_entries(created_at);

-- 2. ELO/MMR — שידוך לפי רמה (Fair Play)
ALTER TABLE users ADD COLUMN IF NOT EXISTS elo_rating INTEGER NOT NULL DEFAULT 1500 CHECK (elo_rating >= 0 AND elo_rating <= 3000);

-- 3. לוח בקרה מוניטרי — מכסת הנפקה יומית ל-Oasis
CREATE TABLE IF NOT EXISTS mint_daily_budget (
  budget_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  minted_today DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (minted_today >= 0),
  daily_cap DECIMAL(20, 8) NOT NULL DEFAULT 100000 CHECK (daily_cap >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO mint_daily_budget (budget_date, daily_cap) VALUES (CURRENT_DATE, 100000)
ON CONFLICT (budget_date) DO NOTHING;

-- 4. AML — דגל זוגות חשודים (אותו מנצח שוב ושוב)
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS aml_flagged BOOLEAN NOT NULL DEFAULT false;
