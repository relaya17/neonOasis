/**
 * פאנל פרסי מיומנות — הצגת יתרת פרס ומידע משפטי.
 * Skill-Based Competition Prizes — ניתן למימוש בכפוף לתקנון ולרישיון.
 *
 * חשוב: הפרסים הם מתחרויות מיומנות (Skill-Based) בלבד — לא ממשחקי מזל.
 * משחק מול AI (מחשב) אינו מזכה בפרסי מיומנות.
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { playSound } from '../audio';

const MIN_CASH_OUT = 100;

interface CashOutPanelProps {
  /** יתרת פרס (Redeemable) — מתחרויות מיומנות בלבד */
  prizeBalance: number | string;
  onCashOut: () => void;
  disabled?: boolean;
}

export function CashOutPanel({ prizeBalance, onCashOut, disabled }: CashOutPanelProps) {
  const balance = Number(prizeBalance);
  const canCashOut = balance >= MIN_CASH_OUT && !disabled;

  const handleClick = () => {
    playSound('neon_click');
    onCashOut();
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: '#1a1a1a',
        borderRadius: 4,
        border: '1px solid #ffd700',
        boxShadow: '0 0 20px rgba(255,215,0,0.15)',
      }}
    >
      <Typography variant="h6" sx={{ color: '#fff' }}>
        פרסי מיומנות
      </Typography>
      <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
        יתרת פרס — מתחרויות מיומנות (PvP) ומתנות בלבד
      </Typography>
      <Typography variant="h3" sx={{ color: '#ffd700', my: 2 }}>
        {balance.toLocaleString()} 🪙
      </Typography>

      <Button
        fullWidth
        variant="contained"
        disabled={!canCashOut}
        sx={{
          bgcolor: '#ffd700',
          color: '#000',
          fontWeight: 'bold',
          '&:hover': { bgcolor: '#ffc107' },
          '&.Mui-disabled': { color: '#666', bgcolor: '#333' },
        }}
        onClick={handleClick}
        aria-label="בקש מימוש פרס מיומנות"
      >
        בקש מימוש פרס מיומנות
      </Button>

      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', fontSize: '0.68rem', lineHeight: 1.6 }}>
          * מינימום מימוש: {MIN_CASH_OUT} מטבעות. בכפוף לתקנון ולאישור.
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', fontSize: '0.68rem', lineHeight: 1.6 }}>
          * פרסים מבוססים על מיומנות בלבד (Skill-Based) — לא על מזל.
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', fontSize: '0.68rem', lineHeight: 1.6 }}>
          * משחק מול מחשב (AI) הוא לאימון בלבד ואינו מזכה בפרסי מיומנות.
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', fontSize: '0.68rem', lineHeight: 1.6 }}>
          * Neon Oasis אינה אתר הימורים. אין משחקי מזל באתר.
        </Typography>
      </Box>
    </Box>
  );
}
