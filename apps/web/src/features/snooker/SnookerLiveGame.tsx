/**
 * SnookerLiveGame — Container לסנוקר לייב.
 * מבנה אחיד: useLiveGame (socket/pot/gifts) + LiveUI (overlay) + SnookerCanvas (rendering).
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { Box, Button, Card, CardContent, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import type { GameMode } from '../../shared/hooks/useLiveGame';
import { useSnookerStore, COLOR_ORDER, COLOR_VALUES, type ColorName } from './store';
import { playSound } from '../../shared/audio';
import { SNOOKER_INTRO_VIDEO_URL } from '../../config/videoUrls';
import { responsiveVideoStyle } from '../../config/videoStyles';
import { LiveUI, type LiveGiftConfig } from '../../shared/components/LiveUI';
import { SnookerCanvas } from './SnookerCanvas';
import { CUE_DESIGNS, DEFAULT_CUE_ID, GIFT_PRICES } from './snookerCues';
import type { CueDesign } from './snookerCues';
import { useLiveGame } from '../../shared/hooks/useLiveGame';

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';

const COLOR_BALLS: Record<ColorName, string> = {
  yellow: '#f5d033',
  green: '#2e7d32',
  brown: '#5d4037',
  blue: '#1565c0',
  pink: '#ec407a',
  black: '#1a1a1a',
};

/* ─── Gold rain effect ─────────────────────────── */
const GOLD_RAIN_PARTICLES = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left: (i * 2.1 + (i % 7)) % 98,
  delay: (i % 5) * 0.25,
  size: 6 + (i % 4),
}));

function GoldRainEffect() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {GOLD_RAIN_PARTICLES.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            bgcolor: '#ffd700',
            boxShadow: '0 0 10px #ffd700',
            animation: 'goldRainFall 4.5s ease-in forwards',
            animationDelay: `${p.delay}s`,
            opacity: 0.9,
            '@keyframes goldRainFall': {
              '0%': { transform: 'translateY(0)', opacity: 0.9 },
              '100%': { transform: 'translateY(110vh)', opacity: 0.2 },
            },
          }}
        />
      ))}
    </Box>
  );
}

/* ─── Snooker gift config (includes chalk) ─────── */
const SNOOKER_GIFTS: LiveGiftConfig[] = [
  { id: 'rose', icon: '🌹', label: 'Rose', color: '#ff2d55', price: GIFT_PRICES.rose ?? 20 },
  { id: 'diamond', icon: '💎', label: 'Diamond', color: '#00f2ea', price: GIFT_PRICES.diamond ?? 500 },
  { id: 'crown', icon: '👑', label: 'Crown', color: '#ffd700', price: GIFT_PRICES.crown ?? 200 },
  { id: 'chalk', icon: '🩵', label: 'Chalk', color: '#5c9ead', price: GIFT_PRICES.chalk ?? 10 },
  { id: 'beer', icon: '🍺', label: 'Beer', color: '#daa520', price: GIFT_PRICES.beer ?? 50 },
];

const ENTRY_FEE = 50;
const TABLE_RAKE = 0.1;
const CHALK_COST = 50;
const PURCHASABLE_CUE_IDS = ['snake', 'dragon', 'phoenix'] as const;

export function SnookerLiveGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeMode = (location.state as { mode?: GameMode })?.mode ?? 'pvp';
  const { state, setLevel, potRed, potColor, endFrame, reset } = useSnookerStore();

  /* ── Shared live hook ─────────────────────────── */
  const live = useLiveGame({
    tableId: 'snooker-main',
    entryFee: ENTRY_FEE,
    rake: TABLE_RAKE,
    gifts: SNOOKER_GIFTS,
    gameMode: routeMode,
  });

  /* ── Snooker-specific state ───────────────────── */
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [activeCueId, setActiveCueId] = useState<string>(DEFAULT_CUE_ID);
  const [giftCueOverride, setGiftCueOverride] = useState<CueDesign | null>(null);
  const [userInventory, setUserInventory] = useState<string[]>(['default']);
  const [showGoldRain, setShowGoldRain] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [beerBlurUntil, setBeerBlurUntil] = useState(0);
  const [chalkActiveUntil, setChalkActiveUntil] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [prizeWon, setPrizeWon] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const paidOutRef = useRef(false);

  const activeCue: CueDesign = giftCueOverride ?? CUE_DESIGNS[activeCueId] ?? CUE_DESIGNS[DEFAULT_CUE_ID];
  const isChalked = chalkActiveUntil > Date.now();

  /* ── Intro video ──────────────────────────────── */
  useEffect(() => {
    if (showIntroVideo && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [showIntroVideo]);

  /* ── Timers cleanup ───────────────────────────── */
  useEffect(() => {
    if (!showGoldRain) return;
    const t = setTimeout(() => setShowGoldRain(false), 5500);
    return () => clearTimeout(t);
  }, [showGoldRain]);

  useEffect(() => {
    if (beerBlurUntil <= 0) return;
    const t = setTimeout(() => setBeerBlurUntil(0), Math.max(0, beerBlurUntil - Date.now()));
    return () => clearTimeout(t);
  }, [beerBlurUntil]);

  useEffect(() => {
    if (chalkActiveUntil <= 0) return;
    const t = setTimeout(() => setChalkActiveUntil(0), Math.max(0, chalkActiveUntil - Date.now()));
    return () => clearTimeout(t);
  }, [chalkActiveUntil]);

  /* ── Winner payout ────────────────────────────── */
  useEffect(() => {
    if (state.winner === -1 || live.tablePot <= 0 || paidOutRef.current) return;
    paidOutRef.current = true;
    const afterRake = live.payoutWinner();
    setPrizeWon((w) => w + afterRake);
  }, [state.winner, live.tablePot, live.payoutWinner]);

  useEffect(() => {
    if (state.winner === -1) paidOutRef.current = false;
  }, [state.winner]);

  /* ── Gift handling (snooker-specific effects) ── */
  const handleGiftReceived = useCallback(
    (giftId: string) => {
      // Deduct coins via shared hook
      live.handleGiftSent(giftId);

      if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
      if (giftId === 'crown') {
        setGiftCueOverride(CUE_DESIGNS.GOLD_VIP);
        setShowGoldRain(true);
        playSound('win');
        cueTimeoutRef.current = setTimeout(() => { setGiftCueOverride(null); cueTimeoutRef.current = null; }, 30000);
      } else if (giftId === 'rose') {
        setGiftCueOverride(CUE_DESIGNS.LASER_KNIGHT);
        cueTimeoutRef.current = setTimeout(() => { setGiftCueOverride(null); cueTimeoutRef.current = null; }, 15000);
      } else if (giftId === 'diamond') {
        setGiftCueOverride(CUE_DESIGNS.NEON_CYBER);
        cueTimeoutRef.current = setTimeout(() => { setGiftCueOverride(null); cueTimeoutRef.current = null; }, 10000);
      } else if (giftId === 'chalk') {
        setChalkActiveUntil(Date.now() + 15000);
      } else if (giftId === 'beer') {
        setBeerBlurUntil(Date.now() + 4000);
        playSound('win');
      }
    },
    [live.handleGiftSent],
  );

  /* ── Game actions ─────────────────────────────── */
  const startGameWithEntry = useCallback(() => {
    if (live.userCoins < ENTRY_FEE) {
      setShopOpen(true);
      return;
    }
    live.addToPot();
    setResetKey((k) => k + 1);
    reset();
    playSound('neon_click');
  }, [live.userCoins, live.addToPot, reset]);

  const handleChalkClick = useCallback(() => {
    if (live.userCoins < CHALK_COST) {
      setShopOpen(true);
      playSound('neon_click');
      return;
    }
    live.setUserCoins((c) => c - CHALK_COST);
    setChalkActiveUntil(Date.now() + 30000);
    playSound('neon_click');
  }, [live.userCoins, live.setUserCoins]);

  const handleStrike = useCallback(() => {
    playSound('neon_click');
    setChalkActiveUntil((prev) => (prev > Date.now() ? 0 : prev));
  }, []);

  const handlePurchase = useCallback((cueId: string, price: number) => {
    const cue = CUE_DESIGNS[cueId];
    if (!cue || userInventory.includes(cueId)) return;
    if (live.userCoins < price) { playSound('neon_click'); return; }
    live.setUserCoins((c) => c - price);
    setUserInventory((inv) => [...inv, cueId]);
    setActiveCueId(cueId);
    playSound('neon_click');
  }, [live.userCoins, live.setUserCoins, userInventory]);

  const equipCue = useCallback((cueId: string) => {
    if (!userInventory.includes(cueId)) return;
    setActiveCueId(cueId);
    setGiftCueOverride(null);
    if (cueTimeoutRef.current) { clearTimeout(cueTimeoutRef.current); cueTimeoutRef.current = null; }
    playSound('neon_click');
  }, [userInventory]);

  const handlePotRed = useCallback(() => {
    if (state.winner !== -1 || state.phase !== 'red' || state.redsPotted >= 15) return;
    live.setBoomMessage('BOOM! Red potted! 🎱🔥');
    potRed();
  }, [state.phase, state.redsPotted, state.winner, potRed, live.setBoomMessage]);

  const handlePotColor = useCallback(
    (color: ColorName) => {
      if (state.winner !== -1 || state.colorsPotted[color]) return;
      if (state.phase === 'color') {
        live.setBoomMessage(`BOOM! Potted ${color}! 🎱🔥`);
        potColor(color);
      }
    },
    [state.phase, state.colorsPotted, state.winner, potColor, live.setBoomMessage],
  );

  const handlePassColor = useCallback(() => {
    if (state.phase !== 'color') return;
    playSound('neon_click');
    endFrame();
  }, [state.phase, endFrame]);

  const redsLeft = 15 - state.redsPotted;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#000',
        background: 'radial-gradient(ellipse at 50% 30%, #0a1a0f 0%, #000 70%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        px: 1,
      }}
    >
      {/* ── Intro video layer (with LiveUI on top = live stream feel) ── */}
      {showIntroVideo && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 900, bgcolor: '#000' }}>
          <video ref={introVideoRef} src={SNOOKER_INTRO_VIDEO_URL} muted playsInline autoPlay loop style={responsiveVideoStyle} />
          {/* LiveUI over the video — looks like a live stream */}
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
            <LiveUI
              gameName="סנוקר Live"
              gifts={SNOOKER_GIFTS}
              boomMessage={live.boomMessage}
              onBoomShown={() => live.setBoomMessage(null)}
              onGiftSent={handleGiftReceived}
            />
          </Box>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, display: 'flex', justifyContent: 'center', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', zIndex: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => { playSound('neon_click'); setShowIntroVideo(false); }}
              sx={{ bgcolor: NEON_GOLD, color: '#000', fontWeight: 'bold', fontSize: '1.1rem', px: 4, py: 1.5, '&:hover': { bgcolor: NEON_GOLD, opacity: 0.9 } }}
            >
              כניסה למשחק
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Shared LiveUI overlay (game mode) ────── */}
      <LiveUI
        gameName="סנוקר Live"
        gifts={SNOOKER_GIFTS}
        boomMessage={live.boomMessage}
        onBoomShown={() => live.setBoomMessage(null)}
        onGiftSent={handleGiftReceived}
      />

      {/* ── Effects ──────────────────────────────── */}
      {showGoldRain && <GoldRainEffect />}
      {beerBlurUntil > Date.now() && (
        <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)' }} />
      )}
      {chalkActiveUntil > Date.now() && (
        <Box sx={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(92, 158, 173, 0.9)', color: '#fff', fontSize: '0.8rem', zIndex: 45, pointerEvents: 'none', boxShadow: '0 0 20px rgba(92,158,173,0.6)' }}>
          🩵 גיר פעיל — +דיוק
        </Box>
      )}

      {/* ── AI Practice badge ─────────────────────── */}
      {live.isAI && (
        <Box sx={{ bgcolor: 'rgba(0,245,212,0.15)', border: '1px solid rgba(0,245,212,0.4)', borderRadius: 2, px: 2, py: 0.5, mb: 1 }}>
          <Typography sx={{ color: NEON_CYAN, fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>
            🤖 מצב אימון (AI) — ללא רווח כספי
          </Typography>
        </Box>
      )}

      {/* ── Header ───────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 720, mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Button variant="outlined" size="small" onClick={() => { playSound('neon_click'); navigate('/'); }} sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }} aria-label="חזרה">
          ← חזרה
        </Button>
        <Typography variant="h6" sx={{ color: NEON_GOLD, fontWeight: 'bold', textShadow: `0 0 20px ${NEON_GOLD}40` }}>
          {live.isAI ? 'סנוקר — אימון' : 'סנוקר'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ color: NEON_GOLD, fontSize: '0.9rem' }}>🪙 {live.userCoins}</Typography>
          <Button variant="outlined" size="small" onClick={() => { playSound('neon_click'); setShopOpen((o) => !o); }} sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }} aria-label="חנות מקלות">
            {shopOpen ? 'סגור חנות' : 'חנות מקלות'}
          </Button>
        </Box>
      </Box>

      {/* ── Cue shop ─────────────────────────────── */}
      {shopOpen && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', mb: 1.5 }}>מקלות — בחר או רכוש</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {[DEFAULT_CUE_ID, ...PURCHASABLE_CUE_IDS].map((id) => {
              const cue = CUE_DESIGNS[id];
              if (!cue) return null;
              const owned = userInventory.includes(id);
              const equipped = activeCueId === id;
              const canBuy = !owned && cue.price > 0 && live.userCoins >= cue.price;
              const imgSrc = cue.imagePath || undefined;
              return (
                <Card key={id} sx={{ width: 160, bgcolor: '#1a1a1a', color: 'white', borderRadius: 4, border: equipped ? `2px solid ${NEON_GOLD}` : '1px solid rgba(255,215,0,0.3)', boxShadow: equipped ? `0 0 20px ${NEON_GOLD}40` : 'none' }}>
                  <Box sx={{ height: 100, p: 1.5, bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imgSrc ? <img src={imgSrc} alt={cue.name} style={{ maxHeight: 90, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <Box sx={{ width: 40, height: 8, borderRadius: 1, bgcolor: cue.primaryColor || '#888' }} />}
                  </Box>
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>{cue.name}</Typography>
                    {cue.bonusLabel && <Typography sx={{ color: '#aaa', fontSize: '0.7rem', mb: 0.5 }}>{cue.bonusLabel}</Typography>}
                    {cue.price === 0 ? <Typography sx={{ color: '#888', fontSize: '0.75rem' }}>חינם</Typography> : <Typography sx={{ color: NEON_GOLD, fontSize: '0.8rem' }}>🪙 {cue.price}</Typography>}
                    {owned ? (
                      <Button fullWidth size="small" variant={equipped ? 'contained' : 'outlined'} onClick={() => equipCue(id)} sx={{ mt: 0.5, fontSize: '0.75rem', ...(equipped ? { bgcolor: NEON_GOLD, color: '#000' } : { borderColor: NEON_CYAN, color: NEON_CYAN }) }}>
                        {equipped ? 'מצויד' : 'השתמש'}
                      </Button>
                    ) : canBuy ? (
                      <Button fullWidth size="small" variant="contained" onClick={() => handlePurchase(id, cue.price)} sx={{ mt: 0.5, fontSize: '0.75rem', bgcolor: NEON_GOLD, color: '#000' }}>
                        קנה ב-{cue.price}
                      </Button>
                    ) : (
                      <Typography sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>{cue.price > 0 && live.userCoins < cue.price ? 'חסר מטבעות' : ''}</Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ── Scoreboard ───────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,245,212,0.3)' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: state.turn === 0 ? NEON_CYAN : '#666', fontWeight: state.turn === 0 ? 'bold' : 'normal', fontSize: '0.85rem' }}>שחקן 1</Typography>
          <Typography sx={{ color: NEON_CYAN, fontSize: '1.5rem', fontWeight: 'bold' }}>{state.scores[0]}</Typography>
        </Box>
        <Box sx={{ alignSelf: 'center', color: NEON_GOLD }}>–</Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: state.turn === 1 ? NEON_PINK : '#666', fontWeight: state.turn === 1 ? 'bold' : 'normal', fontSize: '0.85rem' }}>שחקן 2</Typography>
          <Typography sx={{ color: NEON_PINK, fontSize: '1.5rem', fontWeight: 'bold' }}>{state.scores[1]}</Typography>
        </Box>
      </Box>

      {/* ── Level selector ───────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,212,0.25)' }}>
        <Typography sx={{ color: NEON_CYAN, fontSize: '0.9rem', fontWeight: 500 }}>רמה (שולחן):</Typography>
        <ToggleButtonGroup value={state.level ?? 1} exclusive onChange={(_, v: number | null) => { if (v != null) { playSound('neon_click'); setLevel(v); } }} size="small" sx={{ '& .MuiToggleButton-root': { color: '#888', borderColor: 'rgba(0,245,212,0.4)', px: 1.5, '&.Mui-selected': { color: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.15)', borderColor: NEON_CYAN, '&:hover': { bgcolor: 'rgba(0,245,212,0.25)' } }, '&:hover': { borderColor: NEON_CYAN, color: NEON_CYAN } } }}>
          <ToggleButton value={1}>רמה 1</ToggleButton>
          <ToggleButton value={2}>רמה 2</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Turn hint + instructions ─────────────── */}
      {state.winner === -1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>
            {state.phase === 'red' ? `תור שחקן ${state.turn + 1} — הכנס כדור אדום (${redsLeft} נותרו)` : 'בחר צבע להכנסה (או דלג לתור הבא)'}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => { playSound('neon_click'); setShowInstructions((s) => !s); }} sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, minWidth: 36, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }}>?</Button>
        </Box>
      )}
      {state.winner === -1 && showInstructions && (
        <Box sx={{ mb: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,212,0.3)' }}>
          <Typography sx={{ color: 'rgba(0,245,212,0.95)', fontSize: '0.8rem' }}>
            1) כוון עם העכבר. 2) לחץ על הכדור הלבן. 3) גרור אחורה לטעינת כוח. 4) שחרר כדי להכות.
          </Typography>
        </Box>
      )}

      {/* ── Canvas + BANK + Chalk ─────────────────── */}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 420, mx: 'auto' }}>
        <Box sx={{ maxHeight: 'min(640px, 78vh)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <SnookerCanvas
            width={400} height={600}
            redsCount={redsLeft}
            colorsPotted={state.colorsPotted}
            phase={state.phase}
            onPotRed={handlePotRed}
            onPotColor={handlePotColor}
            disabled={state.winner !== -1}
            resetKey={resetKey}
            onStrike={handleStrike}
            activeCue={activeCue}
            level={state.level ?? 1}
            chalkActive={chalkActiveUntil > Date.now()}
            onDraggingChange={setIsDragging}
          />
        </Box>

        {/* BANK overlay */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ color: NEON_GOLD, fontSize: '1rem', fontWeight: 'bold', textShadow: '0 0 12px rgba(255,215,0,0.8)' }}>
            BANK: {live.userCoins} 🪙
          </Box>
          {live.tablePot > 0 && (
            <Box sx={{ color: NEON_CYAN, fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 0 8px rgba(0,242,234,0.8)' }}>
              💰 קופה: {live.tablePot} 🪙
            </Box>
          )}
        </Box>

        {/* Chalk button */}
        {state.winner === -1 && (
          <Button onClick={handleChalkClick} disabled={isDragging} sx={{ position: 'absolute', bottom: 16, left: 16, width: 80, height: 80, borderRadius: '12px', background: isChalked ? 'linear-gradient(45deg, #0047ab, #4169e1)' : 'rgba(20,20,20,0.85)', border: `2px solid ${isChalked ? NEON_CYAN : '#333'}`, boxShadow: isChalked ? `0 0 20px ${NEON_CYAN}` : 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', '&:hover:not(:disabled)': { transform: 'scale(1.05)', boxShadow: `0 0 15px ${NEON_CYAN}`, borderColor: NEON_CYAN } }}>
            <Box component="span" sx={{ fontSize: '1.75rem', mb: 0.25 }}>🩵</Box>
            <Box component="span" sx={{ fontSize: '0.7rem' }}>{CHALK_COST} 🪙</Box>
          </Button>
        )}
      </Box>

      {/* ── Pass turn ────────────────────────────── */}
      {state.phase === 'color' && state.winner === -1 && (
        <Button variant="outlined" size="small" onClick={handlePassColor} sx={{ mt: 2, borderColor: NEON_GOLD, color: NEON_GOLD, '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.1)' } }}>
          דלג — העבר תור
        </Button>
      )}

      {/* ── Winner ───────────────────────────────── */}
      {state.winner !== -1 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', fontSize: '1.2rem' }}>
            {state.winner === 0 ? 'שחקן 1 ניצח!' : 'שחקן 2 ניצח!'}
          </Typography>
          {prizeWon > 0 && (
            <Typography sx={{ color: NEON_CYAN, fontSize: '0.95rem', mt: 0.5 }}>
              🏆 הפרס (לאחר עמלה {(TABLE_RAKE * 100).toFixed(0)}%): {prizeWon} 🪙
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mt: 1.5 }}>
            <Button variant="contained" size="medium" onClick={() => { playSound('neon_click'); setResetKey((k) => k + 1); reset(); }} sx={{ background: `linear-gradient(90deg, ${NEON_CYAN}, ${NEON_PINK})`, fontWeight: 'bold' }}>
              משחק חדש
            </Button>
            <Button variant="outlined" size="medium" onClick={startGameWithEntry} disabled={live.userCoins < ENTRY_FEE} sx={{ borderColor: NEON_GOLD, color: NEON_GOLD, fontWeight: 'bold', '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.1)' } }}>
              משחק עם קופה ({ENTRY_FEE} 🪙)
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Legend ────────────────────────────────── */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
        {COLOR_ORDER.map((c) => (
          <Typography key={c} sx={{ color: '#888', fontSize: '0.7rem' }}>
            <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: COLOR_BALLS[c], mr: 0.5, verticalAlign: 'middle' }} />
            {c} = {COLOR_VALUES[c]}
          </Typography>
        ))}
      </Box>

      {/* ── Gift rain animation ──────────────────── */}
      {live.giftRain && (
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, fontSize: '4rem', pointerEvents: 'none' }}>
          {live.giftRain.icon}
        </Box>
      )}
    </Box>
  );
}
