import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  BottomNavigation,
  BottomNavigationAction,
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

const onNavClick = () => {
  playSound('click');
  hapticClick();
};

const bottomNavPaths = ['/', '/store', '/leaderboard', '/profile'] as const;

// Navigation labels
const NAV_LABELS = {
  home: 'בית',
  store: 'חנות', 
  leaderboard: 'דירוג',
  profile: 'פרופיל',
};

export function Layout({ children }: { children: React.ReactNode }) {
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

  return (
    <Box sx={{ pb: 7 }}>
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
          bgcolor: 'rgba(22, 22, 26, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
        role="banner"
        aria-label="App header"
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            component="span"
            sx={{ color: '#00ffff', fontWeight: 'bold' }}
          >
            NEON OASIS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AudioSettingsButton />
            <Box
              data-wallet-chip
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              bgcolor: '#333',
              px: 2,
              py: 0.5,
              borderRadius: 5,
              border: '1px solid #ff00ff',
              boxShadow: '0 0 12px rgba(255,0,255,0.3)',
              transition: 'transform 0.1s ease-out',
            }}
            aria-label={`${Number(balance).toLocaleString()} ${t('balance')}, ${Number(oasisBalance).toLocaleString()} Oasis, ELO ${eloRating}`}
          >
            <Typography component="span" sx={{ color: '#ff00ff', fontSize: '0.875rem' }}>
              💎 {Number(balance).toLocaleString()}
            </Typography>
            <Typography component="span" sx={{ color: '#00ffff', fontSize: '0.75rem' }}>
              ◉ {Number(oasisBalance).toLocaleString()}
            </Typography>
            <Typography component="span" sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
              ELO {eloRating}
            </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <main>{children}</main>

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
