import { useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { useWalletStore } from './store';
import { NeonButton } from '@/shared/components';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { useSessionStore } from '../auth';
import { playSound } from '../../shared/audio';
import { hapticClick } from '../../shared/hooks';

const API_URL = import.meta.env.VITE_API_URL ?? '';

const PACKAGES = [
  { id: 'starter', coins: 100, price: '₪4.99', bonus: '', credits: 100 },
  { id: 'pro', coins: 500, price: '₪19.99', bonus: '+50 חינם', credits: 550 },
  { id: 'vip', coins: 2000, price: '₪74.99', bonus: '+400 חינם', credits: 2400 },
];

export function StoreView() {
  const balance = useWalletStore((s) => s.balance);
  const userId = useWalletStore((s) => s.userId);
  const setBalance = useWalletStore((s) => s.setBalance);
  const apiOnline = useApiStatusStore((s) => s.online);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    if (apiOnline === false) return;
    playSound('neon_click');
    hapticClick();
    setPurchasing(pkg.id);
    try {
      // Mock IAP: generate transactionId and call /api/iap/apple
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch(`${API_URL}/api/iap/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactionId,
          productId: pkg.id,
          credits: pkg.credits,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBalance(data.balance);
        setSnackbar({ open: true, message: `נוספו ${pkg.credits} מטבעות!`, severity: 'success' });
        playSound('win');
      } else {
        setSnackbar({ open: true, message: data.error ?? 'רכישה נכשלה', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'שגיאת רשת', severity: 'error' });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d0d0d 0%, #1a0a14 100%)',
        py: 4,
        px: 2,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          color: 'primary.main',
          textShadow: '0 0 20px var(--neon-glow)',
          mb: 3,
        }}
      >
        חנות ניאון
      </Typography>

      <Card
        component={motion.div}
        sx={{
          maxWidth: 360,
          mx: 'auto',
          mb: 4,
          background: 'rgba(26,26,26,0.9)',
          border: '1px solid',
          borderColor: 'primary.main',
          boxShadow: '0 0 24px rgba(0,245,212,0.2)',
        }}
      >
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            יתרה נוכחית
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: 'primary.main',
              fontFamily: 'monospace',
              textShadow: '0 0 12px var(--neon-glow)',
            }}
          >
            {Number(balance).toLocaleString()} מטבעות
          </Typography>
        </CardContent>
      </Card>

      {apiOnline === false && (
        <Typography
          variant="caption"
          sx={{
            color: '#ff4d9a',
            display: 'block',
            textAlign: 'center',
            mb: 2,
          }}
        >
          ה־API לא זמין כרגע — רכישות מושבתות במצב Offline.
        </Typography>
      )}

      <Stack spacing={2} maxWidth={400} mx="auto">
        {PACKAGES.map((pkg, i) => (
          <Card
            key={pkg.id}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            sx={{
              background: 'rgba(26,26,26,0.85)',
              border: '1px solid rgba(0,245,212,0.3)',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 0 20px rgba(0,245,212,0.25)',
              },
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Box>
                  <Typography variant="h6" color="primary.main">
                    {pkg.coins.toLocaleString()} מטבעות
                  </Typography>
                  {pkg.bonus && (
                    <Typography variant="caption" color="secondary.main">
                      {pkg.bonus}
                    </Typography>
                  )}
                </Box>
                <NeonButton
                  variant="contained"
                  size="medium"
                  aria-label={`Buy ${pkg.coins} coins for ${pkg.price}`}
                  disabled={apiOnline === false || purchasing === pkg.id}
                  onClick={() => handlePurchase(pkg)}
                >
                  {purchasing === pkg.id ? <CircularProgress size={20} sx={{ color: '#000' }} /> : pkg.price}
                </NeonButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ bgcolor: snackbar.severity === 'success' ? 'rgba(0,245,212,0.1)' : 'rgba(255,0,85,0.1)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
