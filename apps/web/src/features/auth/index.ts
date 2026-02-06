// Auth feature — registration, age verification (AI Guardian entry)
export { AuthGuard } from './AuthGuard';
export { ConsentGate } from './ConsentGate';
export { GuardianGate } from './AgeVerification';
export { IntroVideoGate } from './IntroVideoGate';
export { TermsPage } from './TermsPage';
export { PrivacyPage } from './PrivacyPage';
export { ResponsibleGamingPage } from './ResponsibleGamingPage';
export { useAuthStore } from './store';
export { useSessionStore } from './authStore';
export { useConsentStore } from './consentStore';
export { performFullLogout } from './performFullLogout';
export { LoginView } from './LoginView';
