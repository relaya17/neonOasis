import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';

interface ProvablyFairDialogProps {
  open: boolean;
  onClose: () => void;
  gameId?: string;
  serverSeed?: string;
  clientSeed?: string;
  commitment?: string;
  nonce?: string;
  diceResult?: number[];
  errorMessage?: string | null;
}

/**
 * Provably Fair RNG Verification Dialog
 * מציג commit/reveal של זריקת קוביות לאימות הוגן.
 */
export function ProvablyFairDialog({
  open,
  onClose,
  gameId = 'demo_game_123',
  serverSeed = 'hidden_until_reveal',
  clientSeed = 'client_seed_xyz',
  commitment = '',
  nonce = '',
  diceResult = [3, 5],
  errorMessage = null,
}: ProvablyFairDialogProps) {
  const [verifyServerSeed, setVerifyServerSeed] = useState('');
  const [verifyResult, setVerifyResult] = useState<'valid' | 'invalid' | null>(null);
  const [verifyDice, setVerifyDice] = useState<number[] | null>(null);

  const handleVerify = async () => {
    try {
      const seed = verifyServerSeed.trim();
      if (!seed) return setVerifyResult('invalid');
      const encoder = new TextEncoder();
      const combined = clientSeed ? `${seed}:${clientSeed}:${nonce}` : `${seed}:${nonce}`;
      const bytes = encoder.encode(combined);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const b1 = parseInt(hash.slice(0, 2), 16);
      const b2 = parseInt(hash.slice(2, 4), 16);
      const d1 = (b1 % 6) + 1;
      const d2 = (b2 % 6) + 1;
      setVerifyDice([d1, d2]);

      if (commitment && commitment !== hash) {
        setVerifyResult('invalid');
        return;
      }
      if (diceResult?.length === 2 && (diceResult[0] !== d1 || diceResult[1] !== d2)) {
        setVerifyResult('invalid');
        return;
      }
      setVerifyResult('valid');
    } catch (_e) {
      setVerifyResult('invalid');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0a0a0b',
          border: '1px solid #00ffff',
          boxShadow: '0 0 30px rgba(0,255,255,0.2)',
        },
      }}
    >
      <DialogTitle sx={{ color: 'primary.main', fontFamily: "'Orbitron', sans-serif" }}>
        Provably Fair RNG
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
          אימות הוגן של תוצאת זריקת קוביות. השרת מחייב (commit) seed מוצפן לפני המשחק, ומגלה (reveal) אחרי.
        </Typography>

        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ mb: 2 }}
        >
          <Typography variant="caption" sx={{ color: '#888' }}>Game ID</Typography>
          <Typography variant="body2" sx={{ color: '#00ffff', fontFamily: 'monospace', mb: 1 }}>
            {gameId}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#888' }}>Client Seed (שלך)</Typography>
          <Typography variant="body2" sx={{ color: '#00ffff', fontFamily: 'monospace', mb: 1, wordBreak: 'break-all' }}>
            {clientSeed}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#888' }}>Server Seed Hash (Commit)</Typography>
          <Typography variant="body2" sx={{ color: '#ff00ff', fontFamily: 'monospace', mb: 1, wordBreak: 'break-all' }}>
            {commitment || 'SHA256(server_seed)'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#888' }}>Nonce</Typography>
          <Typography variant="body2" sx={{ color: '#00ffff', fontFamily: 'monospace', mb: 1, wordBreak: 'break-all' }}>
            {nonce || 'nonce_unknown'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: '#333' }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#888' }}>תוצאה (Dice Roll)</Typography>
          <Typography variant="h6" sx={{ color: '#00f5d4', fontWeight: 'bold' }}>
            {diceResult[0]} · {diceResult[1]}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
          לאימות: הזן את ה-server seed המקורי (מגולה אחרי המשחק):
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="server_seed_revealed"
          value={verifyServerSeed}
          onChange={(e) => setVerifyServerSeed(e.target.value)}
          sx={{ mb: 1, bgcolor: '#111', borderRadius: 1 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleVerify}
          sx={{ borderColor: 'primary.main', color: 'primary.main', mb: 2 }}
        >
          אמת
        </Button>

        {verifyResult === 'valid' && (
          <Alert severity="success" sx={{ bgcolor: 'rgba(0,245,212,0.1)' }}>
            ✓ אימות הצליח! ה-commit והקוביות תואמים.
          </Alert>
        )}
        {verifyResult === 'invalid' && (
          <Alert severity="error" sx={{ bgcolor: 'rgba(255,0,85,0.1)' }}>
            ✗ האימות נכשל. בדוק seed/nonce/commit.
          </Alert>
        )}
        {verifyDice && (
          <Alert severity="info" sx={{ bgcolor: 'rgba(0,255,255,0.08)', mt: 1 }}>
            תוצאת חישוב מקומית: {verifyDice[0]} · {verifyDice[1]}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="warning" sx={{ bgcolor: 'rgba(255,215,0,0.1)', mt: 1 }}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: 'primary.main' }}>
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
}
