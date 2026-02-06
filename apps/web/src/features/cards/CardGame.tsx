/**
 * Card Games - Touch/Solitaire Style
 * Build sequences like Solitaire
 */

import { useState, useMemo } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { playSound } from '../../shared/audio';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_ORDER: Record<string, number> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };
const RED_SUITS = ['♥', '♦'];

export interface Card {
  suit: string;
  rank: string;
  faceUp: boolean;
  id: string;
}

function isRed(card: Card): boolean {
  return RED_SUITS.includes(card.suit);
}

function rankValue(rank: string): number {
  return RANK_ORDER[rank] ?? 0;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        suit,
        rank,
        faceUp: false,
        id: `${rank}${suit}-${Math.random().toString(36).slice(2, 9)}`,
      });
    });
  });
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Deal classic solitaire: pile 0 gets 1 card, pile 1 gets 2, ... pile 6 gets 7; top of each face up. */
function dealTableau(deck: Card[]): { tableau: Card[][]; remaining: Card[] } {
  const shuffled = shuffleDeck([...deck]);
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let p = 0; p < 7; p++) {
    for (let c = 0; c <= p; c++) {
      const card = shuffled[idx++];
      card.faceUp = c === p;
      tableau[p].push(card);
    }
  }
  return { tableau, remaining: shuffled.slice(idx) };
}

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

type PileSource = { type: 'tableau'; pileIndex: number; cardIndex: number } | { type: 'foundation'; pileIndex: number };

export function TouchCardGame() {
  const navigate = useNavigate();
  const initialDeal = useMemo(() => dealTableau(shuffleDeck(createDeck())), []);
  const [tableau, setTableau] = useState<Card[][]>(() => initialDeal.tableau);
  const [foundation, setFoundation] = useState<Card[][]>([[], [], [], []]);
  const [stock, setStock] = useState<Card[]>(() => initialDeal.remaining);
  const [selected, setSelected] = useState<PileSource | null>(null);

  const getCard = (src: PileSource): Card | null => {
    if (src.type === 'tableau') {
      const pile = tableau[src.pileIndex];
      return pile[src.cardIndex] ?? null;
    }
    const pile = foundation[src.pileIndex];
    return pile.length > 0 ? pile[pile.length - 1] : null;
  };

  const canMoveToFoundation = (card: Card, foundIndex: number): boolean => {
    const pile = foundation[foundIndex];
    if (pile.length === 0) return card.rank === 'A';
    const top = pile[pile.length - 1];
    return top.suit === card.suit && rankValue(card.rank) === rankValue(top.rank) + 1;
  };

  const canMoveToTableau = (card: Card, pileIndex: number): boolean => {
    const pile = tableau[pileIndex];
    if (pile.length === 0) return card.rank === 'K';
    const top = pile[pile.length - 1];
    return isRed(card) !== isRed(top) && rankValue(card.rank) === rankValue(top.rank) - 1;
  };

  const handleCardClick = (card: Card, pileType: string, pileIndex: number, cardIndex: number) => {
    if (pileType !== 'tableau') return;
    const pile = tableau[pileIndex];
    const isTop = cardIndex === pile.length - 1;

    if (!card.faceUp) {
      if (isTop) {
        playSound('card_flip');
        setTableau((prev) => {
          const next = prev.map((p, i) =>
            i === pileIndex ? p.map((c, j) => (j === cardIndex ? { ...c, faceUp: true } : c)) : p
          );
          return next;
        });
      }
      return;
    }

    if (selected) {
      const srcCard = getCard(selected);
      if (!srcCard || (selected.type === 'tableau' && selected.pileIndex === pileIndex && selected.cardIndex === cardIndex)) {
        setSelected(null);
        return;
      }
      for (let f = 0; f < 4; f++) {
        if (canMoveToFoundation(srcCard, f)) {
          playSound('chip_stack');
          setFoundation((prev) => {
            const next = [...prev.map((p) => [...p])];
            next[f] = [...next[f], srcCard];
            return next;
          });
          if (selected.type === 'tableau') {
            setTableau((prev) => prev.map((p, i) => (i === selected.pileIndex ? p.slice(0, selected.cardIndex) : p)));
          } else {
            setFoundation((prev) => prev.map((p, i) => (i === selected.pileIndex ? p.slice(0, -1) : p)));
          }
          setSelected(null);
          return;
        }
      }
      if (canMoveToTableau(srcCard, pileIndex)) {
        playSound('chip_stack');
        moveCardsToTableau(selected, pileIndex);
        setSelected(null);
        return;
      }
      setSelected(null);
      return;
    }

    if (isTop) {
      playSound('card_flip');
      setSelected({ type: 'tableau', pileIndex, cardIndex });
    }
  };

  const moveCardsToTableau = (src: PileSource, toPileIndex: number) => {
    let cards: Card[] = [];
    if (src.type === 'tableau') {
      const pile = tableau[src.pileIndex];
      cards = pile.slice(src.cardIndex);
    } else {
      const pile = foundation[src.pileIndex];
      cards = [pile[pile.length - 1]];
    }
    setTableau((prev) => {
      const next = prev.map((p, i) => [...p]);
      if (src.type === 'tableau') next[src.pileIndex] = next[src.pileIndex].slice(0, src.cardIndex);
      next[toPileIndex] = [...next[toPileIndex], ...cards];
      return next;
    });
    if (src.type === 'foundation') {
      setFoundation((prev) => prev.map((p, i) => (i === src.pileIndex ? p.slice(0, -1) : p)));
    }
  };

  const handleFoundationClick = (foundIndex: number) => {
    if (!selected) return;
    const srcCard = getCard(selected);
    if (!srcCard || !canMoveToFoundation(srcCard, foundIndex)) return;
    playSound('chip_stack');
    setFoundation((prev) => {
      const next = [...prev.map((p) => [...p])];
      next[foundIndex] = [...next[foundIndex], srcCard];
      return next;
    });
    if (selected.type === 'tableau') {
      setTableau((prev) => prev.map((p, i) => (i === selected.pileIndex ? p.slice(0, selected.cardIndex) : p)));
    } else {
      setFoundation((prev) => prev.map((p, i) => (i === selected.pileIndex ? p.slice(0, -1) : p)));
    }
    setSelected(null);
  };

  const handleTableauPileClick = (pileIndex: number) => {
    const pile = tableau[pileIndex];
    if (pile.length === 0 && selected) {
      const srcCard = getCard(selected);
      if (srcCard?.rank === 'K') {
        playSound('chip_stack');
        moveCardsToTableau(selected, pileIndex);
        setSelected(null);
      }
    }
  };

  const handleNewGame = () => {
    playSound('neon_click');
    const fullDeck = shuffleDeck(createDeck());
    const { tableau: t, remaining } = dealTableau(fullDeck);
    setTableau(t);
    setFoundation([[], [], [], []]);
    setStock(remaining);
    setSelected(null);
  };

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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/')}
          sx={{
            borderColor: NEON_CYAN,
            color: NEON_CYAN,
            fontSize: { xs: '0.7rem', sm: '0.875rem' },
          }}
        >
          ← חזרה
        </Button>

        <Typography
          sx={{
            color: NEON_GOLD,
            fontWeight: 'bold',
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            textShadow: `0 0 10px ${NEON_GOLD}`,
          }}
        >
          🃏 Touch • טאצ'
        </Typography>

        <Button
          variant="contained"
          size="small"
          onClick={handleNewGame}
          sx={{
            bgcolor: NEON_PINK,
            color: '#000',
            fontSize: { xs: '0.7rem', sm: '0.875rem' },
            fontWeight: 'bold',
          }}
        >
          משחק חדש
        </Button>
      </Box>

      {/* Game Instructions */}
      <Paper
        sx={{
          bgcolor: 'rgba(0, 255, 255, 0.1)',
          border: `1px solid ${NEON_CYAN}`,
          borderRadius: 1,
          p: { xs: 1, sm: 1.5 },
          mb: 2,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#fff', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          🎯 <strong>מטרה:</strong> בנה סדרות מ-A עד K • הזז קלפים בין הערימות • בנה 4 חבילות מלאות
        </Typography>
      </Paper>

      {/* Foundation (4 stacks - completed sequences) */}
      <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, mb: 2, justifyContent: 'center' }}>
        {foundation.map((pile, i) => (
          <Box
            key={`foundation-${i}`}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleFoundationClick(i); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFoundationClick(i); } }}
            sx={{
              width: { xs: 50, sm: 70, md: 80 },
              height: { xs: 70, sm: 98, md: 112 },
              border: `2px dashed ${NEON_GOLD}`,
              borderRadius: 1,
              bgcolor: selected && getCard(selected) && canMoveToFoundation(getCard(selected)!, i) ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: selected ? 'pointer' : 'default',
            }}
          >
            {pile.length > 0 ? (
              <Paper
                sx={{
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fff',
                  border: `2px solid ${NEON_GOLD}`,
                }}
              >
                <Typography sx={{ fontSize: '1.5rem', color: pile[pile.length - 1].suit === '♥' || pile[pile.length - 1].suit === '♦' ? '#f00' : '#000' }}>
                  {pile[pile.length - 1].suit}
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{pile[pile.length - 1].rank}</Typography>
              </Paper>
            ) : (
              <Typography sx={{ color: NEON_GOLD, fontSize: { xs: '2rem', sm: '3rem' }, opacity: 0.3 }}>
                {SUITS[i]}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Tableau (7 piles - main playing area) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(7, 1fr)', sm: 'repeat(7, 1fr)' },
          gap: { xs: 0.3, sm: 0.5, md: 1 },
          px: { xs: 0.5, sm: 1 },
        }}
      >
        {tableau.map((pile, pileIndex) => (
          <Box
            key={`pile-${pileIndex}`}
            onClick={() => pile.length === 0 && handleTableauPileClick(pileIndex)}
            sx={{
              minHeight: 200,
              border: `2px dashed ${NEON_CYAN}44`,
              borderRadius: 1,
              bgcolor: pile.length === 0 && selected && getCard(selected)?.rank === 'K' ? 'rgba(0, 255, 255, 0.15)' : 'rgba(0, 255, 255, 0.03)',
              p: { xs: 0.3, sm: 0.5 },
              position: 'relative',
              cursor: pile.length === 0 && selected ? 'pointer' : 'default',
            }}
          >
            {pile.length === 0 && (
              <Typography
                sx={{
                  color: NEON_CYAN,
                  opacity: 0.2,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  textAlign: 'center',
                  mt: 1,
                }}
              >
                {pileIndex + 1}
              </Typography>
            )}
            {pile.map((card, cardIndex) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: cardIndex === 0 ? 'relative' : 'absolute',
                  top: cardIndex * 20,
                  left: 0,
                  right: 0,
                }}
              >
                <Paper
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleCardClick(card, 'tableau', pileIndex, cardIndex);
                  }}
                  sx={{
                    height: { xs: 70, sm: 98, md: 112 },
                    bgcolor: card.faceUp ? '#fff' : '#333',
                    border: selected?.type === 'tableau' && selected.pileIndex === pileIndex && selected.cardIndex === cardIndex
                      ? `3px solid ${NEON_CYAN}`
                      : `2px solid ${card.faceUp ? NEON_GOLD : '#555'}`,
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: selected?.type === 'tableau' && selected.pileIndex === pileIndex && selected.cardIndex === cardIndex ? `0 0 20px ${NEON_CYAN}` : 'none',
                    '&:hover': {
                      boxShadow: `0 0 15px ${NEON_CYAN}`,
                    },
                  }}
                >
                  {card.faceUp ? (
                    <>
                      <Typography
                        sx={{
                          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                          color: card.suit === '♥' || card.suit === '♦' ? '#f00' : '#000',
                          fontWeight: 'bold',
                        }}
                      >
                        {card.suit}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.3rem' },
                          fontWeight: 'bold',
                          color: card.suit === '♥' || card.suit === '♦' ? '#f00' : '#000',
                        }}
                      >
                        {card.rank}
                      </Typography>
                    </>
                  ) : (
                    <Typography sx={{ color: '#666', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      🂠
                    </Typography>
                  )}
                </Paper>
              </motion.div>
            ))}
          </Box>
        ))}
      </Box>

      {/* Instructions */}
      <Typography
        sx={{
          color: '#666',
          fontSize: { xs: '0.7rem', sm: '0.8rem' },
          textAlign: 'center',
          mt: 2,
        }}
      >
        💡 טיפ: בנה סדרות יורדות בצבעים מתחלפים • העבר לבסיס כשסדרה מלאה
      </Typography>
    </Box>
  );
}
