/**
 * Snooker Game — לוח סנוקר בסגנון ניאון וגאס
 * משחק פשוט: לחיצה על כדור כדי להכניס (פוט), ניקוד אוטומטי
 */

import React, { useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnookerStore, COLOR_ORDER, COLOR_VALUES, type ColorName } from './store';
import { playSound } from '../../shared/audio';

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

export function SnookerGame() {
  const navigate = useNavigate();
  const { state, potRed, potColor, endFrame, reset } = useSnookerStore();

  const handlePotRed = useCallback(() => {
    if (state.winner !== -1 || state.phase !== 'red' || state.redsPotted >= 15) return;
    playSound('neon_click');
    potRed();
  }, [state.phase, state.redsPotted, state.winner, potRed]);

  const handlePotColor = useCallback(
    (color: ColorName) => {
      if (state.winner !== -1 || state.colorsPotted[color]) return;
      if (state.phase === 'color') {
        playSound('neon_click');
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

  return (
    <Box
      sx={{
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 720, mb: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => { playSound('neon_click'); navigate('/'); }}
          sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }}
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

      {/* Turn / phase hint */}
      {state.winner === -1 && (
        <Typography sx={{ color: '#aaa', fontSize: '0.8rem', mb: 1 }}>
          {state.phase === 'red'
            ? `תור שחקן ${state.turn + 1} — הכנס כדור אדום (${redsLeft} נותרו)`
            : 'בחר צבע להכנסה (או דלג לתור הבא)'}
        </Typography>
      )}

      {/* Table */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          aspectRatio: '2 / 1',
          borderRadius: 3,
          bgcolor: FELT,
          background: `linear-gradient(145deg, ${FELT_LIGHT} 0%, ${FELT} 50%)`,
          boxShadow: `inset 0 0 60px rgba(0,0,0,0.4), 0 0 30px ${NEON_CYAN}20`,
          border: '3px solid #1a6b3c',
          overflow: 'hidden',
        }}
      >
        {/* Pockets */}
        {[
          { left: 0, top: 0 },
          { left: '50%', top: 0, transform: 'translateX(-50%)' },
          { right: 0, top: 0 },
          { left: 0, bottom: 0 },
          { left: '50%', bottom: 0, transform: 'translateX(-50%)' },
          { right: 0, bottom: 0 },
        ].map((pos, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: POCKET,
              border: '2px solid #222',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
              ...pos,
            }}
          />
        ))}

        {/* Balls area - reds */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '35%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            maxWidth: 120,
            justifyContent: 'center',
          }}
        >
          {redsLeft > 0 && (
            <Box
              onClick={canPotRed ? handlePotRed : undefined}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: RED,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                border: '1px solid #8b0000',
                cursor: canPotRed ? 'pointer' : 'default',
                opacity: canPotRed ? 1 : 0.9,
                '&:hover': canPotRed ? { transform: 'scale(1.1)', boxShadow: `0 0 20px ${RED}` } : {},
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            />
          )}
        </Box>

        {/* Color balls row */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '58%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 320,
          }}
        >
          {COLOR_ORDER.map((color) => {
            const potted = state.colorsPotted[color];
            const canPot = canPotColor && !potted;
            return (
              <Box
                key={color}
                onClick={() => handlePotColor(color)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: potted ? 'transparent' : COLOR_BALLS[color],
                  boxShadow: potted ? 'none' : '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
                  border: potted ? '2px dashed #333' : `1px solid ${color === 'black' ? '#333' : 'rgba(0,0,0,0.3)'}`,
                  cursor: canPot ? 'pointer' : 'default',
                  opacity: potted ? 0.4 : 1,
                  '&:hover': canPot ? { transform: 'scale(1.15)', boxShadow: `0 0 16px ${COLOR_BALLS[color]}` } : {},
                  transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.2s',
                }}
              />
            );
          })}
        </Box>

        {/* Cue ball (decorative) */}
        <Box
          sx={{
            position: 'absolute',
            left: '18%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 26,
            height: 26,
            borderRadius: '50%',
            bgcolor: CUE_BALL,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)',
            border: '1px solid #ddd',
          }}
        />
      </Box>

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
            onClick={() => { playSound('neon_click'); reset(); }}
            sx={{
              mt: 1,
              background: `linear-gradient(90deg, ${NEON_CYAN}, ${NEON_PINK})`,
              fontWeight: 'bold',
              '&:hover': { opacity: 0.95 },
            }}
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
