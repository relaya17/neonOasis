/**
 * Snooker Game — לוח סנוקר בסגנון ניאון וגאס
 * משחק פשוט: לחיצה על כדור כדי להכניס (פוט), ניקוד אוטומטי
 * וידאו פרומו בכניסה (כמו פוקר/רמי/שש-בש)
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Box, Button, Card, CardContent, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnookerStore, COLOR_ORDER, COLOR_VALUES, type ColorName } from './store';
import { playSound } from '../../shared/audio';
import { SNOOKER_INTRO_VIDEO_URL } from '../../config/videoUrls';
import { responsiveVideoStyle } from '../../config/videoStyles';
import { SnookerLiveUI } from './SnookerLiveUI';
import { SnookerCanvas } from './SnookerCanvas';
import { CUE_DESIGNS, DEFAULT_CUE_ID, GIFT_PRICES } from './snookerCues';
import type { CueDesign } from './snookerCues';
import { useLiveStore } from '../../shared/store/liveStore';

const FELT = '#0d4d2a';
const FELT_LIGHT = '#126b38';
const POCKET = '#0a0a0a';
const CUE_BALL = '#f0f0f0';
const RED = '#c41e3a';
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

const GOLD_RAIN_PARTICLES = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left: (i * 2.1 + (i % 7)) % 98,
  delay: (i % 5) * 0.25,
  size: 6 + (i % 4),
}));

function GoldRainEffect() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
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

const INITIAL_COINS = 1000;
const CHALK_COST = 50;
const ENTRY_FEE = 50;
const TABLE_RAKE = 0.1;
const PURCHASABLE_CUE_IDS = ['snake', 'dragon', 'phoenix'] as const;

export function SnookerGame() {
  const navigate = useNavigate();
  const { state, setLevel, potRed, potColor, endFrame, reset } = useSnookerStore();
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [impactVisible, setImpactVisible] = useState(false);
  const [boomMessage, setBoomMessage] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [userCoins, setUserCoins] = useState(INITIAL_COINS);
  const [userInventory, setUserInventory] = useState<string[]>(['default']);
  const [activeCueId, setActiveCueId] = useState<string>(DEFAULT_CUE_ID);
  const [giftCueOverride, setGiftCueOverride] = useState<CueDesign | null>(null);
  const [showGoldRain, setShowGoldRain] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [beerBlurUntil, setBeerBlurUntil] = useState(0);
  const [chalkActiveUntil, setChalkActiveUntil] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tablePot, setTablePot] = useState(0);
  const [prizeWon, setPrizeWon] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const paidOutRef = useRef(false);

  const activeCue: CueDesign = giftCueOverride ?? CUE_DESIGNS[activeCueId] ?? CUE_DESIGNS[DEFAULT_CUE_ID];
  const isChalked = chalkActiveUntil > Date.now();

  const startGameWithEntry = useCallback(() => {
    if (userCoins < ENTRY_FEE) {
      setShopOpen(true);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('אין מספיק מטבעות לדמי כניסה. פתח את החנות.');
      }
      return;
    }
    setUserCoins((c) => c - ENTRY_FEE);
    setTablePot((p) => p + ENTRY_FEE);
    setResetKey((k) => k + 1);
    reset();
    playSound('neon_click');
  }, [userCoins, reset]);

  const handleChalkClick = useCallback(() => {
    if (userCoins < CHALK_COST) {
      setShopOpen(true);
      playSound('neon_click');
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('אין לך מספיק מטבעות. פתחתי את החנות.');
      }
      return;
    }
    setUserCoins((c) => c - CHALK_COST);
    setChalkActiveUntil(Date.now() + 30000);
    playSound('neon_click');
  }, [userCoins]);

  const handleStrike = useCallback(() => {
    playSound('neon_click');
    setChalkActiveUntil((prev) => (prev > Date.now() ? 0 : prev));
  }, []);

  const handlePurchase = useCallback((cueId: string, price: number) => {
    const cue = CUE_DESIGNS[cueId];
    if (!cue) return;
    if (userInventory.includes(cueId)) return;
    if (userCoins < price) {
      playSound('neon_click');
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('אין לך מספיק מטבעות... רוצה לקנות עוד?');
      }
      return;
    }
    setUserCoins((c) => c - price);
    setUserInventory((inv) => (inv.includes(cueId) ? inv : [...inv, cueId]));
    setActiveCueId(cueId);
    playSound('neon_click');
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`תתחדש! מקל ${cue.name} שלך עכשיו.`);
    }
  }, [userCoins, userInventory]);

  const equipCue = useCallback((cueId: string) => {
    if (!userInventory.includes(cueId)) return;
    setActiveCueId(cueId);
    setGiftCueOverride(null);
    if (cueTimeoutRef.current) {
      clearTimeout(cueTimeoutRef.current);
      cueTimeoutRef.current = null;
    }
    playSound('neon_click');
  }, [userInventory]);

  useEffect(() => {
    if (showIntroVideo && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [showIntroVideo]);

  useEffect(() => {
    if (!impactVisible) return;
    const t = setTimeout(() => setImpactVisible(false), 600);
    return () => clearTimeout(t);
  }, [impactVisible]);

  useEffect(() => {
    if (!showGoldRain) return;
    const t = setTimeout(() => setShowGoldRain(false), 5500);
    return () => clearTimeout(t);
  }, [showGoldRain]);

  useEffect(() => {
    if (beerBlurUntil <= 0) return;
    const delay = Math.max(0, beerBlurUntil - Date.now());
    const t = setTimeout(() => setBeerBlurUntil(0), delay);
    return () => clearTimeout(t);
  }, [beerBlurUntil]);

  useEffect(() => {
    if (chalkActiveUntil <= 0) return;
    const delay = Math.max(0, chalkActiveUntil - Date.now());
    const t = setTimeout(() => setChalkActiveUntil(0), delay);
    return () => clearTimeout(t);
  }, [chalkActiveUntil]);

  useEffect(() => {
    if (state.winner === -1 || tablePot <= 0 || paidOutRef.current) return;
    paidOutRef.current = true;
    const afterRake = Math.floor(tablePot * (1 - TABLE_RAKE));
    setPrizeWon((w) => w + afterRake);
    setUserCoins((c) => c + afterRake);
    setTablePot(0);
  }, [state.winner, tablePot]);

  useEffect(() => {
    if (state.winner === -1) paidOutRef.current = false;
  }, [state.winner]);

  const handleGiftReceived = useCallback((giftId: string) => {
    const price = GIFT_PRICES[giftId];
    if (price != null) {
      if (userCoins < price) {
        playSound('neon_click');
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('אין לך מספיק מטבעות... רוצה לקנות עוד?');
        }
        return;
      }
      setUserCoins((c) => c - price);
    }

    if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
    if (giftId === 'crown') {
      setGiftCueOverride(CUE_DESIGNS.GOLD_VIP);
      setShowGoldRain(true);
      playSound('win');
      cueTimeoutRef.current = setTimeout(() => {
        setGiftCueOverride(null);
        cueTimeoutRef.current = null;
      }, 30000);
    } else if (giftId === 'rose') {
      setGiftCueOverride(CUE_DESIGNS.LASER_KNIGHT);
      cueTimeoutRef.current = setTimeout(() => {
        setGiftCueOverride(null);
        cueTimeoutRef.current = null;
      }, 15000);
    } else if (giftId === 'diamond') {
      setGiftCueOverride(CUE_DESIGNS.NEON_CYBER);
      cueTimeoutRef.current = setTimeout(() => {
        setGiftCueOverride(null);
        cueTimeoutRef.current = null;
      }, 10000);
    } else if (giftId === 'chalk') {
      setChalkActiveUntil(Date.now() + 15000);
    } else if (giftId === 'beer') {
      setBeerBlurUntil(Date.now() + 4000);
      playSound('win');
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Cheers! 🍺');
      }
    }
  }, [userCoins]);

  const registerGiftHandler = useLiveStore((s) => s.registerGiftHandler);
  useEffect(() => {
    const handler = (gift: { id: string; label: string; icon: string; price: number }) => {
      if (userCoins < gift.price) {
        setShopOpen(true);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('אין לך מספיק מטבעות. פתח את החנות.');
        }
        return;
      }
      setUserCoins((c) => c - gift.price);
      handleGiftReceived(gift.id);
    };
    registerGiftHandler(handler);
    return () => registerGiftHandler(null);
  }, [userCoins, registerGiftHandler, handleGiftReceived]);

  const handlePotRed = useCallback(() => {
    if (state.winner !== -1 || state.phase !== 'red' || state.redsPotted >= 15) return;
    setBoomMessage('BOOM! KingOfSnooker just pocketed a red! 🎱🔥');
    setImpactVisible(true);
    potRed();
  }, [state.phase, state.redsPotted, state.winner, potRed]);

  const handlePotColor = useCallback(
    (color: ColorName) => {
      if (state.winner !== -1 || state.colorsPotted[color]) return;
      if (state.phase === 'color') {
        setBoomMessage(`BOOM! Potted ${color}! 🎱🔥`);
        setImpactVisible(true);
        potColor(color);
      }
    },
    [state.phase, state.colorsPotted, state.winner, potColor]
  );

  const handlePassColor = useCallback(() => {
    if (state.phase !== 'color') return;
    playSound('neon_click');
    endFrame();
  }, [state.phase, endFrame]);

  const redsLeft = 15 - state.redsPotted;
  const canPotRed = state.phase === 'red' && redsLeft > 0 && state.winner === -1;
  const canPotColor = state.phase === 'color' && state.winner === -1;

  /* פרומו וידאו בכניסה — כמו שלושת הכרטיסים האחרים */
  if (showIntroVideo) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          bgcolor: '#000',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <video
          ref={introVideoRef}
          src={SNOOKER_INTRO_VIDEO_URL}
          muted
          playsInline
          autoPlay
          loop
          style={responsiveVideoStyle}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              playSound('neon_click');
              setShowIntroVideo(false);
            }}
            sx={{
              bgcolor: NEON_GOLD,
              color: '#000',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              px: 4,
              py: 1.5,
              '&:hover': { bgcolor: NEON_GOLD, opacity: 0.9 },
            }}
          >
            כניסה למשחק
          </Button>
        </Box>
      </Box>
    );
  }

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
      <SnookerLiveUI
        boomMessage={boomMessage}
        onBoomShown={() => setBoomMessage(null)}
        onGiftSent={handleGiftReceived}
      />
      {showGoldRain && <GoldRainEffect />}
      {beerBlurUntil > Date.now() && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 40,
            background: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease-out',
            '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
          }}
        />
      )}
      {chalkActiveUntil > Date.now() && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            bgcolor: 'rgba(92, 158, 173, 0.9)',
            color: '#fff',
            fontSize: '0.8rem',
            zIndex: 45,
            pointerEvents: 'none',
            boxShadow: '0 0 20px rgba(92,158,173,0.6)',
          }}
        >
          🩵 גיר פעיל — +דיוק
        </Box>
      )}
      {/* Header + מטבעות + חנות */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 720, mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => { playSound('neon_click'); navigate('/'); }}
          sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }}
          aria-label="חזרה לדף הבית"
        >
          ← חזרה
        </Button>
        <Typography variant="h6" sx={{ color: NEON_GOLD, fontWeight: 'bold', textShadow: `0 0 20px ${NEON_GOLD}40` }}>
          סנוקר
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ color: NEON_GOLD, fontSize: '0.9rem' }}>🪙 {userCoins}</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => { playSound('neon_click'); setShopOpen((o) => !o); }}
            sx={{ borderColor: NEON_CYAN, color: NEON_CYAN, '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' } }}
            aria-label="חנות מקלות"
          >
            {shopOpen ? 'סגור חנות' : 'חנות מקלות'}
          </Button>
        </Box>
      </Box>

      {/* חנות Freemium — כרטיסיות עם תמונת המקל (ידית) */}
      {shopOpen && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', mb: 1.5 }}>מקלות — בחר או רכוש</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {[DEFAULT_CUE_ID, ...PURCHASABLE_CUE_IDS].map((id) => {
              const cue = CUE_DESIGNS[id];
              if (!cue) return null;
              const owned = userInventory.includes(id);
              const equipped = activeCueId === id;
              const canBuy = !owned && cue.price > 0 && userCoins >= cue.price;
              const imgSrc = cue.imagePath || undefined;
              return (
                <Card
                  key={id}
                  sx={{
                    width: 160,
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    borderRadius: 4,
                    border: equipped ? `2px solid ${NEON_GOLD}` : '1px solid rgba(255,215,0,0.3)',
                    boxShadow: equipped ? `0 0 20px ${NEON_GOLD}40` : 'none',
                  }}
                >
                  <Box
                    sx={{
                      height: 100,
                      p: 1.5,
                      bgcolor: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={cue.name}
                        style={{ maxHeight: 90, objectFit: 'contain' }}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          if (t) t.style.display = 'none';
                        }}
                      />
                    ) : null}
                  </Box>
                  {!imgSrc && (
                    <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)' }}>
                      <Box sx={{ width: 40, height: 8, borderRadius: 1, bgcolor: cue.primaryColor || '#888' }} />
                    </Box>
                  )}
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {cue.name}
                    </Typography>
                    {cue.bonusLabel && (
                      <Typography sx={{ color: '#aaa', fontSize: '0.7rem', mb: 0.5 }}>{cue.bonusLabel}</Typography>
                    )}
                    {cue.price === 0 ? (
                      <Typography sx={{ color: '#888', fontSize: '0.75rem' }}>חינם</Typography>
                    ) : (
                      <Typography sx={{ color: NEON_GOLD, fontSize: '0.8rem' }}>🪙 {cue.price}</Typography>
                    )}
                    {owned ? (
                      <Button
                        fullWidth
                        size="small"
                        variant={equipped ? 'contained' : 'outlined'}
                        onClick={() => equipCue(id)}
                        sx={{
                          mt: 0.5,
                          fontSize: '0.75rem',
                          ...(equipped ? { bgcolor: NEON_GOLD, color: '#000' } : { borderColor: NEON_CYAN, color: NEON_CYAN }),
                        }}
                        aria-label={equipped ? 'מצויד' : `השתמש במקל ${cue.name}`}
                      >
                        {equipped ? 'מצויד' : 'השתמש'}
                      </Button>
                    ) : canBuy ? (
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        onClick={() => handlePurchase(id, cue.price)}
                        sx={{ mt: 0.5, fontSize: '0.75rem', bgcolor: NEON_GOLD, color: '#000' }}
                        aria-label={`קנה ${cue.name} ב-${cue.price} מטבעות`}
                      >
                        קנה ב-{cue.price} מטבעות
                      </Button>
                    ) : (
                      <Typography sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
                        {cue.price > 0 && userCoins < cue.price ? 'חסר מטבעות' : ''}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Score board */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,245,212,0.3)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: state.turn === 0 ? NEON_CYAN : '#666', fontWeight: state.turn === 0 ? 'bold' : 'normal', fontSize: '0.85rem' }}>
            שחקן 1
          </Typography>
          <Typography sx={{ color: NEON_CYAN, fontSize: '1.5rem', fontWeight: 'bold' }}>{state.scores[0]}</Typography>
        </Box>
        <Box sx={{ alignSelf: 'center', color: NEON_GOLD }}>–</Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: state.turn === 1 ? NEON_PINK : '#666', fontWeight: state.turn === 1 ? 'bold' : 'normal', fontSize: '0.85rem' }}>
            שחקן 2
          </Typography>
          <Typography sx={{ color: NEON_PINK, fontSize: '1.5rem', fontWeight: 'bold' }}>{state.scores[1]}</Typography>
        </Box>
      </Box>

      {/* בחירת רמה — שולחן שונה לכל רמה */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,245,212,0.25)',
        }}
      >
        <Typography sx={{ color: NEON_CYAN, fontSize: '0.9rem', fontWeight: 500 }}>רמה (שולחן):</Typography>
        <ToggleButtonGroup
          value={state.level ?? 1}
          exclusive
          onChange={(_, value: number | null) => {
            if (value != null) {
              playSound('neon_click');
              setLevel(value);
            }
          }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#888',
              borderColor: 'rgba(0,245,212,0.4)',
              px: 1.5,
              '&.Mui-selected': {
                color: NEON_CYAN,
                bgcolor: 'rgba(0,245,212,0.15)',
                borderColor: NEON_CYAN,
                '&:hover': { bgcolor: 'rgba(0,245,212,0.25)' },
              },
              '&:hover': { borderColor: NEON_CYAN, color: NEON_CYAN },
            },
          }}
        >
          <ToggleButton value={1}>רמה 1</ToggleButton>
          <ToggleButton value={2}>רמה 2</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Turn / phase hint + כפתור הסבר */}
      {state.winner === -1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>
            {state.phase === 'red'
              ? `תור שחקן ${state.turn + 1} — הכנס כדור אדום (${redsLeft} נותרו)`
              : 'בחר צבע להכנסה (או דלג לתור הבא)'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => { playSound('neon_click'); setShowInstructions((s) => !s); }}
            sx={{
              borderColor: NEON_CYAN,
              color: NEON_CYAN,
              minWidth: 36,
              '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' },
            }}
            aria-label={showInstructions ? 'סגור הסבר' : 'הצג הסבר משחק'}
          >
            ?
          </Button>
        </Box>
      )}

      {/* הוראות גרירה — מוצג רק בלחיצה על ? */}
      {state.winner === -1 && showInstructions && (
        <Box sx={{ mb: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,212,0.3)' }}>
          <Typography sx={{ color: 'rgba(0,245,212,0.95)', fontSize: '0.8rem' }}>
            1) כוון עם העכבר לאן לירות (הקו מראה כיוון). 2) לחץ על הכדור הלבן. 3) גרור <strong>אחורה</strong> (מהכדור הלבן החוצה) כדי לטעון כוח — מד הכוח מימין עולה. 4) שחרר את העכבר כדי להכות.
          </Typography>
        </Box>
      )}
      {/* שולחן + כפתור גיר + BANK — High-Stakes */}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 420, mx: 'auto' }}>
        <Box
          sx={{
            maxHeight: 'min(640px, 78vh)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <SnookerCanvas
            width={400}
            height={600}
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

        {/* BANK + קופה (Pot) — חיבור חנות ↔ Pot */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ color: NEON_GOLD, fontSize: '1rem', fontWeight: 'bold', textShadow: '0 0 12px rgba(255,215,0,0.8)' }}>
            BANK: {userCoins} 🪙
          </Box>
          {tablePot > 0 && (
            <Box sx={{ color: NEON_CYAN, fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 0 8px rgba(0,242,234,0.8)' }}>
              💰 קופה: {tablePot} 🪙
            </Box>
          )}
        </Box>

        {/* כפתור גיר נאוני — Risk vs Reward */}
        {state.winner === -1 && (
          <Button
            onClick={handleChalkClick}
            disabled={isDragging}
            aria-label={`גיר — ${CHALK_COST} מטבעות, דיוק משופר`}
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              width: 80,
              height: 80,
              borderRadius: '12px',
              background: isChalked
                ? 'linear-gradient(45deg, #0047ab, #4169e1)'
                : 'rgba(20, 20, 20, 0.85)',
              border: `2px solid ${isChalked ? NEON_CYAN : '#333'}`,
              boxShadow: isChalked ? `0 0 20px ${NEON_CYAN}` : 'none',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              '&:hover:not(:disabled)': {
                transform: 'scale(1.05)',
                boxShadow: `0 0 15px ${NEON_CYAN}`,
                borderColor: NEON_CYAN,
              },
              '&:disabled': {
                color: 'rgba(255,255,255,0.5)',
              },
            }}
          >
            <Box component="span" sx={{ fontSize: '1.75rem', mb: 0.25 }}>🩵</Box>
            <Box component="span" sx={{ fontSize: '0.7rem' }}>{CHALK_COST} 🪙</Box>
          </Button>
        )}
      </Box>

      {/* Pass turn (when phase is color) */}
      {state.phase === 'color' && state.winner === -1 && (
        <Button
          variant="outlined"
          size="small"
          onClick={handlePassColor}
          sx={{
            mt: 2,
            borderColor: NEON_GOLD,
            color: NEON_GOLD,
            '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.1)' },
          }}
          aria-label="דלג והעבר תור ליריב"
        >
          דלג — העבר תור
        </Button>
      )}

      {/* Winner — חיבור Pot → פרס למימוש (לאחר Rake) */}
      {state.winner !== -1 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold', fontSize: '1.2rem' }}>
            {state.winner === 0 ? 'שחקן 1 ניצח!' : 'שחקן 2 ניצח!'}
          </Typography>
          {prizeWon > 0 && (
            <Typography sx={{ color: NEON_CYAN, fontSize: '0.95rem', mt: 0.5 }}>
              🏆 הפרס למימוש (לאחר עמלה {(TABLE_RAKE * 100).toFixed(0)}%): {prizeWon} 🪙
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mt: 1.5 }}>
            <Button
              variant="contained"
              size="medium"
              onClick={() => { playSound('neon_click'); setResetKey((k) => k + 1); reset(); }}
              sx={{
                background: `linear-gradient(90deg, ${NEON_CYAN}, ${NEON_PINK})`,
                fontWeight: 'bold',
                '&:hover': { opacity: 0.95 },
              }}
              aria-label="התחל משחק סנוקר חדש"
            >
              משחק חדש
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={startGameWithEntry}
              disabled={userCoins < ENTRY_FEE}
              sx={{
                borderColor: NEON_GOLD,
                color: NEON_GOLD,
                fontWeight: 'bold',
                '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.1)' },
              }}
              aria-label={`משחק עם קופה ${ENTRY_FEE} מטבעות`}
            >
              משחק עם קופה ({ENTRY_FEE} 🪙)
            </Button>
          </Box>
        </Box>
      )}

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
        {COLOR_ORDER.map((c) => (
          <Typography key={c} sx={{ color: '#888', fontSize: '0.7rem' }}>
            <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: COLOR_BALLS[c], mr: 0.5, verticalAlign: 'middle' }} />
            {c} = {COLOR_VALUES[c]}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
