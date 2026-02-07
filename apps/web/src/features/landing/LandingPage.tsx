/**
 * Landing Page - Main Entry Point
 * Login options + Game Selection
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography, Paper, Grid, Card, CardContent, IconButton, Menu, MenuItem } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '../auth/authStore';
import { performFullLogout } from '../auth/performFullLogout';
import { useWalletStore } from '../store';
import { playSound } from '../../shared/audio';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { BACKGAMMON_INTRO_VIDEO_URL, POKER_INTRO_VIDEO_URL, SNOOKER_INTRO_VIDEO_URL, RUMMY_INTRO_VIDEO_URL, WELCOME_CHOICE_VIDEO_URL } from '../../config/videoUrls';
import { fullScreenVideoStyle, responsiveVideoStyle } from '../../config/videoStyles';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

interface GameOption {
  id: string;
  route: string;
  color: string;
  available: boolean;
  cardBackgroundImage?: string;
  cardBackgroundVideo?: string;
}

const games: GameOption[] = [
  { id: 'backgammon', route: '/backgammon', color: NEON_CYAN, available: true, cardBackgroundImage: '/images/bord.png', cardBackgroundVideo: BACKGAMMON_INTRO_VIDEO_URL },
  { id: 'snooker', route: '/snooker', color: '#2e7d32', available: true, ...(SNOOKER_INTRO_VIDEO_URL && { cardBackgroundVideo: SNOOKER_INTRO_VIDEO_URL }) },
  { id: 'touch', route: '/touch', color: NEON_GOLD, available: true, ...(RUMMY_INTRO_VIDEO_URL && { cardBackgroundVideo: RUMMY_INTRO_VIDEO_URL }) },
  { id: 'poker', route: '/poker', color: NEON_PINK, available: true, cardBackgroundImage: '/images/bord2.png', cardBackgroundVideo: POKER_INTRO_VIDEO_URL },
];

export function LandingPage() {
  const { t, i18n } = useTranslation(['landing', 'common']);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  /** וידאו אחרי בחירת אורח/לוגין — כמו בשש-בש */
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [afterWelcomeVideoNavigateTo, setAfterWelcomeVideoNavigateTo] = useState<string | null>(null);
  const [welcomeVideoError, setWelcomeVideoError] = useState(false);
  const [welcomeVideoLoaded, setWelcomeVideoLoaded] = useState(false);
  const welcomeVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const sessionUserId = useSessionStore((s) => s.userId);
  const sessionUsername = useSessionStore((s) => s.username);
  const setUser = useSessionStore((s) => s.setUser);
  const setUserId = useWalletStore((s) => s.setUserId);
  const fetchBalance = useWalletStore((s) => s.fetchBalance);

  useEffect(() => {
    if (showWelcomeVideo && welcomeVideoRef.current) {
      welcomeVideoRef.current.play().catch(() => {});
    }
  }, [showWelcomeVideo]);

  const handleGuestLogin = async () => {
    setLoggingIn(true);
    playSound('neon_click');

    try {
      const res = await fetch(`${API_URL}/api/auth/guest`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data.userId) {
        setUser(data.userId, data.username ?? 'Guest', !!data.is_admin);
        setUserId(data.userId);
        await fetchBalance(data.userId);
      } else {
        // Fallback: local guest
        const guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        setUser(guestId, 'Guest', false);
        setUserId(guestId);
        useWalletStore.getState().setBalance('0');
      }
    } catch {
      // Fallback: local guest
      const guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      setUser(guestId, 'Guest', false);
      setUserId(guestId);
      useWalletStore.getState().setBalance('0');
    } finally {
      setLoggingIn(false);
      setShowWelcomeVideo(true);
      setAfterWelcomeVideoNavigateTo(null);
    }
  };

  const handleLoginClick = () => {
    playSound('neon_click');
    setShowWelcomeVideo(true);
    setAfterWelcomeVideoNavigateTo('/login');
  };

  const handleWelcomeVideoContinue = () => {
    playSound('neon_click');
    const target = afterWelcomeVideoNavigateTo;
    setShowWelcomeVideo(false);
    setAfterWelcomeVideoNavigateTo(null);
    setWelcomeVideoError(false);
    setWelcomeVideoLoaded(false);
    if (target) navigate(target);
  };

  const handleGameSelect = (game: GameOption) => {
    if (!game.available) return;
    playSound('neon_click');
    navigate(game.route);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#000',
        background: 'radial-gradient(circle at 50% 50%, #0a0a0b 0%, #000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* וידאו אחרי בחירת אורח או לוגין — כמו בשש-בש */}
      {showWelcomeVideo && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
            bgcolor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={welcomeVideoRef}
            src={WELCOME_CHOICE_VIDEO_URL}
            muted
            playsInline
            autoPlay
            loop
            onError={() => setWelcomeVideoError(true)}
            onLoadedData={() => setWelcomeVideoLoaded(true)}
            style={{
              ...fullScreenVideoStyle,
              opacity: welcomeVideoLoaded && !welcomeVideoError ? 1 : 0,
            }}
          />
          {(welcomeVideoError || (!welcomeVideoLoaded && !welcomeVideoError)) && (
            <Box
              onClick={welcomeVideoError ? handleWelcomeVideoContinue : undefined}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 2,
                cursor: welcomeVideoError ? 'pointer' : 'wait',
              }}
            >
              {welcomeVideoError && (
                <Typography sx={{ color: '#888', textAlign: 'center' }}>
                  {t('landing:videoNotLoaded')}
                </Typography>
              )}
              {!welcomeVideoLoaded && !welcomeVideoError && (
                <Typography sx={{ color: '#666' }}>{t('landing:loadingVideo')}</Typography>
              )}
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleWelcomeVideoContinue}
              aria-label={afterWelcomeVideoNavigateTo ? t('landing:continueToLogin') : t('landing:continueToHome')}
              sx={{
                bgcolor: NEON_GOLD,
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: NEON_GOLD, opacity: 0.9 },
              }}
            >
              {afterWelcomeVideoNavigateTo ? t('landing:continueToLogin') : t('landing:continueToHome')}
            </Button>
          </Box>
        </Box>
      )}

      {/* Animated background effects */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          background: `
            radial-gradient(circle at 20% 30%, ${NEON_CYAN} 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, ${NEON_PINK} 0%, transparent 50%)
          `,
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.1 },
            '50%': { opacity: 0.2 },
          },
        }}
      />

      {/* Language switcher */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => setLangAnchor(e.currentTarget)}
          sx={{ color: NEON_CYAN, '&:hover': { bgcolor: 'rgba(0,245,212,0.1)' } }}
          aria-label={t('landing:language')}
        >
          <LanguageIcon />
        </IconButton>
        <Menu anchorEl={langAnchor} open={!!langAnchor} onClose={() => setLangAnchor(null)}>
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <MenuItem
              key={code}
              selected={i18n.language === code || i18n.language.startsWith(code + '-')}
              onClick={() => { i18n.changeLanguage(code); setLangAnchor(null); }}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* ברכה למשתמש מחובר: אורח או שם פרטי */}
      {sessionUserId && (
        <Typography
          sx={{
            color: NEON_GOLD,
            fontWeight: 'bold',
            fontSize: { xs: '1.1rem', sm: '1.35rem' },
            textAlign: 'center',
            mb: 1,
            textShadow: `0 0 15px ${NEON_GOLD}99`,
          }}
        >
          {sessionUsername === 'Guest' || sessionUsername === 'אורח' || !sessionUsername
            ? t('landing:welcomeGuest')
            : t('landing:welcomeName', { name: sessionUsername.split(/\s+/)[0] || sessionUsername })}
        </Typography>
      )}

      {/* Logo */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Typography
          sx={{
            color: NEON_CYAN,
            fontWeight: 'bold',
            mb: 1,
            textShadow: `0 0 30px ${NEON_CYAN}`,
            letterSpacing: { xs: 2, sm: 4 },
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            textAlign: 'center',
          }}
        >
          NEON OASIS
        </Typography>
        <Typography
          sx={{
            color: NEON_PINK,
            textAlign: 'center',
            mb: 1,
            textShadow: `0 0 20px ${NEON_PINK}`,
            fontSize: { xs: '1rem', sm: '1.2rem' },
          }}
        >
          🎰 {t('landing:vegasPlatform')}
        </Typography>
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: { xs: '95%', sm: 720 },
            mx: 'auto',
            mb: { xs: 3, sm: 4 },
            px: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", "Orbitron", sans-serif',
              color: NEON_GOLD,
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              lineHeight: 1.4,
              letterSpacing: { xs: 0.5, sm: 1 },
              textShadow: `0 0 25px ${NEON_GOLD}99, 0 0 12px ${NEON_GOLD}66`,
              textAlign: 'center',
            }}
          >
            {t('landing:tagline')}
          </Typography>
        </Box>
      </motion.div>

      {/* Login Options - Only if not logged in */}
      {!sessionUserId && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ width: '100%', maxWidth: 500, marginBottom: 40 }}
        >
          <Paper
            sx={{
              bgcolor: 'rgba(26, 26, 26, 0.8)',
              border: `2px solid ${NEON_CYAN}`,
              borderRadius: 3,
              p: 3,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
              {t('landing:welcomeTitle')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PersonIcon />}
                onClick={handleGuestLogin}
                disabled={loggingIn}
                sx={{
                  bgcolor: NEON_CYAN,
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  py: 1.5,
                  boxShadow: `0 0 20px ${NEON_CYAN}66`,
                  '&:hover': { bgcolor: NEON_CYAN, boxShadow: `0 0 30px ${NEON_CYAN}` },
                }}
              >
                {loggingIn ? t('landing:loggingIn') : t('landing:continueAsGuest')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<LoginIcon />}
                onClick={handleLoginClick}
                sx={{
                  borderColor: NEON_PINK,
                  color: NEON_PINK,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  py: 1.2,
                  '&:hover': { borderColor: NEON_PINK, bgcolor: `${NEON_PINK}22` },
                }}
              >
                {t('landing:loginToAccount')}
              </Button>
            </Box>
          </Paper>
        </motion.div>
      )}

      {/* Game Selection */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        style={{ width: '100%', maxWidth: 900 }}
      >
        <Typography
          sx={{
            color: '#fff',
            textAlign: 'center',
            mb: { xs: 2, sm: 3 },
            fontWeight: 'bold',
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
          }}
        >
          {t('landing:chooseGame')}
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
          {games.map((game) => (
            <Grid item xs={12} sm={6} md={6} key={game.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: game.available ? game.color : '#666',
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    textAlign: 'center',
                  }}
                >
                  {t(`landing:games.${game.id}`)}
                </Typography>
                <Card
                  component={motion.div}
                  whileHover={{ scale: game.available ? 1.02 : 1 }}
                  whileTap={{ scale: game.available ? 0.98 : 1 }}
                  onClick={() => handleGameSelect(game)}
                  sx={{
                    width: '100%',
                    bgcolor: game.available ? 'rgba(26, 26, 26, 0.9)' : 'rgba(50, 50, 50, 0.5)',
                    border: `2px solid ${game.available ? game.color : '#444'}`,
                    borderRadius: 2,
                    cursor: game.available ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s',
                    opacity: game.available ? 1 : 0.5,
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: { xs: 180, sm: 240, md: 280 },
                    '&:hover': game.available
                      ? {
                          boxShadow: `0 0 30px ${game.color}66`,
                          borderColor: game.color,
                        }
                      : {},
                    ...((game.cardBackgroundVideo || game.cardBackgroundImage) && {
                      '& .card-content-inner': {
                        position: 'relative',
                        zIndex: 1,
                        textShadow: '0 0 8px rgba(0,0,0,0.9), 0 1px 3px #000',
                      },
                    }),
                    ...(game.cardBackgroundImage && !game.cardBackgroundVideo && {
                      backgroundImage: `url(${game.cardBackgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.7) 100%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      },
                    }),
                  }}
                >
                  {game.cardBackgroundVideo && (
                    <>
                      <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          src={game.cardBackgroundVideo}
                          style={responsiveVideoStyle}
                        />
                      </Box>
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.7) 100%)',
                          pointerEvents: 'none',
                          zIndex: 0.5,
                        }}
                      />
                    </>
                  )}
                  <CardContent className="card-content-inner" sx={{ minHeight: { xs: 180, sm: 240, md: 280 }, py: 0, '&:last-child': { pb: 0 } }} />
                </Card>
                {game.available ? (
                  <Button
                    component={RouterLink}
                    to={game.route}
                    variant="contained"
                    size="large"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('neon_click');
                    }}
                    sx={{
                      bgcolor: game.color,
                      color: '#000',
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: game.color, opacity: 0.9 },
                    }}
                  >
                    {t('landing:enterGame')}
                  </Button>
                ) : (
                  <Typography sx={{ color: '#666', fontSize: '0.85rem' }}>
                    🔒 {t('landing:comingSoon')}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Logout button if already logged in */}
      {sessionUserId && (
        <Button
          onClick={() => performFullLogout()}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: '#666',
            fontSize: '0.75rem',
            '&:hover': { color: '#fff' },
          }}
        >
          {t('common:logout')}
        </Button>
      )}

      {/* Footer */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: 20,
          color: '#666',
          fontSize: '0.8rem',
          textAlign: 'center',
        }}
      >
        Neon Oasis © 2026 • Vegas Gaming Platform
      </Typography>
    </Box>
  );
}
