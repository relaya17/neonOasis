import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const NEON_GOLD = '#ffd700';

export interface GameHeaderProps {
  userCoins: number;
  tablePot: number;
  entryFee?: number;
  onBack: () => void;
  onAddBet: () => void;
}

export function GameHeader({ userCoins, tablePot, entryFee = 50, onBack, onAddBet }: GameHeaderProps) {
  const canBet = userCoins >= entryFee;
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        p: 2,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8), transparent)',
      }}
    >
      <Button onClick={onBack} sx={{ color: '#00f5d4' }}>
        ← חזרה
      </Button>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography sx={{ color: '#00f5d4', fontWeight: 'bold' }}>קופה: {tablePot} 🪙</Typography>
        <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold' }}>BANK: {userCoins} 🪙</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onAddBet}
          disabled={!canBet}
          sx={{ borderColor: NEON_GOLD, color: NEON_GOLD }}
        >
          הכנס {entryFee} 🪙
        </Button>
      </Box>
    </Box>
  );
}
