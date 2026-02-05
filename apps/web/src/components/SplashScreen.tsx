import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  /** לחיצה להמשך — מופיע אחרי שנייה כדי לאפשר מעבר אם הטיימר לא עבד */
  onContinue?: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  const [showContinue, setShowContinue] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowContinue(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0a0a0b',
        position: 'fixed',
        zIndex: 9999,
        top: 0,
        left: 0,
      }}
      role="progressbar"
      aria-label="Loading application"
    >
      {/* לוגו ניאון מהבהב */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{
          opacity: [0.5, 1, 0.8, 1, 0.5],
          textShadow: [
            '0 0 10px #ff00ff, 0 0 20px #ff00ff',
            '0 0 20px #ff00ff, 0 0 40px #ff00ff',
            '0 0 10px #ff00ff, 0 0 20px #ff00ff',
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Typography
          variant="h1"
          component="span"
          sx={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#ff00ff',
            fontSize: { xs: '3rem', md: '5rem' },
            fontWeight: 900,
            letterSpacing: '8px',
          }}
        >
          NEON OASIS
        </Typography>
      </motion.div>

      {/* בר טעינה תחתון */}
      <Box sx={{ width: '200px', mt: 4, position: 'relative' }}>
        <Typography
          variant="caption"
          component="span"
          sx={{
            color: '#00ffff',
            display: 'block',
            mb: 1,
            textAlign: 'center',
            letterSpacing: 2,
          }}
        >
          LOADING VEGAS...
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: '2px',
            bgcolor: 'rgba(0, 255, 255, 0.2)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'linear' }}
            style={{
              height: '100%',
              backgroundColor: '#00ffff',
              boxShadow: '0 0 10px #00ffff',
            }}
          />
        </Box>
      </Box>

      {/* כפתור המשך — מופיע אחרי שנייה, מאפשר מעבר אם הטיימר לא עבד */}
      {onContinue && showContinue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ marginTop: 24 }}
        >
          <Button
            variant="outlined"
            onClick={onContinue}
            sx={{
              borderColor: '#00ffff',
              color: '#00ffff',
              '&:hover': { borderColor: '#00ffff', bgcolor: 'rgba(0,255,255,0.1)' },
            }}
            aria-label="המשך"
          >
            המשך
          </Button>
        </motion.div>
      )}

      {/* קרדיט קטן בתחתית */}
      <Typography
        variant="caption"
        component="span"
        sx={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.3)' }}
      >
        © 1982 NEON OASIS ENTERTAINMENT
      </Typography>
    </Box>
  );
}
