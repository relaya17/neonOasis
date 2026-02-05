-- Affiliate commission type + AI Fraud Alerts table
-- psql $DATABASE_URL -f apps/api/src/db/migrations/002_affiliate_commission_ai_alerts.sql

-- Allow referral_commission (עמלת שותף על קניית מטבעות)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('purchase', 'win', 'bet', 'fee', 'gift', 'market_sale', 'market_buy', 'coupon', 'referral', 'referral_commission'));

-- AI Guardian: התראות רמאות / בוטים / קטינים
CREATE TABLE IF NOT EXISTS ai_fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bot', 'minor', 'cheat', 'other')),
  room_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_fraud_alerts_created ON ai_fraud_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_fraud_alerts_user ON ai_fraud_alerts(user_id);
