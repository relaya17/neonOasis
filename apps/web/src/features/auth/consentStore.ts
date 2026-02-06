import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CONSENT_KEY = 'neon-oasis-consent';

/** sessionStorage: בכל פתיחת דפדפן/טאב חדש — תקנון + אימות גיל יוצגו מחדש */
const consentStorage = typeof window !== 'undefined' ? window.sessionStorage : undefined;

interface ConsentState {
  termsAccepted: boolean;
  acceptedAt: number | null;
  /** AI Guardian: age verified 18+ (placeholder until face scan) */
  ageVerified: boolean;
  /** וידאו כניסה (all.mp4) הוצג — מעבר לדף הבית */
  introVideoSeen: boolean;
  acceptConsent: () => void;
  setAgeVerified: (verified: boolean) => void;
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
      introVideoSeen: false,
      acceptConsent: () => set({ termsAccepted: true, acceptedAt: Date.now() }),
      setAgeVerified: (verified) => set({ ageVerified: verified }),
      setIntroVideoSeen: (seen) => set({ introVideoSeen: seen }),
      resetConsent: () => set({ termsAccepted: false, acceptedAt: null, ageVerified: false, introVideoSeen: false }),
    }),
    { name: CONSENT_KEY, storage: consentStorage ? { getItem: (n) => consentStorage.getItem(n), setItem: (n, v) => consentStorage.setItem(n, v), removeItem: (n) => consentStorage.removeItem(n) } : undefined }
  )
);
