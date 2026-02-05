import { pool } from '../db';
import { grantAffiliateCommissionOnPurchase } from './referralService';

/**
 * עיבוד קניית מטבעות (IAP).
 * כשנוסיף Apple Pay / Google Pay / Stripe – האימות יבוא מבחוץ;
 * הלוגיקה כאן: עדכון יתרה, רישום transaction, ועמלת שותף אם המשתמש הוזמן.
 */
export async function processPurchase(
  userId: string,
  amountCoins: number,
  paymentReference?: string
): Promise<
  | { success: true; newBalance: string; affiliateCommissionGranted: boolean }
  | { success: false; error: string }
> {
  if (amountCoins <= 0) return { success: false, error: 'Invalid amount' };
  if (!pool) return { success: false, error: 'Database not configured' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query<{ balance: string }>(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2 RETURNING balance::text AS balance`,
      [amountCoins.toFixed(8), userId]
    );
    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'User not found' };
    }
    const newBalance = updateRes.rows[0].balance;

    const txRes = await client.query<{ id: string }>(
      `INSERT INTO transactions (user_id, amount, type, reference_id) VALUES ($1, $2, 'purchase', $3) RETURNING id`,
      [userId, amountCoins.toFixed(8), paymentReference ?? null]
    );
    const purchaseTxId = txRes.rows[0]?.id;

    await client.query('COMMIT');

    // עמלת שותף: מחוץ ל-tx הראשי כדי שאם היא נכשלת, הקנייה לא מתבטלת
    let affiliateCommissionGranted = false;
    try {
      const commission = await grantAffiliateCommissionOnPurchase(
        userId,
        amountCoins,
        purchaseTxId
      );
      affiliateCommissionGranted = commission.granted;
    } catch {
      // לוג בלבד; הקנייה כבר בוצעה
    }

    return {
      success: true,
      newBalance,
      affiliateCommissionGranted,
    };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
