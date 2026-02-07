import { create } from 'zustand';
import { getApiBase } from '../../config/apiBase';

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? '00000000-0000-0000-0000-000000000001';

interface WalletState {
  balance: string;
  userId: string;
  /** P2P / Game-Fi: Oasis Token + ELO */
  oasisBalance: string;
  eloRating: number;
  setBalance: (balance: string) => void;
  setUserId: (userId: string) => void;
  setOasisBalance: (v: string) => void;
  setEloRating: (v: number) => void;
  fetchBalance: (userId?: string) => Promise<void>;
  /** GET /api/users/:userId/profile — balance, oasis_balance, elo_rating */
  fetchProfile: (userId?: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: '0',
  userId: DEMO_USER_ID,
  oasisBalance: '0',
  eloRating: 1500,
  setBalance: (balance) => set({ balance }),
  setUserId: (userId) => set({ userId }),
  setOasisBalance: (oasisBalance) => set({ oasisBalance }),
  setEloRating: (eloRating) => set({ eloRating }),

  fetchBalance: async (userId?: string) => {
    const uid = userId ?? get().userId;
    if (!uid) {
      set({ balance: '0' });
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/api/users/${uid}/balance`);
      if (res.ok) {
        const data = await res.json();
        set({ balance: data.balance ?? '0' });
      }
    } catch {
      set({ balance: get().balance || '0' });
    }
  },

  fetchProfile: async (userId?: string) => {
    const uid = userId ?? get().userId;
    if (!uid) return;
    try {
      const res = await fetch(`${getApiBase()}/api/users/${uid}/profile`);
      if (res.ok) {
        const data = await res.json();
        set({
          balance: data.balance ?? get().balance,
          oasisBalance: data.oasis_balance ?? '0',
          eloRating: data.elo_rating ?? 1500,
        });
      }
    } catch {
      // keep current
    }
  },
}));
