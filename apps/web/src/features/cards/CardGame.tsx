/**
 * Card Games - Touch/Solitaire Style
 * Build sequences like Solitaire
 */

import { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { playSound } from '../../shared/audio';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export interface Card {
  suit: string;
  rank: string;
  faceUp: boolean;
  id: string;
}

// Create a standard 52-card deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        suit,
        rank,
        faceUp: false,
        id: `${rank}${suit}`,
      });
    });
  });
  return deck;
}

// Shuffle deck
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

export function TouchCardGame() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Card[]>(() => shuffleDeck(createDeck()));
  const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], [], []]);
  const [foundation, setFoundation] = useState<Card[][]>([[], [], [], []]);
  const [selectedCard, setSelectedCard] = useState<{ pile: string; index: number } | null>(null);

  const handleCardClick = (card: Card, pileType: string, pileIndex: number, cardIndex: number) => {
    playSound('card_flip');
    console.log('Card clicked:', card, pileType, pileIndex);
    // TODO: Implement move logic
  };

  const handleNewGame = () => {
    playSound('neon_click');
    setDeck(shuffleDeck(createDeck()));
    setTableau([[], [], [], [], [], [], []]);
    setFoundation([[], [], [], []]);
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
            sx={{
              width: { xs: 50, sm: 70, md: 80 },
              height: { xs: 70, sm: 98, md: 112 },
              border: `2px dashed ${NEON_GOLD}`,
              borderRadius: 1,
              bgcolor: 'rgba(255, 215, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: NEON_GOLD, fontSize: { xs: '2rem', sm: '3rem' }, opacity: 0.3 }}>
              {SUITS[i]}
            </Typography>
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
            sx={{
              minHeight: 200,
              border: `2px dashed ${NEON_CYAN}44`,
              borderRadius: 1,
              bgcolor: 'rgba(0, 255, 255, 0.03)',
              p: { xs: 0.3, sm: 0.5 },
              position: 'relative',
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
                  onClick={() => handleCardClick(card, 'tableau', pileIndex, cardIndex)}
                  sx={{
                    height: { xs: 70, sm: 98, md: 112 },
                    bgcolor: card.faceUp ? '#fff' : '#333',
                    border: `2px solid ${card.faceUp ? NEON_GOLD : '#555'}`,
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
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
