/**
 * פאנל פדיון (Cash Out) — הקופה שלי, כפתור פדה כסף עכשיו.
 * Skill-Based: פרס מניצחונות ומתנות ניתן למשיכה לאחר אימות.
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { playSound } from '../audio';

const MIN_CASH_OUT = 100;

interface CashOutPanelProps {
  /** יתרת פרס (Redeemable) — מה שניתן למשיכה */
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
        הקופה שלי
      </Typography>
      <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
        יתרת פרס (לפדיון) — מניצחונות ומתנות
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
        aria-label="פדה כסף עכשיו Cash Out"
      >
        פדֵה כסף עכשיו (Cash Out)
      </Button>

      <Typography
        variant="caption"
        sx={{ color: '#666', display: 'block', mt: 1, textAlign: 'center' }}
      >
        * פדיון מינימלי: {MIN_CASH_OUT} מטבעות. כפוף לתקנון &quot;טורניר מיומנות&quot;.
      </Typography>
    </Box>
  );
}
