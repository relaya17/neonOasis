import { query, pool } from '../db';
import type { PoolClient } from 'pg';

export type RedeemResult =
  | { success: true; coins: number; newBalance: string }
  | { success: false; error: string };

export async function redeemCoupon(
  code: string,
  userId: string
): Promise<RedeemResult> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { success: false, error: 'Invalid code' };

  const couponRes = await query<{
    id: string;
    coins: string;
    max_uses: number;
    used_count: number;
    expires_at: string | null;
  }>(
    `SELECT id, coins::text AS coins, max_uses, used_count, expires_at
     FROM coupons WHERE code = $1`,
    [normalizedCode]
  );

  if (couponRes.rows.length === 0) return { success: false, error: 'Code not found' };
  const coupon = couponRes.rows[0];

  if (coupon.used_count >= coupon.max_uses)
    return { success: false, error: 'Code expired or max uses reached' };

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { success: false, error: 'Code expired' };

  const alreadyRedeemed = await query(
    `SELECT 1 FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2`,
    [coupon.id, userId]
  );
  if (alreadyRedeemed.rows.length > 0) return { success: false, error: 'Already redeemed' };

  if (!pool) return { success: false, error: 'Database not configured' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
      [coupon.coins, userId]
    );
    const balanceRes = await client.query<{ balance: string }>(
      `SELECT balance::text FROM users WHERE id = $1`,
      [userId]
    );
    if (balanceRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'User not found' };
    }
    const newBalance = balanceRes.rows[0].balance;

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'coupon', $3)`,
      [userId, coupon.coins, coupon.id]
    );
    await client.query(
      `INSERT INTO coupon_redemptions (coupon_id, user_id) VALUES ($1, $2)`,
      [coupon.id, userId]
    );
    await client.query(
      `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
      [coupon.id]
    );

    await client.query('COMMIT');
    return { success: true, coins: parseFloat(coupon.coins), newBalance };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
