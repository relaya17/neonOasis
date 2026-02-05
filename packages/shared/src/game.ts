/** Game types — backgammon, snooker, cards, etc. */

export type GameKind = 'backgammon' | 'snooker' | 'cards';

export type GamePhase = 'lobby' | 'playing' | 'finished';

export interface GameRoom {
  id: string;
  kind: GameKind;
  phase: GamePhase;
  players: string[]; // userIds
  state: GameState;
  createdAt: number;
}

/** Snapshot of board state — server is Source of Truth */
export type GameState = BackgammonState | SnookerState | CardsState;

/** 24 points: index 0 = player 1 home, 23 = player 0 home. Value: +N = player 0, -N = player 1. */
export interface BackgammonState {
  kind: 'backgammon';
  /** 24 points; positive = player 0 count, negative = player 1 count */
  board: number[];
  /** Checkers on bar: [player0, player1] */
  bar: [number, number];
  /** Borne off: [player0, player1] */
  off: [number, number];
  turn: 0 | 1;
  dice: [number, number] | null;
  lastMoveAt: number;
}

/** Single move: from point index (or 'bar') to point index (or 'off') */
export interface BackgammonMove {
  from: number | 'bar';
  to: number | 'off';
}

export interface SnookerState {
  kind: 'snooker';
  balls: Record<string, { x: number; y: number }>;
  cueAngle: number;
  turn: number;
  lastShotAt: number;
}

export interface CardsState {
  kind: 'cards';
  hands: Record<string, string[]>;
  table: string[];
  turn: number;
  lastPlayAt: number;
}
