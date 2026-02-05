/**
 * P2P Wallet Service — Modular layer for games to plug into.
 * Ledger: every movement is recorded. Escrow: hold → settle or refund.
 */
import type { PoolClient } from 'pg';
import { pool } from '../db';
import { getRakeRate } from '../config/rake';

const DEFAULT_FEE_RATE = 0.1; // 10% platform fee

/** Hold stake from user balance into escrow (start of game). Atomic. */
export async function holdEscrow(
  gameId: string,
  userId: string,
  amount: string,
  client?: PoolClient
): Promise<{ ok: true; holdId: string } | { ok: false; error: string }> {
  const c = client ?? (await pool!.connect());
  const release = !client;

  try {
    if (!client) await c.query('BEGIN');

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      if (!client) await c.query('ROLLBACK');
      return { ok: false, error: 'Invalid amount' };
    }

    const upd = await c.query(
      `UPDATE users SET balance = balance - $1, updated_at = now() WHERE id = $2 AND balance >= $1 RETURNING id`,
      [amt.toFixed(8), userId]
    );
    if (upd.rowCount === 0) {
      if (!client) await c.query('ROLLBACK');
      return { ok: false, error: 'Insufficient balance' };
    }

    const ins = await c.query<{ id: string }>(
      `INSERT INTO escrow_holds (game_id, user_id, amount, status) VALUES ($1, $2, $3, 'held') RETURNING id`,
      [gameId, userId, amt.toFixed(8)]
    );
    const holdId = ins.rows[0].id;

    await c.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'escrow_hold', $3)`,
      [userId, (-amt).toFixed(8), gameId]
    );

    if (!client) await c.query('COMMIT');
    return { ok: true, holdId };
  } catch (e) {
    if (!client) await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    if (release) c.release();
  }
}

/** Release escrow and settle P2P: winner gets pot - fee, platform gets fee. Atomic. */
export async function settleP2P(
  gameId: string,
  winnerId: string,
  loserId: string,
  potAmount: string,
  feeRate: number = getRakeRate() || DEFAULT_FEE_RATE
): Promise<
  | { success: true; winnerNewBalance: string; feeAmount: string }
  | { success: false; error: string }
> {
  if (!pool) return { success: false, error: 'Database not configured' };
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pot = parseFloat(potAmount);
    if (isNaN(pot) || pot <= 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Invalid pot' };
    }

    const fee = pot * feeRate;
    const prize = pot - fee;

    // Race condition: lock escrow rows so only one settlement wins (Production)
    const locked = await client.query(
      `SELECT id FROM escrow_holds WHERE game_id = $1 AND status = 'held' FOR UPDATE`,
      [gameId]
    );
    if (locked.rowCount !== 2) {
      await client.query('ROLLBACK');
      client.release();
      return { success: false, error: 'Escrow not found or already settled' };
    }

    // Mark escrow as released (money was already deducted at hold)
    await client.query(
      `UPDATE escrow_holds SET status = 'released', released_at = now() WHERE game_id = $1 AND status = 'held'`,
      [gameId]
    );

    // Winner gets prize
    const winnerRes = await client.query<{ balance: string }>(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2 RETURNING balance::text AS balance`,
      [prize.toFixed(8), winnerId]
    );
    if (winnerRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Winner not found' };
    }

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'p2p_transfer', $3)`,
      [winnerId, prize.toFixed(8), gameId]
    );

    await client.query(
      `INSERT INTO admin_revenues (amount, source_type, source_id) VALUES ($1, 'game', $2)`,
      [fee.toFixed(8), gameId]
    );

    // Double-Entry Ledger: from loser → to winner, fee to house (blockchain-style audit)
    await client.query(
      `INSERT INTO ledger_entries (from_user_id, to_user_id, amount, fee_to_house, asset_type, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, 'chips', 'p2p_settlement', $5)`,
      [loserId, winnerId, prize.toFixed(8), fee.toFixed(8), gameId]
    );

    await client.query('COMMIT');
    return {
      success: true,
      winnerNewBalance: winnerRes.rows[0].balance,
      feeAmount: fee.toFixed(8),
    };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Refund escrow (e.g. game cancelled). */
export async function refundEscrow(gameId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!pool) return { ok: false, error: 'Database not configured' };
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const holds = await client.query<{ id: string; user_id: string; amount: string }>(
      `SELECT id, user_id, amount FROM escrow_holds WHERE game_id = $1 AND status = 'held'`,
      [gameId]
    );

    for (const row of holds.rows) {
      await client.query(
        `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
        [row.amount, row.user_id]
      );
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'escrow_release', $3)`,
        [row.user_id, row.amount, gameId]
      );
    }

    await client.query(
      `UPDATE escrow_holds SET status = 'refunded', released_at = now() WHERE game_id = $1 AND status = 'held'`,
      [gameId]
    );

    await client.query('COMMIT');
    return { ok: true };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Mint Oasis Token on win/achievement. Respects daily cap (לוח בקרה מוניטרי). */
export async function mintOasis(
  userId: string,
  amount: string,
  reason: 'win' | 'achievement' | 'tournament',
  referenceId?: string
): Promise<{ success: true; newOasisBalance: string } | { success: false; error: string }> {
  if (!pool) return { success: false, error: 'Database not configured' };

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return { success: false, error: 'Invalid amount' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Daily cap check (Proof of Skill tokenomics — prevent inflation)
    const budget = await client.query<{ minted_today: string; daily_cap: string }>(
      `SELECT minted_today, daily_cap FROM mint_daily_budget WHERE budget_date = CURRENT_DATE FOR UPDATE`
    );
    if (budget.rowCount === 0) {
      await client.query(
        `INSERT INTO mint_daily_budget (budget_date, minted_today, daily_cap) VALUES (CURRENT_DATE, 0, 100000) ON CONFLICT (budget_date) DO NOTHING`
      );
    }
    const capRow = await client.query<{ minted_today: string; daily_cap: string }>(
      `SELECT minted_today, daily_cap FROM mint_daily_budget WHERE budget_date = CURRENT_DATE FOR UPDATE`
    );
    if (capRow.rowCount && capRow.rows[0]) {
      const minted = parseFloat(capRow.rows[0].minted_today);
      const cap = parseFloat(capRow.rows[0].daily_cap);
      if (minted + amt > cap) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Daily mint cap reached' };
      }
      await client.query(
        `UPDATE mint_daily_budget SET minted_today = minted_today + $1, updated_at = now() WHERE budget_date = CURRENT_DATE`,
        [amt.toFixed(8)]
      );
    }

    const res = await client.query<{ oasis_balance: string }>(
      `UPDATE users SET oasis_balance = oasis_balance + $1, updated_at = now() WHERE id = $2 RETURNING oasis_balance::text AS oasis_balance`,
      [amt.toFixed(8), userId]
    );
    if (res.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'User not found' };
    }

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'oasis_mint', $3)`,
      [userId, amt.toFixed(8), referenceId ?? null]
    );

    // Double-Entry: mint = from NULL (new supply) → to user
    await client.query(
      `INSERT INTO ledger_entries (from_user_id, to_user_id, amount, fee_to_house, asset_type, reference_type, reference_id)
       VALUES (NULL, $1, $2, 0, 'oasis', 'oasis_mint', $3)`,
      [userId, amt.toFixed(8), referenceId ?? null]
    );

    await client.query('COMMIT');
    return { success: true, newOasisBalance: res.rows[0].oasis_balance };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Anti-Fraud: log game session (IP + timestamps). */
export async function startGameSession(
  gameId: string,
  gameKind: string,
  player1Id: string,
  player2Id: string,
  stakeAmount: string,
  ipAddress?: string
): Promise<{ sessionId: string } | { error: string }> {
  if (!pool) return { error: 'Database not configured' };

  const res = await pool.query<{ id: string }>(
    `INSERT INTO game_sessions (game_id, game_kind, player1_id, player2_id, stake_amount, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6::inet) RETURNING id`,
    [gameId, gameKind, player1Id, player2Id, stakeAmount, ipAddress ?? null]
  );
  return { sessionId: res.rows[0].id };
}

export async function endGameSession(sessionId: string, winnerId: string | null): Promise<void> {
  if (!pool) return;
  await pool.query(
    `UPDATE game_sessions SET ended_at = now(), winner_id = $2 WHERE id = $1`,
    [sessionId, winnerId]
  );
}

/**
 * Escrow Oracle: מתנתק באמצע משחק — המתנתק מפסיד טכנית (forfeit).
 * הזוכה הוא השחקן שנשאר; הקופה עוברת אליו (פחות עמלה).
 */
export async function resolveEscrowOnDisconnect(
  gameId: string,
  disconnectedUserId: string
): Promise<
  | { ok: true; winnerId: string; winnerNewBalance: string }
  | { ok: false; error: string }
> {
  if (!pool) return { ok: false, error: 'Database not configured' };

  const holds = await pool.query<{ user_id: string; amount: string }>(
    `SELECT user_id, amount FROM escrow_holds WHERE game_id = $1 AND status = 'held'`,
    [gameId]
  );
  if (holds.rows.length !== 2) return { ok: false, error: 'Invalid escrow state' };

  const stayedUserId = holds.rows.find((r) => r.user_id !== disconnectedUserId)?.user_id;
  if (!stayedUserId) return { ok: false, error: 'Could not determine stayed player' };

  const stakeAmount = holds.rows[0].amount;
  const pot = (parseFloat(stakeAmount) * 2).toFixed(8);
  const result = await settleP2P(gameId, stayedUserId, disconnectedUserId, pot);
  if (!result.success) return { ok: false, error: (result as { error: string }).error ?? 'Settlement failed' };

  return {
    ok: true,
    winnerId: stayedUserId,
    winnerNewBalance: result.winnerNewBalance ?? '0',
  };
}

/** Get daily mint cap (for admin panel). */
export async function getMintDailyBudget(): Promise<{
  budgetDate: string;
  mintedToday: string;
  dailyCap: string;
} | null> {
  if (!pool) return null;
  const res = await pool.query<{ budget_date: string; minted_today: string; daily_cap: string }>(
    `SELECT budget_date::text, minted_today::text, daily_cap::text FROM mint_daily_budget WHERE budget_date = CURRENT_DATE`
  );
  if (res.rowCount === 0) return null;
  const r = res.rows[0];
  return {
    budgetDate: r.budget_date,
    mintedToday: r.minted_today,
    dailyCap: r.daily_cap,
  };
}

/** Set daily mint cap (לוח בקרה מוניטרי). */
export async function setMintDailyCap(cap: number): Promise<boolean> {
  if (!pool) return false;
  await pool.query(
    `INSERT INTO mint_daily_budget (budget_date, minted_today, daily_cap) VALUES (CURRENT_DATE, COALESCE((SELECT minted_today FROM mint_daily_budget WHERE budget_date = CURRENT_DATE), 0), $1)
     ON CONFLICT (budget_date) DO UPDATE SET daily_cap = $1, updated_at = now()`,
    [cap.toFixed(8)]
  );
  return true;
}

/** Burn Oasis Token — רכישת פריטים/עמלת שולחן (מטבעות "נשרפים" מהמחזור). */
export async function burnOasis(
  userId: string,
  amount: string,
  reason: 'store' | 'tournament_fee' | 'table_fee',
  referenceId?: string
): Promise<{ success: true; newOasisBalance: string } | { success: false; error: string }> {
  if (!pool) return { success: false, error: 'Database not configured' };

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return { success: false, error: 'Invalid amount' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query<{ oasis_balance: string }>(
      `UPDATE users SET oasis_balance = oasis_balance - $1, updated_at = now()
       WHERE id = $2 AND oasis_balance >= $1 RETURNING oasis_balance::text AS oasis_balance`,
      [amt.toFixed(8), userId]
    );
    if (res.rowCount === 0) {
      await client.query('ROLLBACK');
      client.release();
      return { success: false, error: 'Insufficient Oasis balance or user not found' };
    }

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'oasis_spend', $3)`,
      [userId, (-amt).toFixed(8), referenceId ?? null]
    );

    await client.query('COMMIT');
    return { success: true, newOasisBalance: res.rows[0].oasis_balance };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Social Backing: supporter places bet on a player.
 * Deducts supporter balance and logs transaction.
 */
export async function placeBackingBet(
  gameId: string,
  supporterId: string,
  playerId: string,
  amount: string,
  odds = 1.0
): Promise<{ ok: true; betId: string } | { ok: false; error: string }> {
  if (!pool) return { ok: false, error: 'Database not configured' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Invalid amount' };
    }
    const oddsNum = Number.isFinite(odds) && odds > 0 ? odds : 1.0;

    const upd = await client.query(
      `UPDATE users SET balance = balance - $1, updated_at = now() WHERE id = $2 AND balance >= $1 RETURNING id`,
      [amt.toFixed(8), supporterId]
    );
    if (upd.rowCount === 0) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Insufficient balance' };
    }

    const ins = await client.query<{ id: string }>(
      `INSERT INTO backing_bets (game_id, player_id, supporter_id, amount, odds, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
      [gameId, playerId, supporterId, amt.toFixed(8), oddsNum.toFixed(4)]
    );

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id)
       VALUES ($1, $2, 'backing_bet', $3)`,
      [supporterId, (-amt).toFixed(8), ins.rows[0].id]
    );

    await client.query('COMMIT');
    return { ok: true, betId: ins.rows[0].id };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Social Backing: settle bets for a game.
 * Winner gets supporter payouts; backed player earns a share.
 */
export async function settleBackingBets(
  gameId: string,
  winnerId: string,
  playerShareRate = 0.15
): Promise<{ ok: true; settled: number } | { ok: false; error: string }> {
  if (!pool) return { ok: false, error: 'Database not configured' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const rate = Number.isFinite(playerShareRate) && playerShareRate >= 0 && playerShareRate <= 0.5
      ? playerShareRate
      : 0.15;

    const bets = await client.query<{
      id: string;
      supporter_id: string;
      amount: string;
      odds: string;
      player_id: string;
    }>(
      `SELECT id, supporter_id, amount::text, odds::text, player_id
       FROM backing_bets WHERE game_id = $1 AND status = 'pending'`,
      [gameId]
    );

    if (bets.rowCount === 0) {
      await client.query('COMMIT');
      return { ok: true, settled: 0 };
    }

    let settled = 0;
    let playerShareTotal = 0;

    for (const bet of bets.rows) {
      const amount = parseFloat(bet.amount);
      const odds = parseFloat(bet.odds);
      if (bet.player_id !== winnerId) {
        await client.query(
          `UPDATE backing_bets SET status = 'lost', settled_at = now() WHERE id = $1`,
          [bet.id]
        );
        settled += 1;
        continue;
      }

      const grossPayout = amount * odds;
      const playerShare = grossPayout * rate;
      const supporterPayout = grossPayout - playerShare;
      playerShareTotal += playerShare;

      await client.query(
        `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
        [supporterPayout.toFixed(8), bet.supporter_id]
      );
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, reference_id)
         VALUES ($1, $2, 'backing_payout', $3)`,
        [bet.supporter_id, supporterPayout.toFixed(8), bet.id]
      );
      await client.query(
        `UPDATE backing_bets SET status = 'won', payout_amount = $2, settled_at = now() WHERE id = $1`,
        [bet.id, supporterPayout.toFixed(8)]
      );
      settled += 1;
    }

    if (playerShareTotal > 0) {
      await client.query(
        `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
        [playerShareTotal.toFixed(8), winnerId]
      );
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, reference_id)
         VALUES ($1, $2, 'backing_share', $3)`,
        [winnerId, playerShareTotal.toFixed(8), gameId]
      );
    }

    await client.query('COMMIT');
    return { ok: true, settled };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export interface BackingHistoryRow {
  id: string;
  gameId: string;
  playerId: string;
  amount: string;
  odds: string;
  status: string;
  payoutAmount: string | null;
  createdAt: string;
}

export async function getBackingHistory(
  supporterId: string,
  limit = 20
): Promise<BackingHistoryRow[]> {
  if (!pool) return [];
  const lim = Math.min(Math.max(limit, 1), 100);
  const res = await pool.query<{
    id: string;
    game_id: string;
    player_id: string;
    amount: string;
    odds: string;
    status: string;
    payout_amount: string | null;
    created_at: string;
  }>(
    `SELECT id, game_id, player_id, amount::text, odds::text, status, payout_amount::text, created_at
     FROM backing_bets
     WHERE supporter_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [supporterId, lim]
  );
  return res.rows.map((r) => ({
    id: r.id,
    gameId: r.game_id,
    playerId: r.player_id,
    amount: r.amount,
    odds: r.odds,
    status: r.status,
    payoutAmount: r.payout_amount,
    createdAt: r.created_at,
  }));
}

export async function cancelBackingBet(
  betId: string,
  supporterId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!pool) return { ok: false, error: 'Database not configured' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await client.query<{ amount: string; status: string }>(
      `SELECT amount::text, status FROM backing_bets WHERE id = $1 AND supporter_id = $2`,
      [betId, supporterId]
    );
    if (row.rowCount === 0) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Bet not found' };
    }
    if (row.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Bet already settled' };
    }

    const amount = parseFloat(row.rows[0].amount);
    await client.query(
      `UPDATE backing_bets SET status = 'refunded', settled_at = now() WHERE id = $1`,
      [betId]
    );
    await client.query(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
      [amount.toFixed(8), supporterId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id)
       VALUES ($1, $2, 'backing_refund', $3)`,
      [supporterId, amount.toFixed(8), betId]
    );

    await client.query('COMMIT');
    return { ok: true };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function getBackingOdds(
  gameId: string,
  playerId: string
): Promise<{ odds: number }> {
  if (!pool) return { odds: 1.8 };
  const res = await pool.query<{ total: string | null; player_total: string | null }>(
    `SELECT
       COALESCE(SUM(amount), 0)::text AS total,
       COALESCE(SUM(CASE WHEN player_id = $2 THEN amount ELSE 0 END), 0)::text AS player_total
     FROM backing_bets
     WHERE game_id = $1 AND status = 'pending'`,
    [gameId, playerId]
  );
  const total = parseFloat(res.rows[0]?.total ?? '0');
  const playerTotal = parseFloat(res.rows[0]?.player_total ?? '0');
  if (!Number.isFinite(total) || total <= 0) return { odds: 1.8 };

  const share = Math.min(Math.max(playerTotal / total, 0), 1);
  const base = 2.5 - share * 1.5;
  const odds = Math.min(Math.max(base, 1.2), 3.0);
  return { odds: Number(odds.toFixed(2)) };
}
