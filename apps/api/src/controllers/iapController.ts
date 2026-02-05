import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db';
import { getIdempotency, setIdempotency } from '../services/idempotencyService';

type AppleBody = {
  userId: string;
  transactionId: string;
  productId: string;
  receipt?: string;
  /** Credits to add (from IAP product mapping); stub uses this if no server-side receipt validation */
  credits?: number;
};

/**
 * IAP Bridge — Apple In-App Purchase → Oasis/Credits (App Store Compliance).
 * Production: validate receipt with Apple, map productId to credits, then credit user.
 * Stub: accept transactionId + productId, credit once (idempotent by transactionId).
 */
export async function postIAPApple(
  req: FastifyRequest<{ Body: AppleBody }>,
  reply: FastifyReply
) {
  try {
    const { userId, transactionId, productId, credits = 1000 } = req.body ?? {};
    if (!userId || !transactionId || !productId) {
      return reply.status(400).send({ error: 'userId, transactionId, productId required' });
    }
    if (!pool) return reply.status(503).send({ error: 'Database not configured' });

    const idempotencyKey = `iap:${transactionId}`;
    const stored = await getIdempotency(idempotencyKey);
    if (stored && stored.responseType === 'iap_apple') {
      return reply.send(stored.responsePayload as { success: true; balance: string; credits?: number; alreadyProcessed?: boolean });
    }

    const amt = Number(credits);
    if (isNaN(amt) || amt <= 0) {
      return reply.status(400).send({ error: 'Invalid credits amount' });
    }

    await pool.query('BEGIN');
    const upd = await pool.query<{ balance: string }>(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2 RETURNING balance::text AS balance`,
      [amt.toFixed(8), userId]
    );
    if (upd.rowCount === 0) {
      await pool.query('ROLLBACK');
      return reply.status(404).send({ error: 'User not found' });
    }
    await pool.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'purchase', $3)`,
      [userId, amt.toFixed(8), null]
    );
    await pool.query('COMMIT');

    const payload = { success: true, balance: upd.rows[0].balance, credits: amt };
    await setIdempotency(idempotencyKey, 'iap_apple', payload);
    return reply.send(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'IAP failed';
    return reply.status(500).send({ error: msg });
  }
}
