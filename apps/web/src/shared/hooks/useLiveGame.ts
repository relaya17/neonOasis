/**
 * useLiveGame — הוק משותף לכל מסכי ה-Live Game.
 *
 * מרכז: סוקט, קופה (pot), מתנות, BOOM messages, מצב מטבעות.
 * כל [Game]LiveGame.tsx משתמש בהוק הזה במקום שכפול לוגיקה.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveStore } from '../store/liveStore';
import { useWalletStore } from '../../features/store/store';
import { useApiStatusStore } from '../store/apiStatus';
import { socketService } from '../../api/socketService';
import { playSound, playVoice } from '../audio';
import type { LiveGiftConfig } from '../components/LiveUI';

/* ─── Game mode ───────────────────────────────────────────────── */
export type GameMode = 'ai' | 'pvp';

/* ─── Config ──────────────────────────────────────────────────── */

export interface UseLiveGameOptions {
  tableId: string;
  entryFee?: number;
  rake?: number;
  /** מחירי מתנות (gift id → price). אם לא מועבר, ייקח מ-gifts */
  giftPrices?: Record<string, number>;
  /** כפתורי המתנות (משמש לחילוץ מחירים אם giftPrices לא מועבר) */
  gifts?: LiveGiftConfig[];
  /** מטבעות התחלתיות */
  initialCoins?: number;
  /**
   * מצב משחק:
   * - 'ai' = אימון מול מחשב. אין דמי כניסה, אין קופת פרסים, אין רווח כספי.
   * - 'pvp' = תחרות מיומנות בין שחקנים. דמי כניסה → קופה → פרס למנצח.
   * ברירת מחדל: 'pvp'
   */
  gameMode?: GameMode;
}

export interface UseLiveGameReturn {
  /* state */
  userCoins: number;
  setUserCoins: React.Dispatch<React.SetStateAction<number>>;
  tablePot: number;
  boomMessage: string | null;
  giftRain: { icon: string; id: string } | null;
  /** מצב משחק נוכחי */
  gameMode: GameMode;
  /** true אם AI mode — ללא רווח כספי */
  isAI: boolean;

  /* actions */
  setBoomMessage: (msg: string | null) => void;
  addToPot: () => void;
  payoutWinner: () => number;
  handleGiftSent: (giftId: string) => void;

  /* socket helpers */
  isConnected: boolean;
}

const INITIAL_COINS = 1000;

export function useLiveGame(opts: UseLiveGameOptions): UseLiveGameReturn {
  const {
    tableId,
    entryFee = 50,
    rake = 0.1,
    giftPrices,
    gifts,
    initialCoins = INITIAL_COINS,
    gameMode = 'pvp',
  } = opts;

  const isAI = gameMode === 'ai';

  /* ── stores ───────────────────────────────────── */
  const userId = useWalletStore((s) => s.userId);
  const apiOnline = useApiStatusStore((s) => s.online);
  const registerGiftHandler = useLiveStore((s) => s.registerGiftHandler);

  /* ── local state ──────────────────────────────── */
  const [userCoins, setUserCoins] = useState(initialCoins);
  const [tablePot, setTablePot] = useState(0);
  const [boomMessage, setBoomMessage] = useState<string | null>(null);
  const [giftRain, setGiftRain] = useState<{ icon: string; id: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const tablePotRef = useRef(0);
  const paidOutRef = useRef(false);

  useEffect(() => { tablePotRef.current = tablePot; }, [tablePot]);

  /* ── resolve gift prices ──────────────────────── */
  const priceMap = giftPrices ?? Object.fromEntries((gifts ?? []).map((g) => [g.id, g.price]));

  /* ── socket connect/disconnect ────────────────── */
  useEffect(() => {
    let mounted = true;
    const token = userId ?? 'user-verified-token';
    const bypassApi = (import.meta.env as { VITE_DEV_BYPASS_API?: string }).VITE_DEV_BYPASS_API === 'true';

    if (apiOnline === false || bypassApi) return () => { mounted = false; };

    socketService
      .connect(token)
      .then(() => {
        if (!mounted) return;
        socketService.joinTable(tableId);
        setIsConnected(true);
      })
      .catch((err) => {
        if (err?.message?.includes('disconnect') || err?.message?.includes('BYPASS_API')) return;
        console.warn('Socket connect failed:', err?.message ?? err);
      });

    return () => {
      mounted = false;
      socketService.offTableUpdate();
      socketService.offGameOver();
      socketService.offBetPlaced();
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [apiOnline, tableId, userId]);

  /* ── register gift handler via liveStore ─────── */
  useEffect(() => {
    const handler = (gift: { id: string; label: string; icon: string; price: number }) => {
      if (userCoins < gift.price) {
        playSound('neon_click');
        return;
      }
      setUserCoins((c) => c - gift.price);
      setGiftRain({ icon: gift.icon, id: gift.id });
      setTimeout(() => setGiftRain(null), 2500);
    };
    registerGiftHandler(handler);
    return () => registerGiftHandler(null);
  }, [userCoins, registerGiftHandler]);

  /* ── add entry fee to pot ─────────────────────── */
  const addToPot = useCallback(() => {
    // AI mode = אימון חינם, אין דמי כניסה ואין קופה
    if (isAI) {
      playSound('neon_click');
      return;
    }
    if (userCoins < entryFee) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('אין מספיק מטבעות לדמי כניסה.');
      }
      return;
    }
    playSound('neon_click');
    paidOutRef.current = false;
    setUserCoins((c) => c - entryFee);
    setTablePot((p) => p + entryFee);
  }, [userCoins, entryFee, isAI]);

  /* ── payout winner (call from game-over handler) */
  const payoutWinner = useCallback(() => {
    // AI mode = אימון בלבד, אין פרס כספי
    if (isAI) {
      setTablePot(0);
      return 0;
    }
    const pot = tablePotRef.current;
    if (pot <= 0 || paidOutRef.current) return 0;
    paidOutRef.current = true;
    const afterRake = Math.floor(pot * (1 - rake));
    setUserCoins((c) => c + afterRake);
    setTablePot(0);
    return afterRake;
  }, [rake, isAI]);

  /* ── handle gift from LiveUI onGiftSent ──────── */
  const handleGiftSent = useCallback(
    (giftId: string) => {
      const price = priceMap[giftId] ?? 0;
      if (price > 0 && userCoins < price) {
        playSound('neon_click');
        return;
      }
      if (price > 0) setUserCoins((c) => c - price);
      playSound('gift_sent');
      setGiftRain({ icon: giftId === 'crown' ? '👑' : giftId === 'rose' ? '🌹' : giftId === 'diamond' ? '💎' : giftId === 'beer' ? '🍺' : '🎁', id: giftId });
      setTimeout(() => setGiftRain(null), 2500);
    },
    [userCoins, priceMap],
  );

  return {
    userCoins,
    setUserCoins,
    tablePot,
    boomMessage,
    giftRain,
    gameMode,
    isAI,
    setBoomMessage,
    addToPot,
    payoutWinner,
    handleGiftSent,
    isConnected,
  };
}
