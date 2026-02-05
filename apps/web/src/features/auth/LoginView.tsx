import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, type SxProps, type Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from './authStore';
import { useWalletStore } from '../store';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { claimReferralIfPending } from './referralRef';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export function LoginView() {
  const { t } = useTranslation('common');
  const apiOnline = useApiStatusStore((s) => s.online);
  const setUser = useSessionStore((s) => s.setUser);
  const setUserId = useWalletStore((s) => s.setUserId);
  const fetchBalance = useWalletStore((s) => s.fetchBalance);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const base = API_URL || '';

  const handleGuest = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${base || '/'}/api/auth/guest`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.userId) {
        setUser(data.userId, data.username ?? 'Guest', !!data.is_admin);
        setUserId(data.userId);
        await fetchBalance(data.userId);
        setStatus('idle');
        return;
      }
    } catch {
      // fall through to local guest
    }
    // Fallback: enter as guest locally when API is down (500 / connection refused)
    const guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    setUser(guestId, 'Guest', false);
    setUserId(guestId);
    useWalletStore.getState().setBalance('0');
    setStatus('idle');
    setErrorMsg(''); // clear so we don't show "Network error" — offline is OK
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.userId) {
        setUser(data.userId, data.username ?? username.trim(), !!data.is_admin);
        setUserId(data.userId);
        await fetchBalance(data.userId);
        await claimReferralIfPending(data.userId);
        setStatus('idle');
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Failed');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error');
    }
  };

  // Cast via unknown to avoid TS "union type too complex" on MUI sx
  const boxSx = {
    position: 'fixed',
    inset: 0,
    bgcolor: '#0a0a0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    p: 2,
  } as unknown as SxProps<Theme>;
  const paperSx = {
    maxWidth: 400,
    width: '100%',
    p: 3,
    bgcolor: '#16161a',
    border: '1px solid',
    borderColor: 'primary.main',
    boxShadow: '0 0 30px rgba(0,255,255,0.15)',
  } as unknown as SxProps<Theme>;

  const content: React.ReactElement = (
    // @ts-ignore MUI Box sx union type too complex for TS to represent
    <Box sx={boxSx}>
      <Paper sx={paperSx}>
        <Typography variant="h5" sx={{ color: 'primary.main', mb: 2, textAlign: 'center' } as unknown as SxProps<Theme>}>
          NEON OASIS
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, textAlign: 'center' } as unknown as SxProps<Theme>}>
          {t('loginSubtitle', 'Enter or continue as guest')}
        </Typography>

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('username', 'Username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 } as unknown as SxProps<Theme>}
            inputProps={{ 'aria-label': t('username', 'Username') }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={status === 'loading'}
            sx={{ mb: 1, bgcolor: 'primary.main', color: '#000' } as unknown as SxProps<Theme>}
            aria-label={t('login', 'Login')}
          >
            {status === 'loading' ? t('loading', 'Loading...') : t('login', 'Login')}
          </Button>
        </form>

        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', my: 1 } as unknown as SxProps<Theme>}>
          —
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleGuest}
          disabled={status === 'loading'}
          sx={{ borderColor: 'primary.main', color: 'primary.main' } as unknown as SxProps<Theme>}
          aria-label={t('continueAsGuest', 'Continue as guest')}
        >
          {t('continueAsGuest', 'Continue as guest')}
        </Button>

        {apiOnline === false && (
          <Typography
            variant="caption"
            sx={{ color: '#ff4d9a', display: 'block', textAlign: 'center', mt: 2 } as unknown as SxProps<Theme>}
          >
            ה־API לא זמין כרגע. אפשר להיכנס כאורח במצב Offline.
          </Typography>
        )}

        {errorMsg && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2, textAlign: 'center' } as unknown as SxProps<Theme>}>
            {errorMsg}
          </Typography>
        )}
      </Paper>
    </Box>
  );
  return content;
}

