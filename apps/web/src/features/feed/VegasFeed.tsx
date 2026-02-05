import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CasinoIcon from '@mui/icons-material/Casino';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './GameScene';
import { ContentSkeleton } from '../../shared/components';
import { useGeo } from '../../shared/hooks/useGeo';
import { hapticClick, useWebGLContextLoss } from '../../shared/hooks';
import { playSound } from '../../shared/audio';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { useWalletStore } from '../store';

export interface GameRoom {
  id: string;
  playerId: string;
  type: 'BACKGAMMON' | 'SNOOKER' | 'CARDS';
  host: string;
  spectators: number;
}

const mockRooms: GameRoom[] = [
  { id: 'room-1', playerId: '00000000-0000-0000-0000-000000000011', type: 'SNOOKER', host: 'Tony_Montana', spectators: 1240 },
  { id: 'room-2', playerId: '00000000-0000-0000-0000-000000000022', type: 'BACKGAMMON', host: 'The_Cowboy', spectators: 850 },
  { id: 'room-3', playerId: '00000000-0000-0000-0000-000000000033', type: 'CARDS', host: 'Vegas_Queen', spectators: 3200 },
];

const SLIDE_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 800;

const FEED_LOAD_MS = 400;
const API_URL = import.meta.env.VITE_API_URL ?? '';
const DEFAULT_BACK_ODDS = 1.8;

export function VegasFeed() {
  const parentRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [backingOpen, setBackingOpen] = useState(false);
  const [backingRoom, setBackingRoom] = useState<GameRoom | null>(null);
  const [backingAmount, setBackingAmount] = useState('5');
  const [backingError, setBackingError] = useState<string | null>(null);
  const [backingSuccess, setBackingSuccess] = useState<string | null>(null);
  const [backingSubmitting, setBackingSubmitting] = useState(false);
  const [backingCancellingId, setBackingCancellingId] = useState<string | null>(null);
  const [backingHistory, setBackingHistory] = useState<
    { id: string; gameId: string; playerId: string; amount: string; odds: string; status: string; payoutAmount?: string | null }[]
  >([]);
  const [backingOdds, setBackingOdds] = useState(DEFAULT_BACK_ODDS);
  const { playForCoinsAllowed } = useGeo();
  const apiOnline = useApiStatusStore((s) => s.online);
  const { webglLost, onCanvasCreated } = useWebGLContextLoss();
  const userId = useWalletStore((s) => s.userId);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), FEED_LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!backingOpen || !userId) return;
    fetch(`${API_URL}/api/games/p2p/back/history?supporterId=${encodeURIComponent(userId)}&limit=10`)
      .then(async (res) => (res.ok ? res.json() : Promise.reject(new Error('history failed'))))
      .then((data) => {
        setBackingHistory(Array.isArray(data.history) ? data.history : []);
      })
      .catch(() => {
        setBackingHistory([]);
      });
  }, [backingOpen, userId]);

  useEffect(() => {
    if (!backingOpen || !backingRoom) return;
    fetch(
      `${API_URL}/api/games/p2p/back/odds?gameId=${encodeURIComponent(backingRoom.id)}&playerId=${encodeURIComponent(backingRoom.playerId)}`
    )
      .then(async (res) => (res.ok ? res.json() : Promise.reject(new Error('odds failed'))))
      .then((data) => {
        if (typeof data?.odds === 'number') setBackingOdds(data.odds);
      })
      .catch(() => {
        setBackingOdds(DEFAULT_BACK_ODDS);
      });
  }, [backingOpen, backingRoom]);

  const openBacking = (room: GameRoom) => {
    setBackingRoom(room);
    setBackingAmount('5');
    setBackingError(null);
    setBackingSuccess(null);
    setBackingOdds(DEFAULT_BACK_ODDS);
    setBackingOpen(true);
  };

  const submitBacking = async () => {
    if (!backingRoom || !userId) return;
    const amt = parseFloat(backingAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setBackingError('סכום לא תקין');
      return;
    }
    setBackingSubmitting(true);
    setBackingError(null);
    setBackingSuccess(null);
    try {
      const res = await fetch(`${API_URL}/api/games/p2p/back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: backingRoom.id,
          supporterId: userId,
          playerId: backingRoom.playerId,
          amount: backingAmount,
          odds: backingOdds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Backing failed');
      }
      setBackingSuccess('ההימור נקלט. בהצלחה!');
      playSound('click');
      hapticClick();
    } catch (err) {
      setBackingError(err instanceof Error ? err.message : 'Backing failed');
    } finally {
      setBackingSubmitting(false);
    }
  };

  const cancelBacking = async (betId: string) => {
    if (!userId) return;
    setBackingCancellingId(betId);
    try {
      const res = await fetch(`${API_URL}/api/games/p2p/back/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, supporterId: userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Cancel failed');
      }
      setBackingHistory((prev) =>
        prev.map((bet) => (bet.id === betId ? { ...bet, status: 'refunded' } : bet))
      );
    } catch (err) {
      setBackingError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setBackingCancellingId(null);
    }
  };

  const virtualizer = useVirtualizer({
    count: mockRooms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => SLIDE_HEIGHT,
    overscan: 1,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0b' }}>
        <ContentSkeleton rows={4} rowHeight={140} />
      </Box>
    );
  }

  return (
    <>
      <Box
      ref={parentRef}
      onScroll={() => {
        const scrollTop = parentRef.current?.scrollTop ?? 0;
        const next = Math.round(scrollTop / SLIDE_HEIGHT);
        if (next !== activeIndex) setActiveIndex(Math.max(0, Math.min(next, mockRooms.length - 1)));
      }}
      sx={{
        height: '100%',
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        position: 'relative',
      }}
      role="feed"
      aria-label="Game rooms feed"
    >
      {/* Help Banner */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 101,
          bgcolor: 'rgba(0, 255, 255, 0.2)',
          borderBottom: '2px solid #00ffff',
          color: '#00ffff',
          textAlign: 'center',
          fontSize: '1rem',
          py: 1.5,
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)',
        }}
      >
        👆 גלול לראות חדרים • לחץ על "🎲 שחק עכשיו" להתחלת משחק!
      </Box>
      
      {apiOnline === false && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            bgcolor: 'rgba(255, 0, 85, 0.12)',
            borderBottom: '1px solid rgba(255, 0, 85, 0.3)',
            color: '#ff4d9a',
            textAlign: 'center',
            fontSize: '0.85rem',
            py: 0.5,
          }}
        >
          ה־API לא זמין — חדרים מדמי.
        </Box>
      )}
      {webglLost && (
        <Box
          role="alert"
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.9)',
            zIndex: 200,
            textAlign: 'center',
            p: 3,
          }}
        >
          <Box>
            <Typography sx={{ color: '#ff4d9a', mb: 1, fontWeight: 600 }}>
              WebGL הושבת
            </Typography>
            <Typography sx={{ color: '#ccc', mb: 2, fontSize: '0.9rem' }}>
              רענן את הדף או סגור טאב־ים כדי לשחרר זיכרון.
            </Typography>
            <Box
              component="button"
              onClick={() => window.location.reload()}
              sx={{
                px: 2,
                py: 1,
                border: '1px solid #00ffff',
                color: '#00ffff',
                bgcolor: 'transparent',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(0,255,255,0.1)' },
              }}
            >
              רענן
            </Box>
          </Box>
        </Box>
      )}
      <Box
        sx={{
          height: `${totalHeight}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow: { index: number; size: number; start: number }) => {
          const room = mockRooms[virtualRow.index];
          const isActive = activeIndex === virtualRow.index;
          return (
            <Box
              key={room.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                scrollSnapAlign: 'start',
                background: '#000',
              }}
            >
              {/* Live Preview 3D — Cinematic Camera בזוויות אקשן (GameScene) */}
              <Box sx={{ position: 'absolute', inset: 0 }}>
                {!webglLost ? (
                  <Canvas onCreated={onCanvasCreated}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} color="#ff00ff" />
                    <GameScene type={room.type} isActive={isActive} />
                  </Canvas>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      bgcolor: '#050505',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#666' }}>WebGL לא זמין</Typography>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 40,
                  right: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                <IconButton
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }}
                  aria-label="Like"
                >
                  <FavoriteIcon />
                </IconButton>
                <Typography variant="caption" sx={{ color: '#fff' }}>
                  {room.spectators}
                </Typography>
                <IconButton
                  component={Link}
                  to="/backgammon"
                  sx={{ color: '#00ffff', bgcolor: 'rgba(255,255,255,0.1)' }}
                  aria-label="Play"
                >
                  <CasinoIcon />
                </IconButton>
                <Typography component={Link} to="/backgammon" variant="caption" sx={{ color: '#00ffff', textDecoration: 'none' }}>
                  PLAY
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openBacking(room)}
                  disabled={!playForCoinsAllowed || apiOnline === false}
                  sx={{
                    mt: 0.5,
                    borderColor: '#ffd700',
                    color: '#ffd700',
                    fontSize: '0.7rem',
                    '&:hover': { borderColor: '#ffd700', bgcolor: 'rgba(255,215,0,0.1)' },
                  }}
                >
                  Back Player
                </Button>
              </Box>

              {/* Cyber-Vegas 2.0: Join — Geo: אם playForCoinsAllowed=false → "Play for Fun" */}
              <Box
                component={Link}
                to="/backgammon"
                onClick={() => {
                  playSound('click');
                  hapticClick();
                }}
                sx={{
                  position: 'absolute',
                  bottom: 100,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  px: 5,
                  py: 2.5,
                  borderRadius: 3,
                  border: playForCoinsAllowed ? '3px solid #00ffff' : '3px solid #888',
                  bgcolor: playForCoinsAllowed ? '#00ffff' : 'rgba(128,128,128,0.3)',
                  color: playForCoinsAllowed ? '#000' : '#fff',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  textDecoration: 'none',
                  boxShadow: playForCoinsAllowed ? '0 0 40px #00ffff' : '0 0 20px rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  '&:hover': { 
                    bgcolor: playForCoinsAllowed ? '#00ffff' : 'rgba(128,128,128,0.5)', 
                    boxShadow: playForCoinsAllowed ? '0 0 60px #00ffff, 0 0 20px #00ffff inset' : '0 0 30px rgba(255,255,255,0.5)',
                    transform: 'translateX(-50%) scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {playForCoinsAllowed ? '🎲 שחק עכשיו / PLAY NOW 🎲' : '🎲 שחק חינם / PLAY FREE 🎲'}
              </Box>
              <Box sx={{ position: 'absolute', bottom: 40, left: 20, zIndex: 10 }}>
                <Typography
                  variant="h6"
                  sx={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}
                >
                  @{room.host}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Playing {room.type} in the Velvet Lounge
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      </Box>
      <Dialog
      open={backingOpen}
      onClose={() => setBackingOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { bgcolor: '#0a0a0b', border: '1px solid #ffd700' } }}
    >
      <DialogTitle sx={{ color: '#ffd700', fontFamily: "'Orbitron', sans-serif" }}>
        Social Backing
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
          גבו את @{backingRoom?.host} והרוויחו יחד איתו.
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
          Odds: {backingOdds}x · Potential: {(() => {
            const amt = parseFloat(backingAmount);
            return Number.isFinite(amt) ? (amt * backingOdds).toFixed(2) : '--';
          })()}
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Amount"
          value={backingAmount}
          onChange={(e) => setBackingAmount(e.target.value)}
          sx={{ mb: 2, bgcolor: '#111', borderRadius: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {['5', '10', '25'].map((v) => (
            <Button
              key={v}
              variant={backingAmount === v ? 'contained' : 'outlined'}
              onClick={() => setBackingAmount(v)}
              sx={{
                borderColor: '#00ffff',
                color: backingAmount === v ? '#0a0a0b' : '#00ffff',
                bgcolor: backingAmount === v ? '#00ffff' : 'transparent',
              }}
            >
              {v}
            </Button>
          ))}
        </Box>
        {backingError && <Alert severity="error" sx={{ mb: 1 }}>{backingError}</Alert>}
        {backingSuccess && <Alert severity="success" sx={{ mb: 1 }}>{backingSuccess}</Alert>}
        {backingHistory.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#888' }}>
              ההימורים האחרונים שלך
            </Typography>
            <Box sx={{ mt: 1, display: 'grid', gap: 0.5 }}>
              {backingHistory.map((bet) => (
                <Box
                  key={bet.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    bgcolor: '#111',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    color: bet.status === 'won' ? '#00f5d4' : bet.status === 'lost' ? '#ff4d9a' : '#ccc',
                  }}
                >
                  <span>{bet.gameId}</span>
                  <span>{bet.amount}</span>
                  <span>{bet.status}</span>
                  {bet.status === 'pending' && (
                    <Button
                      size="small"
                      onClick={() => cancelBacking(bet.id)}
                      disabled={backingCancellingId === bet.id}
                      sx={{
                        minWidth: 'auto',
                        color: '#ffd700',
                        fontSize: '0.65rem',
                        px: 1,
                      }}
                    >
                      בטל
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setBackingOpen(false)} sx={{ color: '#888' }}>
          סגור
        </Button>
        <Button
          onClick={submitBacking}
          disabled={backingSubmitting || apiOnline === false || !playForCoinsAllowed}
          sx={{ color: '#ffd700' }}
        >
          שלח הימור
        </Button>
      </DialogActions>
      </Dialog>
    </>
  );
}
