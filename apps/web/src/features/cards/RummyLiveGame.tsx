/**
 * RummyLiveGame — Container לרמי אבנים לייב.
 * מבנה אחיד: useLiveGame (socket/pot/gifts) + LiveUI (overlay) + TouchCardGame (rendering).
 */

import React, { useMemo } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { TouchCardGame } from './CardGame';
import { LiveUI } from '../../shared/components/LiveUI';
import { useLiveGame } from '../../shared/hooks/useLiveGame';
import type { GameMode } from '../../shared/hooks/useLiveGame';
import { useRummyLogic } from './useRummyLogic';

const NEON_CYAN = '#00f5d4';
const NEON_GOLD = '#ffd700';

const ENTRY_FEE = 50;
const TABLE_RAKE = 0.1;

const COLORS = { neonCyan: NEON_CYAN, neonGold: NEON_GOLD };

export function RummyLiveGame() {
  const location = useLocation();
  const routeMode = useMemo(() => (location.state as { mode?: GameMode })?.mode ?? 'pvp', [location.state]);

  /* ── Shared live hook ─────────────────────────── */
  const live = useLiveGame({
    tableId: 'rummy-main',
    entryFee: ENTRY_FEE,
    rake: TABLE_RAKE,
    gameMode: routeMode,
  });

  const { handlePlaceGroup, handleWin } = useRummyLogic(live);

  return (
    <Box sx={{ position: 'relative', width: '100vw', height: '100vh', bgcolor: '#000', overflow: 'hidden' }}>
      {/* Layer 1: Game (touch-optimized) — lowest z */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', touchAction: 'none' }}>
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

      {/* Status overlay */}
      <StatusOverlay live={live} />

      {/* Gift rain */}
      <Fade in={!!live.giftRain}>
        <Box sx={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999, fontSize: '5rem', pointerEvents: 'none', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }}>
          {live.giftRain?.icon}
        </Box>
      </Fade>
    </Box>
  );
}

const StatusOverlay = React.memo(({ live }: { live: ReturnType<typeof useLiveGame> }) => (
  <Box sx={{ position: 'absolute', top: 80, left: 16, zIndex: 20, pointerEvents: 'none' }}>
    <Typography sx={{ color: COLORS.neonCyan, fontSize: '0.7rem', fontWeight: 900, letterSpacing: 1 }}>
      {live.isAI ? 'PRACTICE MODE' : 'LIVE MODE'}
    </Typography>
    <Typography sx={{ color: COLORS.neonGold, fontSize: '1.1rem', fontWeight: 'bold' }}>
      BANK: {live.userCoins.toLocaleString()} 🪙
    </Typography>
    {live.tablePot > 0 && (
      <Typography sx={{ color: '#fff', fontSize: '0.9rem', opacity: 0.9 }}>
        POT: {live.tablePot} 💰
      </Typography>
    )}
  </Box>
));
