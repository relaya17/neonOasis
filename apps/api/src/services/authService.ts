import { query, hasDb } from '../db';

export type AuthResult =
  | { success: true; userId: string; username: string; isAdmin: boolean }
  | { success: false; error: string };

/** יצירת משתמש אורח — username: guest_<random>; בלי DB או בשגיאה מחזיר דמו */
export async function createGuest(): Promise<AuthResult> {
  try {
    if (!hasDb()) {
      const userId = `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      return { success: true, userId, username: `Guest_${userId.slice(5, 11)}`, isAdmin: false };
    }
    const username = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return await createUser(username);
  } catch {
    const userId = `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return { success: true, userId, username: `Guest_${userId.slice(5, 11)}`, isAdmin: false };
  }
}

/** כניסה עם שם משתמש — מחפש או יוצר משתמש חדש; בלי DB דמו */
export async function loginWithUsername(inputUsername: string): Promise<AuthResult> {
  const username = inputUsername.trim().replace(/\s+/g, '_').slice(0, 32);
  if (!username) return { success: false, error: 'Username required' };

  if (!hasDb()) {
    const userId = `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return { success: true, userId, username, isAdmin: false };
  }

  try {
    const existing = await query<{ id: string; username: string; is_admin: boolean }>(
      'SELECT id::text AS id, username, COALESCE(is_admin, false) AS is_admin FROM users WHERE username = $1',
      [username]
    );
    if (existing.rows.length > 0) {
      const r = existing.rows[0];
      return { success: true, userId: r.id, username: r.username, isAdmin: r.is_admin };
    }
  } catch {
    const existing = await query<{ id: string; username: string }>(
      'SELECT id::text AS id, username FROM users WHERE username = $1',
      [username]
    );
    if (existing.rows.length > 0) {
      const r = existing.rows[0];
      return { success: true, userId: r.id, username: r.username, isAdmin: false };
    }
  }
  return createUser(username);
}

async function createUser(username: string): Promise<AuthResult> {
  try {
    const result = await query<{ id: string; username: string; is_admin: boolean }>(
      `INSERT INTO users (username) VALUES ($1) RETURNING id::text AS id, username, COALESCE(is_admin, false) AS is_admin`,
      [username]
    );
    if (result.rows.length === 0) return { success: false, error: 'Create failed' };
    const r = result.rows[0];
    return { success: true, userId: r.id, username: r.username, isAdmin: r.is_admin };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('unique') || msg.includes('duplicate'))
      return { success: false, error: 'Username taken' };
    if (msg.includes('is_admin')) {
      const result = await query<{ id: string; username: string }>(
        `INSERT INTO users (username) VALUES ($1) RETURNING id::text AS id, username`,
        [username]
      );
      if (result.rows.length === 0) return { success: false, error: 'Create failed' };
      const r = result.rows[0];
      return { success: true, userId: r.id, username: r.username, isAdmin: false };
    }
    throw e;
  }
}
