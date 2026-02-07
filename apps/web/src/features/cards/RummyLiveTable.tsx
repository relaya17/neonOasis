/**
 * רמי אבנים Live — כמו ששבש ופוקר: שידור חי בסגנון TikTok
 * עם הודעות BOOM כשמורידים סדרה ארוכה או מנצחים.
 * ניצחון מוסיף מטבעות ל-BANK (כמו בפוקר).
 */

import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { TouchCardGame } from './CardGame';
import { BackgammonLiveUI } from '../backgammon/BackgammonLiveUI';
import { playSound } from '../../shared/audio';

const RUN_BOOM_THRESHOLD = 4; // סדרה של 4+ אבנים = "סדרה מטורפת"
const INITIAL_COINS = 1000;
const RUMMY_WIN_REWARD = 80; // מטבעות על ניצחון

export function RummyLiveTable() {
  const [boomMessage, setBoomMessage] = useState<string | null>(null);
  const [isLive] = useState(true);
  const [userCoins, setUserCoins] = useState(INITIAL_COINS);

  const handleGameEvent = useCallback((text: string) => {
    setBoomMessage(text);
  }, []);

  const handleGiftSent = useCallback(
    (giftId: string) => {
      const gifts: Record<string, string> = {
        rose: 'שלח ורד! 🌹',
        diamond: 'פינק ביהלום! 💎',
        crown: 'כתר למנצח! 👑',
        beer: 'הרים לחיים! 🍺',
      };
      handleGameEvent(gifts[giftId] ?? 'תודה על המתנה! 🎁');
      playSound('gift_sent');
    },
    [handleGameEvent]
  );

  const handlePlaceGroup = useCallback(
    (tilesCount: number, isRun: boolean) => {
      if (isRun && tilesCount >= RUN_BOOM_THRESHOLD) {
        handleGameEvent('סדרה מטורפת! 🔥');
      } else if (tilesCount >= 4) {
        handleGameEvent('קבוצה חזקה! 💪');
      }
    },
    [handleGameEvent]
  );

  const handleWin = useCallback(() => {
    handleGameEvent('ניצחון ברומי! 🎉');
    setUserCoins((c) => c + RUMMY_WIN_REWARD);
    playSound('win');
  }, [handleGameEvent]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        bgcolor: '#000',
        overflow: 'hidden',
      }}
    >
      {/* שכבה 1: המשחק (לוח + יד) — גלילה אם התוכן גבוה */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <TouchCardGame onPlaceGroup={handlePlaceGroup} onWin={handleWin} />
      </Box>

      {/* שכבה 2: Live Overlay — צ'אט, צופים, מתנות */}
      {isLive && (
        <BackgammonLiveUI
          boomMessage={boomMessage}
          onBoomShown={() => setBoomMessage(null)}
          onGiftSent={handleGiftSent}
        />
      )}

      {/* תווית Live + BANK בפינה */}
      <Box
        sx={{
          position: 'absolute',
          top: 80,
          left: 10,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Typography
          sx={{
            color: '#00f5d4',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(0,245,212,0.8)',
          }}
        >
          Live Mode Active
        </Typography>
        <Typography
          sx={{
            color: '#ffd700',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(255,215,0,0.6)',
          }}
        >
          BANK: {userCoins} 🪙
        </Typography>
      </Box>
    </Box>
  );
}
