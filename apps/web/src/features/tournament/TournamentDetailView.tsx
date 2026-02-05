/**
 * Tournament Detail View
 * Shows tournament details, participants, and brackets
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { ArrowBack, EmojiEvents } from '@mui/icons-material';
import { TournamentBrackets } from '../game/TournamentBrackets';

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
  status: string;
  start_time?: string;
  end_time?: string;
}

interface Participant {
  id: string;
  user_id: string;
  seed: number;
  status: string;
}

interface Match {
  id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  status: string;
}

export function TournamentDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchTournamentDetails();
  }, [id]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tournaments/${id}`);
      const data = await res.json();

      if (res.ok) {
        setTournament(data.tournament);
        setParticipants(data.participants || []);
        setMatches(data.matches || []);
      } else {
        setError(data.error || 'Failed to load tournament');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tournament) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Tournament not found'}</Alert>
        <Button onClick={() => navigate('/tournaments')} sx={{ mt: 2 }}>
          חזרה לטורנירים
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/tournaments')} sx={{ mb: 2 }}>
        חזרה לטורנירים
      </Button>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid #0f3460',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#00ffff' }}>
          🏆 {tournament.name}
        </Typography>

        {tournament.description && (
          <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
            {tournament.description}
          </Typography>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              סטטוס
            </Typography>
            <Typography variant="h6">
              <Chip
                label={
                  tournament.status === 'open'
                    ? 'פתוח'
                    : tournament.status === 'full'
                    ? 'מלא'
                    : tournament.status === 'in_progress'
                    ? 'בתהליך'
                    : tournament.status === 'completed'
                    ? 'הסתיים'
                    : tournament.status
                }
                color={tournament.status === 'open' ? 'success' : 'default'}
              />
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              דמי כניסה
            </Typography>
            <Typography variant="h6">{parseFloat(tournament.entry_fee).toFixed(2)} מטבעות</Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              פרס כולל
            </Typography>
            <Typography variant="h6" sx={{ color: '#ffd700' }}>
              {parseFloat(tournament.prize_pool).toFixed(2)} מטבעות
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              משתתפים
            </Typography>
            <Typography variant="h6">
              {tournament.current_participants}/{tournament.max_participants}
            </Typography>
          </Grid>
        </Grid>

        {tournament.start_time && (
          <Typography variant="body2" color="text.secondary">
            התחלה: {new Date(tournament.start_time).toLocaleString('he-IL')}
          </Typography>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid #0f3460',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              משתתפים ({participants.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {participants.length === 0 ? (
              <Alert severity="info">אין משתתפים עדיין</Alert>
            ) : (
              <List>
                {participants.map((p) => (
                  <ListItem key={p.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#00ffff', color: '#000' }}>
                        {p.seed}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`משתתף #${p.seed}`}
                      secondary={
                        p.status === 'winner' ? (
                          <Chip label="🏆 מנצח" color="success" size="small" />
                        ) : p.status === 'eliminated' ? (
                          <Chip label="הודח" color="default" size="small" />
                        ) : (
                          <Chip label="פעיל" color="primary" size="small" />
                        )
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid #0f3460',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Bracket
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {matches.length === 0 ? (
              <Alert severity="info">ה-Bracket יווצר כשהטורניר יתחיל</Alert>
            ) : (
              <TournamentBrackets />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
