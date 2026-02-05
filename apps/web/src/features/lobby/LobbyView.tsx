import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { useSessionStore } from '../auth';
import { playSound } from '../../shared/audio';
import { hapticClick } from '../../shared/hooks';

export function LobbyView() {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const apiOnline = useApiStatusStore((s) => s.online);
  const username = useSessionStore((s) => s.username);

  useEffect(() => {
    if (!searching) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [searching]);

  const handleStartSearch = () => {
    playSound('neon_click');
    hapticClick();
    setSearching(true);
    setCountdown(0);
    // Mock: auto-match after 5s
    setTimeout(() => {
      setSearching(false);
      navigate('/backgammon');
    }, 5000);
  };

  const handleCancelSearch = () => {
    playSound('neon_click');
    hapticClick();
    setSearching(false);
    setCountdown(0);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0b 0%, #1a0a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      {apiOnline === false && (
        <Typography
          variant="caption"
          sx={{
            color: '#ff4d9a',
            bgcolor: 'rgba(255, 0, 85, 0.12)',
            border: '1px solid rgba(255, 0, 85, 0.3)',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            mb: 2,
          }}
        >
          ה־API לא זמין — Matchmaking לא פעיל במצב Offline.
        </Typography>
      )}

      <Typography
        variant="h4"
        sx={{
          color: 'primary.main',
          fontFamily: "'Orbitron', sans-serif",
          textShadow: '0 0 20px rgba(0,255,255,0.5)',
          mb: 1,
        }}
      >
        Matchmaking Lobby
      </Typography>
      <Typography variant="body2" sx={{ color: '#ccc', mb: 4 }}>
        @{username ?? 'Guest'} · מחפש יריבים בדירוג דומה
      </Typography>

      {searching ? (
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: 'primary.main' }} size={60} />
          <Typography sx={{ color: '#00ffff', fontWeight: 600 }}>
            מחפש משחק... ({countdown}s)
          </Typography>
          <Typography variant="caption" sx={{ color: '#888' }}>
            ELO matchmaking...
          </Typography>
          <Button
            variant="outlined"
            onClick={handleCancelSearch}
            sx={{
              mt: 2,
              borderColor: '#888',
              color: '#888',
              '&:hover': { borderColor: '#aaa', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            ביטול
          </Button>
        </Stack>
      ) : (
        <Button
          variant="contained"
          onClick={handleStartSearch}
          disabled={apiOnline === false}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: apiOnline === false ? 'rgba(100,100,100,0.3)' : 'linear-gradient(90deg, #00f5d4, #f72585)',
            color: apiOnline === false ? '#666' : '#000',
            boxShadow: apiOnline === false ? 'none' : '0 0 30px rgba(0,245,212,0.4)',
            '&:hover': {
              boxShadow: apiOnline === false ? 'none' : '0 0 40px rgba(247,37,133,0.6)',
            },
          }}
        >
          {apiOnline === false ? 'Offline' : 'חפש משחק'}
        </Button>
      )}

      <Typography variant="caption" sx={{ color: '#666', mt: 4 }}>
        או חזור ל־<Box component="span" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={() => navigate('/')}>Feed</Box>
      </Typography>
    </Box>
  );
}
