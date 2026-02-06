/**
 * יציאה מלאה: התנתקות מהמערכת והתחלה מחדש.
 * מאפס סשן, consent (תקנון/וידאו כניסה) וארנק, ואז טוען את דף הבית מחדש.
 */
import { useSessionStore } from './authStore';
import { useConsentStore } from './consentStore';
import { useWalletStore } from '../store';

export function performFullLogout(): void {
  useConsentStore.getState().resetConsent();
  useSessionStore.getState().logout();
  const wallet = useWalletStore.getState();
  wallet.setUserId('');
  wallet.setBalance('0');
  wallet.setOasisBalance('0');
  wallet.setEloRating(1500);
  window.location.href = '/';
}
