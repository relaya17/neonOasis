/**
 * Simple Poker - 5 cards, draw new hand, show hand rank
 */

import { useState, useCallback } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createDeck, shuffleDeck, type Card } from './deck';
import { playSound } from '../../shared/audio';

const RANK_ORDER: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
const SUITS = ['♠', '♥', '♦', '♣'];

function rankVal(c: Card): number {
  return RANK_ORDER[c.rank] ?? 0;
}

function getHandRank(hand: Card[]): string {
  if (hand.length !== 5) return '—';
  const ranks = hand.map((c) => c.rank).sort((a, b) => (RANK_ORDER[b] ?? 0) - (RANK_ORDER[a] ?? 0));
  const suits = hand.map((c) => c.suit);
  const count: Record<string, number> = {};
  ranks.forEach((r) => { count[r] = (count[r] ?? 0) + 1; });
  const counts = Object.values(count).sort((a, b) => b - a);
  const isFlush = suits.every((s) => s === suits[0]);
  const values = hand.map((c) => rankVal(c)).sort((a, b) => b - a);
  const isStraight = (() => {
    const v = [...new Set(values)].sort((a, b) => b - a);
    if (v.length !== 5) return false;
    if (v[0] - v[4] === 4) return true;
    if (v[0] === 14 && v[1] === 5 && v[4] === 2) return true; // A-5 straight
    return false;
  })();

  if (isFlush && isStraight) return 'סטרייט פלאש';
  if (counts[0] === 4) return 'קרֶבֶט';
  if (counts[0] === 3 && counts[1] === 2) return 'פול האוס';
  if (isFlush) return 'צבע';
  if (isStraight) return 'סטרייט';
  if (counts[0] === 3) return 'שלישייה';
  if (counts[0] === 2 && counts[1] === 2) return 'שני זוגות';
  if (counts[0] === 2) return 'זוג';
  return 'גבוה';
}

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

function dealFive(): Card[] {
  const d = shuffleDeck(createDeck());
  return d.slice(0, 5).map((c) => ({ ...c, faceUp: true }));
}

export function SimplePoker() {
  const navigate = useNavigate();
  const [hand, setHand] = useState<Card[]>(() => dealFive());

  const drawNewHand = useCallback(() => {
    playSound('card_flip');
    setHand(dealFive());
  }, []);

  const dealFirst = useCallback(() => {
    playSound('neon_click');
    setHand(dealFive());
  }, []);

  const handRank = getHandRank(hand);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0b',
        background: 'radial-gradient(circle at 50% 50%, #1a1a1b 0%, #0a0a0b 100%)',
        p: { xs: 1, sm: 2 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/')}
          sx={{ borderColor: NEON_CYAN, color: NEON_CYAN }}
        >
          ← חזרה
        </Button>
        <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', fontSize: '1.3rem' }}>
          ♠♥♦♣ פוקר
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={dealFirst}
          sx={{ bgcolor: NEON_PINK, color: '#000', fontWeight: 'bold' }}
        >
          חליפה
        </Button>
      </Box>

      <Paper sx={{ bgcolor: 'rgba(0,255,255,0.08)', border: `1px solid ${NEON_CYAN}`, borderRadius: 2, p: 2, mb: 2, textAlign: 'center' }}>
        <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
          חמש קלפים • לחץ "חליפה" לקבלת יד חדשה
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
        {hand.map((card, i) => (
          <Paper
            key={`${card.id}-${i}`}
            sx={{
              width: { xs: 56, sm: 72 },
              height: { xs: 80, sm: 100 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fff',
              border: `2px solid ${NEON_GOLD}`,
              borderRadius: 1,
            }}
          >
            <Typography sx={{ fontSize: '1.5rem', color: card.suit === '♥' || card.suit === '♦' ? '#c00' : '#000' }}>
              {card.suit}
            </Typography>
            <Typography sx={{ fontWeight: 'bold', color: card.suit === '♥' || card.suit === '♦' ? '#c00' : '#000' }}>
              {card.rank}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Typography sx={{ color: NEON_CYAN, fontWeight: 'bold', textAlign: 'center', fontSize: '1.2rem' }}>
        {handRank}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          onClick={drawNewHand}
          sx={{
            bgcolor: NEON_CYAN,
            color: '#000',
            fontWeight: 'bold',
            px: 3,
            '&:hover': { bgcolor: NEON_CYAN, opacity: 0.9 },
          }}
        >
          החלף יד
        </Button>
      </Box>
    </Box>
  );
}
