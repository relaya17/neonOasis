import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';

export const CONSENT_KEY = 'neon-oasis-consent';

/** sessionStorage: בכל פתיחת דפדפן/טאב חדש — תקנון + אימות גיל יוצגו מחדש */
const consentStorage: PersistStorage<ConsentState> | undefined =
  typeof window !== 'undefined'
    ? {
        getItem: (n) => {
          try {
            const s = sessionStorage.getItem(n);
            return s ? (JSON.parse(s) as StorageValue<ConsentState>) : null;
          } catch {
            return null;
          }
        },
        setItem: (n, v) => { sessionStorage.setItem(n, typeof v === 'string' ? v : JSON.stringify(v)); },
        removeItem: (n) => { sessionStorage.removeItem(n); },
      }
    : undefined;

interface ConsentState {
  termsAccepted: boolean;
  acceptedAt: number | null;
  /** AI Guardian: age verified 18+ (placeholder until face scan) */
  ageVerified: boolean;
  /** הסבר מטבעות וארנק הוצג — קובץ אחרי אזהרת גיל */
  coinsInfoSeen: boolean;
  /** וידאו כניסה (all.mp4) הוצג — מעבר לדף הבית */
  introVideoSeen: boolean;
  acceptConsent: () => void;
  setAgeVerified: (verified: boolean) => void;
  setCoinsInfoSeen: (seen: boolean) => void;
  setIntroVideoSeen: (seen: boolean) => void;
  /** איפוס אחרי יציאה — כדי שהשערים יוצגו שוב בכניסה הבאה */
  resetConsent: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      termsAccepted: false,
      acceptedAt: null,
      ageVerified: false,
      coinsInfoSeen: false,
      introVideoSeen: false,
      acceptConsent: () => set({ termsAccepted: true, acceptedAt: Date.now() }),
      setAgeVerified: (verified) => set({ ageVerified: verified }),
      setCoinsInfoSeen: (seen) => set({ coinsInfoSeen: seen }),
      setIntroVideoSeen: (seen) => set({ introVideoSeen: seen }),
      resetConsent: () => set({ termsAccepted: false, acceptedAt: null, ageVerified: false, coinsInfoSeen: false, introVideoSeen: false }),
    }),
    { name: CONSENT_KEY, storage: consentStorage }
  )
);
