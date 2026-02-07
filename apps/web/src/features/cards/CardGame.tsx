/**
 * רמי אבנים (Rummy Stones) — משחק אבנים בסגנון רומיקוב
 * קבוצות (אותו מספר, צבעים שונים) וסדרות (רצף באותו צבע)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { playSound } from '../../shared/audio';
import { RUMMY_INTRO_VIDEO_URL } from '../../config/videoUrls';
import { fullScreenVideoStyle } from '../../config/videoStyles';

const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00'] as const; // אדום, כחול, ירוק, כתום
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const COPIES = 2; // שני עותקים מכל אבן

export interface Tile {
  number: number;
  color: string;
  id: string;
}

function createTiles(): Tile[] {
  const tiles: Tile[] = [];
  COLORS.forEach((color) => {
    NUMBERS.forEach((num) => {
      for (let c = 0; c < COPIES; c++) {
        tiles.push({
          number: num,
          color,
          id: `${num}-${color}-${c}-${Math.random().toString(36).slice(2, 9)}`,
        });
      }
    });
  });
  return tiles;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** קבוצה תקנית: 3–4 אבנים עם אותו מספר, צבעים שונים */
function isValidSet(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 4) return false;
  const num = tiles[0].number;
  const colors = new Set(tiles.map((t) => t.color));
  return tiles.every((t) => t.number === num) && colors.size === tiles.length;
}

/** סדרה תקנית: 3+ אבנים באותו צבע, מספרים עוקבים */
function isValidRun(tiles: Tile[]): boolean {
  if (tiles.length < 3) return false;
  const color = tiles[0].color;
  const sorted = [...tiles].sort((a, b) => a.number - b.number);
  if (!sorted.every((t) => t.color === color)) return false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].number !== sorted[i - 1].number + 1) return false;
  }
  return true;
}

function isValidGroup(tiles: Tile[]): boolean {
  return isValidSet(tiles) || isValidRun(tiles);
}

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

/** טבלה = מערך קבוצות; כל קבוצה = מערך אבנים */
type Table = Tile[][];

export interface TouchCardGameProps {
  /** נקרא כשמונחת קבוצה/סדרה תקנית על השולחן (למשל ל-BOOM בלייב) */
  onPlaceGroup?: (tilesCount: number, isRun: boolean) => void;
  /** נקרא כשחקן רוקן את היד (ניצחון) */
  onWin?: () => void;
}

export function TouchCardGame({ onPlaceGroup, onWin }: TouchCardGameProps = {}) {
  const navigate = useNavigate();
  const [showIntroVideo, setShowIntroVideo] = useState(!!RUMMY_INTRO_VIDEO_URL);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [pool, setPool] = useState<Tile[]>(() => shuffle(createTiles()));
  const [hand, setHand] = useState<Tile[]>([]);
  const [table, setTable] = useState<Table>([]);
  const [selectedHandIndices, setSelectedHandIndices] = useState<Set<number>>(new Set());
  const [pendingGroup, setPendingGroup] = useState<Tile[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (showIntroVideo && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [showIntroVideo]);

  const initialDealDone = hand.length > 0;
  const handSize = 14;

  const dealInitialHand = () => {
    if (pool.length < handSize) return;
    const drawn = pool.slice(0, handSize);
    setPool((p) => p.slice(handSize));
    setHand(drawn);
    setMessage('בחר אבנים ליד ואז "הנח על השולחן", או "גרוף" כדי לקחת אבן.');
  };

  const drawOne = () => {
    if (pool.length === 0) {
      setMessage('אין עוד אבנים בגורל.');
      return;
    }
    playSound('card_flip');
    const [tile] = pool;
    setPool((p) => p.slice(1));
    setHand((h) => [...h, tile]);
    setMessage('אבן נגרה. הנח קבוצה/סדרה או גרוף שוב.');
  };

  const toggleHandSelection = (index: number) => {
    setSelectedHandIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectedTiles = useMemo(() => {
    return Array.from(selectedHandIndices)
      .sort((a, b) => a - b)
      .map((i) => hand[i]);
  }, [hand, selectedHandIndices]);

  const placeSelectedOnTable = () => {
    if (selectedTiles.length === 0) {
      setMessage('בחר אבנים מהיד.');
      return;
    }
    if (!isValidGroup(selectedTiles)) {
      setMessage('לא תקף: קבוצה = 3–4 אותו מספר צבעים שונים; סדרה = 3+ רצף באותו צבע.');
      return;
    }
    playSound('chip_stack');
    const isRun = isValidRun(selectedTiles);
    const count = selectedTiles.length;
    const indices = Array.from(selectedHandIndices).sort((a, b) => b - a);
    setHand((h) => indices.reduce((acc, i) => acc.filter((_, idx) => idx !== i), [...h]));
    setTable((t) => [...t, [...selectedTiles]]);
    setSelectedHandIndices(new Set());
    setMessage('');
    onPlaceGroup?.(count, isRun);
    const newHandSize = hand.length - count;
    if (newHandSize === 0) {
      setMessage('🎉 ניצחת! רוקנת את היד.');
      onWin?.();
    }
  };

  const addToPending = () => {
    if (selectedTiles.length === 0) return;
    setPendingGroup((p) => [...p, ...selectedTiles]);
    const indices = Array.from(selectedHandIndices).sort((a, b) => b - a);
    setHand((h) => indices.reduce((acc, i) => acc.filter((_, idx) => idx !== i), [...h]));
    setSelectedHandIndices(new Set());
  };

  const placePendingAsGroup = () => {
    if (pendingGroup.length === 0) return;
    if (!isValidGroup(pendingGroup)) {
      setMessage('הקבוצה ב"ממתין" אינה תקפה.');
      return;
    }
    playSound('chip_stack');
    setTable((t) => [...t, [...pendingGroup]]);
    setPendingGroup([]);
    setMessage('');
  };

  const clearPending = () => {
    if (pendingGroup.length === 0) return;
    setHand((h) => [...h, ...pendingGroup]);
    setPendingGroup([]);
    setMessage('');
  };

  const handleNewGame = () => {
    playSound('neon_click');
    const tiles = shuffle(createTiles());
    setPool(tiles);
    setHand([]);
    setTable([]);
    setSelectedHandIndices(new Set());
    setPendingGroup([]);
    setMessage('');
  };

  if (showIntroVideo && RUMMY_INTRO_VIDEO_URL) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          bgcolor: '#000',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <video
          ref={introVideoRef}
          src={RUMMY_INTRO_VIDEO_URL}
          muted
          playsInline
          autoPlay
          loop
          style={fullScreenVideoStyle}
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
            כניסה ללוח
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0b',
        background: 'radial-gradient(circle at 50% 50%, #1a1a1b 0%, #0a0a0b 100%)',
        p: { xs: 1, sm: 2 },
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/')}
          sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
        >
          ← חזרה
        </Button>
        <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', fontSize: { xs: '1.2rem', sm: '1.5rem' }, textShadow: `0 0 10px ${NEON_GOLD}` }}>
          🃏 רמי אבנים
        </Typography>
        <Button variant="contained" size="small" onClick={handleNewGame} sx={{ bgcolor: NEON_PINK, color: '#000', fontSize: { xs: '0.7rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
          משחק חדש
        </Button>
      </Box>

      <Paper sx={{ bgcolor: 'rgba(0, 255, 255, 0.1)', border: `1px solid ${NEON_CYAN}`, borderRadius: 1, p: 1.5, mb: 2, textAlign: 'center' }}>
        <Typography sx={{ color: '#fff', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          🎯 <strong>מטרה:</strong> להיפטר מכל האבנים ביד. <strong>קבוצה:</strong> 3–4 אותו מספר (צבעים שונים). <strong>סדרה:</strong> 3+ רצף באותו צבע.
        </Typography>
      </Paper>

      {!initialDealDone && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: NEON_CYAN, mb: 2 }}>לחץ כדי לחלק 14 אבנים ליד</Typography>
          <Button variant="contained" onClick={dealInitialHand} sx={{ bgcolor: NEON_CYAN, color: '#000' }}>
            חלוקה להתחלה
          </Button>
        </Box>
      )}

      {initialDealDone && (
        <>
          {/* שולחן */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: NEON_GOLD, fontSize: '0.9rem', mb: 1 }}>שולחן</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 80, p: 1, border: `1px dashed ${NEON_CYAN}66`, borderRadius: 1 }}>
              {table.map((group, gi) => (
                <Box key={gi} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  {group.map((t) => (
                    <Paper
                      key={t.id}
                      sx={{
                        width: 44,
                        height: 56,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: t.color,
                        color: '#fff',
                        fontWeight: 'bold',
                        border: '2px solid rgba(255,255,255,0.5)',
                      }}
                    >
                      <Typography sx={{ fontSize: '1.1rem' }}>{t.number}</Typography>
                    </Paper>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>

          {/* ממתין להנחה */}
          {pendingGroup.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ color: NEON_CYAN, fontSize: '0.85rem' }}>ממתין:</Typography>
              {pendingGroup.map((t) => (
                <Paper
                  key={t.id}
                  sx={{
                    width: 44,
                    height: 56,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: t.color,
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '2px solid rgba(255,255,255,0.5)',
                  }}
                >
                  {t.number}
                </Paper>
              ))}
              <Button size="small" variant="outlined" onClick={placePendingAsGroup} sx={{ borderColor: NEON_CYAN, color: NEON_CYAN }}>
                הנח על השולחן
              </Button>
              <Button size="small" variant="outlined" onClick={clearPending} sx={{ borderColor: NEON_PINK, color: NEON_PINK }}>
                החזר ליד
              </Button>
            </Box>
          )}

          {/* כפתורי פעולה */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" size="small" onClick={drawOne} sx={{ bgcolor: NEON_CYAN, color: '#000' }}>
              גרוף אבן
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={placeSelectedOnTable}
              disabled={selectedTiles.length === 0 || !isValidGroup(selectedTiles)}
              sx={{ bgcolor: NEON_GOLD, color: '#000' }}
            >
              הנח קבוצה/סדרה מהיד
            </Button>
            <Button variant="outlined" size="small" onClick={addToPending} disabled={selectedTiles.length === 0} sx={{ borderColor: NEON_GOLD, color: NEON_GOLD }}>
              הוסף ל"ממתין"
            </Button>
          </Box>

          {message && (
            <Typography sx={{ color: message.includes('🎉') ? NEON_GOLD : NEON_CYAN, fontSize: '0.9rem', mb: 1 }}>
              {message}
            </Typography>
          )}

          {/* יד */}
          <Box>
            <Typography sx={{ color: NEON_GOLD, fontSize: '0.9rem', mb: 1 }}>
              היד ({hand.length}) • גורל: {pool.length}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {hand.map((tile, index) => (
                <motion.div key={tile.id} layout>
                  <Paper
                    onClick={() => toggleHandSelection(index)}
                    sx={{
                      width: { xs: 42, sm: 48 },
                      height: { xs: 54, sm: 62 },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: tile.color,
                      color: '#fff',
                      fontWeight: 'bold',
                      border: selectedHandIndices.has(index) ? `3px solid ${NEON_GOLD}` : '2px solid rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      boxShadow: selectedHandIndices.has(index) ? `0 0 12px ${NEON_GOLD}` : 'none',
                    }}
                  >
                    <Typography sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>{tile.number}</Typography>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          </Box>

          <Typography sx={{ color: '#666', fontSize: '0.75rem', textAlign: 'center', mt: 2 }}>
            💡 בחר אבנים מהיד → "הנח קבוצה/סדרה" אם התקף; או "הוסף לממתין" ואז הנח אחרי שתשלים קבוצה תקפה.
          </Typography>
        </>
      )}
    </Box>
  );
}
