import type { ProvablyFairRoll } from '@neon-oasis/shared';
import { createHash, randomBytes } from 'crypto';
import { pool } from '../db';

// In-memory fallback for development (when DATABASE_URL is not set)
interface RngCommit {
  gameId: string;
  seed: string;
  commitment: string;
  nonce: string;
  clientSeed: string | null;
}

const inMemoryCommits = new Map<string, RngCommit>();

/**
 * Provably fair dice roll — PRD: RNG certified for fairness (CSPRNG).
 * Server generates seed + nonce, SHA256(seed+clientSeed+nonce) => hash, dice derived from hash.
 * Client can verify: same inputs => same dice.
 */
export function generateProvablyFairRoll(nonce: string, clientSeed?: string): ProvablyFairRoll {
  const seed = randomBytes(16).toString('hex');
  const combined = clientSeed ? `${seed}:${clientSeed}:${nonce}` : `${seed}:${nonce}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  const dice = hashToDice(hash);
  return {
    seed,
    nonce,
    hash,
    dice,
    timestamp: Date.now(),
  };
}

/** Derive two dice 1–6 from first 4 bytes of hash (deterministic, fair distribution) */
export function hashToDice(hexHash: string): [number, number] {
  const b1 = parseInt(hexHash.slice(0, 2), 16);
  const b2 = parseInt(hexHash.slice(2, 4), 16);
  const d1 = (b1 % 6) + 1;
  const d2 = (b2 % 6) + 1;
  return [d1, d2];
}

/** Commitment = hash(seed) — נשלח ללקוח לפני משחק; בסוף המשחק מגלים את seed לאימות */
function makeCommitment(seed: string): string {
  return createHash('sha256').update(seed).digest('hex');
}

/**
 * Commit (לפני משחק): שרת יוצר seed, שומר, מחזיר commitment.
 * הלקוח שומר את ה-commitment; בסוף המשחק קורא ל-reveal ומאמת.
 */
export async function commitSeed(
  gameId: string,
  clientSeed?: string
): Promise<{ commitment: string; nonce: string } | { error: string }> {
  const seed = randomBytes(16).toString('hex');
  const nonce = `roll-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const commitment = makeCommitment(seed);
  
  if (!pool) {
    inMemoryCommits.set(gameId, { gameId, seed, commitment, nonce, clientSeed: clientSeed ?? null });
    return { commitment, nonce };
  }

  try {
    await pool.query(
      `INSERT INTO rng_commits (game_id, seed, commitment, nonce, client_seed)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (game_id) DO UPDATE SET seed = $2, commitment = $3, nonce = $4, client_seed = $5`,
      [gameId, seed, commitment, nonce, clientSeed ?? null]
    );
    return { commitment, nonce };
  } catch {
    inMemoryCommits.set(gameId, { gameId, seed, commitment, nonce, clientSeed: clientSeed ?? null });
    return { commitment, nonce };
  }
}

/**
 * Roll (during game): use committed seed + nonce to derive dice and hash.
 * Does not reveal seed (reveal is a separate endpoint).
 */
export async function getCommittedRoll(
  gameId: string,
  clientSeedOverride?: string
): Promise<
  | { commitment: string; nonce: string; hash: string; dice: [number, number]; timestamp: number }
  | { error: string }
> {
  if (!pool) {
    // In-memory fallback for development
    const commit = inMemoryCommits.get(gameId);
    if (!commit) return { error: 'No commit for this game' };
    const clientSeed = clientSeedOverride ?? commit.clientSeed ?? undefined;
    const combined = clientSeed ? `${commit.seed}:${clientSeed}:${commit.nonce}` : `${commit.seed}:${commit.nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const dice = hashToDice(hash);
    return { commitment: commit.commitment, nonce: commit.nonce, hash, dice, timestamp: Date.now() };
  }
  
  try {
    const row = await pool.query<{
      seed: string;
      nonce: string;
      client_seed: string | null;
      commitment: string;
    }>(`SELECT seed, nonce, client_seed, commitment FROM rng_commits WHERE game_id = $1`, [gameId]);
    if (row.rowCount === 0) {
      const commit = inMemoryCommits.get(gameId);
      if (!commit) return { error: 'No commit for this game' };
      const clientSeed = clientSeedOverride ?? commit.clientSeed ?? undefined;
      const combined = clientSeed ? `${commit.seed}:${clientSeed}:${commit.nonce}` : `${commit.seed}:${commit.nonce}`;
      const hash = createHash('sha256').update(combined).digest('hex');
      const dice = hashToDice(hash);
      return { commitment: commit.commitment, nonce: commit.nonce, hash, dice, timestamp: Date.now() };
    }
    const { seed, nonce, client_seed, commitment } = row.rows[0];
    const clientSeed = clientSeedOverride ?? client_seed ?? undefined;
    const combined = clientSeed ? `${seed}:${clientSeed}:${nonce}` : `${seed}:${nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const dice = hashToDice(hash);
    return { commitment, nonce, hash, dice, timestamp: Date.now() };
  } catch {
    const commit = inMemoryCommits.get(gameId);
    if (!commit) return { error: 'No commit for this game' };
    const clientSeed = clientSeedOverride ?? commit.clientSeed ?? undefined;
    const combined = clientSeed ? `${commit.seed}:${clientSeed}:${commit.nonce}` : `${commit.seed}:${commit.nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const dice = hashToDice(hash);
    return { commitment: commit.commitment, nonce: commit.nonce, hash, dice, timestamp: Date.now() };
  }
}

/**
 * Reveal (אחרי משחק): מחזיר seed, hash, dice — הלקוח מאמת ש-commitment === hash(seed) ו-dice תואמים.
 */
export async function revealSeed(gameId: string): Promise<
  | { seed: string; nonce: string; hash: string; dice: [number, number]; timestamp: number }
  | { error: string }
> {
  if (!pool) {
    // In-memory fallback for development
    const commit = inMemoryCommits.get(gameId);
    if (!commit) return { error: 'No commit for this game' };
    const combined = commit.clientSeed ? `${commit.seed}:${commit.clientSeed}:${commit.nonce}` : `${commit.seed}:${commit.nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const dice = hashToDice(hash);
    return { seed: commit.seed, nonce: commit.nonce, hash, dice, timestamp: Date.now() };
  }
  
  try {
    const row = await pool.query<{ seed: string; nonce: string; client_seed: string | null }>(
      `SELECT seed, nonce, client_seed FROM rng_commits WHERE game_id = $1`,
      [gameId]
    );
    if (row.rowCount === 0) {
      const commit = inMemoryCommits.get(gameId);
      if (!commit) return { error: 'No commit for this game' };
      const combined = commit.clientSeed ? `${commit.seed}:${commit.clientSeed}:${commit.nonce}` : `${commit.seed}:${commit.nonce}`;
      const hash = createHash('sha256').update(combined).digest('hex');
      const dice = hashToDice(hash);
      return { seed: commit.seed, nonce: commit.nonce, hash, dice, timestamp: Date.now() };
    }
    const { seed, nonce, client_seed } = row.rows[0];
    const combined = client_seed ? `${seed}:${client_seed}:${nonce}` : `${seed}:${nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const dice = hashToDice(hash);
    return { seed, nonce, hash, dice, timestamp: Date.now() };
  } catch {
    const commit = inMemoryCommits.get(gameId);
    if (!commit) return { error: 'No commit for this game' };
    const combined = commit.clientSeed ? `${commit.seed}:${commit.clientSeed}:${commit.nonce}` : `${commit.seed}:${commit.nonce}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    const dice = hashToDice(hash);
    return { seed: commit.seed, nonce: commit.nonce, hash, dice, timestamp: Date.now() };
  }
}
