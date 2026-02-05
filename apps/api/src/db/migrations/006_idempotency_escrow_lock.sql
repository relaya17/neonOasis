-- Production: Idempotency keys + Escrow locking (Race Condition / Double-Spend)
-- Run: psql $DATABASE_URL -f apps/api/src/db/migrations/006_idempotency_escrow_lock.sql

-- Idempotency: כל העברת כספים (P2P) עם מפתח ייחודי — שליחה כפולה לא מורידה כסף פעמיים
CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  response_type TEXT NOT NULL,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_created ON idempotency_keys(created_at);

-- TTL cleanup: ניתן להריץ cron שמנקה מפתחות ישנים (למשל אחרי 24 שעות)
-- DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours';
