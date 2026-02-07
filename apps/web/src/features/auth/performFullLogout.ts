/**
 * יציאה מלאה: התנתקות מהמערכת והתחלה מחדש.
 * מאפס סשן, consent (תקנון/וידאו כניסה) וארנק. מוחק את consent מ-sessionStorage
 * כדי שבחזרה יוצגו שוב תנאי שימוש ואזהרות.
 */
import { useSessionStore } from './authStore';
import { useConsentStore, CONSENT_KEY } from './consentStore';
import { useWalletStore } from '../store';

export function performFullLogout(): void {
  useConsentStore.getState().resetConsent();
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.removeItem(CONSENT_KEY);
  }
  useSessionStore.getState().logout();
  const wallet = useWalletStore.getState();
  wallet.setUserId('');
  wallet.setBalance('0');
  wallet.setOasisBalance('0');
  wallet.setEloRating(1500);
  window.location.href = '/';
}
