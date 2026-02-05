import { query } from '../db';

/** בודק אם המשתמש אומת על ידי AI Guardian (is_verified במסד) */
export async function isUserVerified(userId: string): Promise<boolean> {
  try {
    const result = await query<{ is_verified: boolean }>(
      'SELECT is_verified FROM users WHERE id = $1',
      [userId]
    );
    return result.rows.length > 0 && result.rows[0].is_verified === true;
  } catch {
    return false;
  }
}
