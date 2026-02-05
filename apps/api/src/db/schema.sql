-- The Neon Oasis — PostgreSQL schema
-- Run once to create tables (e.g. psql $DATABASE_URL -f src/db/schema.sql)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. טבלת משתמשים (users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  avatar_id TEXT NOT NULL DEFAULT 'default',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. טבלת ארנק ותנועות כספיות (transactions)
-- כל שינוי ב-balance חייב להירשם כאן (ביקורת)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'win', 'bet', 'fee', 'gift', 'market_sale', 'market_buy', 'coupon', 'referral', 'referral_commission')),
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- 3. טבלת מרקטפלייס (items_inventory)
CREATE TABLE IF NOT EXISTS items_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'Common' CHECK (rarity IN ('Common', 'Rare', 'Legendary')),
  is_for_sale BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL(20, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_owner ON items_inventory(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_for_sale ON items_inventory(is_for_sale) WHERE is_for_sale = true;

-- 4. עמלות הבית (admin_revenues)
CREATE TABLE IF NOT EXISTS admin_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(20, 8) NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'game',
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_revenues_created ON admin_revenues(created_at);

-- 5. קודי קופון (למשפיענים / קמפיינים)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  coins DECIMAL(20, 8) NOT NULL CHECK (coins > 0),
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- 6. מימוש קופונים (משתמש לא יכול לממש אותו קוד פעמיים)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);

-- 7. Referral — הזמנת חבר (inviter מקבל בונוס כשהחבר נרשם/משחק)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_id);

-- P2P Skill-Economy (Escrow, Oasis Token, Anti-Fraud): run migration 004 after this file
-- psql $DATABASE_URL -f src/db/migrations/004_p2p_escrow_oasis_ledger.sql
