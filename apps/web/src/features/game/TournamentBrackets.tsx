import { Box, Typography, Card, CardContent, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { useApiStatusStore } from '../../shared/store/apiStatus';

interface Player {
  id: string;
  name: string;
  seed: number;
}

interface Match {
  id: string;
  player1?: Player;
  player2?: Player;
  winner?: string;
  round: number;
}

const MOCK_BRACKET: Match[] = [
  // Round 1 (Quarter-finals)
  { id: 'm1', player1: { id: 'p1', name: 'Tony_Montana', seed: 1 }, player2: { id: 'p8', name: 'Lucky_8', seed: 8 }, winner: 'p1', round: 1 },
  { id: 'm2', player1: { id: 'p4', name: 'The_Cowboy', seed: 4 }, player2: { id: 'p5', name: 'Vegas_Queen', seed: 5 }, winner: 'p5', round: 1 },
  { id: 'm3', player1: { id: 'p2', name: 'NeonKing', seed: 2 }, player2: { id: 'p7', name: 'Chip_Master', seed: 7 }, winner: 'p2', round: 1 },
  { id: 'm4', player1: { id: 'p3', name: 'OasisAce', seed: 3 }, player2: { id: 'p6', name: 'Dice_Lord', seed: 6 }, winner: 'p3', round: 1 },
  // Round 2 (Semi-finals)
  { id: 'm5', player1: { id: 'p1', name: 'Tony_Montana', seed: 1 }, player2: { id: 'p5', name: 'Vegas_Queen', seed: 5 }, round: 2 },
  { id: 'm6', player1: { id: 'p2', name: 'NeonKing', seed: 2 }, player2: { id: 'p3', name: 'OasisAce', seed: 3 }, round: 2 },
  // Round 3 (Final)
  { id: 'm7', round: 3 },
];

/**
 * Tournament Brackets UI — מערכת טורנירים בסגנון Vegas.
 * Stub: מציג מבנה בראקט בסיסי עם מצב Offline.
 */
export function TournamentBrackets() {
  const apiOnline = useApiStatusStore((s) => s.online);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0b 0%, #1a0a1a 100%)',
        py: 4,
        px: 2,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          color: 'primary.main',
          fontFamily: "'Orbitron', sans-serif",
          textShadow: '0 0 20px rgba(255,0,255,0.5)',
          mb: 1,
        }}
      >
        Tournament Brackets
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', color: '#aaa', mb: 3 }}>
        Neon Oasis Championship — 8 Players
      </Typography>

      {apiOnline === false && (
        <Typography
          variant="caption"
          sx={{
            color: '#ff4d9a',
            bgcolor: 'rgba(255, 0, 85, 0.12)',
            border: '1px solid rgba(255, 0, 85, 0.3)',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            display: 'block',
            textAlign: 'center',
            mb: 2,
          }}
        >
          ה־API לא זמין — נתוני טורניר מדמי.
        </Typography>
      )}

      <Stack spacing={3} maxWidth={900} mx="auto">
        {/* Round 1 */}
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#00ffff', mb: 1 }}>
            Round 1 — Quarter-Finals
          </Typography>
          <Stack spacing={1}>
            {MOCK_BRACKET.filter((m) => m.round === 1).map((match) => (
              <Card
                key={match.id}
                sx={{
                  bgcolor: '#16161a',
                  border: '1px solid rgba(0,255,255,0.2)',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <CardContent sx={{ py: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                      sx={{
                        color: match.winner === match.player1?.id ? '#00f5d4' : '#ccc',
                        fontWeight: match.winner === match.player1?.id ? 'bold' : 'normal',
                      }}
                    >
                      {match.player1?.name} (#{match.player1?.seed})
                    </Typography>
                    <Typography sx={{ color: '#888' }}>vs</Typography>
                    <Typography
                      sx={{
                        color: match.winner === match.player2?.id ? '#00f5d4' : '#ccc',
                        fontWeight: match.winner === match.player2?.id ? 'bold' : 'normal',
                      }}
                    >
                      {match.player2?.name} (#{match.player2?.seed})
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Round 2 */}
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#ff00ff', mb: 1 }}>
            Round 2 — Semi-Finals
          </Typography>
          <Stack spacing={1}>
            {MOCK_BRACKET.filter((m) => m.round === 2).map((match) => (
              <Card
                key={match.id}
                sx={{
                  bgcolor: '#16161a',
                  border: '1px solid rgba(255,0,255,0.2)',
                  '&:hover': { borderColor: '#ff00ff' },
                }}
              >
                <CardContent sx={{ py: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    {match.player1 && match.player2 ? (
                      <>
                        <Typography sx={{ color: '#ccc' }}>{match.player1.name}</Typography>
                        <Typography sx={{ color: '#888' }}>vs</Typography>
                        <Typography sx={{ color: '#ccc' }}>{match.player2.name}</Typography>
                      </>
                    ) : (
                      <Typography sx={{ color: '#666', textAlign: 'center', width: '100%' }}>
                        TBD
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Round 3 (Final) */}
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#f72585', mb: 1 }}>
            Round 3 — Final
          </Typography>
          <Card
            sx={{
              bgcolor: '#16161a',
              border: '2px solid rgba(247,37,133,0.4)',
              boxShadow: '0 0 30px rgba(247,37,133,0.2)',
            }}
          >
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography sx={{ color: '#666' }}>TBD — מחכה לסיום Semi-Finals</Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}
