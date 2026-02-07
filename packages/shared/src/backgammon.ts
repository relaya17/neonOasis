/** Backgammon logic — legal moves, hits, bear off, mars. Single source of truth. */

import type { BackgammonState, BackgammonMove, BackgammonMoveWithDie } from './game';

export const BACKGAMMON_POINTS = 24;
export const CHECKERS_PER_PLAYER = 15;

/** Initial board: 24 points, + = player 0, - = player 1. */
export function createInitialBackgammonState(): BackgammonState {
  const board = new Array(BACKGAMMON_POINTS).fill(0);
  // Player 0: 2 on 0, 5 on 5, 3 on 7, 5 on 12 (points 0–11 are "outer" for 0)
  board[0] = 2;
  board[5] = 5;
  board[7] = 3;
  board[12] = 5;
  // Player 1: 2 on 23, 5 on 18, 3 on 16, 5 on 11
  board[23] = -2;
  board[18] = -5;
  board[16] = -3;
  board[11] = -5;
  return {
    kind: 'backgammon',
    board,
    bar: [0, 0],
    off: [0, 0],
    turn: 0,
    dice: null,
    lastMoveAt: 0,
  };
}

/** Direction: player 0 moves toward 23 (increasing), player 1 toward 0 (decreasing). */
export function step(player: 0 | 1, point: number): number {
  return player === 0 ? point + 1 : point - 1;
}

/** Is point index in player's home board (bearing off from there)? Player 0: 18–23, Player 1: 0–5. */
export function isHomeBoard(player: 0 | 1, point: number): boolean {
  return player === 0 ? point >= 18 : point <= 5;
}

/** Can player bear off? All checkers in home board (and none on bar). */
export function canBearOff(state: BackgammonState, player: 0 | 1): boolean {
  if (state.bar[player] > 0) return false;
  const sign = player === 0 ? 1 : -1;
  for (let i = 0; i < BACKGAMMON_POINTS; i++) {
    const v = state.board[i];
    if (sign > 0 && v > 0 && !isHomeBoard(0, i)) return false;
    if (sign < 0 && v < 0 && !isHomeBoard(1, i)) return false;
  }
  return true;
}

/** Is point occupied by opponent (single blot) — can be hit. */
function isBlot(state: BackgammonState, point: number, player: 0 | 1): boolean {
  const v = state.board[point];
  if (player === 0) return v === -1;
  return v === 1;
}

/** Is point blocked for opponent (2+ checkers)? */
function isBlocked(state: BackgammonState, point: number, player: 0 | 1): boolean {
  const v = state.board[point];
  if (player === 0) return v < -1;
  return v > 1;
}

/** Can land on point? (empty, our checkers, or single opponent blot) */
export function isPointAvailable(state: BackgammonState, point: number, player: 0 | 1): boolean {
  return !isBlocked(state, point, player);
}

/** Is this the furthest point with our checker (for bear-off with high die)? Player 0: highest index; Player 1: lowest. */
export function isFurthestPoint(state: BackgammonState, point: number, player: 0 | 1): boolean {
  const board = state.board;
  if (player === 0) {
    for (let i = point + 1; i < BACKGAMMON_POINTS; i++) if (board[i] > 0) return false;
    return board[point] > 0;
  } else {
    for (let i = point - 1; i >= 0; i--) if (board[i] < 0) return false;
    return board[point] < 0;
  }
}

/** All legal moves for current turn (dice already set). Uses dice as two moves or one double move. */
export function getLegalMoves(state: BackgammonState): BackgammonMove[] {
  return getLegalMovesWithDie(state).map(({ from, to }) => ({ from, to }));
}

/**
 * כל המהלכים החוקיים עם מספר הקוביה (die) — ל-UI: הדגשת יעדים, צריכת קוביה.
 * לוגיקה זהה ל-getLegalMoves: Bar, חסימות, bearing off.
 */
export function getLegalMovesWithDie(state: BackgammonState): BackgammonMoveWithDie[] {
  const moves: BackgammonMoveWithDie[] = [];
  if (state.dice === null) return moves;
  const player = state.turn;
  const [a, b] = state.dice;
  const diceValues = a === b ? [a, a, a, a] : [a, b];

  function addMove(from: number | 'bar', to: number | 'off', die: number): void {
    if (isMoveLegal(state, player, from, to)) moves.push({ from, to, die });
  }

  // 1. כלים ב-Bar — חובה להוציא קודם. שחקן 0 נכנס ב-(23-d), שחקן 1 ב-(d-1).
  if (state.bar[player] > 0) {
    const uniqDice = a === b ? [a] : [a, b];
    for (const d of uniqDice) {
      const entry = player === 0 ? 23 - d : d - 1;
      if (entry >= 0 && entry < 24 && !isBlocked(state, entry, player)) addMove('bar', entry, d);
    }
    if (moves.length > 0) return moves;
  }

  // 2. מהלכים רגילים + bearing off
  for (let from = 0; from < BACKGAMMON_POINTS; from++) {
    const count = player === 0 ? state.board[from] : -state.board[from];
    if (count <= 0) continue;
    for (const d of diceValues) {
      let toPoint = from;
      for (let i = 0; i < d; i++) toPoint = step(player, toPoint);
      if (player === 0 && toPoint >= 24) addMove(from, 'off', d);
      else if (player === 1 && toPoint < 0) addMove(from, 'off', d);
      else if (toPoint >= 0 && toPoint < 24) addMove(from, toPoint, d);
    }
  }
  return moves;
}

/** Check if a single move is legal. */
export function isMoveLegal(
  state: BackgammonState,
  player: 0 | 1,
  from: number | 'bar',
  to: number | 'off'
): boolean {
  if (from === 'bar') {
    if (state.bar[player] <= 0) return false;
    if (to === 'off') return false;
    if (to < 0 || to >= BACKGAMMON_POINTS) return false;
    if (isBlocked(state, to, player)) return false;
    const dieUsed = player === 0 ? 23 - (to as number) : (to as number) + 1;
    const [d1, d2] = state.dice!;
    if (dieUsed !== d1 && dieUsed !== d2 && (d1 !== d2 || dieUsed > d1 * 2)) return false;
    return true;
  }
  if (to === 'off') {
    if (!canBearOff(state, player)) return false;
    const dist = player === 0 ? 24 - from : from + 1;
    const [d1, d2] = state.dice!;
    return dist === d1 || dist === d2 || (d1 === d2 && dist <= d1 * 2);
  }
  const count = player === 0 ? state.board[from] : -state.board[from];
  if (count <= 0) return false;
  if (to < 0 || to >= BACKGAMMON_POINTS) return false;
  if (isBlocked(state, to, player)) return false;
  return true;
}

/** Apply one move; returns new state or null if illegal. */
export function applyMove(state: BackgammonState, move: BackgammonMove): BackgammonState | null {
  const player = state.turn;
  if (!isMoveLegal(state, player, move.from, move.to)) return null;

  const board = [...state.board];
  let bar = [...state.bar] as [number, number];
  let off = [...state.off] as [number, number];

  const sign = player === 0 ? 1 : -1;

  if (move.from === 'bar') {
    bar[player]--;
    if (move.to !== 'off') {
      if (isBlot(state, move.to, player)) {
        board[move.to] = 0;
        bar[1 - player]++;
      }
      board[move.to] = (board[move.to] || 0) + sign;
    }
  } else {
    board[move.from] = (board[move.from] || 0) - sign;
    if (move.to === 'off') {
      off[player]++;
    } else {
      if (isBlot(state, move.to, player)) {
        board[move.to] = 0;
        bar[1 - player]++;
      }
      board[move.to] = (board[move.to] || 0) + sign;
    }
  }

  return {
    ...state,
    board,
    bar,
    off,
    lastMoveAt: Date.now(),
  };
}

/** Is the game finished? Winner 0 or 1, or -1 if not finished. */
export function getWinner(state: BackgammonState): 0 | 1 | -1 {
  if (state.off[0] === CHECKERS_PER_PLAYER) return 0;
  if (state.off[1] === CHECKERS_PER_PLAYER) return 1;
  return -1;
}

/** Mars (backgammon): loser has checkers in winner's home or on bar. Double points. */
export function isMars(state: BackgammonState, winner: 0 | 1): boolean {
  const loser = 1 - winner;
  if (state.bar[loser] > 0) return true;
  const homeStart = winner === 0 ? 0 : 18;
  const homeEnd = winner === 0 ? 5 : 23;
  for (let i = homeStart; i <= homeEnd; i++) {
    const v = state.board[i];
    if (winner === 0 && v < 0) return true;
    if (winner === 1 && v > 0) return true;
  }
  return false;
}
