-- Provably Fair: Commit/Reveal — לפני משחק: Hashed Seed; אחרי: גילוי מפתח ואימות
-- Run: psql $DATABASE_URL -f apps/api/src/db/migrations/007_rng_commit_reveal.sql

CREATE TABLE IF NOT EXISTS rng_commits (
  game_id TEXT PRIMARY KEY,
  seed TEXT NOT NULL,
  commitment TEXT NOT NULL,
  nonce TEXT NOT NULL,
  client_seed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rng_commits_created ON rng_commits(created_at);
