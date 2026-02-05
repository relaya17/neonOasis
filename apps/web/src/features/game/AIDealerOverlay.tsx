import { Box, Typography } from '@mui/material';

interface AIDealerOverlayProps {
  message: string | null;
}

export function AIDealerOverlay({ message }: AIDealerOverlayProps) {
  if (!message) return null;
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        px: 2,
        py: 1,
        bgcolor: 'rgba(10,10,11,0.85)',
        border: '1px solid rgba(0,255,255,0.6)',
        borderRadius: 2,
        boxShadow: '0 0 18px rgba(0,255,255,0.25)',
        backdropFilter: 'blur(6px)',
        maxWidth: '80%',
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: '#00ffff', textAlign: 'center', fontFamily: "'Orbitron', sans-serif" }}
      >
        {message}
      </Typography>
    </Box>
  );
}
