import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { LEADERBOARD_VIDEO_URL } from '../../config/videoUrls';
import { fullScreenVideoStyle } from '../../config/videoStyles';

const API_URL = import.meta.env.VITE_API_URL ?? '';

interface Entry {
  rank: number;
  userId: string;
  username: string;
  balance: string;
  level: number;
}

export function LeaderboardView() {
  const { t } = useTranslation('common');
  const apiOnline = useApiStatusStore((s) => s.online);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (apiOnline === false) {
      setError('ה־API לא זמין כרגע');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?limit=20`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          if (res.ok) {
            setEntries(data.leaderboard ?? []);
            setError(null);
          } else {
            setEntries([]);
            setError('הטבלה לא זמינה כרגע');
          }
        }
      } catch (e) {
        if (!cancelled) {
          setEntries([]);
          setError('הטבלה לא זמינה כרגע');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiOnline]);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* רקע וידאו */}
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <video
          src={LEADERBOARD_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          style={fullScreenVideoStyle}
        />
      </Box>
      {/* שכבת כיסוי כהה */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* תוכן הדף */}
      <Box sx={{ position: 'relative', zIndex: 2, py: 2, px: 2 }}>
        {loading && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'primary.main' }}>{t('loading', 'Loading...')}</Typography>
          </Box>
        )}
        {!loading && error && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        {!loading && !error && (
          <>
            <Typography variant="h5" sx={{ color: 'primary.main', mb: 2, textAlign: 'center' }}>
              {t('leaderboard', 'Leaderboard')}
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,26,0.9)', backdropFilter: 'blur(8px)' }}>
              <Table size="small" aria-label="Leaderboard">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>#</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>{t('username', 'Username')}</TableCell>
                    <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{t('balance')}</TableCell>
                    <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell sx={{ color: row.rank <= 3 ? '#ff00ff' : 'text.primary' }}>{row.rank}</TableCell>
                      <TableCell>@{row.username}</TableCell>
                      <TableCell align="right">💎 {Number(row.balance).toLocaleString()}</TableCell>
                      <TableCell align="right">{row.level}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Box>
  );
}
