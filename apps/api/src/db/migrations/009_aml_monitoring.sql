-- Migration 009: AML (Anti-Money Laundering) Monitoring
-- Adds tables for tracking suspicious activity and compliance

-- 1. טבלת התראות AML
CREATE TABLE IF NOT EXISTS aml_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_volume', 'rapid_deposit_withdraw', 'unusual_pattern', 'multiple_accounts', 'geo_mismatch', 'blocked_jurisdiction', 'manual_review')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aml_alerts_user ON aml_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_aml_alerts_status ON aml_alerts(status);
CREATE INDEX IF NOT EXISTS idx_aml_alerts_severity ON aml_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_aml_alerts_created ON aml_alerts(created_at);

-- 2. טבלת חסימות משתמשים (blocks)
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_user ON user_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_active ON user_blocks(user_id) WHERE lifted_at IS NULL;

-- 3. טבלת אירועי AML (audit log)
CREATE TABLE IF NOT EXISTS aml_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aml_events_user ON aml_events(user_id);
CREATE INDEX IF NOT EXISTS idx_aml_events_created ON aml_events(created_at);
CREATE INDEX IF NOT EXISTS idx_aml_events_type ON aml_events(event_type);

-- 4. הוסף שדה is_blocked לטבלת users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(is_blocked) WHERE is_blocked = true;

COMMENT ON TABLE aml_alerts IS 'התראות AML - פעילות חשודה';
COMMENT ON TABLE user_blocks IS 'חסימות משתמשים - זמניות או קבועות';
COMMENT ON TABLE aml_events IS 'אירועי AML - audit log מלא';
