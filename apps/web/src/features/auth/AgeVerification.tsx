import type { ReactNode } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useConsentStore } from './consentStore';

interface GuardianGateProps {
  children: ReactNode;
}

/**
 * AI Guardian gate — PRD: Face scan 18+ before app.
 * Placeholder: "Verify 18+" button; real flow will use Face API / Mediapipe (local only).
 */
export function GuardianGate({ children }: GuardianGateProps) {
  const ageVerified = useConsentStore((s) => s.ageVerified);
  const setAgeVerified = useConsentStore((s) => s.setAgeVerified);

  if (ageVerified) return <>{children}</>;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'rgba(0,0,0,0.97)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99,
        p: 2,
      }}
    >
      <Paper
        sx={{
          maxWidth: 420,
          p: 3,
          bgcolor: '#0a0a0b',
          border: '1px solid',
          borderColor: '#ff00ff',
          boxShadow: '0 0 40px rgba(255,0,255,0.15)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#00ffff',
            fontFamily: "'Orbitron', sans-serif",
            mb: 1,
            textAlign: 'center',
          }}
        >
          AI Guardian
        </Typography>
        <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2, textAlign: 'center' }}>
          אימות גיל 18+ — עיבוד מקומי בלבד, ללא שמירת תמונות.
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2, textAlign: 'center' }}>
          לאחר האישור תעבור למסך כניסה.
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2, textAlign: 'center' }}>
          בגרסה מלאה: סריקת פנים (Face API / Mediapipe) לאימות גיל. כרגע — אישור ידני.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={() => setAgeVerified(true)}
          aria-label="אישור גיל 18+"
          sx={{
            bgcolor: '#00ffff',
            color: '#0a0a0b',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#00dddd', boxShadow: '0 0 20px #00ffff' },
          }}
        >
          אני מעל גיל 18 — כניסה
        </Button>
      </Paper>
    </Box>
  );
}
