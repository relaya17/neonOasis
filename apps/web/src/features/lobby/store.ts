import { create } from 'zustand';

interface MatchmakingState {
  searching: boolean;
  setSearching: (v: boolean) => void;
}

export const useMatchmakingStore = create<MatchmakingState>((set) => ({
  searching: false,
  setSearching: (searching) => set({ searching }),
}));
