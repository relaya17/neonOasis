import { query } from '../db';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  balance: string;
  level: number;
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const result = await query<{ id: string; username: string; balance: string; level: number }>(
    `SELECT id, username, balance::text AS balance, level
     FROM users
     ORDER BY balance DESC, level DESC
     LIMIT $1`,
    [Math.min(Math.max(1, limit), 100)]
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    userId: row.id,
    username: row.username,
    balance: row.balance,
    level: row.level,
  }));
}
