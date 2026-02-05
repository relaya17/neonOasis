import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUTH_KEY = 'neon-oasis-auth';

interface AuthState {
  userId: string | null;
  username: string | null;
  isAdmin: boolean;
  setUser: (userId: string, username: string, isAdmin?: boolean) => void;
  logout: () => void;
}

export const useSessionStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      isAdmin: false,
      setUser: (userId, username, isAdmin = false) => set({ userId, username, isAdmin }),
      logout: () => set({ userId: null, username: null, isAdmin: false }),
    }),
    { name: AUTH_KEY }
  )
);
