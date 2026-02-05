import { query, pool } from '../db';

/** GGR = Gross Gaming Revenue — סך עמלות הבית (Rake) היום */
export async function getGGRToday(): Promise<number> {
  if (!pool) return 0;
  const res = await pool.query<{ sum: string | null }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS sum
     FROM admin_revenues
     WHERE created_at >= current_date AND created_at < current_date + interval '1 day'`
  );
  return parseFloat(res.rows[0]?.sum ?? '0') || 0;
}

/** DAU = Daily Active Users — משתמשים ייחודיים עם פעילות היום */
export async function getDAU(): Promise<number> {
  if (!pool) return 0;
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(DISTINCT user_id)::text AS count
     FROM transactions
     WHERE created_at >= current_date AND created_at < current_date + interval '1 day'`
  );
  return parseInt(res.rows[0]?.count ?? '0', 10) || 0;
}

/**
 * Churn Rate: משתמשים שהיו פעילים לפני 7+ ימים אבל לא ב-7 הימים האחרונים.
 * חישוב: (משתמשים שלא פעילים ב-7 ימים אחרונים אבל היו פעילים ב-30 ימים לפני כן) / (משתמשים פעילים ב-30 ימים).
 */
export async function getChurnRate(): Promise<number> {
  if (!pool) return 0;
  const res = await pool.query<{ churn_pct: string | null }>(`
    WITH active_last_7 AS (
      SELECT DISTINCT user_id FROM transactions
      WHERE created_at >= current_date - interval '7 days'
    ),
    active_8_to_30 AS (
      SELECT DISTINCT user_id FROM transactions
      WHERE created_at >= current_date - interval '30 days'
        AND created_at < current_date - interval '7 days'
    ),
    churned AS (
      SELECT a.user_id FROM active_8_to_30 a
      LEFT JOIN active_last_7 b ON a.user_id = b.user_id
      WHERE b.user_id IS NULL
    ),
    total_30 AS (
      SELECT COUNT(DISTINCT user_id) AS c FROM transactions
      WHERE created_at >= current_date - interval '30 days'
    )
    SELECT CASE WHEN t.c > 0 THEN (SELECT COUNT(*) FROM churned)::float / t.c * 100 ELSE 0 END::text AS churn_pct
    FROM total_30 t
  `);
  const pct = parseFloat(res.rows[0]?.churn_pct ?? '0');
  return Number.isFinite(pct) ? Math.round(pct * 100) / 100 : 0;
}

/** הכנסות ופעילות לפי שעה (היום) — לגרף */
export async function getRevenueByHourToday(): Promise<
  { name: string; revenue: number; players: number }[]
> {
  if (!pool) return [];
  const [revRes, actRes] = await Promise.all([
    pool.query<{ hour: number; revenue: string }>(
      `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COALESCE(SUM(amount), 0)::text AS revenue
       FROM admin_revenues
       WHERE created_at >= current_date AND created_at < current_date + interval '1 day'
       GROUP BY EXTRACT(HOUR FROM created_at)`
    ),
    pool.query<{ hour: number; players: string }>(
      `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(DISTINCT user_id)::text AS players
       FROM transactions
       WHERE created_at >= current_date AND created_at < current_date + interval '1 day'
       GROUP BY EXTRACT(HOUR FROM created_at)`
    ),
  ]);
  const byHour: Record<number, { revenue: number; players: number }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { revenue: 0, players: 0 };
  for (const row of revRes.rows) {
    byHour[row.hour].revenue = parseFloat(row.revenue) || 0;
  }
  for (const row of actRes.rows) {
    byHour[row.hour].players = parseInt(row.players, 10) || 0;
  }
  return Object.entries(byHour).map(([h, v]) => ({
    name: `${String(h).padStart(2, '0')}:00`,
    revenue: v.revenue,
    players: v.players,
  }));
}

export interface AdminStats {
  ggr: number;
  dau: number;
  churnRate: number;
  aiAlerts: number;
  revenue: number; // alias for ggr (backward compat)
  activePlayers: number; // alias for dau
  revenueByHour: { name: string; revenue: number; players: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const [ggr, dau, churnRate, revenueByHour, alertsCount] = await Promise.all([
    getGGRToday(),
    getDAU(),
    getChurnRate(),
    getRevenueByHourToday(),
    getAIFraudAlertsCount(),
  ]);
  return {
    ggr,
    dau,
    churnRate,
    aiAlerts: alertsCount,
    revenue: ggr,
    activePlayers: dau,
    revenueByHour: revenueByHour.length ? revenueByHour : [
      { name: '08:00', revenue: 0, players: 0 },
      { name: '12:00', revenue: 0, players: 0 },
      { name: '16:00', revenue: 0, players: 0 },
      { name: '20:00', revenue: 0, players: 0 },
    ],
  };
}

export async function getAIFraudAlertsCount(): Promise<number> {
  if (!pool) return 0;
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ai_fraud_alerts WHERE created_at >= current_date - interval '7 days'`
  );
  return parseInt(res.rows[0]?.count ?? '0', 10) || 0;
}

export interface FraudAlertRow {
  id: string;
  userId: string;
  type: string;
  roomId: string | null;
  time: string;
}

export async function getAIFraudAlerts(limit = 50): Promise<FraudAlertRow[]> {
  if (!pool) return [];
  const res = await pool.query<{ id: string; user_id: string; type: string; room_id: string | null; created_at: string }>(
    `SELECT id, user_id, type, room_id, created_at
     FROM ai_fraud_alerts
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    roomId: r.room_id,
    time: new Date(r.created_at).toISOString().slice(11, 16),
  }));
}

export interface AdminUserRow {
  id: string;
  username: string;
  balance: string;
  level: number;
  createdAt: string;
  isBlocked: boolean;
}

export async function searchUsers(q = '', limit = 50): Promise<AdminUserRow[]> {
  if (!pool) return [];
  const term = `%${q}%`;
  try {
    const res = await pool.query<{ id: string; username: string; balance: string; level: number; created_at: string; is_blocked: boolean }>(
      `SELECT id, username, balance::text AS balance, level, created_at, COALESCE(is_blocked, false) AS is_blocked
       FROM users
       WHERE username ILIKE $1 OR id::text ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [term, limit]
    );
    return res.rows.map((r) => ({
      id: r.id,
      username: r.username,
      balance: r.balance,
      level: r.level,
      createdAt: r.created_at,
      isBlocked: r.is_blocked,
    }));
  } catch {
    const res = await pool.query<{ id: string; username: string; balance: string; level: number; created_at: string }>(
      `SELECT id, username, balance::text AS balance, level, created_at
       FROM users
       WHERE username ILIKE $1 OR id::text ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [term, limit]
    );
    return res.rows.map((r) => ({
      id: r.id,
      username: r.username,
      balance: r.balance,
      level: r.level,
      createdAt: r.created_at,
      isBlocked: false,
    }));
  }
}

/** רישום פעולת מנהל — Audit Trail */
export async function logAdminAudit(
  action: string,
  opts: { actorId?: string; targetType?: string; targetId?: string; details?: Record<string, unknown> } = {}
): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [opts.actorId ?? null, action, opts.targetType ?? null, opts.targetId ?? null, opts.details ? JSON.stringify(opts.details) : null]
    );
  } catch {
    // טבלה עדיין לא קיימת (migration 003 לא הורץ)
  }
}

/** חסימת משתמש */
export async function blockUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!pool) return { success: false, error: 'Database not configured' };
  try {
    const res = await pool.query('UPDATE users SET is_blocked = true, updated_at = now() WHERE id = $1 RETURNING id', [userId]);
    if (res.rowCount === 0) return { success: false, error: 'User not found' };
    await logAdminAudit('block_user', { targetType: 'user', targetId: userId });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Block failed' };
  }
}

/** ביטול חסימה */
export async function unblockUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!pool) return { success: false, error: 'Database not configured' };
  try {
    const res = await pool.query('UPDATE users SET is_blocked = false, updated_at = now() WHERE id = $1 RETURNING id', [userId]);
    if (res.rowCount === 0) return { success: false, error: 'User not found' };
    await logAdminAudit('unblock_user', { targetType: 'user', targetId: userId });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unblock failed' };
  }
}

export interface AdminTransactionRow {
  id: string;
  amount: string;
  type: string;
  referenceId: string | null;
  createdAt: string;
}

export async function getUserTransactions(userId: string, limit = 100): Promise<AdminTransactionRow[]> {
  if (!pool) return [];
  const res = await pool.query<{ id: string; amount: string; type: string; reference_id: string | null; created_at: string }>(
    `SELECT id, amount::text AS amount, type, reference_id, created_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return res.rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    type: r.type,
    referenceId: r.reference_id,
    createdAt: r.created_at,
  }));
}
