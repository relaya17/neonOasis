import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useWalletStore } from '../features/store';
import { getTheme } from './theme';
import { cacheLtr, cacheRtl } from './RtlCache';
import { VegasFeed } from '../features/feed';
import { LandingPage } from '../features/landing';
import { StoreView } from '../features/store';
import { BoardContainer } from '../features/backgammon';
import { SnookerGame } from '../features/snooker';
import { TouchCardGame, SimplePoker, PokerTable } from '../features/cards';
import { AdminDashboard, AdminGuard } from '../features/admin';
import { ProfileView } from '../features/profile';
import { LeaderboardView } from '../features/leaderboard';
import { TournamentListView, TournamentDetailView } from '../features/tournament';
import { SyncProvider } from '../features/sync';
import { ConsentGate, GuardianGate, IntroVideoGate, TermsPage, PrivacyPage, ResponsibleGamingPage, useSessionStore, LoginView } from '../features/auth';
import { getPendingReferralInviterId } from '../features/auth/referralRef';
import { Layout, SplashScreen } from '../components';
import { useTranslation } from 'react-i18next';
import { RTL_LANGS } from '../i18n';
import { preloadSounds, playVoice } from '../shared/audio';
import { useApiStatus } from '../shared/hooks';

const routes = [
  { path: '/', element: <LandingPage />, fullHeight: true },
  { path: '/feed', element: <VegasFeed />, fullHeight: true },
  { path: '/backgammon', element: <BoardContainer tableId="main" />, fullHeight: true },
  { path: '/snooker', element: <SnookerGame />, fullHeight: true },
  { path: '/cards', element: <TouchCardGame />, fullHeight: true },
  { path: '/touch', element: <TouchCardGame />, fullHeight: true },
  { path: '/store', element: <StoreView />, fullHeight: false },
  { path: '/profile', element: <ProfileView />, fullHeight: false },
  { path: '/leaderboard', element: <LeaderboardView />, fullHeight: false },
  { path: '/tournaments', element: <TournamentListView />, fullHeight: false },
  { path: '/tournaments/:id', element: <TournamentDetailView />, fullHeight: false },
  { path: '/admin', element: <AdminGuard><AdminDashboard /></AdminGuard>, fullHeight: false },
];

export function App() {
  const { i18n } = useTranslation('common');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const sessionUserId = useSessionStore((s) => s.userId);
  const setUserId = useWalletStore((s) => s.setUserId);
  const fetchBalance = useWalletStore((s) => s.fetchBalance);
  const fetchProfile = useWalletStore((s) => s.fetchProfile);
  const fullHeight = routes.find((r) => r.path === location.pathname)?.fullHeight ?? false;
  const isRtl = RTL_LANGS.includes(i18n.language);
  const muiTheme = getTheme(isRtl ? 'rtl' : 'ltr');

  useApiStatus();

  useEffect(() => {
    const main = setTimeout(() => {
      setIsLoading(false);
      try {
        preloadSounds(); // AudioContext ready for playSound (user gesture may be required on first play)
        // Welcome voice (only on first visit)
        const hasPlayedWelcome = sessionStorage.getItem('audio_welcome_played');
        if (!hasPlayedWelcome) {
          setTimeout(() => {
            playVoice('welcome');
            sessionStorage.setItem('audio_welcome_played', 'true');
          }, 500);
        }
      } catch {
        // ignore
      }
    }, 1500);
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

  useEffect(() => {
    if (sessionUserId) {
      setUserId(sessionUserId);
      fetchBalance(sessionUserId);
      fetchProfile(sessionUserId);
    }
  }, [sessionUserId, setUserId, fetchBalance, fetchProfile]);

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
        <ConsentGate>
        <GuardianGate>
        <IntroVideoGate>
        <SyncProvider>
          <Routes>
            {/* Landing page without Layout */}
            <Route path="/" element={<LandingPage />} />
            
            {/* All other pages with Layout */}
            <Route path="/feed" element={<Layout><VegasFeed /></Layout>} />
            <Route path="/backgammon" element={<Layout><BoardContainer tableId="main" /></Layout>} />
            <Route path="/snooker" element={<Layout><SnookerGame /></Layout>} />
            <Route path="/cards" element={<Layout><TouchCardGame /></Layout>} />
            <Route path="/touch" element={<Layout><TouchCardGame /></Layout>} />
            <Route path="/poker" element={<Layout><PokerTable /></Layout>} />
            <Route path="/store" element={<Layout><StoreView /></Layout>} />
            <Route path="/profile" element={<Layout><ProfileView /></Layout>} />
            <Route path="/leaderboard" element={<Layout><LeaderboardView /></Layout>} />
            <Route path="/tournaments" element={<Layout><TournamentListView /></Layout>} />
            <Route path="/tournaments/:id" element={<Layout><TournamentDetailView /></Layout>} />
            <Route path="/admin" element={<Layout><AdminGuard><AdminDashboard /></AdminGuard></Layout>} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/responsible-gaming" element={<ResponsibleGamingPage />} />
          </Routes>
        </SyncProvider>
        </IntroVideoGate>
        </GuardianGate>
      </ConsentGate>
      </CacheProvider>
    </ThemeProvider>
  );
}
