import type { ReactNode } from 'react';
import { useRef, useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useConsentStore } from './consentStore';
import { playSound } from '../../shared/audio';
import { INTRO_VIDEO_URL } from '../../config/videoUrls';

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
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

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
        src={INTRO_VIDEO_URL}
        muted
        playsInline
        autoPlay
        loop
        onError={() => setVideoError(true)}
        onLoadedData={() => setVideoLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: videoLoaded && !videoError ? 1 : 0,
        }}
      />
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
          }}
        >
          {videoError && (
            <Typography sx={{ color: '#888', textAlign: 'center' }}>
              הווידאו לא נטען. לחץ להמשך.
            </Typography>
          )}
          {!videoLoaded && !videoError && (
            <Typography sx={{ color: '#666' }}>טוען וידאו...</Typography>
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
