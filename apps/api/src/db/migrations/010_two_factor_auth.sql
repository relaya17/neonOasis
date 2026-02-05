-- Migration 010: Two-Factor Authentication
-- Adds 2FA support for enhanced security

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_two_factor ON users(two_factor_enabled) WHERE two_factor_enabled = true;

COMMENT ON COLUMN users.two_factor_secret IS '2FA TOTP secret (encrypted in production)';
COMMENT ON COLUMN users.two_factor_enabled IS 'Is 2FA enabled for this user';
