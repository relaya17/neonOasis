/**
 * ארנק ניאון יוקרתי — כרטיס מאזן בסגנון כרטיס אשראי,
 * הפרדה ברורה בין Balance (קנייה) ל-Prize Balance (הרווחה), Cash Out + Add Funds, היסטוריה ואמון.
 */

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import History from '@mui/icons-material/History';
import GetApp from '@mui/icons-material/GetApp';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import Store from '@mui/icons-material/Store';
import { motion } from 'framer-motion';
import { playSound } from '../audio';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const NEON_CYAN = '#00f2ea';
const NEON_PINK = '#f72585';
const MIN_CASH_OUT = 100;
const CASH_OUT_FEE_RATE = 0.1; // 10% — "זמין למשיכה לאחר עמלה"

export interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  createdAt: string;
}

const TX_LABELS: Record<string, { label: string; emoji: string }> = {
  gift: { label: 'קיבלת מתנה בלייב', emoji: '🎁' },
  gift_received: { label: 'קיבלת מתנה בלייב', emoji: '🎁' },
  gift_sent: { label: 'שלחת מתנה', emoji: '🎁' },
  win: { label: 'זכייה בטורניר', emoji: '🏆' },
  bet: { label: 'הימור משחק', emoji: '💸' },
  purchase: { label: 'רכישת מטבעות', emoji: '💳' },
  coupon: { label: 'קוד קופון', emoji: '🎟️' },
  referral: { label: 'הזמנת חבר', emoji: '👥' },
  referral_commission: { label: 'עמלת הפניה', emoji: '👥' },
  withdrawal: { label: 'משיכה', emoji: '🏦' },
  p2p_transfer: { label: 'זכייה במשחק', emoji: '🏆' },
  escrow_hold: { label: 'הפקדת משחק', emoji: '🔒' },
  escrow_release: { label: 'שחרור הפקדה', emoji: '🔓' },
  backing_bet: { label: 'הימור תמיכה', emoji: '💸' },
  backing_payout: { label: 'תשלום תמיכה', emoji: '💰' },
  backing_share: { label: 'חלק מזכייה', emoji: '🏆' },
  backing_refund: { label: 'החזר תמיכה', emoji: '↩️' },
  oasis_mint: { label: 'Oasis', emoji: '◉' },
  oasis_spend: { label: 'שימוש Oasis', emoji: '◉' },
  fee: { label: 'עמלה', emoji: '📋' },
  market_sale: { label: 'מכירה בשוק', emoji: '🛒' },
  market_buy: { label: 'רכישה בשוק', emoji: '🛒' },
};

function getTxDisplay(type: string): { label: string; emoji: string } {
  return TX_LABELS[type] ?? { label: type, emoji: '📌' };
}

interface NeonWalletProps {
  userId: string | null;
  balance: number | string;
  prizeBalance: number | string;
  onCashOut: () => void;
  onAddFunds?: () => void;
  disabled?: boolean;
}

export function NeonWallet({
  userId,
  balance,
  prizeBalance,
  onCashOut,
  onAddFunds,
  disabled,
}: NeonWalletProps) {
  const prize = Number(prizeBalance);
  const playMoney = Number(balance);
  const canCashOut = prize >= MIN_CASH_OUT && !disabled;
  const availableAfterFee = Math.floor(prize * (1 - CASH_OUT_FEE_RATE));

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (!userId || !API_URL) {
      setTransactions([]);
      return;
    }
    setTxLoading(true);
    fetch(`${API_URL}/api/users/${userId}/wallet/transactions?limit=30`)
      .then((r) => (r.ok ? r.json() : { transactions: [] }))
      .then((data: { transactions?: WalletTransaction[] }) => {
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      })
      .catch(() => setTransactions([]))
      .finally(() => setTxLoading(false));
  }, [userId]);

  const handleCashOut = () => {
    playSound('neon_click');
    onCashOut();
  };

  const handleAddFunds = () => {
    playSound('neon_click');
    onAddFunds?.();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
      {/* כרטיס המאזן המרכזי — Prize Balance */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1a1a1a 0%, rgba(0, 242, 234, 0.13) 100%)',
            border: '1px solid rgba(0, 242, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Stack spacing={1}>
            <Typography
              sx={{
                color: NEON_CYAN,
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: 1,
              }}
            >
              TOTAL PRIZE BALANCE
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 'bold',
                fontFamily: 'Orbitron, sans-serif',
                color: '#fff',
              }}
            >
              {prize.toLocaleString()} 🪙
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              זמין למשיכה מיידית (לאחר עמלה 10%): {availableAfterFee.toLocaleString()} 🪙
            </Typography>
          </Stack>
          <AccountBalanceWallet
            sx={{
              position: 'absolute',
              right: -10,
              bottom: -10,
              fontSize: '120px',
              color: 'rgba(0, 242, 234, 0.05)',
            }}
          />
        </Paper>
      </motion.div>

      {/* מאזן משחק (Balance) — הפרדה פסיכולוגית */}
      <Paper
        elevation={0}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          mb: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: '#888' }}>
            Play Money (רכישה)
          </Typography>
          <Typography sx={{ color: '#fff', fontWeight: 600 }}>
            {playMoney.toLocaleString()} 🪙
          </Typography>
        </Stack>
      </Paper>

      {/* כפתורי פעולה */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={!canCashOut}
          onClick={handleCashOut}
          startIcon={<GetApp />}
          sx={{
            bgcolor: NEON_CYAN,
            color: '#000',
            fontWeight: 'bold',
            borderRadius: 3,
            py: 1.5,
            '&:hover': { bgcolor: '#00d1ca' },
            '&.Mui-disabled': { color: '#666', bgcolor: '#333' },
          }}
          aria-label="פדה כסף Cash Out"
        >
          CASH OUT
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleAddFunds}
          startIcon={<Store />}
          sx={{
            borderColor: '#333',
            color: '#fff',
            borderRadius: 3,
            '&:hover': { borderColor: NEON_CYAN, color: NEON_CYAN },
          }}
          aria-label="הוסף כסף Add Funds"
        >
          ADD FUNDS
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ color: '#666', display: 'block', textAlign: 'center', mb: 2 }}>
        פדיון מינימלי: {MIN_CASH_OUT} 🪙 · כפוף לתקנון טורניר מיומנות
      </Typography>

      {/* היסטוריית פעולות */}
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#fff',
        }}
      >
        <History /> היסטוריית פעולות
      </Typography>

      {txLoading ? (
        <Typography variant="body2" sx={{ color: '#666' }}>
          טוען...
        </Typography>
      ) : transactions.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#666' }}>
          עדיין אין תנועות. שחק וצבור פרסים.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {transactions.map((tx) => {
            const { label, emoji } = getTxDisplay(tx.type);
            const isPositive = tx.amount > 0;
            return (
              <Box
                key={tx.id}
                sx={{
                  p: 2,
                  bgcolor: '#0a0a0a',
                  borderRadius: 2,
                  borderLeft: `4px solid ${isPositive ? NEON_CYAN : NEON_PINK}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
                    {emoji} {label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#555' }}>
                    {new Date(tx.createdAt).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    color: isPositive ? NEON_CYAN : '#ff4d4d',
                  }}
                >
                  {isPositive ? '+' : ''}
                  {tx.amount.toLocaleString()} 🪙
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* אבטחה — Trust */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{ mt: 4, opacity: 0.7 }}
      >
        <VerifiedUser sx={{ fontSize: '18px', color: NEON_CYAN }} />
        <Typography variant="caption" sx={{ color: '#888' }}>
          מאובטח על ידי הצפנת 256-bit SSL
        </Typography>
      </Stack>
    </Box>
  );
}
