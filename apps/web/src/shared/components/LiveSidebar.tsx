/**
 * Live Sidebar גנרי — מונה צופים, זרם מתנות, כפתורי רכישה מהירה.
 * מתאים לסנוקר, ששבש ופוקר (לב המודל העסקי כמו TikTok).
 */

import React from 'react';
import { Box, Typography, Avatar, Stack, Badge } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveStore } from '../store/liveStore';
import { useSessionStore } from '../../features/auth';

export const GIFT_TYPES = [
  { id: 'chalk', label: 'גיר', icon: '🟦', price: 10 },
  { id: 'beer', label: 'בירה', icon: '🍺', price: 50 },
  { id: 'diamond', label: 'יהלום', icon: '💎', price: 500 },
];

export function LiveSidebar() {
  const viewersCount = useLiveStore((s) => s.viewersCount);
  const incomingGifts = useLiveStore((s) => s.gifts);
  const sendGift = useLiveStore((s) => s.sendGift);
  const giftHandler = useLiveStore((s) => s.giftHandler);
  const username = useSessionStore((s) => s.username) ?? 'צופה';

  const handleSendGift = (gift: (typeof GIFT_TYPES)[0]) => {
    if (!giftHandler) return;
    sendGift(gift, username);
  };

  return (
    <Box
      sx={{
        width: { md: 260, lg: 280 },
        minWidth: { md: 240, lg: 280 },
        height: '100vh',
        maxHeight: '100vh',
        bgcolor: 'rgba(15, 15, 15, 0.95)',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        p: { md: 1.5, lg: 2 },
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* מונה צופים לייב */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Badge variant="dot" color="error" overlap="circular">
          <Typography sx={{ color: '#ff4d4d', fontWeight: 'bold' }}>LIVE</Typography>
        </Badge>
        <Typography sx={{ color: '#aaa', fontSize: { md: '12px', lg: '14px' } }}>{viewersCount} צופים</Typography>
      </Stack>

      {/* זרם מתנות (Gift Feed) */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column-reverse' }}>
        <AnimatePresence initial={false}>
          {incomingGifts.map((gift) => (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              style={{ marginBottom: 10 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.05)',
                  p: 1,
                  borderRadius: '8px',
                  border: '1px solid rgba(255,215,0,0.2)',
                }}
              >
                <Avatar sx={{ width: 24, height: 24, fontSize: '12px', bgcolor: '#333' }}>
                  {gift.user[0] ?? '?'}
                </Avatar>
                <Typography sx={{ color: '#fff', fontSize: '13px' }}>
                  <strong>{gift.user}</strong> שלח {gift.icon}
                </Typography>
              </Stack>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {/* פאנל שליחת מתנות — 70% לשחקן / 30% פלטפורמה */}
      <Typography variant="caption" sx={{ color: '#666', mb: 1 }}>
        שלח מתנה לשחקן:
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        {GIFT_TYPES.map((gift) => (
          <Box
            key={gift.id}
            onClick={() => handleSendGift(gift)}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendGift(gift)}
            sx={{
              cursor: giftHandler ? 'pointer' : 'default',
              textAlign: 'center',
              opacity: giftHandler ? 1 : 0.6,
              '&:hover': giftHandler ? { transform: 'scale(1.1)' } : {},
              transition: '0.2s',
            }}
            aria-label={`שלח ${gift.label} ${gift.price} מטבעות`}
          >
            <Box
              sx={{
                fontSize: '24px',
                bgcolor: '#222',
                p: 1,
                borderRadius: '12px',
                border: '1px solid #444',
              }}
            >
              {gift.icon}
            </Box>
            <Typography sx={{ color: '#ffd700', fontSize: '11px', mt: 0.5 }}>
              {gift.price} 🪙
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
