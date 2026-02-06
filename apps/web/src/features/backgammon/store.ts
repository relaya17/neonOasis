import { create } from 'zustand';
import type { BackgammonState } from '@neon-oasis/shared';
import { createInitialBackgammonState } from '@neon-oasis/shared';

interface BackgammonStoreState {
  state: BackgammonState;
  setState: (s: BackgammonState | ((prev: BackgammonState) => BackgammonState)) => void;
  reset: () => void;
}

const initial = createInitialBackgammonState();

export const useBackgammonStore = create<BackgammonStoreState>((set) => ({
  state: initial,
  setState: (arg) =>
    set((prev) => ({
      state: typeof arg === 'function' ? (arg as (prev: BackgammonState) => BackgammonState)(prev.state) : arg,
    })),
  reset: () => set({ state: createInitialBackgammonState() }),
}));
