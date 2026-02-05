import { create } from 'zustand';
import type { BackgammonState } from '@neon-oasis/shared';
import { createInitialBackgammonState } from '@neon-oasis/shared';

interface BackgammonStoreState {
  state: BackgammonState;
  setState: (s: BackgammonState) => void;
  reset: () => void;
}

const initial = createInitialBackgammonState();

export const useBackgammonStore = create<BackgammonStoreState>((set) => ({
  state: initial,
  setState: (state) => set({ state }),
  reset: () => set({ state: createInitialBackgammonState() }),
}));
