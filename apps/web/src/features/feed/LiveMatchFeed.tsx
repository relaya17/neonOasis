/**
 * פיד אנכי של חדרים חיים — חוויית TikTok: גלילה אנכית, scroll-snap,
 * אנימציות Framer Motion (whileInView), צליל החלקה, כפתור הצטרף.
 * הניתוב: /feed/backgammon | /feed/snooker | /feed/poker | /feed/cards
 */

import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { LiveMatchRoom, type LiveMatch } from './LiveMatchRoom';
import { playSound } from '../../shared/audio';

const GAME_TYPE_LABELS: Record<string, string> = {
  backgammon: 'ששבש',
  snooker: 'סנוקר',
  poker: 'פוקר',
  cards: 'קלפים',
  touch: 'קלפים',
  rummy: 'רמי',
};

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';
function avatar(id: string) {
  return `${DEFAULT_AVATAR}${encodeURIComponent(id)}`;
}

/** חדרים לדמו — לפי gameType */
function getMockRooms(gameType: string): LiveMatch[] {
  const type: LiveMatch['gameType'] =
    gameType === 'rummy' || gameType === 'touch' ? 'cards' : (gameType as LiveMatch['gameType']) || 'backgammon';
  const seeds: [string, string, number, number][] = [
    ['Tony_Montana', 'Vegas_Queen', 320, 1240],
    ['The_Cowboy', 'Neon_Dragon', 150, 850],
    ['Snooker_Pro', 'Cue_Master', 500, 2100],
    ['Poker_Face', 'Ace_High', 200, 980],
    ['Lucky_Seven', 'Chip_Stack', 75, 440],
  ];
  return seeds.map(([n1, n2, pot, viewers], i) => ({
    id: `room-${type}-${i}`,
    gameType: type,
    player1: { id: `p1-${i}`, name: n1, avatar: avatar(n1) },
    player2: { id: `p2-${i}`, name: n2, avatar: avatar(n2) },
    pot: pot + (i * 50),
    viewers,
    activePlayer: (i % 2 + 1) as 1 | 2,
    winRate1: 0.45 + (i % 5) * 0.08,
    winRate2: 0.52 + (i % 4) * 0.06,
    streak1: i % 3,
    streak2: (i + 1) % 4,
  }));
}

const SLIDE_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 800;

export function LiveMatchFeed() {
  const { gameType } = useParams<{ gameType: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const prevIndexRef = useRef(0);

  const normalizedType = gameType === 'rummy' || gameType === 'touch' ? 'cards' : gameType ?? 'backgammon';
  const rooms = getMockRooms(normalizedType);
  const gameLabel = GAME_TYPE_LABELS[normalizedType] ?? normalizedType;

  const routes: Record<string, string> = {
    backgammon: '/backgammon',
    snooker: '/snooker',
    poker: '/poker',
    cards: '/touch',
  };
  const playRoute = routes[normalizedType] ?? '/';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const next = Math.round(el.scrollTop / SLIDE_HEIGHT);
      const clamped = Math.max(0, Math.min(next, rooms.length - 1));
      if (clamped !== activeIndex) {
        if (prevIndexRef.current !== clamped) {
          playSound('neon_click');
          prevIndexRef.current = clamped;
        }
        setActiveIndex(clamped);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeIndex, rooms.length]);

  const handleGift = () => {
    playSound('neon_click');
    navigate(playRoute);
  };

  const handleJoinQueue = () => {
    playSound('neon_click');
    if (typeof window !== 'undefined' && window.alert) {
      window.alert('נרשמת לתור! כשהמשחק יסתיים תקבל הזמנה להצטרף למשחק הבא.');
    }
  };

  const handleLike = () => {
    playSound('neon_click');
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#000' }}>
      {/* Header — חזרה + סוג משחק */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: 'rgba(0,0,0,0.85)',
          borderBottom: '1px solid #333',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => { playSound('neon_click'); navigate('/'); }}
          sx={{ color: '#00f2ea', minWidth: 'auto' }}
          aria-label="חזרה"
        >
          חזרה
        </Button>
        <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
          לייב {gameLabel}
        </Typography>
        <Box sx={{ width: 80 }} />
      </Box>

      {/* פיד אנכי — TikTok-style: scroll-snap + אנימציות */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          WebkitOverflowScrolling: 'touch',
        }}
        role="feed"
        aria-label={`פיד חדרים חיים ${gameLabel}`}
      >
        {rooms.map((match, index) => (
          <Box
            key={match.id}
            sx={{
              height: SLIDE_HEIGHT,
              flexShrink: 0,
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            {/* כשחדר נכנס ל-view (whileInView) — עתידי: חיבור ל-Socket של החדר לעדכון לוח בזמן אמת */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ height: '100%' }}
            >
              <LiveMatchRoom
                match={match}
                onGift={handleGift}
                onJoin={() => {
                  playSound('neon_click');
                  navigate(playRoute);
                }}
                onJoinQueue={handleJoinQueue}
                onLike={handleLike}
              />
            </motion.div>
          </Box>
        ))}
      </Box>

      {/* אינדיקציה — איזה חדר */}
      <Box
        sx={{
          position: 'fixed',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {rooms.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: activeIndex === i ? '#00f2ea' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.2s',
            }}
            aria-hidden
          />
        ))}
      </Box>
    </Box>
  );
}
