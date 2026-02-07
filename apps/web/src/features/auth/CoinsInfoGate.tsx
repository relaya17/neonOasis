/**
 * מסך "הסבר מטבעות וארנק" — מוצג פעם אחת אחרי תנאי שימוש ואזהרת גיל.
 * כולל כניסה כחבר (שם משתמש) או כאורח.
 * מתבסס על docs/הסבר_מטבעות_וארנק.md
 */

import { useState, type ReactNode } from 'react';
import { Box, Typography, Button, Paper, TextField, Divider, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConsentStore } from './consentStore';
import { useSessionStore } from './authStore';
import { useWalletStore } from '../store/store';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { claimReferralIfPending } from './referralRef';
import { getApiBase } from '../../config/apiBase';
import { playSound } from '../../shared/audio';

interface CoinsInfoGateProps {
  children: ReactNode;
}

export function CoinsInfoGate({ children }: CoinsInfoGateProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const coinsInfoSeen = useConsentStore((s) => s.coinsInfoSeen);
  const setCoinsInfoSeen = useConsentStore((s) => s.setCoinsInfoSeen);
  const sessionUserId = useSessionStore((s) => s.userId);
  const setUser = useSessionStore((s) => s.setUser);
  const setUserId = useWalletStore((s) => s.setUserId);
  const fetchBalance = useWalletStore((s) => s.fetchBalance);
  const apiOnline = useApiStatusStore((s) => s.online);

  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const base = getApiBase() || '';

  // If already seen AND logged in — pass through
  if (coinsInfoSeen && sessionUserId) return <>{children}</>;

  // If info was seen but user somehow isn't logged in, we still show login
  // If info wasn't seen, show full info + login

  const finishGate = () => {
    playSound('neon_click');
    setCoinsInfoSeen(true);
  };

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
        finishGate();
        navigate('/', { replace: true });
        return;
      }
    } catch {
      // fall through to local guest
    }
    // Fallback: enter as guest locally when API is down
    const guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    setUser(guestId, 'Guest', false);
    setUserId(guestId);
    useWalletStore.getState().setBalance('0');
    setStatus('idle');
    setErrorMsg('');
    finishGate();
    navigate('/', { replace: true });
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
        finishGate();
        navigate('/', { replace: true });
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Login failed');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error');
    }
  };

  const isLoading = status === 'loading';

  const BG_URL = 'https://res.cloudinary.com/dora8sxcb/image/upload/v1770485752/Skill_Arena6.png_f0g3cr.jpg';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 97,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        p: 0,
        overflow: 'hidden',
        bgcolor: '#000',
      }}
    >
      {/* ─── Background image (contained, not stretched) ─── */}
      <Box
        component="img"
        src={BG_URL}
        alt=""
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center top',
          zIndex: 0,
        }}
      />
      {/* ─── Compact bottom card ─── */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          px: 2,
          pt: 2.5,
          pb: 3,
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 60%, rgba(0,0,0,0) 100%)',
        }}
      >
        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
          {/* ─── Coins info (full explanation, frosted glass) ─── */}
          {!coinsInfoSeen && (
            <Box
              sx={{
                mb: 2,
                px: 2,
                py: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(0,242,234,0.2)',
                boxShadow: '0 0 20px rgba(0,242,234,0.08)',
                maxHeight: '40vh',
                overflowY: 'auto',
              }}
            >
              <Typography sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1.5, textAlign: 'center', fontSize: '0.95rem' }}>
                🪙 הסבר המטבעות והארנק
              </Typography>

              <Typography variant="subtitle2" sx={{ color: '#00f2ea', fontWeight: 'bold', mb: 0.25, fontSize: '0.82rem' }}>
                1. Balance (מאזן / Play Money)
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc', mb: 1.25, fontSize: '0.8rem', lineHeight: 1.5 }}>
                כסף שקנית או שקיבלת (קופונים, הפניות). משמש לדמי כניסה, קופה בשולחן, חנות ושליחת מתנות בלייב.
              </Typography>

              <Typography variant="subtitle2" sx={{ color: '#ff9800', fontWeight: 'bold', mb: 0.25, fontSize: '0.82rem' }}>
                2. Prize Balance (יתרת פרס / לפדיון)
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc', mb: 1.25, fontSize: '0.8rem', lineHeight: 1.5 }}>
                כסף שהרווחת — מניצחונות במשחקי מיומנות וממתנות מהקהל. ניתן למשיכה (Cash Out) בהתאם לתקנון.
              </Typography>

              <Typography variant="subtitle2" sx={{ color: '#00f2ea', fontWeight: 'bold', mb: 0.25, fontSize: '0.82rem' }}>
                3. איך מרוויחים?
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc', mb: 1.25, fontSize: '0.8rem', lineHeight: 1.5 }}>
                ניצחון (ששבש, סנוקר, פוקר) ומתנות מהקהל → Prize Balance. רכישה, קופון, הזמנת חבר → Balance.
              </Typography>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

              <Typography variant="subtitle2" sx={{ color: '#ff9800', fontWeight: 'bold', mb: 0.25, fontSize: '0.82rem' }}>
                פדיון כסף
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.78rem', lineHeight: 1.5 }}>
                רק מ-Prize Balance, בכפוף למינימום פדיון ולאישור המערכת. הזכיות מבוססות מיומנות (Skill-Based).
              </Typography>
            </Box>
          )}

          {/* ─── Login / Guest Entry ─── */}
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', mb: 0.25, letterSpacing: 2 }}>
            NEON OASIS
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', textAlign: 'center', mb: 1.5 }}>
            {t('loginSubtitle', 'הזן שם משתמש כדי להתחבר או להירשם')}
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('username', 'שם משתמש')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.06)',
                  borderRadius: 2,
                  height: 42,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: '#00f2ea' },
                  '&.Mui-focused fieldset': { borderColor: '#00f2ea' },
                },
              }}
              inputProps={{ 'aria-label': t('username', 'שם משתמש') }}
            />

            {/* ─── Login / Register side by side ─── */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading || !username.trim()}
                sx={{
                  height: 42,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #00f5d4, #00b4d8)',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  '&:disabled': { opacity: 0.4 },
                }}
                aria-label={t('login', 'התחבר')}
              >
                {isLoading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : t('login', 'התחבר')}
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading || !username.trim()}
                sx={{
                  height: 42,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #f72585, #b5179e)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  '&:disabled': { opacity: 0.4 },
                }}
                aria-label={t('register', 'הירשם')}
              >
                {isLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : t('register', 'הירשם')}
              </Button>
            </Box>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', textAlign: 'center', mb: 0.5, fontSize: '0.7rem' }}>
              * אם השם לא קיים — ייווצר חשבון חדש אוטומטית
            </Typography>
          </form>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

          <Button
            fullWidth
            variant="outlined"
            onClick={handleGuest}
            disabled={isLoading}
            sx={{
              height: 40,
              borderRadius: 2,
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': { borderColor: '#00f2ea', color: '#00f2ea', bgcolor: 'rgba(0,242,234,0.05)' },
            }}
            aria-label={t('continueAsGuest', 'המשך כאורח')}
          >
            {t('continueAsGuest', 'המשך כאורח')}
          </Button>

          {apiOnline === false && (
            <Typography variant="caption" sx={{ color: '#ff4d9a', display: 'block', textAlign: 'center', mt: 0.5 }}>
              Offline — אפשר להיכנס כאורח
            </Typography>
          )}

          {errorMsg && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
              {errorMsg}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
