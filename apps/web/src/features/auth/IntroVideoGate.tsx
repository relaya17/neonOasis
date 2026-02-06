import type { ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useConsentStore } from './consentStore';
import { playSound } from '../../shared/audio';

const NEON_GOLD = '#ffd700';

interface IntroVideoGateProps {
  children: ReactNode;
}

/**
 * אחרי תנאי שימוש ואימות גיל — וידאו כניסה (all.mp4), אחריו מעבר לדף הבית.
 */
export function IntroVideoGate({ children }: IntroVideoGateProps) {
  const introVideoSeen = useConsentStore((s) => s.introVideoSeen);
  const setIntroVideoSeen = useConsentStore((s) => s.setIntroVideoSeen);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!introVideoSeen && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [introVideoSeen]);

  if (introVideoSeen) return <>{children}</>;

  const handleEnter = () => {
    playSound('neon_click');
    setIntroVideoSeen(true);
    navigate('/');
  };

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
      <video
        ref={introVideoRef}
        src="/images/all.mp4"
        muted
        playsInline
        autoPlay
        loop
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
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
          onClick={handleEnter}
          aria-label="כניסה לדף הבית"
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
          כניסה לדף הבית
        </Button>
      </Box>
    </Box>
  );
}
