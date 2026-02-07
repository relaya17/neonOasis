import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const AUTH_KEY = 'neon-oasis-auth';

/** sessionStorage: סשן נשמר רק בטאב הנוכחי — בסגירת הטאב/דפדפן ההתחברות מתאפסת */
const sessionStorage =
  typeof window !== 'undefined' ? window.sessionStorage : undefined;

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
    {
      name: AUTH_KEY,
      storage: sessionStorage
        ? createJSONStorage<AuthState>(() => sessionStorage)
        : undefined,
    }
  )
);
