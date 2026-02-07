/**
 * מסך Welcome / Onboarding — כניסה לקזינו יוקרתי.
 * מוצג פעם אחת, מסביר את שלושת עמודי התווך: שחק במיומנות, צבור יהלומים, פדה מזומן.
 * Certified Skill-Based, Haptic על "מתחילים להרוויח".
 */

import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Stack } from '@mui/material';
import { hapticClick } from '../../shared/hooks/useHaptic';
import { playSound } from '../../shared/audio';

const PILLARS = [
  { icon: '🎮', title: 'שחק במיומנות', desc: 'סנוקר, ששבש ופוקר מבוססי יכולת בלבד.' },
  { icon: '💎', title: 'צבור יהלומים', desc: 'קבל מתנות מהקהל בזמן שאתה משחק בלייב.' },
  { icon: '🏦', title: 'פדה מזומן', desc: 'משוך את הזכיות שלך ישירות לחשבון בביטחון מלא.' },
];

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

export function WelcomeOnboarding({ onComplete }: WelcomeOnboardingProps) {
  const handleStart = () => {
    playSound('neon_click');
    hapticClick();
    onComplete();
  };

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        background: 'radial-gradient(circle at 50% 30%, #1a0a1a 0%, #0a0510 50%, #000 100%)',
        overflow: 'auto',
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: '"Orbitron", sans-serif',
            fontWeight: 'bold',
            color: '#00f2ea',
            textShadow: '0 0 30px rgba(0,242,234,0.6), 0 0 60px rgba(0,242,234,0.3)',
            mb: 2,
            textAlign: 'center',
            fontSize: { xs: '2rem', sm: '2.75rem' },
          }}
        >
          NEON OASIS
        </Typography>
      </motion.div>

      <Stack spacing={4} sx={{ my: 6, maxWidth: 400, width: '100%' }}>
        {PILLARS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ fontSize: '2rem' }} aria-hidden>
                {item.icon}
              </Typography>
              <Box>
                <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  {item.desc}
                </Typography>
              </Box>
            </Stack>
          </motion.div>
        ))}
      </Stack>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <Button
          variant="contained"
          onClick={handleStart}
          sx={{
            px: 6,
            py: 2,
            borderRadius: '40px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #00f2ea, #f72585)',
            boxShadow: '0 0 24px rgba(0,242,234,0.4)',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 0 32px rgba(247,37,133,0.5)',
            },
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          aria-label="מתחילים להרוויח"
        >
          מתחילים להרוויח
        </Button>
      </motion.div>

      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.7rem',
        }}
      >
        Certified Skill-Based Platform
      </Typography>
    </Box>
  );
}

export const ONBOARDING_KEY = 'neon_oasis_onboarding_done';

export function useOnboardingDone(): [boolean, () => void] {
  const [done, setDone] = useState(() =>
    typeof window !== 'undefined' ? !!localStorage.getItem(ONBOARDING_KEY) : false
  );
  const complete = () => {
    if (typeof window !== 'undefined') localStorage.setItem(ONBOARDING_KEY, '1');
    setDone(true);
  };
  return [done, complete];
}

/** עטיפה: מציגה Onboarding בפעם הראשונה, אחרת את הילדים */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const [done, complete] = useOnboardingDone();
  if (!done) return <WelcomeOnboarding onComplete={complete} />;
  return <>{children}</>;
}
