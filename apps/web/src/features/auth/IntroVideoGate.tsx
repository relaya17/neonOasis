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
              הווידאו לא נטען. מעבר אוטומטי...
            </Typography>
          )}
          {!videoLoaded && !videoError && (
            <Typography sx={{ color: '#666' }}>טוען וידאו...</Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
