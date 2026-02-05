import { pool } from '../db';
import type { PoolClient } from 'pg';
import { getRakeRate } from '../config/rake';
import {
  holdEscrow,
  settleP2P,
  refundEscrow,
  mintOasis,
  startGameSession,
  endGameSession,
  settleBackingBets,
} from './walletService';
import { updateEloAfterGame } from './eloService';
import { AMLService, checkAndFlagSuspiciousPair } from './amlService';

/** Oasis tokens minted per P2P win (configurable) */
const OASIS_MINT_PER_WIN = 10;

/**
 * עיבוד זכייה במשחק — טרנזקציה אטומית.
 * לעולם לא מעדכנים רק balance; כל שינוי נרשם ב-transactions.
 */
export async function processGameWin(
  winnerId: string,
  _loserId: string,
  potAmount: string,
  sourceGameId?: string
): Promise<{ success: true; prize: number; newBalance: string } | { success: false; error: string }> {
  if (!pool) return { success: false, error: 'Database not configured' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pot = parseFloat(potAmount);
    if (isNaN(pot) || pot <= 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Invalid pot amount' };
    }

    const fee = pot * getRakeRate();
    const finalPrize = pot - fee;

    // 1. עדכון יתרת הזוכה
    const updateRes = await client.query<{ balance: string }>(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2 RETURNING balance::text AS balance`,
      [finalPrize.toFixed(8), winnerId]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Winner not found' };
    }
    const newBalance = updateRes.rows[0].balance;

    // 2. רישום הפעולה בהיסטוריה (חובה לביקורת)
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'win', $3)`,
      [winnerId, finalPrize.toFixed(8), sourceGameId ?? null]
    );

    // 3. רישום עמלת הבית
    await client.query(
      `INSERT INTO admin_revenues (amount, source_type, source_id) VALUES ($1, 'game', $2)`,
      [fee.toFixed(8), sourceGameId ?? null]
    );

    await client.query('COMMIT');
    return { success: true, prize: finalPrize, newBalance };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * הימור — מוריד מ-balance ורושם bet. מחזיר את ה-client אם צריך להמשיך באותה טרנזקציה.
 */
export async function placeBet(
  userId: string,
  amount: string,
  gameId: string,
  existingClient?: PoolClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!pool) return { ok: false, error: 'Database not configured' };
  const client = existingClient ?? (await pool.connect());
  const release = !existingClient;

  try {
    if (!existingClient) await client.query('BEGIN');

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      if (!existingClient) await client.query('ROLLBACK');
      return { ok: false, error: 'Invalid bet amount' };
    }

    const res = await client.query(
      `UPDATE users SET balance = balance - $1, updated_at = now() WHERE id = $2 AND balance >= $1 RETURNING id`,
      [amt.toFixed(8), userId]
    );

    if (res.rowCount === 0) {
      if (!existingClient) await client.query('ROLLBACK');
      return { ok: false, error: 'Insufficient balance' };
    }

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'bet', $3)`,
      [userId, (-amt).toFixed(8), gameId]
    );

    if (!existingClient) await client.query('COMMIT');
    return { ok: true };
  } catch (e) {
    if (!existingClient) await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    if (release) client.release();
  }
}

/**
 * P2P: Start match — hold escrow from both players, log session (Anti-Fraud).
 * Games call this when two players join with a stake.
 */
export async function startP2PMatch(
  gameId: string,
  gameKind: string,
  player1Id: string,
  player2Id: string,
  stakeAmount: string,
  ipAddress?: string
): Promise<
  | { ok: true; sessionId: string }
  | { ok: false; error: string }
> {
  const session = await startGameSession(
    gameId,
    gameKind,
    player1Id,
    player2Id,
    stakeAmount,
    ipAddress
  );
  if ('error' in session) return { ok: false, error: session.error };

  const h1 = await holdEscrow(gameId, player1Id, stakeAmount);
  if (!h1.ok) return { ok: false, error: (h1 as { error: string }).error };
  const h2 = await holdEscrow(gameId, player2Id, stakeAmount);
  if (!h2.ok) {
    await refundEscrow(gameId);
    return { ok: false, error: (h2 as { error: string }).error };
  }
  return { ok: true, sessionId: session.sessionId };
}

/**
 * P2P: End match — settle pot to winner, fee to platform, mint Oasis to winner.
 */
export async function endP2PMatch(
  gameId: string,
  winnerId: string,
  loserId: string,
  sessionId: string,
  stakeAmount: string
): Promise<
  | { success: true; winnerNewBalance: string; feeAmount: string }
  | { success: false; error: string }
> {
  const pot = (parseFloat(stakeAmount) * 2).toFixed(8);
  const result = await settleP2P(gameId, winnerId, loserId, pot);
  if (!result.success) return result;

  await endGameSession(sessionId, winnerId);
  await mintOasis(winnerId, String(OASIS_MINT_PER_WIN), 'win', gameId);
  await settleBackingBets(gameId, winnerId);
  await updateEloAfterGame(winnerId, loserId);
  await checkAndFlagSuspiciousPair(winnerId, loserId, sessionId);

  return result;
}
