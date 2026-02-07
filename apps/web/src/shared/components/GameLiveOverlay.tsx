/**
 * שכבת לייב אחידה לכל המשחקים (סנוקר, ששבש, פוקר).
 * LIVE מהבהב, מונה צופים, שם משחק, אווטר ובר סטטיסטיקה.
 */

import React from 'react';
import { Box, Typography, Avatar, Badge } from '@mui/material';
import { motion } from 'framer-motion';
import { useLiveStore } from '../store/liveStore';

const NEON_CYAN = '#00f5d4';
const NEON_GOLD = '#ffd700';
const NEON_PINK = '#f72585';

interface GameLiveOverlayProps {
  /** שם המשחק להצגה (למשל "ששבש", "פוקר", "סנוקר") */
  gameName?: string;
  /** סטטיסטיקות מהירות (אופציונלי — אם לא מועבר יוצגו ערכי דמו) */
  stats?: { wins?: string; streak?: string; rank?: string };
}

interface StatItemProps {
  label: string;
  value: string;
  color: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.1rem', color, fontWeight: 'bold' }}>{value}</Typography>
    </Box>
  );
}

export function GameLiveOverlay({ gameName = 'שש-בש לייב', stats }: GameLiveOverlayProps) {
  const viewersCount = useLiveStore((s) => s.viewersCount);
  const viewers = viewersCount > 0 ? viewersCount : Math.floor(Math.random() * 50) + 120;

  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* פינה שמאלית עליונה: סטטוס LIVE */}
      <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#ff0000',
            boxShadow: '0 0 10px #ff0000',
          }}
        />
        <Typography sx={{ color: '#fff', fontWeight: 'bold', textShadow: '0 0 5px #000', fontSize: '1.2rem' }}>
          LIVE
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 1 }}>{viewers} צופים</Typography>
      </Box>

      {/* מרכז עליון: שם המשחק */}
      <Box sx={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <Typography
          sx={{
            color: NEON_CYAN,
            fontSize: '0.8rem',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(0,245,212,0.5)',
          }}
        >
          {gameName}
        </Typography>
      </Box>

      {/* פינה ימנית עליונה: פרופיל שחקן */}
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success">
          <Avatar sx={{ border: '2px solid #ffd700', boxShadow: '0 0 15px rgba(255,215,0,0.3)' }} />
        </Badge>
      </Box>

      {/* תחתית: בר סטטיסטיקה */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 4,
          background: 'rgba(0,0,0,0.6)',
          padding: '10px 30px',
          borderRadius: '30px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <StatItem label="ניצחונות" value={stats?.wins ?? '12'} color={NEON_CYAN} />
        <StatItem label="רצף" value={stats?.streak ?? '3'} color={NEON_GOLD} />
        <StatItem label="דירוג" value={stats?.rank ?? '#4'} color={NEON_PINK} />
      </Box>
    </Box>
  );
}
