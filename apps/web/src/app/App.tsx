import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Typography } from '@mui/material';
import { useWalletStore } from '../features/store';
import { getTheme } from './theme';
import { cacheLtr, cacheRtl } from './RtlCache';
import { VegasFeed, LiveMatchFeed } from '../features/feed';
import { LandingPage } from '../features/landing';
import { StoreView } from '../features/store';
import { BoardContainer } from '../features/backgammon';
import { SnookerGame } from '../features/snooker';
import { TouchCardGame, RummyLiveTable, SimplePoker, PokerTable } from '../features/cards';
import { AdminDashboard, AdminGuard } from '../features/admin';
import { ProfileView } from '../features/profile';
import { LeaderboardView } from '../features/leaderboard';
import { TournamentListView, TournamentDetailView } from '../features/tournament';
import { LobbyView } from '../features/lobby';
import { SyncProvider } from '../features/sync';
import { ConsentGate, GuardianGate, CoinsInfoGate, IntroVideoGate, OnboardingGate, TermsPage, PrivacyPage, ResponsibleGamingPage, useSessionStore, LoginView } from '../features/auth';
import { getPendingReferralInviterId } from '../features/auth/referralRef';
import { Layout, SplashScreen } from '../components';
import { useTranslation } from 'react-i18next';
import { RTL_LANGS } from '../i18n';
import { preloadSounds, playVoice } from '../shared/audio';
import { useApiStatus } from '../shared/hooks';
import { useApiStatusStore } from '../shared/store/apiStatus';
import { socketService } from '../api/socketService';

/* ─── Error Boundary ───────────────────────────────────────────────── */

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: '#ff4d9a' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Something went wrong</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {this.state.error?.message}
          </Typography>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            style={{ padding: '8px 24px', background: '#00e5ff', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Full-height lookup for routes ────────────────────────────────── */
const FULL_HEIGHT_PATHS = new Set([
  '/', '/feed', '/backgammon', '/snooker', '/cards', '/touch', '/poker', '/rummy-live', '/lobby',
]);

export function App() {
  const { i18n } = useTranslation('common');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const sessionUserId = useSessionStore((s) => s.userId);
  const setUserId = useWalletStore((s) => s.setUserId);
  const fetchBalance = useWalletStore((s) => s.fetchBalance);
  const fetchProfile = useWalletStore((s) => s.fetchProfile);
  const _fullHeight = FULL_HEIGHT_PATHS.has(location.pathname);
  const isRtl = RTL_LANGS.includes(i18n.language);
  const muiTheme = getTheme(isRtl ? 'rtl' : 'ltr');

  useApiStatus();

  // רענון/סגירת דף: ב-beforeunload רק sendBeacon (בלי ניתוק Socket) כדי לא לחסום יציאה
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:4000` : '');
    const sendDisconnectBeacon = () => {
      const userId = useSessionStore.getState().userId;
      if (userId && apiUrl && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(
            `${apiUrl}/api/socket/disconnect`,
            new Blob([JSON.stringify({ userId })], { type: 'application/json' })
          );
        } catch (_) {}
      }
    };
    const disconnectOnLeave = () => {
      sendDisconnectBeacon();
      socketService.disconnect();
    };
    const onBeforeUnload = () => {
      sendDisconnectBeacon();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') disconnectOnLeave();
    };
    window.addEventListener('pagehide', disconnectOnLeave);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', disconnectOnLeave);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Unlock audio only after first user interaction (browser policy — no AudioContext before gesture)
  useEffect(() => {
    const unlock = async () => {
      try {
        await preloadSounds();
        const Howler = (window as unknown as { Howler?: { ctx?: AudioContext } }).Howler;
        if (Howler?.ctx?.state === 'suspended') await Howler.ctx.resume();
        const hasPlayedWelcome = sessionStorage.getItem('audio_welcome_played');
        if (!hasPlayedWelcome) {
          playVoice('welcome');
          sessionStorage.setItem('audio_welcome_played', 'true');
        }
      } catch {
        // ignore
      }
    };
    const run = () => { unlock(); };
    document.addEventListener('click', run, { once: true });
    document.addEventListener('touchstart', run, { once: true });
    return () => {
      document.removeEventListener('click', run);
      document.removeEventListener('touchstart', run);
    };
  }, []);

  useEffect(() => {
    const main = setTimeout(() => setIsLoading(false), 1500);
    const safety = setTimeout(() => setIsLoading(false), 3000);
    return () => {
      clearTimeout(main);
      clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    getPendingReferralInviterId();
  }, []);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRtl, i18n.language]);

  const apiOnline = useApiStatusStore((s) => s.online);
  useEffect(() => {
    if (!sessionUserId) return;
    setUserId(sessionUserId);
    if (apiOnline === true) {
      fetchBalance(sessionUserId);
      fetchProfile(sessionUserId);
    }
  }, [sessionUserId, setUserId, fetchBalance, fetchProfile, apiOnline]);

  if (isLoading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <SplashScreen onContinue={() => setIsLoading(false)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
        <CssBaseline />
        <ErrorBoundary>
        <ConsentGate>
        <GuardianGate>
        <CoinsInfoGate>
        <IntroVideoGate>
        <OnboardingGate>
        <SyncProvider>
          <Routes>
            {/* Landing page without Layout */}
            <Route path="/" element={<LandingPage />} />

            {/* All other pages with Layout */}
            <Route path="/feed" element={<Layout><VegasFeed /></Layout>} />
            <Route path="/feed/:gameType" element={<Layout><LiveMatchFeed /></Layout>} />
            <Route path="/backgammon" element={<Layout><BoardContainer tableId="main" /></Layout>} />
            <Route path="/snooker" element={<Layout><SnookerGame /></Layout>} />
            <Route path="/cards" element={<Layout><TouchCardGame /></Layout>} />
            <Route path="/touch" element={<Layout><TouchCardGame /></Layout>} />
            <Route path="/poker" element={<Layout><PokerTable /></Layout>} />
            <Route path="/rummy-live" element={<Layout><RummyLiveTable /></Layout>} />
            <Route path="/lobby" element={<Layout><LobbyView /></Layout>} />
            <Route path="/store" element={<Layout><StoreView /></Layout>} />
            <Route path="/profile" element={<Layout><ProfileView /></Layout>} />
            <Route path="/leaderboard" element={<Layout><LeaderboardView /></Layout>} />
            <Route path="/tournaments" element={<Layout><TournamentListView /></Layout>} />
            <Route path="/tournaments/:id" element={<Layout><TournamentDetailView /></Layout>} />
            <Route path="/admin" element={<Layout><AdminGuard><AdminDashboard /></AdminGuard></Layout>} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/responsible-gaming" element={<ResponsibleGamingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SyncProvider>
        </OnboardingGate>
        </IntroVideoGate>
        </CoinsInfoGate>
        </GuardianGate>
        </ConsentGate>
        </ErrorBoundary>
      </CacheProvider>
    </ThemeProvider>
  );
}
