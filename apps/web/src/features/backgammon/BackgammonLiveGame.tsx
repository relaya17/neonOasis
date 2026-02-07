/**
 * מסך משחק ששבש Live — BANK בפינה, onEvent ללוח, BackgammonLiveUI.
 * גרסה חלופית ל-BoardContainer עם layout לפי הדוגמה (BANK ב־top: 80, left: 20).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { BackgammonState } from '@neon-oasis/shared';
import { getWinner } from '@neon-oasis/shared';
import { useBackgammonStore } from './store';
import { useWalletStore } from '../store';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { useLiveStore } from '../../shared/store/liveStore';
import { useBackgammonLogic } from '../../hooks/useBackgammonLogic';
import { BackgammonBoard3D } from './Board3D';
import { BackgammonLiveUI } from './BackgammonLiveUI';
import { socketService } from '../../api/socketService';
import { playSound, playVoice } from '../../shared/audio';

const NEON_GOLD = '#ffd700';
const NEON_CYAN = '#00f5d4';
const ENTRY_FEE = 50;
const TABLE_RAKE = 0.1;

type TableUpdatePayload = {
  state?: BackgammonState & { lastAction?: string };
  winner?: number | null;
};

const giftIcons: Record<string, string> = {
  rose: '🌹',
  diamond: '💎',
  crown: '👑',
  beer: '🍺',
};

export function BackgammonLiveGame({ tableId }: { tableId: string }) {
  const navigate = useNavigate();
  const userId = useWalletStore((s) => s.userId);
  const token = userId ?? 'user-verified-token';
  const setState = useBackgammonStore((s) => s.setState);
  const apiOnline = useApiStatusStore((s) => s.online);
  const registerGiftHandler = useLiveStore((s) => s.registerGiftHandler);
  const { userCoins, setUserCoins, sendGift } = useBackgammonLogic();

  const [tablePot, setTablePot] = useState(0);
  const [giftRain, setGiftRain] = useState<{ icon: string; id: string } | null>(null);
  const [boomMessage, setBoomMessage] = useState<string | null>(null);
  const tablePotRef = useRef(0);
  const paidOutRef = useRef(false);

  useEffect(() => {
    tablePotRef.current = tablePot;
  }, [tablePot]);

  const handleGameEvent = useCallback((message: string) => {
    setBoomMessage(message);
  }, []);

  const handleGiftReceived = useCallback(
    (giftId: string) => {
      const success = sendGift(giftId);
      if (success) {
        setGiftRain({ icon: giftIcons[giftId] ?? '🎁', id: giftId });
        setTimeout(() => setGiftRain(null), 2500);
      }
    },
    [sendGift]
  );

  useEffect(() => {
    registerGiftHandler((gift: { id: string; label: string; icon: string }) => {
      setGiftRain({ icon: gift.icon, id: gift.id });
      setTimeout(() => setGiftRain(null), 2500);
    });
    return () => registerGiftHandler(null);
  }, [registerGiftHandler]);

  const addToPot = () => {
    if (userCoins < ENTRY_FEE) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('אין מספיק מטבעות לדמי כניסה.');
      }
      return;
    }
    playSound('neon_click');
    paidOutRef.current = false;
    setUserCoins((c) => c - ENTRY_FEE);
    setTablePot((p) => p + ENTRY_FEE);
  };

  useEffect(() => {
    let mounted = true;
    const cleanup = () => {
      socketService.offTableUpdate();
      socketService.offGameOver();
      socketService.offBetPlaced();
      socketService.disconnect();
    };
    const bypassApi = (import.meta.env as { VITE_DEV_BYPASS_API?: string }).VITE_DEV_BYPASS_API === 'true';
    if (apiOnline === false || bypassApi) {
      cleanup();
      return () => {
        mounted = false;
      };
    }
    socketService
      .connect(token)
      .then(() => {
        if (!mounted) return;
        socketService.joinTable(tableId);
        socketService.onTableUpdate((payload: TableUpdatePayload) => {
          if (!mounted) return;
          const p = payload as TableUpdatePayload;
          if (p?.state) {
            setState(p.state);
            if (p.state.lastAction === 'HIT') {
              setBoomMessage(`Ouch! ${p.state.turn === 0 ? 'ורוד' : 'ציאן'} נאכל! 🎯`);
            }
            const winner = getWinner(p.state);
            if (winner !== -1) {
              setBoomMessage(`🏆 סוף משחק! המנצח: ${winner === 0 ? 'ציאן' : 'ורוד'}`);
            }
          }
        });
        socketService.onGameOver((data) => {
          if (!mounted) return;
          const isWinner = data?.winnerId === userId;
          if (isWinner) {
            playSound('win');
            playVoice('win');
            const pot = tablePotRef.current;
            if (pot > 0 && !paidOutRef.current) {
              paidOutRef.current = true;
              setUserCoins((c) => c + Math.floor(pot * (1 - TABLE_RAKE)));
              setTablePot(0);
            }
          } else {
            playSound('lose');
            playVoice('loss');
            if (tablePotRef.current > 0) setTablePot(0);
          }
        });
        socketService.onBetPlaced(() => {
          if (!mounted) return;
          playSound('coin');
          playVoice('stake');
        });
      })
      .catch((err) => {
        if (err?.message?.includes('disconnect') || err?.message?.includes('BYPASS_API')) return;
        console.warn('Socket connect failed:', err?.message ?? err);
      });
    return () => {
      mounted = false;
      cleanup();
    };
  }, [apiOnline, tableId, token, setState]);

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
      <BackgammonLiveUI
        boomMessage={boomMessage}
        onBoomShown={() => setBoomMessage(null)}
        onGiftSent={handleGiftReceived}
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              playSound('neon_click');
              navigate('/');
            }}
            sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }}
            aria-label="חזרה לדף הבית"
          >
            ← חזרה
          </Button>
          <Typography variant="h6" sx={{ color: NEON_GOLD, fontWeight: 'bold', textShadow: `0 0 20px ${NEON_GOLD}40`, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            ששבש Live
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: NEON_GOLD, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>🪙 {userCoins}</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={addToPot}
              disabled={userCoins < ENTRY_FEE}
              sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }}
              aria-label="הכנס לקופה"
            >
              הכנס {ENTRY_FEE} 🪙
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: { xs: '50vh', sm: '60vh' },
            maxHeight: '75vh',
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', height: '100%', maxWidth: 560, maxHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* BANK בפינה — top: 80, left: 20 כמו בדוגמה */}
            <Box
              sx={{
                position: 'absolute',
                top: 80,
                left: 20,
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Typography sx={{ color: NEON_GOLD, fontSize: '1rem', fontWeight: 'bold', textShadow: '0 0 12px rgba(255,215,0,0.8)' }}>
                BANK: {userCoins} 🪙
              </Typography>
              {tablePot > 0 && (
                <Typography sx={{ color: NEON_CYAN, fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 0 8px rgba(0,242,234,0.8)' }}>
                  💰 קופה: {tablePot} 🪙
                </Typography>
              )}
            </Box>

            <BackgammonBoard3D
              tableId={tableId}
              onMove={(from, to) => {
                socketService.sendMove(tableId, { from, to });
                playSound('neon_click');
              }}
              onEvent={handleGameEvent}
            />
          </Box>
        </Box>
      </Box>

      {giftRain && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            fontSize: '4rem',
            animation: 'giftPop 2.5s ease-out forwards',
            pointerEvents: 'none',
          }}
        >
          {giftRain.icon}
        </Box>
      )}
    </Box>
  );
}
