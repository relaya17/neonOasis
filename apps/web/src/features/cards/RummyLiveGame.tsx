/**
 * RummyLiveGame — Container לרמי אבנים לייב.
 * מבנה אחיד: useLiveGame (socket/pot/gifts) + LiveUI (overlay) + TouchCardGame (rendering).
 */

import { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { TouchCardGame } from './CardGame';
import { LiveUI } from '../../shared/components/LiveUI';
import { useLiveGame } from '../../shared/hooks/useLiveGame';
import type { GameMode } from '../../shared/hooks/useLiveGame';
import { playSound } from '../../shared/audio';

const NEON_CYAN = '#00f5d4';
const NEON_GOLD = '#ffd700';

const RUN_BOOM_THRESHOLD = 4;
const RUMMY_WIN_REWARD = 80;
const ENTRY_FEE = 50;
const TABLE_RAKE = 0.1;

export function RummyLiveGame() {
  const location = useLocation();
  const routeMode = (location.state as { mode?: GameMode })?.mode ?? 'pvp';

  /* ── Shared live hook ─────────────────────────── */
  const live = useLiveGame({
    tableId: 'rummy-main',
    entryFee: ENTRY_FEE,
    rake: TABLE_RAKE,
    gameMode: routeMode,
  });

  /* ── Game events → BOOM messages ──────────────── */
  const handlePlaceGroup = useCallback(
    (tilesCount: number, isRun: boolean) => {
      if (isRun && tilesCount >= RUN_BOOM_THRESHOLD) {
        live.setBoomMessage('סדרה מטורפת! 🔥');
      } else if (tilesCount >= 4) {
        live.setBoomMessage('קבוצה חזקה! 💪');
      }
    },
    [live.setBoomMessage],
  );

  const handleWin = useCallback(() => {
    live.setBoomMessage('ניצחון ברומי! 🎉');
    live.setUserCoins((c) => c + RUMMY_WIN_REWARD);
    playSound('win');
  }, [live.setBoomMessage, live.setUserCoins]);

  return (
    <Box sx={{ position: 'relative', width: '100vw', height: '100vh', bgcolor: '#000', overflow: 'hidden' }}>
      {/* Layer 1: Game (scrollable) — lowest z */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <TouchCardGame onPlaceGroup={handlePlaceGroup} onWin={handleWin} />
      </Box>

      {/* Layer 2: Shared LiveUI overlay — above game */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
        <LiveUI
          gameName="רמי Live"
          boomMessage={live.boomMessage}
          onBoomShown={() => live.setBoomMessage(null)}
          onGiftSent={live.handleGiftSent}
        />
      </Box>

      {/* Layer 2.5: AI Practice badge */}
      {live.isAI && (
        <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 30, bgcolor: 'rgba(0,245,212,0.15)', border: '1px solid rgba(0,245,212,0.4)', borderRadius: 2, px: 2, py: 0.5, pointerEvents: 'none' }}>
          <Typography sx={{ color: NEON_CYAN, fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>
            🤖 אימון (AI) — ללא רווח כספי
          </Typography>
        </Box>
      )}

      {/* Layer 3: BANK overlay — above everything */}
      <Box sx={{ position: 'absolute', top: 80, left: 10, zIndex: 25, display: 'flex', flexDirection: 'column', gap: 0.5, pointerEvents: 'none' }}>
        <Typography sx={{ color: NEON_CYAN, fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', textShadow: '0 0 8px rgba(0,245,212,0.8)' }}>
          {live.isAI ? 'Practice Mode' : 'Live Mode Active'}
        </Typography>
        <Typography sx={{ color: NEON_GOLD, fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 0 8px rgba(255,215,0,0.6)' }}>
          BANK: {live.userCoins} 🪙
        </Typography>
        {live.tablePot > 0 && (
          <Typography sx={{ color: NEON_CYAN, fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 0 8px rgba(0,242,234,0.8)' }}>
            💰 קופה: {live.tablePot} 🪙
          </Typography>
        )}
      </Box>

      {/* Gift rain */}
      {live.giftRain && (
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, fontSize: '4rem', pointerEvents: 'none' }}>
          {live.giftRain.icon}
        </Box>
      )}
    </Box>
  );
}
