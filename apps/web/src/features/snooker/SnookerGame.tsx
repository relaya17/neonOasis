/**
 * Snooker Game — לוח סנוקר בסגנון ניאון וגאס
 * משחק פשוט: לחיצה על כדור כדי להכניס (פוט), ניקוד אוטומטי
 * וידאו פרומו בכניסה (כמו פוקר/רמי/שש-בש)
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnookerStore, COLOR_ORDER, COLOR_VALUES, type ColorName } from './store';
import { playSound } from '../../shared/audio';
import { SNOOKER_INTRO_VIDEO_URL } from '../../config/videoUrls';
import { responsiveVideoStyle } from '../../config/videoStyles';
import { SnookerLiveUI } from './SnookerLiveUI';
import { SnookerCanvas } from './SnookerCanvas';
import { CUE_DESIGNS, DEFAULT_CUE_ID } from './snookerCues';
import type { CueDesign } from './snookerCues';

const FELT = '#0d4d2a';
const FELT_LIGHT = '#126b38';
const POCKET = '#0a0a0a';
const CUE_BALL = '#f0f0f0';
const RED = '#c41e3a';
const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

const COLOR_BALLS: Record<ColorName, string> = {
  yellow: '#f5d033',
  green: '#2e7d32',
  brown: '#5d4037',
  blue: '#1565c0',
  pink: '#ec407a',
  black: '#1a1a1a',
};

const GOLD_RAIN_PARTICLES = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left: (i * 2.1 + (i % 7)) % 98,
  delay: (i % 5) * 0.25,
  size: 6 + (i % 4),
}));

function GoldRainEffect() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {GOLD_RAIN_PARTICLES.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            bgcolor: '#ffd700',
            boxShadow: '0 0 10px #ffd700',
            animation: 'goldRainFall 4.5s ease-in forwards',
            animationDelay: `${p.delay}s`,
            opacity: 0.9,
            '@keyframes goldRainFall': {
              '0%': { transform: 'translateY(0)', opacity: 0.9 },
              '100%': { transform: 'translateY(110vh)', opacity: 0.2 },
            },
          }}
        />
      ))}
    </Box>
  );
}

export function SnookerGame() {
  const navigate = useNavigate();
  const { state, setLevel, potRed, potColor, endFrame, reset } = useSnookerStore();
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [impactVisible, setImpactVisible] = useState(false);
  const [boomMessage, setBoomMessage] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [activeCue, setActiveCue] = useState<CueDesign>(() => CUE_DESIGNS[DEFAULT_CUE_ID]);
  const [showGoldRain, setShowGoldRain] = useState(false);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showIntroVideo && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [showIntroVideo]);

  useEffect(() => {
    if (!impactVisible) return;
    const t = setTimeout(() => setImpactVisible(false), 600);
    return () => clearTimeout(t);
  }, [impactVisible]);

  useEffect(() => {
    if (!showGoldRain) return;
    const t = setTimeout(() => setShowGoldRain(false), 5500);
    return () => clearTimeout(t);
  }, [showGoldRain]);

  const handleGiftReceived = useCallback((giftId: string) => {
    if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
    if (giftId === 'crown') {
      setActiveCue(CUE_DESIGNS.GOLD_VIP);
      setShowGoldRain(true);
      playSound('win');
      cueTimeoutRef.current = setTimeout(() => {
        setActiveCue(CUE_DESIGNS[DEFAULT_CUE_ID]);
        cueTimeoutRef.current = null;
      }, 30000);
    } else if (giftId === 'rose') {
      setActiveCue(CUE_DESIGNS.LASER_KNIGHT);
      cueTimeoutRef.current = setTimeout(() => {
        setActiveCue(CUE_DESIGNS[DEFAULT_CUE_ID]);
        cueTimeoutRef.current = null;
      }, 15000);
    } else if (giftId === 'diamond') {
      setActiveCue(CUE_DESIGNS.NEON_CYBER);
      cueTimeoutRef.current = setTimeout(() => {
        setActiveCue(CUE_DESIGNS[DEFAULT_CUE_ID]);
        cueTimeoutRef.current = null;
      }, 10000);
    }
  }, []);

  const handlePotRed = useCallback(() => {
    if (state.winner !== -1 || state.phase !== 'red' || state.redsPotted >= 15) return;
    setBoomMessage('BOOM! KingOfSnooker just pocketed a red! 🎱🔥');
    setImpactVisible(true);
    potRed();
  }, [state.phase, state.redsPotted, state.winner, potRed]);

  const handlePotColor = useCallback(
    (color: ColorName) => {
      if (state.winner !== -1 || state.colorsPotted[color]) return;
      if (state.phase === 'color') {
        setBoomMessage(`BOOM! Potted ${color}! 🎱🔥`);
        setImpactVisible(true);
        potColor(color);
      }
    },
    [state.phase, state.colorsPotted, state.winner, potColor]
  );

  const handlePassColor = useCallback(() => {
    if (state.phase !== 'color') return;
    playSound('neon_click');
    endFrame();
  }, [state.phase, endFrame]);

  const redsLeft = 15 - state.redsPotted;
  const canPotRed = state.phase === 'red' && redsLeft > 0 && state.winner === -1;
  const canPotColor = state.phase === 'color' && state.winner === -1;

  /* פרומו וידאו בכניסה — כמו שלושת הכרטיסים האחרים */
  if (showIntroVideo) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          bgcolor: '#000',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <video
          ref={introVideoRef}
          src={SNOOKER_INTRO_VIDEO_URL}
          muted
          playsInline
          autoPlay
          loop
          style={responsiveVideoStyle}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              playSound('neon_click');
              setShowIntroVideo(false);
            }}
            sx={{
              bgcolor: NEON_GOLD,
              color: '#000',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              px: 4,
              py: 1.5,
              '&:hover': { bgcolor: NEON_GOLD, opacity: 0.9 },
            }}
          >
            כניסה למשחק
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#000',
        background: 'radial-gradient(ellipse at 50% 30%, #0a1a0f 0%, #000 70%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        px: 1,
      }}
    >
      <SnookerLiveUI
        boomMessage={boomMessage}
        onBoomShown={() => setBoomMessage(null)}
        onGiftSent={handleGiftReceived}
      />
      {showGoldRain && <GoldRainEffect />}
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 720, mb: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => { playSound('neon_click'); navigate('/'); }}
          sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }}
          aria-label="חזרה לדף הבית"
        >
          ← חזרה
        </Button>
        <Typography variant="h6" sx={{ color: NEON_GOLD, fontWeight: 'bold', textShadow: `0 0 20px ${NEON_GOLD}40` }}>
          סנוקר
        </Typography>
        <Box sx={{ width: 80 }} />
      </Box>

      {/* Score board */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,245,212,0.3)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: state.turn === 0 ? NEON_CYAN : '#666', fontWeight: state.turn === 0 ? 'bold' : 'normal', fontSize: '0.85rem' }}>
            שחקן 1
          </Typography>
          <Typography sx={{ color: NEON_CYAN, fontSize: '1.5rem', fontWeight: 'bold' }}>{state.scores[0]}</Typography>
        </Box>
        <Box sx={{ alignSelf: 'center', color: NEON_GOLD }}>–</Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: state.turn === 1 ? NEON_PINK : '#666', fontWeight: state.turn === 1 ? 'bold' : 'normal', fontSize: '0.85rem' }}>
            שחקן 2
          </Typography>
          <Typography sx={{ color: NEON_PINK, fontSize: '1.5rem', fontWeight: 'bold' }}>{state.scores[1]}</Typography>
        </Box>
      </Box>

      {/* בחירת רמה — שולחן שונה לכל רמה */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,245,212,0.25)',
        }}
      >
        <Typography sx={{ color: NEON_CYAN, fontSize: '0.9rem', fontWeight: 500 }}>רמה (שולחן):</Typography>
        <ToggleButtonGroup
          value={state.level ?? 1}
          exclusive
          onChange={(_, value: number | null) => {
            if (value != null) {
              playSound('neon_click');
              setLevel(value);
            }
          }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#888',
              borderColor: 'rgba(0,245,212,0.4)',
              px: 1.5,
              '&.Mui-selected': {
                color: NEON_CYAN,
                bgcolor: 'rgba(0,245,212,0.15)',
                borderColor: NEON_CYAN,
                '&:hover': { bgcolor: 'rgba(0,245,212,0.25)' },
              },
              '&:hover': { borderColor: NEON_CYAN, color: NEON_CYAN },
            },
          }}
        >
          <ToggleButton value={1}>רמה 1</ToggleButton>
          <ToggleButton value={2}>רמה 2</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Turn / phase hint */}
      {state.winner === -1 && (
        <Typography sx={{ color: '#aaa', fontSize: '0.8rem', mb: 1 }}>
          {state.phase === 'red'
            ? `תור שחקן ${state.turn + 1} — הכנס כדור אדום (${redsLeft} נותרו)`
            : 'בחר צבע להכנסה (או דלג לתור הבא)'}
        </Typography>
      )}

      {/* הוראה קצרה */}
      {state.winner === -1 && (
        <Typography sx={{ color: 'rgba(0,245,212,0.9)', fontSize: '0.8rem', mb: 0.5 }}>
          לחץ על הכדור הלבן וגרור לאחור — שחרור כדי להכות
        </Typography>
      )}
      {/* שולחן Canvas — מקל כיוון, פיזיקה, מד כוח, שוקווייב */}
      <SnookerCanvas
        width={400}
        height={600}
        redsCount={redsLeft}
        colorsPotted={state.colorsPotted}
        phase={state.phase}
        onPotRed={handlePotRed}
        onPotColor={handlePotColor}
        disabled={state.winner !== -1}
        resetKey={resetKey}
        onStrike={() => playSound('neon_click')}
        activeCue={activeCue}
        level={state.level ?? 1}
      />

      {/* Pass turn (when phase is color) */}
      {state.phase === 'color' && state.winner === -1 && (
        <Button
          variant="outlined"
          size="small"
          onClick={handlePassColor}
          sx={{
            mt: 2,
            borderColor: NEON_GOLD,
            color: NEON_GOLD,
            '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.1)' },
          }}
          aria-label="דלג והעבר תור ליריב"
        >
          דלג — העבר תור
        </Button>
      )}

      {/* Winner */}
      {state.winner !== -1 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', fontSize: '1.2rem' }}>
            {state.winner === 0 ? 'שחקן 1 ניצח!' : 'שחקן 2 ניצח!'}
          </Typography>
          <Button
            variant="contained"
            size="medium"
            onClick={() => { playSound('neon_click'); setResetKey((k) => k + 1); reset(); }}
            sx={{
              mt: 1,
              background: `linear-gradient(90deg, ${NEON_CYAN}, ${NEON_PINK})`,
              fontWeight: 'bold',
              '&:hover': { opacity: 0.95 },
            }}
            aria-label="התחל משחק סנוקר חדש"
          >
            משחק חדש
          </Button>
        </Box>
      )}

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
        {COLOR_ORDER.map((c) => (
          <Typography key={c} sx={{ color: '#888', fontSize: '0.7rem' }}>
            <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: COLOR_BALLS[c], mr: 0.5, verticalAlign: 'middle' }} />
            {c} = {COLOR_VALUES[c]}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
