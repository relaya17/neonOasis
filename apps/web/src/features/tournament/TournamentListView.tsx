/**
 * Tournament List View
 * Displays all open tournaments and allows registration
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { EmojiEvents, People, AttachMoney, Schedule } from '@mui/icons-material';
import { useAuthStore } from '../auth/store';
import { useApiStatusStore } from '../../shared/store/apiStatus';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  game_type: string;
  entry_fee: string;
  prize_pool: string;
  max_participants: number;
  current_participants: number;
  status: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  start_time?: string;
  created_at: string;
}

export function TournamentListView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const userId = useAuthStore((s) => s.user?.id);
  const apiOnline = useApiStatusStore((s) => s.online);

  useEffect(() => {
    if (apiOnline === false) {
      setLoading(false);
      setError('ה־API לא זמין כרגע — טורנירים לא זמינים במצב Offline.');
      return;
    }

    fetchTournaments();
  }, [apiOnline]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/tournaments`);
      const data = await res.json();

      if (res.ok) {
        setTournaments(data.tournaments || []);
      } else {
        setError(data.error || 'Failed to load tournaments');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (tournamentId: string) => {
    if (!userId) {
      setError('יש להתחבר כדי להירשם לטורניר');
      return;
    }

    setRegistering(tournamentId);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('נרשמת בהצלחה לטורניר! 🎉');
        fetchTournaments(); // Refresh
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setRegistering(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
        🏆 טורנירים
      </Typography>

      {apiOnline === false && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ה־API לא זמין כרגע — טורנירים לא זמינים במצב Offline.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {tournaments.length === 0 ? (
        <Alert severity="info">אין טורנירים פתוחים כרגע. חזור בקרוב!</Alert>
      ) : (
        <Grid container spacing={3}>
          {tournaments.map((t) => (
            <Grid item xs={12} md={6} key={t.id}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  border: '1px solid #0f3460',
                  boxShadow: '0 4px 20px rgba(0, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 255, 255, 0.2)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#00ffff' }}>
                      {t.name}
                    </Typography>
                    <Chip
                      label={t.status === 'open' ? 'פתוח' : t.status === 'full' ? 'מלא' : t.status}
                      color={t.status === 'open' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  {t.description && (
                    <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                      {t.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AttachMoney sx={{ color: '#ffd700' }} />
                      <Typography variant="body2">
                        דמי כניסה: {parseFloat(t.entry_fee).toFixed(2)} מטבעות
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmojiEvents sx={{ color: '#ffd700' }} />
                      <Typography variant="body2">
                        פרס: {parseFloat(t.prize_pool).toFixed(2)} מטבעות
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <People sx={{ color: '#00ffff' }} />
                      <Typography variant="body2">
                        {t.current_participants}/{t.max_participants} משתתפים
                      </Typography>
                    </Box>
                  </Box>

                  {t.start_time && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <Schedule sx={{ color: '#ff00ff' }} />
                      <Typography variant="body2">
                        מתחיל: {new Date(t.start_time).toLocaleString('he-IL')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={
                      t.status !== 'open' ||
                      registering === t.id ||
                      apiOnline === false ||
                      !userId
                    }
                    onClick={() => handleRegister(t.id)}
                    sx={{
                      background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
                      fontWeight: 700,
                      '&:disabled': {
                        background: '#333',
                        color: '#666',
                      },
                    }}
                  >
                    {registering === t.id ? (
                      <CircularProgress size={24} />
                    ) : t.status === 'open' ? (
                      'הרשם עכשיו'
                    ) : t.status === 'full' ? (
                      'מלא'
                    ) : (
                      'לא זמין'
                    )}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
