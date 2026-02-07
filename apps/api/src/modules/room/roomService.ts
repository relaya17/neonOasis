import type { GameState, BackgammonState, BackgammonMove } from '@neon-oasis/shared';
import { createInitialBackgammonState, applyMove as sharedApplyMove, getWinner, getLegalMoves } from '@neon-oasis/shared';

const rooms = new Map<string, GameState>();
/** tableId -> [player0UserId, player1UserId] for backgammon TABLE_UPDATE / GAME_OVER */
const tablePlayers = new Map<string, [string | undefined, string | undefined]>();

function createInitialState(kind: 'backgammon' | 'snooker' | 'cards'): GameState {
  if (kind === 'backgammon') {
    return { ...createInitialBackgammonState(), lastMoveAt: Date.now() };
  }
  if (kind === 'snooker') {
    return {
      kind: 'snooker',
      balls: {},
      cueAngle: 0,
      turn: 0,
      lastShotAt: Date.now(),
    };
  }
  return {
    kind: 'cards',
    hands: {},
    table: [],
    turn: 0,
    lastPlayAt: Date.now(),
  };
}

export const roomService = {
  getState(roomId: string): GameState | undefined {
    return rooms.get(roomId);
  },

  getOrCreate(roomId: string, kind: 'backgammon' | 'snooker' | 'cards'): GameState {
    let state = rooms.get(roomId);
    if (!state) {
      state = createInitialState(kind);
      rooms.set(roomId, state);
    }
    return state;
  },

  applyAction(roomId: string, _action: unknown): boolean {
    const state = rooms.get(roomId);
    if (!state) return false;
    // TODO: validate & apply move; for MVP just accept
    return true;
  },

  /**
   * Apply a backgammon move; returns new state + lastAction 'HIT' if a checker was hit.
   * Caller should persist state and emit TABLE_UPDATE.
   */
  applyBackgammonMove(
    roomId: string,
    move: BackgammonMove
  ): { ok: true; newState: BackgammonState; lastAction?: 'HIT' } | { ok: false } {
    const state = rooms.get(roomId) as BackgammonState | undefined;
    if (!state?.kind || state.kind !== 'backgammon') return { ok: false };
    const opponent = 1 - state.turn;
    const barBefore = state.bar[opponent];
    let newState = sharedApplyMove(state, move);
    if (!newState) return { ok: false };
    const barAfter = newState.bar[opponent];
    const wasHit = barAfter > barBefore;
    const stillHasMoves = getLegalMoves(newState).length > 0;
    if (!stillHasMoves) {
      newState = { ...newState, turn: (newState.turn === 0 ? 1 : 0) as 0 | 1, dice: null, lastMoveAt: Date.now() };
    } else {
      newState = { ...newState, lastMoveAt: Date.now() };
    }
    rooms.set(roomId, newState);
    return {
      ok: true,
      newState,
      ...(wasHit && { lastAction: 'HIT' as const }),
    };
  },

  /** Assign userId to next free seat (0 or 1); returns player index or null if full. */
  ensureTablePlayer(roomId: string, userId: string): 0 | 1 | null {
    let pair = tablePlayers.get(roomId);
    if (!pair) {
      pair = [undefined, undefined];
      tablePlayers.set(roomId, pair);
    }
    if (pair[0] === userId) return 0;
    if (pair[1] === userId) return 1;
    if (pair[0] == null) {
      pair[0] = userId;
      return 0;
    }
    if (pair[1] == null) {
      pair[1] = userId;
      return 1;
    }
    return null;
  },

  getTablePlayerIndex(roomId: string, userId: string): 0 | 1 | null {
    const pair = tablePlayers.get(roomId);
    if (!pair) return null;
    if (pair[0] === userId) return 0;
    if (pair[1] === userId) return 1;
    return null;
  },

  getTableWinnerId(roomId: string, winner: 0 | 1): string | null {
    const pair = tablePlayers.get(roomId);
    if (!pair) return null;
    return pair[winner] ?? null;
  },
};
