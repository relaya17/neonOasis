/**
 * מסך משחק ששבש Live — BANK בפינה, onEvent ללוח, BackgammonLiveUI.
 * גרסה חלופית ל-BoardContainer עם layout לפי הדוגמה (BANK ב־top: 80, left: 20).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import type { GameMode } from '../../shared/hooks/useLiveGame';
import type { BackgammonState } from '@neon-oasis/shared';
import { getWinner } from '@neon-oasis/shared';
import { useBackgammonStore } from './store';
import { BackgammonBoard3D } from './Board3D';
import { LiveUI } from '../../shared/components/LiveUI';
import { useLiveGame } from '../../shared/hooks/useLiveGame';
import { socketService } from '../../api/socketService';
import { playSound, playVoice } from '../../shared/audio';
import { BACKGAMMON_INTRO_VIDEO_URL } from '../../config/videoUrls';
import { responsiveVideoStyle } from '../../config/videoStyles';

const NEON_GOLD = '#ffd700';
const NEON_CYAN = '#00f5d4';
const ENTRY_FEE = 50;
const TABLE_RAKE = 0.1;

type TableUpdatePayload = {
  state?: BackgammonState & { lastAction?: string };
  winner?: number | null;
};

export function BackgammonLiveGame({ tableId }: { tableId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeMode = (location.state as { mode?: GameMode })?.mode ?? 'pvp';
  const setState = useBackgammonStore((s) => s.setState);

  /* ── Shared live hook ─────────────────────────── */
  const live = useLiveGame({
    tableId,
    entryFee: ENTRY_FEE,
    rake: TABLE_RAKE,
    gameMode: routeMode,
  });

  /* ── Intro video state ──────────────────────────── */
  const [showIntroVideo, setShowIntroVideo] = useState(!!BACKGAMMON_INTRO_VIDEO_URL);
  const introVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showIntroVideo && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [showIntroVideo]);

  const tablePotRef = useRef(0);
  const paidOutRef = useRef(false);

  useEffect(() => { tablePotRef.current = live.tablePot; }, [live.tablePot]);

  const handleGameEvent = useCallback((message: string) => {
    live.setBoomMessage(message);
  }, [live.setBoomMessage]);

  /* ── Socket listeners (backgammon-specific) ──── */
  useEffect(() => {
    if (!live.isConnected) return;
    let mounted = true;

    socketService.onTableUpdate((payload: TableUpdatePayload) => {
      if (!mounted) return;
      if (payload?.state) {
        setState(payload.state);
        if (payload.state.lastAction === 'HIT') {
          live.setBoomMessage(`Ouch! ${payload.state.turn === 0 ? 'ורוד' : 'ציאן'} נאכל! 🎯`);
        }
        const winner = getWinner(payload.state);
        if (winner !== -1) {
          live.setBoomMessage(`🏆 סוף משחק! המנצח: ${winner === 0 ? 'ציאן' : 'ורוד'}`);
        }
      }
    });

    socketService.onGameOver((data) => {
      if (!mounted) return;
      const userId = live.userCoins; // just for scope — actual userId checked below
      const isWinner = data?.winnerId != null;
      if (isWinner) {
        playSound('win');
        playVoice('win');
        const prize = live.payoutWinner();
        if (prize > 0) live.setBoomMessage(`🏆 ניצחון! קיבלת ${prize} 🪙`);
      } else {
        playSound('lose');
        playVoice('loss');
      }
    });

    socketService.onBetPlaced(() => {
      if (!mounted) return;
      playSound('coin');
      playVoice('stake');
    });

    return () => {
      mounted = false;
      socketService.offTableUpdate();
      socketService.offGameOver();
      socketService.offBetPlaced();
    };
  }, [live.isConnected, setState, live.setBoomMessage, live.payoutWinner]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        bgcolor: '#000',
        background: 'radial-gradient(ellipse at 50% 30%, #0a1a0f 0%, #000 70%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 1, sm: 2 },
        overflowX: 'hidden',
      }}
    >
      {/* ── Intro video layer (with LiveUI on top = live stream feel) ── */}
      {showIntroVideo && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 900, bgcolor: '#000' }}>
          <video ref={introVideoRef} src={BACKGAMMON_INTRO_VIDEO_URL} muted playsInline autoPlay loop style={responsiveVideoStyle} />
          {/* LiveUI over the video — looks like a live stream */}
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
            <LiveUI
              gameName="ששבש Live"
              boomMessage={live.boomMessage}
              onBoomShown={() => live.setBoomMessage(null)}
              onGiftSent={live.handleGiftSent}
            />
          </Box>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, display: 'flex', justifyContent: 'center', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', zIndex: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => { playSound('neon_click'); setShowIntroVideo(false); }}
              sx={{ bgcolor: NEON_GOLD, color: '#000', fontWeight: 'bold', fontSize: '1.1rem', px: 4, py: 1.5, '&:hover': { bgcolor: NEON_GOLD, opacity: 0.9 } }}
            >
              כניסה למשחק
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Shared LiveUI overlay (game mode) ────── */}
      <LiveUI
        gameName="ששבש Live"
        boomMessage={live.boomMessage}
        onBoomShown={() => live.setBoomMessage(null)}
        onGiftSent={live.handleGiftSent}
      />

      <Box sx={{ width: '100%', maxWidth: 720, margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: 0 }}>
        {/* AI Practice badge */}
        {live.isAI && (
          <Box sx={{ bgcolor: 'rgba(0,245,212,0.15)', border: '1px solid rgba(0,245,212,0.4)', borderRadius: 2, px: 2, py: 0.5, mb: 1 }}>
            <Typography sx={{ color: NEON_CYAN, fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>
              🤖 מצב אימון (AI) — ללא רווח כספי
            </Typography>
          </Box>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => { playSound('neon_click'); navigate('/'); }} sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }} aria-label="חזרה">
            ← חזרה
          </Button>
          <Typography variant="h6" sx={{ color: NEON_GOLD, fontWeight: 'bold', textShadow: `0 0 20px ${NEON_GOLD}40`, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {live.isAI ? 'ששבש — אימון' : 'ששבש Live'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: NEON_GOLD, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>🪙 {live.userCoins}</Typography>
            <Button variant="outlined" size="small" onClick={live.addToPot} disabled={live.userCoins < ENTRY_FEE} sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }} aria-label="הכנס לקופה">
              הכנס {ENTRY_FEE} 🪙
            </Button>
          </Box>
        </Box>

        {/* Board area */}
        <Box sx={{ position: 'relative', width: '100%', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: '50vh', sm: '60vh' }, maxHeight: '75vh' }}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%', maxWidth: 560, maxHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* BANK */}
            <Box sx={{ position: 'absolute', top: 80, left: 20, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ color: NEON_GOLD, fontSize: '1rem', fontWeight: 'bold', textShadow: '0 0 12px rgba(255,215,0,0.8)' }}>
                BANK: {live.userCoins} 🪙
              </Typography>
              {live.tablePot > 0 && (
                <Typography sx={{ color: NEON_CYAN, fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 0 8px rgba(0,242,234,0.8)' }}>
                  💰 קופה: {live.tablePot} 🪙
                </Typography>
              )}
            </Box>

            <BackgammonBoard3D
              tableId={tableId}
              onMove={(from, to) => { socketService.sendMove(tableId, { from, to }); playSound('neon_click'); }}
              onEvent={handleGameEvent}
            />
          </Box>
        </Box>
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
