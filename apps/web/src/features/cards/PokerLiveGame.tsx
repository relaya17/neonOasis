/**
 * PokerLiveGame — Container לפוקר לייב.
 * מבנה אחיד: useLiveGame (socket/pot/gifts) + LiveUI (overlay) + PokerTable (rendering).
 */

import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import type { GameMode } from '../../shared/hooks/useLiveGame';
import { motion } from 'framer-motion';
import { createDeck, shuffleDeck, type Card } from './deck';
import { evaluateHand, compareHands, HAND_NAMES_HE } from './pokerUtils';
import { playSound, playVoice } from '../../shared/audio';
import { POKER_INTRO_VIDEO_URL } from '../../config/videoUrls';
import { responsiveVideoStyle } from '../../config/videoStyles';
import { LiveUI } from '../../shared/components/LiveUI';
import { useLiveGame } from '../../shared/hooks/useLiveGame';

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';
const TABLE_GREEN = '#0d5c2e';
const ENTRY_FEE = 50;
const TABLE_RAKE = 0.1;

type Phase = 'idle' | 'dealing' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

const DEALER_MESSAGES: Record<Phase, string> = {
  idle: 'לחץ "התחל משחק" להתחלה',
  dealing: 'חלוקה...',
  preflop: 'ההתחלה',
  flop: 'הפלאפ',
  turn: 'הטרן',
  river: 'הריבר',
  showdown: 'הכרעה',
};

function dealTexas(deck: Card[]) {
  const d = [...deck];
  const player = [d.shift()!, d.shift()!].map((c) => ({ ...c, faceUp: true }));
  const ai = [d.shift()!, d.shift()!].map((c) => ({ ...c, faceUp: false }));
  const community = [d.shift()!, d.shift()!, d.shift()!, d.shift()!, d.shift()!].map((c) => ({ ...c, faceUp: false }));
  return { player, ai, community, rest: d };
}

export function PokerLiveGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeMode = (location.state as { mode?: GameMode })?.mode ?? 'pvp';

  /* ── Shared live hook ─────────────────────────── */
  const live = useLiveGame({
    tableId: 'poker-main',
    entryFee: ENTRY_FEE,
    rake: TABLE_RAKE,
    gameMode: routeMode,
  });

  /* ── Poker-specific state ─────────────────────── */
  const [phase, setPhase] = useState<Phase>('idle');
  const [dealerMessage, setDealerMessage] = useState(DEALER_MESSAGES.idle);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [showdownDone, setShowdownDone] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const paidOutRef = useRef(false);
  const introVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showIntroVideo && introVideoRef.current) {
      introVideoRef.current.play().catch(() => {});
    }
  }, [showIntroVideo]);

  const runDealerLine = useCallback((msg: string, delay = 0) => {
    if (delay) setTimeout(() => setDealerMessage(msg), delay);
    else setDealerMessage(msg);
  }, []);

  const startHand = useCallback((withEntry = false) => {
    if (withEntry && live.userCoins < ENTRY_FEE) return;
    playSound('neon_click');
    if (withEntry) {
      live.addToPot();
      setPot(ENTRY_FEE);
    } else {
      setPot(20);
    }
    setPhase('dealing');
    setShowdownDone(false);
    setWinner(null);
    paidOutRef.current = false;
    setDealerMessage(DEALER_MESSAGES.dealing);
    const deck = shuffleDeck(createDeck());
    const { player, ai, community } = dealTexas(deck);
    setPlayerHand(player);
    setAiHand(ai);
    setCommunityCards(community.map((c) => ({ ...c, faceUp: false })));
    playSound('card_flip');
    setTimeout(() => {
      setPhase('preflop');
      runDealerLine(DEALER_MESSAGES.preflop);
      setCommunityCards((prev) => prev.map((c, i) => (i < 3 ? { ...c, faceUp: true } : c)));
    }, 800);
  }, [runDealerLine, live.userCoins, live.addToPot]);

  const doFlop = useCallback(() => { setPhase('flop'); runDealerLine(DEALER_MESSAGES.flop); setCommunityCards((prev) => prev.map((c, i) => (i < 3 ? { ...c, faceUp: true } : c))); playSound('card_flip'); }, [runDealerLine]);
  const doTurn = useCallback(() => { setPhase('turn'); runDealerLine(DEALER_MESSAGES.turn); setCommunityCards((prev) => prev.map((c, i) => (i < 4 ? { ...c, faceUp: true } : c))); playSound('card_flip'); }, [runDealerLine]);
  const doRiver = useCallback(() => { setPhase('river'); runDealerLine(DEALER_MESSAGES.river); setCommunityCards((prev) => prev.map((c) => ({ ...c, faceUp: true }))); playSound('card_flip'); }, [runDealerLine]);

  const doShowdown = useCallback(() => {
    setPhase('showdown');
    runDealerLine(DEALER_MESSAGES.showdown);
    setAiHand((prev) => prev.map((c) => ({ ...c, faceUp: true })));
    playSound('chip_stack');
    const allCommunity = communityCards.map((c) => ({ ...c, faceUp: true }));
    const cmp = compareHands([...playerHand, ...allCommunity], [...aiHand, ...allCommunity]);
    const w = cmp > 0 ? 'player' : cmp < 0 ? 'ai' : null;
    setWinner(w);
    setShowdownDone(true);
    if (w === 'player') {
      playSound('win'); playVoice('win');
      live.setBoomMessage('ניצחון! 🎉');
      if (pot > 0 && !paidOutRef.current) {
        paidOutRef.current = true;
        const afterRake = Math.floor(pot * (1 - TABLE_RAKE));
        live.setUserCoins((c) => c + afterRake);
        setPot(0);
      }
    } else if (w === 'ai') {
      playSound('lose'); playVoice('loss');
      live.setBoomMessage('היריב ניצח 😔');
      if (pot > 0) setPot(0);
    }
  }, [communityCards, playerHand, aiHand, pot, runDealerLine, live]);

  const canAdvance = phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river';
  const advancePhase = () => {
    if (phase === 'preflop') doFlop();
    else if (phase === 'flop') doTurn();
    else if (phase === 'turn') doRiver();
    else if (phase === 'river') doShowdown();
  };

  const playerRank = useMemo(() => {
    if (playerHand.length !== 2 || communityCards.filter((c) => c.faceUp).length < 3) return null;
    return evaluateHand([...playerHand, ...communityCards.filter((c) => c.faceUp)]);
  }, [playerHand, communityCards]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0b', background: 'radial-gradient(ellipse at 50% 30%, #1a2a1a 0%, #0a0a0b 50%)', p: { xs: 1, sm: 2 }, position: 'relative' }}>
      {/* ── Intro video layer (with LiveUI on top = live stream feel) ── */}
      {showIntroVideo && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 900, bgcolor: '#000' }}>
          <video ref={introVideoRef} src={POKER_INTRO_VIDEO_URL} muted playsInline autoPlay loop style={responsiveVideoStyle} />
          {/* LiveUI over the video — looks like a live stream */}
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
            <LiveUI
              gameName="פוקר Live"
              boomMessage={live.boomMessage}
              onBoomShown={() => live.setBoomMessage(null)}
              onGiftSent={live.handleGiftSent}
            />
          </Box>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, display: 'flex', justifyContent: 'center', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', zIndex: 3 }}>
            <Button variant="contained" size="large" onClick={() => { playSound('neon_click'); setShowIntroVideo(false); }} sx={{ bgcolor: NEON_GOLD, color: '#000', fontWeight: 'bold', fontSize: '1.1rem', px: 4, py: 1.5 }}>
              כניסה למשחק
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Shared LiveUI overlay (game mode) ────── */}
      <LiveUI
        gameName="פוקר Live"
        boomMessage={live.boomMessage}
        onBoomShown={() => live.setBoomMessage(null)}
        onGiftSent={live.handleGiftSent}
      />

      {/* ── Gift rain ────────────────────────────── */}
      {live.giftRain && (
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50, fontSize: '3rem', pointerEvents: 'none' }}>
          <Typography sx={{ fontSize: '3rem' }}>{live.giftRain.icon}</Typography>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Button size="small" onClick={() => { playSound('neon_click'); navigate('/'); }} sx={{ color: NEON_CYAN, borderColor: NEON_CYAN, '&:hover': { bgcolor: 'rgba(0,245,212,0.1)' } }} variant="outlined">
          ← חזרה
        </Button>
        <Typography variant="h6" sx={{ color: NEON_GOLD, fontWeight: 'bold', textShadow: `0 0 20px ${NEON_GOLD}40` }}>
          {live.isAI ? 'פוקר — אימון' : 'פוקר'}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-end' }}>
          <Typography sx={{ color: NEON_GOLD, fontSize: '0.8rem', fontWeight: 'bold' }}>BANK: {live.userCoins} 🪙</Typography>
          {pot > 0 && <Typography sx={{ color: NEON_CYAN, fontSize: '0.75rem', fontWeight: 'bold' }}>💰 קופה: {pot} 🪙</Typography>}
        </Box>
      </Box>

      {/* ── Dealer ───────────────────────────────── */}
      <Box sx={{ textAlign: 'center', mb: 1, p: 1, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.4)', border: `1px solid ${NEON_GOLD}` }}>
        <Typography sx={{ color: NEON_GOLD, fontSize: '0.85rem', fontWeight: 'bold' }}>🎩 הדילר</Typography>
        <Typography sx={{ color: '#fff', fontSize: '0.8rem', mt: 0.5 }}>{dealerMessage}</Typography>
      </Box>

      {/* ── Table surface ────────────────────────── */}
      <Paper
        component={motion.div}
        sx={{ background: `radial-gradient(ellipse 80% 70% at 50% 50%, ${TABLE_GREEN}, #0a3d1a)`, border: `3px solid ${NEON_CYAN}`, borderRadius: 4, boxShadow: `0 0 30px ${NEON_CYAN}40`, p: { xs: 2, sm: 3 }, minHeight: 320, position: 'relative' }}
      >
        {/* AI seat */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ color: NEON_PINK, fontSize: '0.8rem', alignSelf: 'center' }}>היריב</Typography>
          {aiHand.map((c) => (
            <Paper key={c.id} sx={{ width: 52, height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, bgcolor: c.faceUp ? '#fff' : '#1a1a2e', border: `2px solid ${c.faceUp ? NEON_GOLD : '#333'}`, borderRadius: 1 }}>
              {c.faceUp ? (
                <>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: c.suit === '♥' || c.suit === '♦' ? '#c00' : '#000', lineHeight: 1 }}>{c.rank}</Typography>
                  <Typography sx={{ fontSize: '1.25rem', color: c.suit === '♥' || c.suit === '♦' ? '#c00' : '#000', lineHeight: 1 }}>{c.suit}</Typography>
                </>
              ) : <Typography sx={{ color: '#555', fontSize: '1.2rem' }}>🂠</Typography>}
            </Paper>
          ))}
        </Box>

        {/* Community + Pot */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {communityCards.map((c, i) => (
              <Paper key={`comm-${i}-${c.id}`} sx={{ width: 48, height: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.25, bgcolor: c.faceUp ? '#fff' : '#1a1a2e', border: `2px solid ${c.faceUp ? NEON_GOLD : '#333'}`, borderRadius: 1 }}>
                {c.faceUp ? (
                  <>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 'bold', color: c.suit === '♥' || c.suit === '♦' ? '#c00' : '#000', lineHeight: 1 }}>{c.rank}</Typography>
                    <Typography sx={{ fontSize: '1.1rem', color: c.suit === '♥' || c.suit === '♦' ? '#c00' : '#000', lineHeight: 1 }}>{c.suit}</Typography>
                  </>
                ) : <Typography sx={{ color: '#555', fontSize: '1rem' }}>🂠</Typography>}
              </Paper>
            ))}
          </Box>
          <Typography sx={{ color: NEON_GOLD, fontWeight: 'bold' }}>💰 קופה: {pot}</Typography>
        </Box>

        {/* Player seat */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 2 }}>
          {playerHand.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {playerHand.map((c) => (
                <Paper key={c.id} sx={{ width: 56, height: 78, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, bgcolor: '#fff', border: `2px solid ${NEON_GOLD}`, borderRadius: 1, boxShadow: `0 0 12px ${NEON_CYAN}60` }}>
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 'bold', color: c.suit === '♥' || c.suit === '♦' ? '#c00' : '#000', lineHeight: 1 }}>{c.rank}</Typography>
                  <Typography sx={{ fontSize: '1.5rem', color: c.suit === '♥' || c.suit === '♦' ? '#c00' : '#000', lineHeight: 1 }}>{c.suit}</Typography>
                </Paper>
              ))}
            </Box>
          )}
          {playerRank && <Typography sx={{ color: NEON_CYAN, fontSize: '0.8rem' }}>ידך: {HAND_NAMES_HE[playerRank.name]}</Typography>}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {phase === 'idle' && (
              <>
                <Button variant="contained" onClick={() => startHand(false)} sx={{ bgcolor: NEON_CYAN, color: '#000', fontWeight: 'bold' }}>התחל משחק</Button>
                <Button variant="outlined" onClick={() => startHand(true)} disabled={live.userCoins < ENTRY_FEE} sx={{ borderColor: NEON_GOLD, color: NEON_GOLD, fontWeight: 'bold' }}>משחק עם קופה ({ENTRY_FEE} 🪙)</Button>
              </>
            )}
            {canAdvance && (
              <Button variant="contained" onClick={advancePhase} sx={{ bgcolor: NEON_PINK, color: '#000', fontWeight: 'bold' }}>
                {phase === 'preflop' ? 'הפלאפ' : phase === 'flop' ? 'הטרן' : phase === 'river' ? 'הכרעה' : 'הבא'}
              </Button>
            )}
            {showdownDone && (
              <>
                <Typography sx={{ color: winner === 'player' ? '#0f0' : winner === 'ai' ? '#f44' : '#ff0', fontWeight: 'bold' }}>
                  {winner === 'player' ? 'ניצחת!' : winner === 'ai' ? 'היריב ניצח' : 'תיקו'}
                </Typography>
                <Button variant="outlined" onClick={() => startHand(false)} sx={{ borderColor: NEON_CYAN, color: NEON_CYAN }}>משחק נוסף</Button>
                <Button variant="outlined" onClick={() => startHand(true)} disabled={live.userCoins < ENTRY_FEE} sx={{ borderColor: NEON_GOLD, color: NEON_GOLD }}>משחק עם קופה ({ENTRY_FEE} 🪙)</Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
