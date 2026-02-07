/**
 * שכבת UI בסגנון TikTok Live מעל משחק הששבש
 * כמו בסנוקר: צ'אט רץ, מונה צופים, כפתורי מתנות
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, List, ListItem, Fade } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const NEON_CYAN = '#00f5d4';

const GIFTS = [
  { id: 'rose', icon: '🌹', label: 'ורד', color: '#ff2d55' },
  { id: 'diamond', icon: '💎', label: 'יהלום', color: '#00f2ea' },
  { id: 'crown', icon: '👑', label: 'כתר', color: '#ffd700' },
  { id: 'beer', icon: '🍺', label: 'בירה', color: '#daa520' },
];

export const BACKGAMMON_GIFT_PRICES: Record<string, number> = {
  rose: 20,
  diamond: 500,
  crown: 200,
  beer: 50,
};

const DEMO_MESSAGES = [
  { id: 1, user: 'User123', text: 'מזל עם הקוביות! 🎲' },
  { id: 2, user: 'VegasQueen', text: 'יאללה כפול!' },
  { id: 3, user: 'BackgammonFan', text: 'שחקן 1 מנצח 💪' },
  { id: 4, user: 'ProViewer', text: 'מהלך חכם' },
  { id: 5, user: 'Lucky7', text: '🌹🌹' },
];

interface BackgammonLiveUIProps {
  /** הודעת אירוע שמוזרקת לצ'אט (למשל כפול, ניצחון) */
  boomMessage?: string | null;
  onBoomShown?: () => void;
  /** מתנה נשלחה */
  onGiftSent?: (giftId: string) => void;
}

export function BackgammonLiveUI(props?: BackgammonLiveUIProps) {
  const { boomMessage, onBoomShown, onGiftSent } = props ?? {};
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [viewerCount] = useState(() => 1200 + Math.floor(Math.random() * 400));

  useEffect(() => {
    if (!boomMessage) return;
    setMessages((prev) => [...prev.slice(-8), { id: Date.now(), user: '🎲', text: boomMessage }]);
    onBoomShown?.();
  }, [boomMessage, onBoomShown]);

  useEffect(() => {
    const t = setInterval(() => {
      const more: { user: string; text: string }[] = [
        { user: 'Chatter', text: 'אחלה משחק' },
        { user: 'Fan99', text: '👑' },
        { user: 'LiveViewer', text: 'תשלח ורד!' },
      ];
      const pick = more[Math.floor(Math.random() * more.length)];
      setMessages((prev) => [...prev.slice(-6), { ...pick, id: Date.now() }]);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleGiftClick = (gift: (typeof GIFTS)[0]) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), user: 'You', text: ` שלח ${gift.icon} ${gift.label}` },
    ]);
    onGiftSent?.(gift.id);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* 1. Header: סטטיסטיקות שידור — רספונסיבי */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 20 },
          left: { xs: 12, sm: 20 },
          display: 'flex',
          gap: 1,
          pointerEvents: 'auto',
        }}
      >
        <Avatar
          sx={{
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            border: '2px solid #ff2d55',
            bgcolor: 'rgba(0,0,0,0.6)',
            color: NEON_CYAN,
          }}
        >
          <FavoriteIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            ששבש Live
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(0,0,0,0.5)',
              px: 1,
              borderRadius: '10px',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                bgcolor: '#ff2d55',
                borderRadius: '50%',
                mr: 0.5,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
              }}
            />
            <Typography sx={{ color: '#fff', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
              {(viewerCount / 1000).toFixed(1)}k צופים
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. צ'אט רץ (צד שמאל למטה) — רספונסיבי */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 100, sm: 120 },
          left: { xs: 8, sm: 20 },
          width: { xs: 'min(180px, 45vw)', sm: 220 },
          maxHeight: { xs: 140, sm: 200 },
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        <List dense disablePadding>
          {messages.slice(-5).map((m) => (
            <Fade in key={m.id}>
              <ListItem
                sx={{
                  px: 1,
                  py: 0.5,
                  bgcolor: 'rgba(0,0,0,0.4)',
                  mb: 0.5,
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Typography
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: NEON_CYAN, fontWeight: 'bold', mr: 0.5, flexShrink: 0 }}
                >
                  {m.user}:
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.text}
                </Typography>
              </ListItem>
            </Fade>
          ))}
        </List>
      </Box>

      {/* 3. כפתורי מתנות (צד ימין) — רספונסיבי */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: 8, sm: 20 },
          bottom: { xs: 80, sm: 100 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1, sm: 2 },
          pointerEvents: 'auto',
        }}
      >
        {GIFTS.map((gift) => (
          <Box
            key={gift.id}
            onClick={() => handleGiftClick(gift)}
            sx={{
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <Box
              sx={{
                width: { xs: 40, sm: 50 },
                height: { xs: 40, sm: 50 },
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${gift.color}`,
                boxShadow: `0 0 12px ${gift.color}66`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.12)',
                  boxShadow: `0 0 20px ${gift.color}`,
                },
              }}
            >
              <Typography component="span" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                {gift.icon}
              </Typography>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.6rem', sm: '0.65rem' }, mt: 0.5 }}>
              {gift.label}
              {BACKGAMMON_GIFT_PRICES[gift.id] != null && ` 🪙${BACKGAMMON_GIFT_PRICES[gift.id]}`}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
