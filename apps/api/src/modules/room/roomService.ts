import type { GameState } from '@neon-oasis/shared';
import { createInitialBackgammonState } from '@neon-oasis/shared';

const rooms = new Map<string, GameState>();

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
};
