/**
 * Idempotency — כל העברת כספים (P2P) עם מפתח ייחודי.
 * שליחה כפולה (ניתוק + retry) לא מורידה כסף פעמיים.
 */
import { pool } from '../db';

export async function getIdempotency(key: string): Promise<{ responseType: string; responsePayload: unknown } | null> {
  if (!pool) return null;
  const res = await pool.query<{ response_type: string; response_payload: unknown }>(
    `SELECT response_type, response_payload FROM idempotency_keys WHERE idempotency_key = $1`,
    [key]
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return { responseType: row.response_type, responsePayload: row.response_payload };
}

export async function setIdempotency(
  key: string,
  responseType: string,
  responsePayload: unknown
): Promise<void> {
  if (!pool) return;
  await pool.query(
    `INSERT INTO idempotency_keys (idempotency_key, response_type, response_payload)
     VALUES ($1, $2, $3)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [key, responseType, JSON.stringify(responsePayload)]
  );
}
