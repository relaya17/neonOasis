import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Link, TextField, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useWalletStore } from '../store';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { useSessionStore } from '../auth';
import { playSound } from '../../shared/audio';
import { hapticClick } from '../../shared/hooks';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** גרף ערך ארנק — קומפוננטה נפרדת כדי להפחית union type complexity ב-Recharts */
function WalletChart({
  data,
  title,
  loading = false,
  loadingLabel = 'Loading...',
}: {
  data: { date: string; value: number }[];
  title: string;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <Box
      sx={{ width: '100%', maxWidth: 360, height: 180, mx: 'auto' }}
      role="img"
      aria-label={loading ? 'Loading wallet chart' : `Wallet value chart: ${title}`}
    >
      <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1 }}>
        {title}
      </Typography>
      {loading ? (
        <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,255,255,0.05)', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#00ffff' }}>{loadingLabel}</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00ffff' }} />
            <Line type="monotone" dataKey="value" stroke="#00ffff" strokeWidth={2} dot={{ fill: '#00ffff' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}

export function ProfileView() {
  const { t } = useTranslation('common');
  const balance = useWalletStore((s) => s.balance);
  const oasisBalance = useWalletStore((s) => s.oasisBalance);
  const eloRating = useWalletStore((s) => s.eloRating);
  const userId = useWalletStore((s) => s.userId);
  const setBalance = useWalletStore((s) => s.setBalance);
  const fetchProfile = useWalletStore((s) => s.fetchProfile);
  const username = useSessionStore((s) => s.username);
  const logout = useSessionStore((s) => s.logout);
  const apiOnline = useApiStatusStore((s) => s.online);

  useEffect(() => {
    if (userId) fetchProfile(userId);
  }, [userId, fetchProfile]);
  const [code, setCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [redeemMessage, setRedeemMessage] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [historyData, setHistoryData] = useState<{ date: string; value: number }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!userId) return;
    if (apiOnline === false) {
      setHistoryError('ה־API לא זמין כרגע');
      setHistoryData([]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError('');
    fetch(`${API_URL}/api/users/${userId}/transactions?days=30`)
      .then((r) => r.json())
      .then((data: { history?: { date: string; balance_delta: string }[] }) => {
        const h = data.history ?? [];
        const sorted = [...h].sort((a, b) => a.date.localeCompare(b.date));
        let cum = 0;
        const chart = sorted.map((row) => {
          cum += Number(row.balance_delta) || 0;
          return { date: row.date.slice(5), value: cum };
        });
        if (chart.length === 0) {
          chart.push({ date: '', value: Number(balance) });
        }
        setHistoryData(chart);
        setHistoryLoading(false);
      })
      .catch(() => {
        setHistoryData([]);
        setHistoryLoading(false);
        setHistoryError('לא ניתן לטעון היסטוריה');
      });
  }, [apiOnline, userId, balance]);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    playSound('neon_click');
    hapticClick();
    setRedeemStatus('loading');
    setRedeemMessage('');
    try {
      const res = await fetch(`${API_URL}/api/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setBalance(data.newBalance ?? balance);
        setRedeemStatus('ok');
        setRedeemMessage(`${data.coins} ${t('balance')} added`);
        setCode('');
      } else {
        setRedeemStatus('error');
        setRedeemMessage(data.error ?? 'Redeem failed');
      }
    } catch {
      setRedeemStatus('error');
      setRedeemMessage('Network error');
    }
  };

  const loadReferralLink = () => {
    const base = window.location.origin;
    const link = `${API_URL.replace(/\/$/, '')}/api/referral/link?userId=${encodeURIComponent(userId)}`;
    fetch(link)
      .then((r) => r.json())
      .then((d) => setReferralLink(d.link ?? `${base}/?ref=${userId}`))
      .catch(() => setReferralLink(`${base}/?ref=${userId}`));
  };

  const copyReferralLink = () => {
    const toCopy = referralLink || `${window.location.origin}/?ref=${userId}`;
    navigator.clipboard.writeText(toCopy).then(() => setLinkCopied(true));
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const chartData: { date: string; value: number }[] = useMemo(
    () =>
      historyData.length > 0
        ? historyData
        : [
            { date: '1', value: Math.max(0, Number(balance) - 500) },
            { date: '2', value: Math.max(0, Number(balance) - 300) },
            { date: '3', value: Math.max(0, Number(balance) - 100) },
            { date: '4', value: Number(balance) },
            { date: '5', value: Number(balance) + Number(oasisBalance) * 2 },
          ],
    [historyData, balance, oasisBalance]
  );

  return (
    <Box
      sx={{
        minHeight: '50vh',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        position: 'relative',
        backgroundImage: 'url(/images/cube.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%' }}>
      <Typography variant="h5" sx={{ color: 'primary.main' }}>
        {t('nav.me')}
      </Typography>
      {username && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          @{username}
        </Typography>
      )}
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
          }}
        >
          ה־API לא זמין כרגע — נתוני פרופיל מוצגים במצב Offline.
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
        }}
      >
        <Box sx={{ bgcolor: '#333', px: 3, py: 2, borderRadius: 2, border: '1px solid #ff00ff' }}>
          <Typography sx={{ color: '#ff00ff' }}>💎 {Number(balance).toLocaleString()} {t('balance')}</Typography>
        </Box>
        <Box sx={{ bgcolor: '#333', px: 3, py: 2, borderRadius: 2, border: '1px solid #00ffff' }}>
          <Typography sx={{ color: '#00ffff' }}>◉ {Number(oasisBalance).toLocaleString()} Oasis</Typography>
        </Box>
        <Box sx={{ bgcolor: '#333', px: 3, py: 2, borderRadius: 2, border: '1px solid #888' }}>
          <Typography sx={{ color: '#e0e0e0' }}>ELO {eloRating}</Typography>
        </Box>
      </Box>

      {/* גרף ניאון — ערך ארנק לאורך זמן ( API /transactions) */}
      <WalletChart
        data={chartData}
        title={historyData.length > 0 ? t('walletValue', 'Wallet value') : t('walletValueDemo', 'Wallet (no history yet)')}
        loading={historyLoading}
        loadingLabel={t('loading', 'Loading...')}
      />
      {historyError && (
        <Typography variant="caption" sx={{ color: '#ff4d9a' }}>
          {historyError}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 320 }}>
        <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
          {t('redeemCode', 'Redeem code')}
        </Typography>
        <TextField
          size="small"
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          sx={{ bgcolor: '#222', borderRadius: 1 }}
          inputProps={{ 'aria-label': t('redeemCode', 'Redeem code') }}
        />
        <Button
          variant="contained"
          onClick={handleRedeem}
          disabled={redeemStatus === 'loading'}
          aria-label={t('redeemCode', 'Redeem code')}
        >
          {redeemStatus === 'loading' ? t('loading', 'Loading...') : t('redeem', 'Redeem')}
        </Button>
        {redeemMessage && (
          <Typography variant="caption" sx={{ color: redeemStatus === 'ok' ? 'primary.main' : 'error.main' }}>
            {redeemMessage}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 320 }}>
        <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
          {t('referralLink', 'Invite friend – get 1,000 coins')}
        </Typography>
        <Button variant="outlined" onClick={loadReferralLink} aria-label={t('referralLink', 'Get referral link')}>
          {t('getLink', 'Get link')}
        </Button>
        <Button variant="outlined" onClick={copyReferralLink} aria-label={t('copyLink', 'Copy link')}>
          {linkCopied ? t('copied', 'Copied!') : t('copyLink', 'Copy link')}
        </Button>
      </Box>

      <Link component={RouterLink} to="/leaderboard" sx={{ color: 'primary.main' }} aria-label={t('leaderboard', 'Leaderboard')}>
        {t('leaderboard', 'Leaderboard')}
      </Link>

      <Button variant="outlined" color="secondary" onClick={logout} aria-label={t('logout', 'Log out')}>
        {t('logout', 'Log out')}
      </Button>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link component={RouterLink} to="/terms" sx={{ color: 'primary.main' }} aria-label={t('footer.terms')}>
          {t('footer.terms')}
        </Link>
        <Link component={RouterLink} to="/privacy" sx={{ color: 'primary.main' }} aria-label={t('footer.privacy')}>
          {t('footer.privacy')}
        </Link>
        <Link component={RouterLink} to="/responsible-gaming" sx={{ color: 'primary.main' }} aria-label={t('footer.responsible')}>
          {t('footer.responsible')}
        </Link>
      </Box>
      </Box>
    </Box>
  );
}
