import type { ReactNode } from 'react';
import { useRef, useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useConsentStore } from './consentStore';
import { playSound } from '../../shared/audio';
import { INTRO_VIDEO_URL } from '../../config/videoUrls';
import { fullScreenVideoStyle } from '../../config/videoStyles';

const NEON_CYAN = '#00f5d4';
const NEON_GOLD = '#ffd700';
const NEON_PINK = '#f72585';

/** הוידאו רץ בלופ — המשתמש בוחר מתי להמשיך */

interface IntroVideoGateProps {
  children: ReactNode;
}

/**
 * אחרי תנאי שימוש ואימות גיל — וידאו כניסה (all.mp4), רץ פעמיים ואז מעבר אוטומטי לדף הבית.
 */
export function IntroVideoGate({ children }: IntroVideoGateProps) {
  const introVideoSeen = useConsentStore((s) => s.introVideoSeen);
  const setIntroVideoSeen = useConsentStore((s) => s.setIntroVideoSeen);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  useEffect(() => {
    if (!introVideoSeen && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [introVideoSeen]);

  const handleEnter = () => {
    playSound('neon_click');
    setIntroVideoSeen(true);
    navigate('/');
  };

  /* If video fails to load, show fallback after 3s */
  useEffect(() => {
    if (!videoError) return;
    const t = setTimeout(handleEnter, 3000);
    return () => clearTimeout(t);
  }, [videoError]);

  /* When video ends → loop it (user decides when to continue) */
  const onVideoEnded = () => {
    introVideoRef.current?.play().catch(() => {});
  };

  if (introVideoSeen) return <>{children}</>;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 98,
        bgcolor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          position: 'absolute',
          top: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#00f2ea',
          zIndex: 2,
          textShadow: '0 0 12px rgba(0,242,234,0.6)',
        }}
      >
        וידאו פתיחה
      </Typography>
      <video
        ref={introVideoRef}
        src={INTRO_VIDEO_URL}
        muted
        playsInline
        autoPlay
        onEnded={onVideoEnded}
        onError={() => setVideoError(true)}
        onLoadedData={() => setVideoLoaded(true)}
        style={{
          ...fullScreenVideoStyle,
          opacity: videoLoaded && !videoError ? 1 : 0,
        }}
      />
      {/* ── Two main entry buttons ────────────────── */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          pb: 4,
          pt: 6,
          px: 2,
          zIndex: 2,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 40%, transparent 100%)',
        }}
      >
        {/* Button 1: Enter game + find player */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => {
            playSound('neon_click');
            setIntroVideoSeen(true);
            navigate('/lobby');
          }}
          sx={{
            maxWidth: 340,
            height: 52,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${NEON_CYAN}, ${NEON_PINK})`,
            color: '#000',
            fontWeight: 'bold',
            fontSize: '1rem',
            textShadow: 'none',
            boxShadow: `0 0 20px ${NEON_CYAN}40`,
            '&:hover': { opacity: 0.9, boxShadow: `0 0 30px ${NEON_CYAN}60` },
          }}
        >
          🎮 הכנס למשחק וחפש שחקן
        </Button>

        {/* Button 2: Enter live feed */}
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={() => {
            playSound('neon_click');
            setIntroVideoSeen(true);
            navigate('/feed');
          }}
          sx={{
            maxWidth: 340,
            height: 48,
            borderRadius: 3,
            borderColor: NEON_GOLD,
            borderWidth: 2,
            color: NEON_GOLD,
            fontWeight: 'bold',
            fontSize: '0.95rem',
            '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.08)', borderWidth: 2 },
          }}
        >
          📺 הכנס ללייב — צפה במשחקים
        </Button>

        {/* Small skip link */}
        <Typography
          component="button"
          type="button"
          onClick={handleEnter}
          sx={{
            mt: 0.5,
            color: 'rgba(255,255,255,0.35)',
            bgcolor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            textDecoration: 'underline',
            '&:hover': { color: 'rgba(255,255,255,0.6)' },
          }}
        >
          דלג לדף הבית
        </Typography>
      </Box>
      {(videoError || (!videoLoaded && !videoError)) && (
        <Box
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
            bgcolor: 'rgba(0,0,0,0.85)',
          }}
        >
          {videoError && (
            <>
              <Typography sx={{ color: '#888', textAlign: 'center' }}>
                וידאו הפתיחה לא נטען. ניתן להמשיך לדף הבית.
              </Typography>
              <Typography
                component="button"
                type="button"
                onClick={handleEnter}
                sx={{
                  color: '#00f2ea',
                  border: '1px solid #00f2ea',
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'rgba(0,242,234,0.1)' },
                }}
              >
                המשך
              </Typography>
            </>
          )}
          {!videoLoaded && !videoError && (
            <Typography sx={{ color: '#666' }}>טוען וידאו פתיחה...</Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
