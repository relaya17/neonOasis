import { create } from 'zustand';

interface ApiStatusState {
  online: boolean | null;
  lastChecked: number | null;
  setOnline: (online: boolean) => void;
}

export const useApiStatusStore = create<ApiStatusState>((set) => ({
  online: null,
  lastChecked: null,
  setOnline: (online) => set({ online, lastChecked: Date.now() }),
}));
