import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString })
  : null;

export async function query<T = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  if (!pool) throw new Error('DATABASE_URL not set');
  return pool.query<T>(text, params);
}

/** האם DB מוגדר — אם לא, auth עובד במצב דמו (אורח מקומי) */
export function hasDb(): boolean {
  return pool != null;
}

// Export pool as 'db' for backward compatibility
export const db = pool;
