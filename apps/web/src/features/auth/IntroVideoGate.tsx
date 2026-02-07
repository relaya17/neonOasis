import type { ReactNode } from 'react';
import { useRef, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useConsentStore } from './consentStore';
import { playSound } from '../../shared/audio';
import { INTRO_VIDEO_URL } from '../../config/videoUrls';
import { fullScreenVideoStyle } from '../../config/videoStyles';

/** כמה פעמים הווידאו רץ לפני מעבר אוטומטי לדף הבית */
const INTRO_LOOP_COUNT = 1;

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
  const [playCount, setPlayCount] = useState(0);

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

  useEffect(() => {
    if (!videoError) return;
    const t = setTimeout(handleEnter, 2000);
    return () => clearTimeout(t);
  }, [videoError]);

  const onVideoEnded = () => {
    if (playCount + 1 >= INTRO_LOOP_COUNT) {
      handleEnter();
      return;
    }
    setPlayCount((c) => c + 1);
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
      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <Typography
          component="button"
          type="button"
          onClick={handleEnter}
          sx={{
            color: '#888',
            bgcolor: 'transparent',
            border: '1px solid #666',
            borderRadius: 2,
            px: 2,
            py: 1,
            cursor: 'pointer',
            fontSize: '0.9rem',
            '&:hover': { color: '#00f2ea', borderColor: '#00f2ea' },
          }}
        >
          דלג על וידאו
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
