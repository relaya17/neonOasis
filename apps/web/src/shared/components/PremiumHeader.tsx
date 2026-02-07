/**
 * Header יוקרתי — אמינות ועושר (World Class 10/10).
 * לוגו Orbitron, מאזן מטבעות בזהב, התחבר/התנתק, אווטר משתמש.
 */

import { Box, Typography, Avatar, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWalletStore } from '../../features/store';
import { useSessionStore } from '../../features/auth';
import { performFullLogout } from '../../features/auth/performFullLogout';
import { playSound } from '../audio';

interface PremiumHeaderProps {
  rightSlot?: React.ReactNode;
}

export function PremiumHeader({ rightSlot }: PremiumHeaderProps) {
  const { t } = useTranslation('common');
  const balance = useWalletStore((s) => s.balance);
  const userId = useSessionStore((s) => s.userId);
  const username = useSessionStore((s) => s.username);

  const handleLogout = () => {
    playSound('neon_click');
    performFullLogout();
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.25rem' },
          color: '#00f2ea',
          textShadow: '0 0 20px rgba(0,242,234,0.4)',
        }}
      >
        NEON OASIS
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {!userId ? (
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#00f2ea',
              color: '#00f2ea',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              '&:hover': { borderColor: '#00f2ea', bgcolor: 'rgba(0,242,234,0.1)' },
            }}
            aria-label={t('login', 'Login')}
          >
            {t('login', 'התחבר')}
          </Button>
        ) : (
          <Button
            onClick={handleLogout}
            variant="outlined"
            size="small"
            sx={{
              borderColor: 'rgba(255,255,255,0.4)',
              color: '#aaa',
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#f72585', color: '#f72585' },
            }}
            aria-label={t('logout', 'Log out')}
          >
            {t('logout', 'התנתק')}
          </Button>
        )}
        {rightSlot}
        <Box
          sx={{
            bgcolor: '#1a1a1a',
            px: 2,
            py: 0.5,
            borderRadius: '20px',
            border: '1px solid #ffd700',
            boxShadow: '0 0 12px rgba(255,215,0,0.2)',
          }}
        >
          <Typography sx={{ color: '#ffd700', fontSize: '14px', fontWeight: 'bold' }}>
            {Number(balance).toLocaleString()} 🪙
          </Typography>
        </Box>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            border: '2px solid #00f2ea',
            bgcolor: '#1a1a1a',
            color: '#00f2ea',
            fontSize: '0.9rem',
          }}
          src={undefined}
        >
          {(username ?? userId ?? '?').toString().charAt(0).toUpperCase()}
        </Avatar>
      </Box>
    </Box>
  );
}
