/**
 * חדר משחק חי בפיד — לוח במרכז, שחקנים עם הילה וסטטיסטיקה, Double-tap לייק.
 * TikTok-style: הילה לשחקן בתור, Win Rate / Win Streak, לחיצה כפולה = לב.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Box, Stack, IconButton, Typography, Button } from '@mui/material';
import CardGiftcard from '@mui/icons-material/CardGiftcard';
import Visibility from '@mui/icons-material/Visibility';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Favorite from '@mui/icons-material/Favorite';
import { motion, AnimatePresence } from 'framer-motion';

const NEON_CYAN = '#00f2ea';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

/** ריבוע שחקן — וידאו/תמונה, הילה כשבתור, Win Rate / Win Streak */
function PlayerVideoFrame({
  player,
  side,
  isActive,
  winRate,
  streak,
}: {
  player: { name: string; avatar: string };
  side: 'left' | 'right';
  isActive?: boolean;
  winRate?: number;
  streak?: number;
}) {
  const color = side === 'left' ? NEON_CYAN : NEON_PINK;
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        component={motion.div}
        initial={{ x: side === 'left' ? -50 : 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        sx={{
          width: 90,
          height: 110,
          borderRadius: '12px',
          border: `2px solid ${color}`,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: '#111',
          boxShadow: isActive
            ? `0 0 25px ${color}99, 0 0 40px ${color}55`
            : `0 0 15px ${color}59`,
          outline: isActive ? `2px solid ${color}` : 'none',
          outlineOffset: 2,
        }}
      >
        <img
          src={player.avatar}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'rgba(0,0,0,0.75)',
            py: 0.25,
            px: 0.5,
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: 600 }}>
            {player.name}
          </Typography>
          {(winRate != null || streak != null) && (
            <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mt: 0.25 }}>
              {winRate != null && (
                <Typography sx={{ color: NEON_GOLD, fontSize: 9 }}>{Math.round(winRate * 100)}%</Typography>
              )}
              {streak != null && streak > 0 && (
                <Typography sx={{ color: '#fff', fontSize: 9 }}>🔥{streak}</Typography>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export interface LiveMatchPlayer {
  id: string;
  name: string;
  avatar: string;
}

export interface LiveMatch {
  id: string;
  gameType: 'backgammon' | 'snooker' | 'poker' | 'cards';
  player1: LiveMatchPlayer;
  player2: LiveMatchPlayer;
  pot: number;
  viewers: number;
  /** שחקן בתור — מקבל הילה */
  activePlayer?: 1 | 2;
  /** Win Rate 0–1; מוצג מתחת לשחקן */
  winRate1?: number;
  winRate2?: number;
  streak1?: number;
  streak2?: number;
  boardPreview?: React.ReactNode;
}

const GAME_TYPE_LABELS: Record<LiveMatch['gameType'], string> = {
  backgammon: 'ששבש',
  snooker: 'סנוקר',
  poker: 'פוקר',
  cards: 'קלפים',
};

interface LiveMatchRoomProps {
  match: LiveMatch;
  onGift?: () => void;
  onJoin?: () => void;
  onJoinQueue?: () => void;
  /** Double-tap to like — לב חינמי (חיזוק קהילה) */
  onLike?: () => void;
}

const DOUBLE_TAP_MS = 350;

export function LiveMatchRoom({ match, onGift, onJoin, onJoinQueue, onLike }: LiveMatchRoomProps) {
  const [heartVisible, setHeartVisible] = useState(false);
  const lastTapRef = useRef(0);

  const handleBoardTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current <= DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      setHeartVisible(true);
      onLike?.();
      setTimeout(() => setHeartVisible(false), 800);
    } else {
      lastTapRef.current = now;
    }
  }, [onLike]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      sx={{
        height: '100%',
        minHeight: '100vh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        position: 'relative',
        bgcolor: '#000',
        overflow: 'hidden',
      }}
    >
      {/* 1. ריבועי השחקנים — הילה לבתור, Win Rate / Streak */}
      <Box
        sx={{
          position: 'absolute',
          top: '8%',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          px: 2,
          zIndex: 10,
        }}
      >
        <PlayerVideoFrame
          player={match.player1}
          side="left"
          isActive={match.activePlayer === 1}
          winRate={match.winRate1}
          streak={match.streak1}
        />
        <PlayerVideoFrame
          player={match.player2}
          side="right"
          isActive={match.activePlayer === 2}
          winRate={match.winRate2}
          streak={match.streak2}
        />
      </Box>

      {/* 2. מרכז — לוח + Double-tap לייק + אנימציית לב */}
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          pt: 12,
          pb: 10,
        }}
      >
        <Box
          onClick={handleBoardTap}
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 360,
            cursor: 'pointer',
            '&:active': { opacity: 0.95 },
          }}
        >
          {match.boardPreview ?? (
            <Box
              sx={{
                width: '100%',
                aspectRatio: '4/3',
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #444',
                borderColor: NEON_GOLD,
                boxShadow: '0 0 30px rgba(255,215,0,0.15)',
              }}
            >
              <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
                [ {GAME_TYPE_LABELS[match.gameType]} — לוח משחק ]
              </Typography>
            </Box>
          )}
          <AnimatePresence>
            {heartVisible && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Favorite sx={{ fontSize: 80, color: NEON_PINK, filter: 'drop-shadow(0 0 20px rgba(247,37,133,0.8))' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {/* 3. כפתורי אינטראקציה — מתנות, צופים — צד ימין למטה */}
      <Stack spacing={2} sx={{ position: 'absolute', bottom: 48, right: 20, zIndex: 20 }}>
        <Box sx={{ textAlign: 'center' }}>
          <IconButton
            onClick={onGift}
            sx={{ bgcolor: 'rgba(255,215,0,0.2)', color: NEON_GOLD, p: 1.5 }}
            aria-label="שלח מתנה"
          >
            <CardGiftcard fontSize="large" />
          </IconButton>
          <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>מתנה</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Visibility sx={{ color: NEON_CYAN, fontSize: '1.2rem' }} />
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
              {match.viewers}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>צופים</Typography>
        </Box>
      </Stack>

      {/* 4. קופה, סוג משחק, כפתורי שחק + הצטרף — תחתית שמאל */}
      <Box sx={{ position: 'absolute', bottom: 48, left: 20, zIndex: 20 }}>
        <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', fontSize: '1.1rem' }}>
          קופה: {match.pot} 🪙
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa' }}>
          טורניר מיומנות · {GAME_TYPE_LABELS[match.gameType]}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {onJoin && (
            <Button
              size="small"
              variant="contained"
              onClick={onJoin}
              sx={{
                bgcolor: NEON_CYAN,
                color: '#000',
                fontWeight: 'bold',
                '&:hover': { bgcolor: NEON_CYAN, opacity: 0.9 },
              }}
            >
              שחק עכשיו
            </Button>
          )}
          {onJoinQueue && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<PersonAdd sx={{ fontSize: '1rem' }} />}
              onClick={onJoinQueue}
              sx={{
                borderColor: NEON_PINK,
                color: NEON_PINK,
                fontWeight: 'bold',
                '&:hover': { borderColor: NEON_PINK, bgcolor: 'rgba(247,37,133,0.1)' },
              }}
            >
              הצטרף
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
