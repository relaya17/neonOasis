import React from 'react';
import { Box, Button } from '@mui/material';
import { responsiveVideoStyle } from '../../config/videoStyles';

const NEON_GOLD = '#ffd700';

export function IntroVideoOverlay({
  onEnter,
  url,
}: {
  onEnter: () => void;
  url: string;
}) {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 999, bgcolor: '#000' }}>
      <video
        src={url}
        muted
        playsInline
        autoPlay
        loop
        style={responsiveVideoStyle}
      />
      <Box sx={{ position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)' }}>
        <Button
          variant="contained"
          onClick={onEnter}
          sx={{ bgcolor: NEON_GOLD, color: '#000', fontWeight: 'bold', px: 6, py: 2 }}
        >
          כניסה למשחק
        </Button>
      </Box>
    </Box>
  );
}
