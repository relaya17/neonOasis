import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useApiStatusStore } from '../../shared/store/apiStatus';

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
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) setEntries(data.leaderboard ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiOnline]);

  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography sx={{ color: 'primary.main' }}>{t('loading', 'Loading...')}</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2, px: 2 }}>
      <Typography variant="h5" sx={{ color: 'primary.main', mb: 2, textAlign: 'center' }}>
        {t('leaderboard', 'Leaderboard')}
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
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
    </Box>
  );
}
