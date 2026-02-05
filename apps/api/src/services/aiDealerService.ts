import { pool } from '../db';

type DealerVoice = 'yalla' | 'stake';

interface DealerResult {
  message?: string;
  voice?: DealerVoice;
}

const MESSAGE_COOLDOWN_MS = 15000;
const FAST_MOVE_MS = 4500;

function pickMessage(totalRolls: number, doubles: number, fastMoves: number, isDoubles: boolean): DealerResult {
  if (isDoubles) {
    return { message: 'דאבל! ראיתי אותך לוקח סיכונים חכמים. מהלך נועז.', voice: 'stake' };
  }
  if (fastMoves >= 3) {
    return { message: 'קצב אש היום. אתה משחק מהר ובטוח — המשך כך.', voice: 'yalla' };
  }
  if (doubles >= 2) {
    return { message: 'המזל איתך הערב. תמשיך ללחוץ על היתרון.' };
  }
  return { message: 'שומר על קו יציב. תזמון טוב — זה מרגיש מקצועי.' };
}

function hasTruthyFlag(payload: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((k) => Boolean(payload[k]));
}

function analyzeMovePayload(payload: unknown): 'bear_off' | 'from_bar' | 'long_move' | 'hit' | 'blot' | 'block' | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { from?: number | 'bar'; to?: number | 'off'; createdBlot?: boolean; createdBlock?: boolean };
  if (hasTruthyFlag(payload as Record<string, unknown>, ['hit', 'hitBlot', 'captured', 'capture'])) {
    return 'hit';
  }
  if (p.createdBlock) return 'block';
  if (p.createdBlot) return 'blot';
  if (p.to === 'off') return 'bear_off';
  if (p.from === 'bar') return 'from_bar';
  if (typeof p.from === 'number' && typeof p.to === 'number') {
    if (Math.abs(p.to - p.from) >= 6) return 'long_move';
  }
  return null;
}

function pickMoveMessage(
  kind: 'bear_off' | 'from_bar' | 'long_move' | 'hit' | 'blot' | 'block' | null,
  fastMoves: number
): DealerResult {
  if (kind === 'hit') {
    return { message: 'מהלך אגרסיבי ומדויק. תפסת בלוט בזמן.' };
  }
  if (kind === 'block') {
    return { message: 'חסימה יפה. אתה מצמצם את המרחב של היריב.' };
  }
  if (kind === 'blot') {
    return { message: 'שמת בלוט פתוח — זה אמיץ. תשמור על הגב.' };
  }
  if (kind === 'bear_off') {
    return { message: 'אתה סוגר את המשחק כמו מקצוען. זה הלחץ הנכון.' };
  }
  if (kind === 'from_bar') {
    return { message: 'חזרת מהבר בניקיון. מהלך חכם.' };
  }
  if (kind === 'long_move') {
    return { message: 'מהלך ארוך ובטוח. אתה קורא את הלוח טוב.' };
  }
  if (fastMoves >= 3) {
    return { message: 'קצב אש היום. אתה משחק מהר ובטוח — המשך כך.', voice: 'yalla' };
  }
  return { message: 'תזמון טוב. אתה משחק ממוקד ובשליטה.' };
}

export async function logDealerEvent(params: {
  userId: string;
  gameId?: string;
  eventType: 'roll' | 'move';
  dice?: [number, number];
  moveMs?: number;
  actionPayload?: unknown;
}): Promise<DealerResult> {
  if (!pool) return {};
  const client = await pool.connect();
  const now = new Date();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO ai_dealer_events (user_id, game_id, event_type, payload)
       VALUES ($1, $2, $3, $4)`,
      [params.userId, params.gameId ?? null, params.eventType, params]
    );

    const profRes = await client.query<{
      total_rolls: number;
      doubles: number;
      fast_moves: number;
      last_roll_at: string | null;
      last_message_at: string | null;
    }>(
      `SELECT total_rolls, doubles, fast_moves, last_roll_at, last_message_at
       FROM ai_dealer_profiles WHERE user_id = $1 FOR UPDATE`,
      [params.userId]
    );

    let totalRolls = 0;
    let doubles = 0;
    let fastMoves = 0;
    let lastRollAt: Date | null = null;
    let lastMessageAt: Date | null = null;

    if (profRes.rowCount === 0) {
      await client.query(
        `INSERT INTO ai_dealer_profiles (user_id, total_rolls, doubles, fast_moves)
         VALUES ($1, 0, 0, 0)`,
        [params.userId]
      );
    } else {
      const row = profRes.rows[0];
      totalRolls = row.total_rolls;
      doubles = row.doubles;
      fastMoves = row.fast_moves;
      lastRollAt = row.last_roll_at ? new Date(row.last_roll_at) : null;
      lastMessageAt = row.last_message_at ? new Date(row.last_message_at) : null;
    }

    let isDoubles = false;
    if (params.eventType === 'roll' && params.dice) {
      totalRolls += 1;
      if (params.dice[0] === params.dice[1]) {
        doubles += 1;
        isDoubles = true;
      }
      if (lastRollAt && now.getTime() - lastRollAt.getTime() < FAST_MOVE_MS) {
        fastMoves += 1;
      }
      lastRollAt = now;
    }

    if (params.eventType === 'move' && typeof params.moveMs === 'number' && params.moveMs < FAST_MOVE_MS) {
      fastMoves += 1;
    }

    const canSpeak = !lastMessageAt || now.getTime() - lastMessageAt.getTime() > MESSAGE_COOLDOWN_MS;
    let result: DealerResult = {};
    if (canSpeak) {
      if (params.eventType === 'roll') {
        result = pickMessage(totalRolls, doubles, fastMoves, isDoubles);
        lastMessageAt = now;
      }
      if (params.eventType === 'move') {
        const kind = analyzeMovePayload(params.actionPayload);
        result = pickMoveMessage(kind, fastMoves);
        lastMessageAt = now;
      }
    }

    await client.query(
      `UPDATE ai_dealer_profiles
       SET total_rolls = $2, doubles = $3, fast_moves = $4, last_roll_at = $5, last_message_at = $6, updated_at = now()
       WHERE user_id = $1`,
      [
        params.userId,
        totalRolls,
        doubles,
        fastMoves,
        lastRollAt ? lastRollAt.toISOString() : null,
        lastMessageAt ? lastMessageAt.toISOString() : null,
      ]
    );

    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
