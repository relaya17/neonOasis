import { create } from 'zustand';
import type { GameState } from '@neon-oasis/shared';

interface GameStoreState {
  roomId: string | null;
  state: GameState | null;
  /** Predictive UI — pending move until server confirms */
  pendingActionId: string | null;
  setRoom: (roomId: string | null, state: GameState | null) => void;
  setState: (state: GameState | null) => void;
  setPendingAction: (id: string | null) => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  roomId: null,
  state: null,
  pendingActionId: null,
  setRoom: (roomId, state) => set({ roomId, state }),
  setState: (state) => set({ state }),
  setPendingAction: (pendingActionId) => set({ pendingActionId }),
}));
