import { create } from 'zustand';
import type { BackgammonState } from '@neon-oasis/shared';
import { createInitialBackgammonState } from '@neon-oasis/shared';

export type LegalTarget = number | 'off';

interface BackgammonStoreState {
  state: BackgammonState;
  isMyTurn: boolean;
  myColor: 0 | 1 | null;
  /** מנקודה אילו גוררים כרגע (null = לא גוררים) */
  draggingFrom: number | 'bar' | null;
  /** יעדים חוקיים לשחרור (אינדקסים 0–23 או 'off') */
  legalMovesForSelected: LegalTarget[];
  setState: (s: BackgammonState | ((prev: BackgammonState) => BackgammonState)) => void;
  setDragging: (from: number | 'bar' | null, targets: LegalTarget[]) => void;
  syncFromServer: (newState: BackgammonState) => void;
  reset: () => void;
}

export const useBackgammonStore = create<BackgammonStoreState>((set) => ({
  state: createInitialBackgammonState(),
  isMyTurn: true,
  myColor: 0,
  draggingFrom: null,
  legalMovesForSelected: [],
  setState: (arg) =>
    set((prev) => ({
      state:
        typeof arg === 'function'
          ? (arg as (prev: BackgammonState) => BackgammonState)(prev.state)
          : arg,
    })),
  setDragging: (from, targets) => set({ draggingFrom: from, legalMovesForSelected: targets }),
  syncFromServer: (newState) => set({ state: newState }),
  reset: () => set({ state: createInitialBackgammonState(), draggingFrom: null, legalMovesForSelected: [] }),
}));