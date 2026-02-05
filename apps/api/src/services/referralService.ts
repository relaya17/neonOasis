import { query, pool } from '../db';

const REFERRAL_BONUS_COINS = 1000;

/** עמלת שותף על קניית מטבעות (5%–10%). כאן: 10% במטבעות */
const AFFILIATE_COMMISSION_RATE = 0.1;

export type ClaimResult =
  | { success: true; bonusGranted: boolean }
  | { success: false; error: string };

/** מחזיר קישור הזמנה למשתמש */
export function getReferralLink(inviterId: string, baseUrl: string): string {
  const url = new URL(baseUrl || 'http://localhost:5273');
  url.searchParams.set('ref', inviterId);
  return url.toString();
}

/**
 * רישום referral: inviter מזמין referred.
 * אם זו הפעם הראשונה שקוראים עם הזוג הזה – נותנים ל-inviter בונוס ומסמנים reward_claimed.
 */
export async function claimReferral(
  inviterId: string,
  referredId: string
): Promise<ClaimResult> {
  if (inviterId === referredId) return { success: false, error: 'Cannot refer yourself' };

  const existing = await query(
    `SELECT id, reward_claimed FROM referrals WHERE referred_id = $1`,
    [referredId]
  );
  let row = existing.rows[0] as { id: string; reward_claimed: boolean } | undefined;

  if (!row) {
    await query(
      `INSERT INTO referrals (inviter_id, referred_id) VALUES ($1, $2)
       ON CONFLICT (referred_id) DO NOTHING`,
      [inviterId, referredId]
    );
    const again = await query(
      `SELECT id, reward_claimed FROM referrals WHERE referred_id = $1`,
      [referredId]
    );
    row = again.rows[0] as { id: string; reward_claimed: boolean };
  }

  if (!row) return { success: false, error: 'Referral not found' };
  if (row.reward_claimed) return { success: true, bonusGranted: false };

  if (!pool) return { success: false, error: 'Database not configured' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
      [REFERRAL_BONUS_COINS.toFixed(8), inviterId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'referral', $3)`,
      [inviterId, REFERRAL_BONUS_COINS.toFixed(8), row.id]
    );
    await client.query(
      `UPDATE referrals SET reward_claimed = true WHERE id = $1`,
      [row.id]
    );

    await client.query('COMMIT');
    return { success: true, bonusGranted: true };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * עמלת שותף (Affiliate): כשמשתמש שהוזמן קונה מטבעות בחנות,
 * המזמין מקבל 10% עמלה במטבעות. קוראים לפונקציה הזו מתוך flow הקנייה (IAP).
 */
export async function grantAffiliateCommissionOnPurchase(
  referredUserId: string,
  purchaseAmountCoins: number,
  purchaseTransactionId?: string
): Promise<{ granted: true; inviterId: string; commission: number } | { granted: false }> {
  if (purchaseAmountCoins <= 0) return { granted: false };

  const ref = await query<{ inviter_id: string }>(
    `SELECT inviter_id FROM referrals WHERE referred_id = $1`,
    [referredUserId]
  );
  const inviterId = ref.rows[0]?.inviter_id;
  if (!inviterId) return { granted: false };

  const commission = Math.max(0, purchaseAmountCoins * AFFILIATE_COMMISSION_RATE);
  if (commission < 0.01) return { granted: false };

  if (!pool) return { granted: false };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
      [commission.toFixed(8), inviterId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'referral_commission', $3)`,
      [inviterId, commission.toFixed(8), purchaseTransactionId ?? null]
    );
    await client.query('COMMIT');
    return { granted: true, inviterId, commission };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
