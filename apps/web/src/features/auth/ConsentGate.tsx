import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Button, Typography, Paper, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useConsentStore } from './consentStore';

interface ConsentGateProps {
  children: ReactNode;
}

/** חובה לאשר תקנון ומדיניות פרטיות לפני סריקת AI Guardian. דפי תקנון/פרטיות נגישים תמיד */
export function ConsentGate({ children }: ConsentGateProps) {
  const termsAccepted = useConsentStore((s) => s.termsAccepted);
  const acceptConsent = useConsentStore((s) => s.acceptConsent);
  const location = useLocation();
  const isLegalPage = location.pathname === '/terms' || location.pathname === '/privacy' || location.pathname === '/responsible-gaming';

  if (termsAccepted || isLegalPage) return <>{children}</>;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        p: 2,
      }}
    >
      <Paper
        sx={{
          maxWidth: 480,
          p: 3,
          bgcolor: '#0a0a0a',
          border: '1px solid',
          borderColor: 'primary.main',
          boxShadow: '0 0 30px rgba(255,0,255,0.2)',
        }}
      >
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
          תנאי שימוש ומדיניות פרטיות
        </Typography>
        <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
          לפני שימוש ב-AI Guardian (אימות גיל וזהות) יש לאשר את תקנון השימוש ומדיניות הפרטיות.
          אנו משתמשים בנתוני פנים אך ורק לאימות גיל ולא לשמירה או שיתוף עם צדדים שלישיים.
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
          <strong>תקנון:</strong> השימוש בפלטפורמה כפוף לתקנון השירות. משחקים בכסף וירטואלי.
          <br />
          <strong>מדיניות פרטיות:</strong> נתוני אימות נמחקים לאחר האימות.{' '}
          <Link component={RouterLink} to="/terms" sx={{ color: 'primary.main' }}>תקנון מלא</Link>
          {' · '}
          <Link component={RouterLink} to="/privacy" sx={{ color: 'primary.main' }}>מדיניות פרטיות</Link>
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2 }}>
          שלבים: 1) אישור תנאים · 2) אימות גיל 18+ · 3) כניסה
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={acceptConsent}
          aria-label="אני מאשר תקנון ומדיניות פרטיות"
          sx={{
            background: 'linear-gradient(90deg, #00f5d4, #f72585)',
            color: '#000',
            fontWeight: 'bold',
          }}
        >
          אני מאשר/ת
        </Button>
      </Paper>
    </Box>
  );
}
