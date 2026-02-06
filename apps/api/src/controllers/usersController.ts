import type { FastifyRequest, FastifyReply } from 'fastify';
import { query, pool, hasDb } from '../db';
import { burnOasis } from '../services/walletService';

type Params = { userId: string };
type BurnBody = { amount: string; reason: 'store' | 'tournament_fee' | 'table_fee'; referenceId?: string };

/** Demo balance for guest/demo users or when DB not configured */
function isGuestOrDemo(userId: string): boolean {
  return userId.startsWith('guest_') || userId.startsWith('demo_');
}

export async function getBalance(req: FastifyRequest<{ Params: Params }>, reply: FastifyReply) {
  const { userId } = req.params;
  if (!hasDb() || isGuestOrDemo(userId)) {
    return reply.send({ balance: '0' });
  }
  try {
    const result = await query<{ balance: string }>(
      'SELECT balance::text FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'User not found' });
    return reply.send({ balance: result.rows[0].balance });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Database error';
    if (msg.includes('DATABASE_URL')) return reply.status(503).send({ error: 'Database not configured' });
    return reply.status(500).send({ error: 'Database error' });
  }
}

/** פרופיל משתמש — balance, oasis_balance, elo_rating (למשחק P2P ו-Fair Play) */
export async function getProfile(req: FastifyRequest<{ Params: Params }>, reply: FastifyReply) {
  const { userId } = req.params;
  if (!hasDb() || isGuestOrDemo(userId)) {
    return reply.send({ balance: '0', oasis_balance: '0', elo_rating: 1500 });
  }
  try {
    const result = await query<{ balance: string; oasis_balance: string; elo_rating: number }>(
      `SELECT balance::text, COALESCE(oasis_balance::text, '0') AS oasis_balance, COALESCE(elo_rating, 1500) AS elo_rating FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'User not found' });
    const row = result.rows[0];
    return reply.send({
      balance: row.balance,
      oasis_balance: row.oasis_balance,
      elo_rating: row.elo_rating,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Database error';
    if (msg.includes('DATABASE_URL')) return reply.status(503).send({ error: 'Database not configured' });
    if (msg.includes('column') && msg.includes('does not exist')) {
      return reply.status(503).send({ error: 'Run migrations 004 and 005 for profile fields' });
    }
    return reply.status(500).send({ error: 'Database error' });
  }
}

/** היסטוריית תנועות לארנק — גרף "הצלחה" (Wallet value over time). */
export async function getTransactionHistory(
  req: FastifyRequest<{ Params: Params; Querystring: { days?: string } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = req.params;
    const days = Math.min(90, Math.max(1, parseInt(req.query.days ?? '30', 10) || 30));
    if (!hasDb()) return reply.send({ history: [] });
    const result = await pool!.query<{ date: string; balance_delta: string }>(
      `SELECT date_trunc('day', created_at)::date::text AS date, SUM(amount)::text AS balance_delta
       FROM transactions WHERE user_id = $1 AND created_at >= now() - ($2 * interval '1 day')
       GROUP BY date_trunc('day', created_at) ORDER BY date`,
      [userId, days]
    );
    return reply.send({ history: result.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Database error';
    return reply.status(500).send({ error: msg });
  }
}

/** שריפת Oasis — רכישה/עמלה (Burn). */
export async function postBurnOasis(
  req: FastifyRequest<{ Params: Params; Body: BurnBody }>,
  reply: FastifyReply
) {
  try {
    const { userId } = req.params;
    const { amount, reason, referenceId } = req.body ?? {};
    if (!amount || !reason) {
      return reply.status(400).send({ error: 'amount and reason required' });
    }
    const result = await burnOasis(userId, amount, reason, referenceId);
    if (!result.success) {
      return reply.status(400).send({ error: (result as { error: string }).error });
    }
    return reply.send({ success: true, oasis_balance: result.newOasisBalance });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return reply.status(500).send({ error: msg });
  }
}
