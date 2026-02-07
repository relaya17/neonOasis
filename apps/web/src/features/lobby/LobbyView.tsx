import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { playSound } from '../../shared/audio';

const GAMES = [
  { id: 'poker', name: 'פוקר', icon: '♠️', path: '/poker' },
  { id: 'rummy', name: 'רמי אבנים', icon: '🀄', path: '/rummy-live' },
  { id: 'snooker', name: 'סנוקר', icon: '🎱', path: '/snooker' },
  { id: 'backgammon', name: 'שש-בש', icon: '🎲', path: '/backgammon' },
];

const STAKE_OPTIONS = [10, 50, 100, 500];

export function LobbyView() {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState('poker');
  const [selectedStake, setSelectedStake] = useState(10);
  const balance = useWalletStore((s) => s.balance);
  const apiOnline = useApiStatusStore((s) => s.online);
  /** ב-dev: רשום ב-.env VITE_DEV_BYPASS_API=true כדי לפתוח את הלובי בלי להריץ את ה-API */
  const bypassApiCheck =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV &&
    (import.meta.env as { VITE_DEV_BYPASS_API?: string }).VITE_DEV_BYPASS_API === 'true';
  const isOnline = bypassApiCheck || apiOnline === true;

  const handleStartSearch = () => {
    if (Number(balance) < selectedStake) {
      alert("אין מספיק מטבעות!");
      return;
    }
    
    playSound('neon_click');
    setSearching(true);

    // סימולציה של מציאת יריב
    setTimeout(() => {
      const gamePath = GAMES.find(g => g.id === selectedGame)?.path || '/';
      setSearching(false);
      navigate(gamePath);
    }, 3000);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle, #1a0a1a 0%, #0a0a0b 100%)', p: 3, color: '#fff' }}>
      
      {/* Header עם יתרה */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h5" sx={{ color: '#00f5d4', fontWeight: 'bold' }}>Skill Arena</Typography>
        <Paper sx={{ px: 2, py: 1, bgcolor: 'rgba(255,215,0,0.1)', border: '1px solid #ffd700' }}>
          <Typography sx={{ color: '#ffd700', fontWeight: 'bold' }}>{Number(balance).toLocaleString()} 🪙</Typography>
        </Paper>
      </Box>

      {!isOnline && apiOnline === false && (
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.5)' }}>
          <Typography sx={{ color: '#ff9800', fontSize: '0.9rem', textAlign: 'center' }}>
            ה־API לא זמין — Matchmaking לא פעיל. הרץ את השרת: <strong>pnpm run dev:api</strong> (או pnpm run dev)
          </Typography>
        </Paper>
      )}

      {!searching ? (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>בחר משחק:</Typography>
          
          {/* גריד משחקים */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {GAMES.map((game) => (
              <Grid item xs={6} sm={4} key={game.id}>
                <Paper
                  onClick={() => setSelectedGame(game.id)}
                  sx={{
                    p: 2, textAlign: 'center', cursor: 'pointer',
                    bgcolor: selectedGame === game.id ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${selectedGame === game.id ? '#00f5d4' : 'transparent'}`,
                    transition: '0.3s',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <Typography sx={{ fontSize: '2rem' }}>{game.icon}</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{game.name}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>סכום כניסה:</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
            {STAKE_OPTIONS.map(stake => (
              <Button 
                key={stake}
                variant={selectedStake === stake ? "contained" : "outlined"}
                onClick={() => setSelectedStake(stake)}
                sx={{ borderRadius: 20 }}
              >
                {stake}
              </Button>
            ))}
          </Box>

          <Button 
            fullWidth variant="contained" size="large"
            onClick={handleStartSearch}
            disabled={!isOnline}
            sx={{ py: 2, background: 'linear-gradient(45deg, #00f5d4, #f72585)', fontWeight: 'bold' }}
          >
            מצא משחק
          </Button>
        </motion.div>
      ) : (
        <Stack alignItems="center" spacing={3} sx={{ mt: 10 }}>
          <CircularProgress size={80} sx={{ color: '#00f5d4' }} />
          <Typography variant="h5">מחפש יריב ל{GAMES.find(g => g.id === selectedGame)?.name}...</Typography>
          <Button onClick={() => setSearching(false)} color="error">ביטול</Button>
        </Stack>
      )}
    </Box>
  );
}