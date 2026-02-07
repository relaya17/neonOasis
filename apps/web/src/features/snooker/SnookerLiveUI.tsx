/**
 * שכבת UI בסגנון TikTok Live מעל משחק הסנוקר
 * צ'אט רץ, מונה צופים, כפתורי מתנות
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, List, ListItem, Fade } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const NEON_PINK = '#f72585';
const NEON_CYAN = '#00f5d4';

const GIFTS = [
  { id: 'rose', icon: '🌹', label: 'Rose', color: '#ff2d55' },
  { id: 'diamond', icon: '💎', label: 'Diamond', color: '#00f2ea' },
  { id: 'crown', icon: '👑', label: 'Gold Crown', color: '#ffd700' },
];

const DEMO_MESSAGES = [
  { id: 1, user: 'User123', text: 'מכה מטורפת! 🔥' },
  { id: 2, user: 'VegasQueen', text: 'תכניס את הכדור השחור!' },
  { id: 3, user: 'SnookerFan', text: 'יאללה שחקן 1 💪' },
  { id: 4, user: 'ProViewer', text: 'הקו הזה ייכנס' },
  { id: 5, user: 'Lucky7', text: '🌹🌹' },
];

interface SnookerLiveUIProps {
  /** הודעת "BOOM" שמוזרקת לצ'אט כשמכניסים כדור */
  boomMessage?: string | null;
  onBoomShown?: () => void;
  /** מתנה נשלחה — לחיבור להחלפת מקל (למשל crown → GOLD_VIP) */
  onGiftSent?: (giftId: string) => void;
}

export function SnookerLiveUI(props?: SnookerLiveUIProps) {
  const { boomMessage, onBoomShown, onGiftSent } = props ?? {};
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [viewerCount] = useState(() => 1200 + Math.floor(Math.random() * 400));

  useEffect(() => {
    if (!boomMessage) return;
    setMessages((prev) => [...prev.slice(-8), { id: Date.now(), user: '🎱', text: boomMessage }]);
    onBoomShown?.();
  }, [boomMessage, onBoomShown]);

  useEffect(() => {
    const t = setInterval(() => {
      const more: typeof DEMO_MESSAGES = [
        { id: 6, user: 'Chatter', text: 'אחלה משחק' },
        { id: 7, user: 'Fan99', text: '👑' },
        { id: 8, user: 'LiveViewer', text: 'תשלח ורד!' },
      ];
      setMessages((prev) => [...prev.slice(-6), { ...more[Math.floor(Math.random() * more.length)], id: Date.now() }]);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleGiftClick = (gift: (typeof GIFTS)[0]) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), user: 'You', text: ` sent ${gift.icon} ${gift.label}` },
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
      {/* 1. Header: סטטיסטיקות שידור */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          display: 'flex',
          gap: 1,
          pointerEvents: 'auto',
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            border: '2px solid #ff2d55',
            bgcolor: 'rgba(0,0,0,0.6)',
            color: NEON_CYAN,
          }}
        >
          <FavoriteIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Vegas Pro
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
                mr: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
              }}
            />
            <Typography sx={{ color: '#fff', fontSize: '0.7rem' }}>
              {(viewerCount / 1000).toFixed(1)}k viewers
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. צ'אט רץ (צד שמאל למטה) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 120,
          left: 20,
          width: '220px',
          maxHeight: '200px',
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
                  sx={{ fontSize: '0.75rem', color: NEON_CYAN, fontWeight: 'bold', mr: 0.5, flexShrink: 0 }}
                >
                  {m.user}:
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.text}
                </Typography>
              </ListItem>
            </Fade>
          ))}
        </List>
      </Box>

      {/* 3. כפתורי מתנות (צד ימין) */}
      <Box
        sx={{
          position: 'absolute',
          right: 20,
          bottom: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
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
                width: 50,
                height: 50,
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
              <span style={{ fontSize: '1.5rem' }}>{gift.icon}</span>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', mt: 0.5 }}>
              {gift.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
