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
import { getApiBase } from '../../config/apiBase';
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
  { id: 'snooker', route: '/snooker', color: '#2e7d32', available: true, cardBackgroundVideo: SNOOKER_INTRO_VIDEO_URL },
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
      const res = await fetch(`${getApiBase()}/api/auth/guest`, { method: 'POST' });
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

      {/* Logo + סלוגן עם אפקט זהב ונאון נושם */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: '900',
              color: '#ffd700',
              textShadow: '0 0 15px rgba(255, 215, 0, 0.7), 0 0 30px rgba(255, 140, 0, 0.5)',
              letterSpacing: { xs: 2, sm: 3 },
              textTransform: 'uppercase',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            NEON OASIS
          </Typography>
          {/* כותרת שנייה: מכונת מזל קטנה + סלוגן */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 }, mt: 2, mb: 0.5 }}>
            {/* מכונת מזל מוקטנת בתחילת הכותרת השנייה */}
            <Box sx={{ flexShrink: 0 }} aria-hidden>
              <svg
                width="44"
                height="62"
                viewBox="0 0 100 140"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))' }}
              >
                <defs>
                  <linearGradient id="slotCabinet" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3d2817" />
                    <stop offset="25%" stopColor="#5c4033" />
                    <stop offset="50%" stopColor="#6b4e3d" />
                    <stop offset="75%" stopColor="#4a3525" />
                    <stop offset="100%" stopColor="#2a1810" />
                  </linearGradient>
                  <linearGradient id="slotGold" x1="0%" y1="0%" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffe066" />
                    <stop offset="40%" stopColor="#ffd700" />
                    <stop offset="100%" stopColor="#b8860b" />
                  </linearGradient>
                  <linearGradient id="slotChrome" x1="0%" y1="0%" x2="1" y2="1">
                    <stop offset="0%" stopColor="#e8e8e8" />
                    <stop offset="50%" stopColor="#fff" />
                    <stop offset="100%" stopColor="#a0a0a0" />
                  </linearGradient>
                  <linearGradient id="slotGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0a1628" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#050d18" stopOpacity="0.98" />
                  </linearGradient>
                </defs>
                <ellipse cx="50" cy="132" rx="38" ry="6" fill="rgba(0,0,0,0.35)" />
                <rect x="22" y="118" width="56" height="14" rx="3" fill="url(#slotCabinet)" stroke="#2a1810" strokeWidth="1" />
                <rect x="28" y="124" width="12" height="4" rx="1" fill="#1a0f08" />
                <rect x="60" y="124" width="12" height="4" rx="1" fill="#1a0f08" />
                <path d="M 18 18 L 82 18 L 82 116 Q 82 120 78 120 L 22 120 Q 18 120 18 116 Z" fill="url(#slotCabinet)" stroke="#2a1810" strokeWidth="1.5" />
                <rect x="24" y="8" width="52" height="18" rx="4" fill="#1a0f08" stroke="url(#slotGold)" strokeWidth="1.5" />
                <circle cx="32" cy="17" r="2.5" fill="#ffd700" opacity="0.9" />
                <circle cx="50" cy="17" r="2.5" fill="#ffd700" opacity="0.9" />
                <circle cx="68" cy="17" r="2.5" fill="#ffd700" opacity="0.9" />
                <rect x="26" y="32" width="48" height="52" rx="2" fill="#1a1a1a" stroke="url(#slotChrome)" strokeWidth="2" />
                <rect x="30" y="36" width="40" height="44" rx="2" fill="url(#slotGlass)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="30" y1="58" x2="70" y2="58" stroke="url(#slotGold)" strokeWidth="1.5" opacity="0.9" />
                <rect x="32" y="38" width="10" height="40" rx="0" fill="#0a0f14" stroke="url(#slotGold)" strokeWidth="1" />
                <rect x="44" y="38" width="10" height="40" rx="0" fill="#0a0f14" stroke="url(#slotGold)" strokeWidth="1" />
                <rect x="56" y="38" width="10" height="40" rx="0" fill="#0a0f14" stroke="url(#slotGold)" strokeWidth="1" />
                <text x="37" y="64" fill="#ffd700" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0 0 6px rgba(255,215,0,0.8)' }}>7</text>
                <text x="49" y="64" fill="#ffd700" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0 0 6px rgba(255,215,0,0.8)' }}>7</text>
                <text x="61" y="64" fill="#ffd700" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0 0 6px rgba(255,215,0,0.8)' }}>7</text>
                <rect x="38" y="92" width="24" height="6" rx="2" fill="#0d0d0d" stroke="url(#slotChrome)" strokeWidth="1" />
                <rect x="42" y="94" width="16" height="2" rx="0.5" fill="#1a1a1a" />
                <rect x="28" y="100" width="44" height="14" rx="2" fill="#1a0f08" stroke="url(#slotGold)" strokeWidth="1" />
                <rect x="30" y="102" width="40" height="10" rx="1" fill="#0d0a08" />
                <path d="M 78 52 L 92 48 Q 96 52 94 60 Q 92 68 78 72 L 76 62 Z" fill="url(#slotCabinet)" stroke="#2a1810" strokeWidth="1" />
                <path d="M 80 54 L 88 52 Q 90 55 89 60 Q 88 65 80 67 Z" fill="#4a3525" stroke="#3d2817" strokeWidth="0.5" />
              </svg>
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: NEON_PINK,
                fontWeight: 600,
                letterSpacing: '1px',
                textShadow: `0 0 15px ${NEON_PINK}99, 0 0 30px rgba(247, 37, 133, 0.5)`,
                opacity: 0.95,
                animation: 'pulsePink 3s infinite ease-in-out',
                fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
                maxWidth: { xs: '100%', sm: 480 },
                lineHeight: 1.45,
                '@keyframes pulsePink': {
                  '0%, 100%': {
                    opacity: 0.85,
                    textShadow: `0 0 12px ${NEON_PINK}, 0 0 20px rgba(247, 37, 133, 0.5)`,
                  },
                  '50%': {
                    opacity: 1,
                    textShadow: `0 0 22px ${NEON_PINK}, 0 0 35px rgba(247, 37, 133, 0.7)`,
                  },
                },
              }}
            >
              {t('landing:slogan')}
            </Typography>
          </Box>
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
            <Typography variant="h6" sx={{ color: NEON_CYAN, mb: 2, textAlign: 'center', fontWeight: 'bold', textShadow: `0 0 20px ${NEON_CYAN}66` }}>
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
            color: NEON_GOLD,
            textAlign: 'center',
            mb: { xs: 2, sm: 3 },
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            textShadow: `0 0 18px ${NEON_GOLD}99`,
            letterSpacing: '0.5px',
          }}
        >
          {sessionUserId
            ? `${t('landing:welcomeName', { name: sessionUsername ?? 'Guest' })}, ${t('landing:chooseGame')}`
            : t('landing:chooseGame')}
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
          {games.map((game) => (
            <Grid item xs={12} sm={6} md={6} key={game.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: game.available ? game.color : '#666',
                    fontWeight: 'bold',
                    fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
                    textAlign: 'center',
                    mb: 1,
                  }}
                >
                  {t(`landing:games.${game.id}`)}
                </Typography>
                <Card
                  component={motion.div}
                  whileHover={{ scale: game.available ? 1.02 : 1 }}
                  whileTap={{ scale: game.available ? 0.98 : 1 }}
                  onClick={() => game.available && handleGameSelect(game)}
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
                    display: 'flex',
                    flexDirection: 'column',
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
                  <CardContent
                    className="card-content-inner"
                    sx={{
                      flex: 1,
                      minHeight: { xs: 180, sm: 240, md: 280 },
                      py: 0,
                      px: 1.5,
                      pb: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      '&:last-child': { pb: 1.5 },
                    }}
                  >
                    {game.available ? (
                      <Button
                        component={RouterLink}
                        to={game.route}
                        variant="contained"
                        size="medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('neon_click');
                        }}
                        sx={{
                          bgcolor: game.color,
                          color: '#000',
                          fontWeight: 'bold',
                          width: '100%',
                          '&:hover': { bgcolor: game.color, opacity: 0.9 },
                        }}
                      >
                        {t('landing:play')}
                      </Button>
                    ) : (
                      <Typography sx={{ color: '#888', fontSize: '0.85rem', textAlign: 'center' }}>
                        🔒 {t('landing:comingSoon')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
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
            '&:hover': { color: NEON_CYAN },
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
