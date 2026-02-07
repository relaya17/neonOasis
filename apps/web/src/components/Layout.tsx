import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Home, Store, Leaderboard, Person } from '@mui/icons-material';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWalletStore } from '../features/store';
import { hapticClick } from '../shared/hooks/useHaptic';
import { playSound } from '../shared/audio';
import { AppFooter } from '../app/AppFooter';
import { useApiStatusStore } from '../shared/store/apiStatus';
import { AudioSettingsButton } from '../shared/components/AudioSettings';
import { LiveSidebar } from '../shared/components/LiveSidebar';
import { PremiumHeader } from '../shared/components/PremiumHeader';

const onNavClick = () => {
  playSound('click');
  hapticClick();
};

const bottomNavPaths = ['/', '/store', '/leaderboard', '/profile'] as const;
const liveSidebarRoutes = ['/snooker', '/backgammon', '/poker'] as const;

// Navigation labels
const NAV_LABELS = {
  home: 'בית',
  store: 'חנות', 
  leaderboard: 'דירוג',
  profile: 'פרופיל',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation('common');
  const apiOnline = useApiStatusStore((s) => s.online);
  const balance = useWalletStore((s) => s.balance);
  const oasisBalance = useWalletStore((s) => s.oasisBalance);
  const eloRating = useWalletStore((s) => s.eloRating);
  const location = useLocation();
  const currentIndex = bottomNavPaths.indexOf(
    location.pathname as (typeof bottomNavPaths)[number]
  );
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const showLiveSidebar =
    liveSidebarRoutes.includes(location.pathname as (typeof liveSidebarRoutes)[number]) && !isSmall;

  return (
    <Box sx={{ pb: 7 }}>
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 9999,
          padding: '12px 24px',
          background: '#00ffff',
          color: '#0a0a0f',
          fontWeight: 'bold',
          borderRadius: 8,
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '12px';
          e.currentTarget.style.top = '12px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.top = 'auto';
        }}
      >
        דלג לתוכן הראשי
      </a>
      {apiOnline === false && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            bgcolor: 'rgba(255, 0, 85, 0.12)',
            borderBottom: '1px solid rgba(255, 0, 85, 0.3)',
            color: '#ff4d9a',
            textAlign: 'center',
            fontSize: '0.85rem',
            py: 0.5,
          }}
        >
          ה־API לא זמין כרגע. הרץ/י `pnpm run dev` כדי להפעיל את השרת.
        </Box>
      )}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
        role="banner"
        aria-label="App header"
      >
        <Toolbar sx={{ minHeight: { xs: 48, sm: 56 }, px: 0 }}>
          <PremiumHeader rightSlot={<AudioSettingsButton />} />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {showLiveSidebar && <LiveSidebar />}
        <Box component="main" id="main-content" tabIndex={-1} sx={{ flex: 1, minWidth: 0 }}>
          {children}
        </Box>
      </Box>

      <AppFooter />

      <BottomNavigation
        showLabels
        value={activeIndex}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#16161a',
          borderTop: '1px solid #333',
          '& .MuiBottomNavigationAction-root': { color: '#fff' },
          '& .Mui-selected': { color: '#00ffff' },
        }}
        role="navigation"
        aria-label="Main bottom navigation"
      >
        <BottomNavigationAction
          label="בית"
          icon={<Home />}
          component={NavLink}
          to="/"
          onClick={onNavClick}
          sx={{ color: '#fff' }}
          aria-label="Home - Game Selection"
        />
        <BottomNavigationAction
          label={t('nav.shop')}
          icon={<Store />}
          component={NavLink}
          to="/store"
          onClick={onNavClick}
          sx={{ color: '#fff' }}
          aria-label={t('nav.shop')}
        />
        <BottomNavigationAction
          label={t('nav.rank')}
          icon={<Leaderboard />}
          component={NavLink}
          to="/leaderboard"
          onClick={onNavClick}
          sx={{ color: '#fff' }}
          aria-label={t('nav.rank')}
        />
        <BottomNavigationAction
          label={t('nav.me')}
          icon={<Person />}
          component={NavLink}
          to="/profile"
          onClick={onNavClick}
          sx={{ color: '#fff' }}
          aria-label={t('nav.me')}
        />
      </BottomNavigation>
    </Box>
  );
}
