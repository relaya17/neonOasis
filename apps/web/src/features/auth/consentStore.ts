import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CONSENT_KEY = 'neon-oasis-consent';

interface ConsentState {
  termsAccepted: boolean;
  acceptedAt: number | null;
  /** AI Guardian: age verified 18+ (placeholder until face scan) */
  ageVerified: boolean;
  acceptConsent: () => void;
  setAgeVerified: (verified: boolean) => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      termsAccepted: false,
      acceptedAt: null,
      ageVerified: false,
      acceptConsent: () => set({ termsAccepted: true, acceptedAt: Date.now() }),
      setAgeVerified: (verified) => set({ ageVerified: verified }),
    }),
    { name: CONSENT_KEY }
  )
);
