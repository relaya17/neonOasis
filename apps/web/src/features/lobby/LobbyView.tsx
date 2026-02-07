import { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Stack, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { playSound } from '../../shared/audio';

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

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

  const gamePath = GAMES.find((g) => g.id === selectedGame)?.path || '/';

  /* ── שחק מול AI — אימון בלבד, ללא רווח כספי ── */
  const handlePlayAI = () => {
    playSound('neon_click');
    // מעביר mode: 'ai' — המשחק לא יפריש לקופת פרסים, אימון בלבד
    navigate(gamePath, { state: { mode: 'ai', stake: selectedStake } });
  };

  /* ── מצא שחקן — תחרות מיומנות עם קופה ── */
  const handleFindPlayer = () => {
    if (Number(balance) < selectedStake) {
      alert('אין מספיק מטבעות!');
      return;
    }
    playSound('neon_click');
    setSearching(true);

    // סימולציה של מציאת יריב — בהמשך יחובר לSocket matchmaking
    setTimeout(() => {
      setSearching(false);
      navigate(gamePath, { state: { mode: 'pvp', stake: selectedStake } });
    }, 3000);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle, #1a0a1a 0%, #0a0a0b 100%)', p: 3, color: '#fff' }}>

      {/* Header עם יתרה */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ color: NEON_CYAN, fontWeight: 'bold' }}>Skill Arena</Typography>
        <Paper sx={{ px: 2, py: 1, bgcolor: 'rgba(255,215,0,0.1)', border: `1px solid ${NEON_GOLD}` }}>
          <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold' }}>{Number(balance).toLocaleString()} 🪙</Typography>
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
              <Grid item xs={6} sm={3} key={game.id}>
                <Paper
                  onClick={() => { playSound('neon_click'); setSelectedGame(game.id); }}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: selectedGame === game.id ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${selectedGame === game.id ? NEON_CYAN : 'transparent'}`,
                    borderRadius: 3,
                    transition: '0.3s',
                    '&:hover': { transform: 'scale(1.05)', borderColor: NEON_CYAN },
                  }}
                >
                  <Typography sx={{ fontSize: '2rem' }}>{game.icon}</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{game.name}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>סכום כניסה:</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            {STAKE_OPTIONS.map((stake) => (
              <Button
                key={stake}
                variant={selectedStake === stake ? 'contained' : 'outlined'}
                onClick={() => { playSound('neon_click'); setSelectedStake(stake); }}
                sx={{
                  borderRadius: 20,
                  minWidth: 64,
                  fontWeight: 'bold',
                  ...(selectedStake === stake
                    ? { bgcolor: NEON_GOLD, color: '#000', '&:hover': { bgcolor: NEON_GOLD, opacity: 0.9 } }
                    : { borderColor: 'rgba(255,215,0,0.5)', color: NEON_GOLD, '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.1)' } }),
                }}
              >
                {stake} 🪙
              </Button>
            ))}
          </Box>

          {/* ── שתי אפשרויות: אימון מול AI או תחרות מיומנות ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 420, mx: 'auto' }}>
            {/* שחק מול AI — אימון */}
            <Box>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePlayAI}
                sx={{
                  py: 2,
                  background: `linear-gradient(135deg, ${NEON_CYAN}, #0077b6)`,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  boxShadow: `0 0 20px ${NEON_CYAN}40`,
                  '&:hover': { boxShadow: `0 0 30px ${NEON_CYAN}60` },
                }}
              >
                🤖 אימון מול מחשב (AI)
              </Button>
              <Typography sx={{ color: 'rgba(0,245,212,0.6)', fontSize: '0.72rem', textAlign: 'center', mt: 0.5 }}>
                חינם — לתרגול בלבד, ללא רווח כספי
              </Typography>
            </Box>

            {/* מצא שחקן אמיתי — תחרות מיומנות */}
            <Box>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleFindPlayer}
                disabled={!isOnline}
                sx={{
                  py: 2,
                  background: isOnline
                    ? `linear-gradient(135deg, ${NEON_PINK}, #7b2ff7)`
                    : 'rgba(255,255,255,0.1)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  boxShadow: isOnline ? `0 0 20px ${NEON_PINK}40` : 'none',
                  '&:hover': { boxShadow: `0 0 30px ${NEON_PINK}60` },
                  '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' },
                }}
              >
                🎯 תחרות מיומנות — מצא שחקן
              </Button>
              <Typography sx={{ color: 'rgba(247,37,133,0.6)', fontSize: '0.72rem', textAlign: 'center', mt: 0.5 }}>
                דמי כניסה: {selectedStake} 🪙 — המנצח מקבל פרס מיומנות
              </Typography>
            </Box>

            {!isOnline && apiOnline === false && (
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center' }}>
                * חיפוש שחקן דורש חיבור לשרת
              </Typography>
            )}

            {/* הבהרה משפטית */}
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', textAlign: 'center', mt: 1, lineHeight: 1.5 }}>
              Neon Oasis היא פלטפורמת משחקי מיומנות (Skill-Based) לבידור.
              המטבעות הם וירטואליים. משחק מול AI הוא לאימון בלבד ללא ערך כספי.
              אין הימורים באתר. בכפוף לתקנון ולחוקי המדינה.
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Stack alignItems="center" spacing={3} sx={{ mt: 10 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress size={100} sx={{ color: NEON_CYAN }} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '2rem' }}>{GAMES.find((g) => g.id === selectedGame)?.icon}</Typography>
              </Box>
            </Box>
            <Typography variant="h5" sx={{ textShadow: `0 0 12px ${NEON_CYAN}40` }}>
              מחפש יריב ל{GAMES.find((g) => g.id === selectedGame)?.name}...
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              סכום כניסה: {selectedStake} 🪙
            </Typography>
            <Button
              onClick={() => { playSound('neon_click'); setSearching(false); }}
              variant="outlined"
              sx={{ borderColor: NEON_PINK, color: NEON_PINK, '&:hover': { borderColor: NEON_PINK, bgcolor: 'rgba(247,37,133,0.1)' } }}
            >
              ביטול חיפוש
            </Button>
          </Stack>
        </motion.div>
      )}
    </Box>
  );
}