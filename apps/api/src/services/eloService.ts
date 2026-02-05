/**
 * ELO/MMR — Skill Matching (Fair Play).
 * התערבויות כספיות רק בין שחקנים ברמה דומה.
 */
import { pool } from '../db';

const K_FACTOR = 32;
const DEFAULT_ELO = 1500;

/** Update ELO after P2P game. Winner gains, loser loses (standard ELO). */
export async function updateEloAfterGame(
  winnerId: string,
  loserId: string
): Promise<{ winnerNewElo: number; loserNewElo: number } | null> {
  if (!pool) return null;

  const res = await pool.query<{ id: string; elo_rating: number }>(
    `SELECT id, elo_rating FROM users WHERE id IN ($1, $2)`,
    [winnerId, loserId]
  );
  if (res.rows.length !== 2) return null;

  const winnerRow = res.rows.find((r) => r.id === winnerId);
  const loserRow = res.rows.find((r) => r.id === loserId);
  const winnerElo = winnerRow?.elo_rating ?? DEFAULT_ELO;
  const loserElo = loserRow?.elo_rating ?? DEFAULT_ELO;

  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const delta = K_FACTOR * (1 - expectedWinner);
  const winnerNewElo = Math.round(winnerElo + delta);
  const loserNewElo = Math.round(Math.max(0, loserElo - delta));

  await pool.query(
    `UPDATE users SET elo_rating = $1, updated_at = now() WHERE id = $2`,
    [winnerNewElo, winnerId]
  );
  await pool.query(
    `UPDATE users SET elo_rating = $1, updated_at = now() WHERE id = $2`,
    [loserNewElo, loserId]
  );

  return { winnerNewElo, loserNewElo };
}

/** Get users in ELO range for matchmaking (Fair Play). */
export async function getUsersInEloRange(
  centerElo: number,
  range: number = 200
): Promise<{ id: string; elo_rating: number }[]> {
  if (!pool) return [];
  const minElo = Math.max(0, centerElo - range);
  const maxElo = Math.min(3000, centerElo + range);
  const res = await pool.query<{ id: string; elo_rating: number }>(
    `SELECT id, elo_rating FROM users WHERE elo_rating >= $1 AND elo_rating <= $2`,
    [minElo, maxElo]
  );
  return res.rows;
}
