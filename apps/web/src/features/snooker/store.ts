import { create } from 'zustand';

export const COLOR_ORDER = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'] as const;
export const COLOR_VALUES: Record<string, number> = {
  yellow: 2,
  green: 3,
  brown: 4,
  blue: 5,
  pink: 6,
  black: 7,
};

export type ColorName = (typeof COLOR_ORDER)[number];

export interface SnookerState {
  redsPotted: number;
  colorsPotted: Record<ColorName, boolean>;
  scores: [number, number];
  turn: 0 | 1;
  /** After potting a red, must pot a color */
  phase: 'red' | 'color';
  /** When phase is color, which color was chosen to pot (for respot) */
  lastColorPotted: ColorName | null;
  winner: -1 | 0 | 1;
}

const initialColors: Record<ColorName, boolean> = {
  yellow: false,
  green: false,
  brown: false,
  blue: false,
  pink: false,
  black: false,
};

function createInitialSnookerState(): SnookerState {
  return {
    redsPotted: 0,
    colorsPotted: { ...initialColors },
    scores: [0, 0],
    turn: 0,
    phase: 'red',
    lastColorPotted: null,
    winner: -1,
  };
}

interface SnookerStoreState {
  state: SnookerState;
  setState: (s: SnookerState | ((prev: SnookerState) => SnookerState)) => void;
  reset: () => void;
  potRed: () => void;
  potColor: (color: ColorName) => void;
  endFrame: () => void;
}

export const useSnookerStore = create<SnookerStoreState>((set) => ({
  state: createInitialSnookerState(),
  setState: (arg) =>
    set((prev) => ({
      state: typeof arg === 'function' ? (arg as (p: SnookerState) => SnookerState)(prev.state) : arg,
    })),
  reset: () => set({ state: createInitialSnookerState() }),

  potRed: () =>
    set((prev) => {
      const s = prev.state;
      if (s.winner !== -1 || s.redsPotted >= 15) return prev;
      return {
        state: {
          ...s,
          redsPotted: s.redsPotted + 1,
          scores: [s.scores[0] + (s.turn === 0 ? 1 : 0), s.scores[1] + (s.turn === 1 ? 1 : 0)],
          phase: 'color',
          lastColorPotted: null,
        },
      };
    }),

  potColor: (color: ColorName) =>
    set((prev) => {
      const s = prev.state;
      if (s.winner !== -1 || s.colorsPotted[color]) return prev;
      const value = COLOR_VALUES[color];
      const newScores: [number, number] = [
        s.scores[0] + (s.turn === 0 ? value : 0),
        s.scores[1] + (s.turn === 1 ? value : 0),
      ];
      const newColors = { ...s.colorsPotted, [color]: true };
      const allColorsPotted = COLOR_ORDER.every((c) => newColors[c]);
      const allRedsPotted = s.redsPotted >= 15;
      const gameOver = allRedsPotted && allColorsPotted;
      const winner: -1 | 0 | 1 = gameOver ? (newScores[0] >= newScores[1] ? 0 : 1) : -1;
      return {
        state: {
          ...s,
          colorsPotted: newColors,
          scores: newScores,
          lastColorPotted: color,
          phase: 'red',
          turn: (s.turn === 0 ? 1 : 0) as 0 | 1,
          winner,
        },
      };
    }),

  endFrame: () =>
    set((prev) => {
      const s = prev.state;
      if (s.phase !== 'color') return prev;
      return {
        state: {
          ...s,
          phase: 'red',
          turn: (s.turn === 0 ? 1 : 0) as 0 | 1,
        },
      };
    }),
}));
