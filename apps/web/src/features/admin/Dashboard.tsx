import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { StatsCard } from './StatsCard';

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GREEN = '#2e7d32';
const NEON_RED = '#d32f2f';
const NEON_BLUE = '#0288d1';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const defaultRevenueData = [
  { name: '08:00', revenue: 4000, players: 240 },
  { name: '12:00', revenue: 7500, players: 600 },
  { name: '16:00', revenue: 12000, players: 1100 },
  { name: '20:00', revenue: 18500, players: 2500 },
  { name: '00:00', revenue: 22100, players: 1800 },
];

const defaultAlerts = [
  { id: '1', type: 'bot', userId: 'u_abc', room: 'BACKGAMMON_1', time: '14:32' },
  { id: '2', type: 'minor', userId: 'u_xyz', room: null, time: '15:01' },
];

type UserRow = { id: string; username: string; balance: string; level: number; createdAt: string; isBlocked?: boolean };
type TransactionRow = { id: string; amount: string; type: string; referenceId: string | null; createdAt: string };
type RoomRow = { roomId: string; playerCount: number };

export function AdminDashboard() {
  const [adminTab, setAdminTab] = useState(0);
  const [emergencyShown, setEmergencyShown] = useState(false);
  const [stats, setStats] = useState<{
    revenue: number;
    activePlayers: number;
    aiAlerts: number;
    churnRate?: number;
    revenueByHour: { name: string; revenue: number; players: number }[];
  } | null>(null);
  const [alerts, setAlerts] = useState<{ id: string; type: string; userId: string; room: string | null; time: string }[]>(defaultAlerts);
  const [loading, setLoading] = useState(true);

  // User Management
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [transactionsUserId, setTransactionsUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Game Control
  const [rake, setRake] = useState(0.15);
  const [rakeLoading, setRakeLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [shutdownRoomId, setShutdownRoomId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/admin/stats`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API_BASE}/api/admin/alerts`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([statsRes, alertsRes]) => {
        if (cancelled) return;
        if (statsRes?.revenue != null) setStats(statsRes);
        if (alertsRes?.alerts?.length) setAlerts(alertsRes.alerts);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    fetch(`${API_BASE}/api/admin/users?q=${encodeURIComponent(userSearch)}`)
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [userSearch]);

  useEffect(() => {
    if (adminTab !== 1) return;
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [adminTab, userSearch, fetchUsers]);

  const openTransactions = (userId: string) => {
    setTransactionsUserId(userId);
    setTransactions([]);
    setTransactionsLoading(true);
    fetch(`${API_BASE}/api/admin/users/${userId}/transactions`)
      .then((r) => (r.ok ? r.json() : { transactions: [] }))
      .then((data) => setTransactions(data.transactions ?? []))
      .catch(() => setTransactions([]))
      .finally(() => setTransactionsLoading(false));
  };

  useEffect(() => {
    if (adminTab !== 2) return;
    setRakeLoading(true);
    fetch(`${API_BASE}/api/admin/rake`)
      .then((r) => (r.ok ? r.json() : { rake: 0.15 }))
      .then((data) => setRake(Number(data.rake) ?? 0.15))
      .catch(() => {})
      .finally(() => setRakeLoading(false));
    setRoomsLoading(true);
    fetch(`${API_BASE}/api/admin/rooms`)
      .then((r) => (r.ok ? r.json() : { rooms: [] }))
      .then((data) => setRooms(data.rooms ?? []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [adminTab]);

  const handleRakeChange = (_: unknown, value: number | number[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    setRake(v);
  };

  const handleRakeCommit = () => {
    fetch(`${API_BASE}/api/admin/rake`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rake: rake }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setRake(data.rake))
      .catch(() => {});
  };

  const doRoomShutdown = (roomId: string) => {
    setShutdownRoomId(roomId);
    fetch(`${API_BASE}/api/admin/rooms/${encodeURIComponent(roomId)}/shutdown`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then(() => {
        setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
        setAlerts((prev) => prev.map((a) => (a.room === roomId ? { ...a, room: null } : a)));
      })
      .finally(() => setShutdownRoomId(null));
  };

  const doAlertRoomShutdown = (roomId: string) => {
    setShutdownRoomId(roomId);
    fetch(`${API_BASE}/api/admin/rooms/${encodeURIComponent(roomId)}/shutdown`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then(() => {
        setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
        setAlerts((prev) => prev.map((a) => (a.room === roomId ? { ...a, room: null } : a)));
      })
      .finally(() => setShutdownRoomId(null));
  };

  const doBlockUser = (userId: string, block: boolean) => {
    fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(userId)}/block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(() => {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBlocked: block } : u)));
      })
      .catch(() => {});
  };

  const revenueData = stats?.revenueByHour ?? defaultRevenueData;
  const revenueFormatted = stats ? `₪${stats.revenue.toLocaleString()}` : '₪45,200';
  const playersFormatted = stats ? stats.activePlayers.toLocaleString() : '2,540';
  const alertsCount = stats?.aiAlerts ?? alerts.length;

  return (
    <Box component="main" sx={{ p: 4, bgcolor: '#0d0d0d', minHeight: '100vh', color: '#e0e0e0' }} role="main" aria-label="Vegas Control Center - Admin Dashboard">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: NEON_CYAN, textShadow: `0 0 20px ${NEON_CYAN}88` }}>
          Vegas Control Center 🎰
        </Typography>
        {emergencyShown && (
          <Alert severity="error" onClose={() => setEmergencyShown(false)} sx={{ maxWidth: 400 }}>
            Emergency Shutdown זמין לחדר ספציפי בלשונית Game Control או AI Guardian
          </Alert>
        )}
        <Button
          variant="outlined"
          color="error"
          onClick={() => setEmergencyShown(true)}
          sx={{ borderColor: NEON_RED, color: NEON_RED, '&:hover': { borderColor: NEON_RED, bgcolor: `${NEON_RED}22` } }}
        >
          Emergency Shutdown
        </Button>
      </Box>

      <Tabs
        value={adminTab}
        onChange={(_: any, v: any) => setAdminTab(v)}
        aria-label="Admin dashboard sections"
        sx={{
          borderBottom: `1px solid ${NEON_CYAN}44`,
          mb: 3,
          '& .MuiTab-root': { color: '#aaa' },
          '& .Mui-selected': { color: NEON_CYAN },
        }}
      >
        <Tab label="מבט על (Overview)" />
        <Tab label="ניהול משתמשים" />
        <Tab label="שליטה במשחקים" />
        <Tab label="AI Guardian Logs" />
      </Tabs>

      {adminTab === 0 && (
        <Grid container spacing={3}>
          {loading && (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress sx={{ color: NEON_CYAN }} />
            </Grid>
          )}
          <Grid item xs={12} md={4}>
            <StatsCard title="Total Revenue" value={revenueFormatted} color={NEON_GREEN} subtitle="Rake + עמלות מרקטפלייס" />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatsCard title="Active Players (DAU)" value={playersFormatted} color={NEON_BLUE} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatsCard title="AI Alerts" value={alertsCount} color={NEON_RED} subtitle="רמאים / קטינים" />
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '15px', bgcolor: 'rgba(26,26,26,0.9)', border: `1px solid ${NEON_CYAN}33` }}>
              <Typography variant="h6" sx={{ mb: 2, color: NEON_CYAN }}>
                Revenue Stream (Live)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: `1px solid ${NEON_CYAN}` }}
                      labelStyle={{ color: NEON_CYAN }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke={NEON_CYAN} strokeWidth={3} dot={{ fill: NEON_CYAN }} />
                    <Line type="monotone" dataKey="players" stroke={NEON_PINK} strokeWidth={2} dot={{ fill: NEON_PINK }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: '15px', bgcolor: 'rgba(26,26,26,0.9)', border: `1px solid ${NEON_PINK}33` }}>
              <Typography variant="h6" sx={{ mb: 2, color: NEON_PINK }}>
                Heatmap — שעות קניית מטבעות
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="heatNeon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={NEON_PINK} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={NEON_PINK} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: `1px solid ${NEON_PINK}` }} />
                    <Area type="monotone" dataKey="revenue" stroke={NEON_PINK} fill="url(#heatNeon)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Happy Hour אוטומטי לפי שעות שיא
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {adminTab === 1 && (
        <Paper sx={{ p: 3, bgcolor: 'rgba(26,26,26,0.9)', border: `1px solid ${NEON_CYAN}33` }}>
          <Typography variant="h6" sx={{ mb: 2, color: NEON_CYAN }}>
            User Management
          </Typography>
          <TextField
            fullWidth
            placeholder="חיפוש משתמש (username / ID)"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            sx={{ mb: 2, maxWidth: 400 }}
            size="small"
            InputProps={{
              sx: { bgcolor: '#1a1a1a', color: '#eee' },
              endAdornment: usersLoading ? <InputAdornment position="end"><CircularProgress size={20} sx={{ color: NEON_CYAN }} /></InputAdornment> : null,
            }}
          />
          <Table size="small" sx={{ '& .MuiTableCell-root': { color: '#e0e0e0', borderColor: '#333' } }}>
            <TableHead>
              <TableRow>
                <TableCell>משתמש</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>יתרה</TableCell>
                <TableCell>רמה</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell align="right">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 && !usersLoading && (
                <TableRow><TableCell colSpan={6} color="text.secondary">אין משתמשים או שהחיפוש לא החזיר תוצאות</TableCell></TableRow>
              )}
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{u.id.slice(0, 8)}…</TableCell>
                  <TableCell>₪{Number(u.balance).toLocaleString()}</TableCell>
                  <TableCell>{u.level}</TableCell>
                  <TableCell>
                    {u.isBlocked ? <Chip label="חסום" size="small" sx={{ bgcolor: NEON_RED + '44', color: NEON_RED }} /> : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openTransactions(u.id)} sx={{ color: NEON_CYAN, mr: 0.5 }}>
                      היסטוריה
                    </Button>
                    {u.isBlocked ? (
                      <Button size="small" onClick={() => doBlockUser(u.id, false)} sx={{ color: NEON_GREEN }}>בטל חסימה</Button>
                    ) : (
                      <Button size="small" color="error" onClick={() => doBlockUser(u.id, true)}>חסום</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {adminTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(26,26,26,0.9)', border: `1px solid ${NEON_CYAN}33` }}>
              <Typography variant="h6" sx={{ mb: 2, color: NEON_CYAN }}>
                Game Control
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                שינוי אחוז Rake בזמן אמת — משפיע על משחקים חדשים
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {rakeLoading ? <CircularProgress size={24} sx={{ color: NEON_CYAN }} /> : (
                  <>
                    <Slider
                      value={rake}
                      min={0}
                      max={0.5}
                      step={0.01}
                      onChange={handleRakeChange}
                      onChangeCommitted={handleRakeCommit}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v: any) => `${Math.round(v * 100)}%`}
                      sx={{ width: 280, color: NEON_GREEN }}
                    />
                    <Chip label={`Rake: ${Math.round(rake * 100)}%`} sx={{ bgcolor: NEON_GREEN + '44', color: NEON_CYAN }} />
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(26,26,26,0.9)', border: `1px solid ${NEON_PINK}33` }}>
              <Typography variant="h6" sx={{ mb: 2, color: NEON_PINK }}>
                חדרים פעילים (לייב)
              </Typography>
              {roomsLoading && <CircularProgress size={24} sx={{ color: NEON_PINK }} />}
              {!roomsLoading && rooms.length === 0 && (
                <Typography color="text.secondary">אין חדרים פעילים כרגע</Typography>
              )}
              <Table size="small" sx={{ mt: 1, '& .MuiTableCell-root': { color: '#e0e0e0', borderColor: '#333' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>חדר</TableCell>
                    <TableCell>שחקנים</TableCell>
                    <TableCell align="right">פעולה</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map((r) => (
                    <TableRow key={r.roomId}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.roomId}</TableCell>
                      <TableCell>{r.playerCount}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          disabled={shutdownRoomId === r.roomId}
                          onClick={() => doRoomShutdown(r.roomId)}
                        >
                          {shutdownRoomId === r.roomId ? '…' : 'Emergency Shutdown'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}

      {adminTab === 3 && (
        <Paper sx={{ p: 3, bgcolor: 'rgba(26,26,26,0.9)', border: `1px solid ${NEON_RED}33` }}>
          <Typography variant="h6" sx={{ mb: 2, color: NEON_RED }}>
            AI Guardian Logs
          </Typography>
          <Table size="small" sx={{ '& .MuiTableCell-root': { color: '#e0e0e0', borderColor: '#333' } }}>
            <TableHead>
              <TableRow>
                <TableCell>סוג</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>חדר</TableCell>
                <TableCell>זמן</TableCell>
                <TableCell align="right">פעולה</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Chip
                      label={row.type === 'bot' ? 'בוט' : row.type === 'minor' ? 'קטין' : row.type}
                      size="small"
                      sx={{ bgcolor: NEON_RED + '44', color: NEON_RED }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{row.userId}</TableCell>
                  <TableCell>{row.room ?? '—'}</TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell align="right">
                    {row.room && (
                      <Button
                        size="small"
                        color="error"
                        disabled={shutdownRoomId === row.room}
                        onClick={() => doAlertRoomShutdown(row.room!)}
                      >
                        {shutdownRoomId === row.room ? '…' : 'Emergency Shutdown'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Audit Trail — כל פעולת מנהל נרשמת
          </Typography>
        </Paper>
      )}

      <Dialog open={transactionsUserId !== null} onClose={() => setTransactionsUserId(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1a1a1a', border: `1px solid ${NEON_CYAN}33` } }}>
        <DialogTitle sx={{ color: NEON_CYAN }}>היסטוריית טרנזקציות</DialogTitle>
        <DialogContent>
          {transactionsLoading && <CircularProgress sx={{ color: NEON_CYAN }} />}
          {!transactionsLoading && (
            <Table size="small" sx={{ '& .MuiTableCell-root': { color: '#e0e0e0' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>סוג</TableCell>
                  <TableCell>סכום</TableCell>
                  <TableCell>תאריך</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 && <TableRow><TableCell colSpan={3}>אין טרנזקציות</TableCell></TableRow>}
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{t.amount}</TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionsUserId(null)} sx={{ color: NEON_CYAN }}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
