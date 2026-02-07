import { useCallback, useEffect, useState } from 'react';
import { playVoice } from '../audio/premiumSoundService';
import { getApiBase } from '../../config/apiBase';

type DealerProfile = {
  totalRolls: number;
  doubles: number;
  fastMoves: number;
  lastRollAt: number | null;
  lastMessageAt: number | null;
};

const STORAGE_KEY = 'aiDealerProfile';
const getApi = () => getApiBase() || '';
const MESSAGE_COOLDOWN_MS = 15000;
const MESSAGE_TTL_MS = 5000;
const FAST_MOVE_MS = 4500;

const defaultProfile: DealerProfile = {
  totalRolls: 0,
  doubles: 0,
  fastMoves: 0,
  lastRollAt: null,
  lastMessageAt: null,
};

function loadProfile(): DealerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProfile };
    const parsed = JSON.parse(raw) as Partial<DealerProfile>;
    return {
      totalRolls: parsed.totalRolls ?? 0,
      doubles: parsed.doubles ?? 0,
      fastMoves: parsed.fastMoves ?? 0,
      lastRollAt: parsed.lastRollAt ?? null,
      lastMessageAt: parsed.lastMessageAt ?? null,
    };
  } catch {
    return { ...defaultProfile };
  }
}

function saveProfile(profile: DealerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

function pickRollMessage(profile: DealerProfile, dice: [number, number]): { text: string; voice?: 'yalla' | 'stake' } {
  const [d1, d2] = dice;
  if (d1 === d2) {
    return { text: 'דאבל! ראיתי אותך לוקח סיכונים חכמים. מהלך נועז.', voice: 'stake' };
  }
  if (profile.fastMoves >= 3) {
    return { text: 'קצב אש היום. אתה משחק מהר ובטוח — המשך כך.', voice: 'yalla' };
  }
  if (profile.doubles >= 2) {
    return { text: 'המזל איתך הערב. תמשיך ללחוץ על היתרון.' };
  }
  return { text: 'שומר על קו יציב. תזמון טוב — זה מרגיש מקצועי.' };
}

function pickMoveMessage(profile: DealerProfile): { text: string; voice?: 'yalla' | 'stake' } {
  if (profile.fastMoves >= 3) {
    return { text: 'קצב אש היום. אתה משחק מהר ובטוח — המשך כך.', voice: 'yalla' };
  }
  return { text: 'תזמון טוב. אתה משחק ממוקד ובשליטה.' };
}

export function useAIDealer(options?: { userId?: string; gameId?: string }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), MESSAGE_TTL_MS);
    return () => clearTimeout(t);
  }, [message]);

  const triggerRoll = useCallback(async (dice: [number, number], moveMs?: number, userId?: string, gameId?: string) => {
    const now = Date.now();
    const api = getApi();
    if (api && userId) {
      try {
        const res = await fetch(`${api}/api/ai/dealer/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            gameId,
            eventType: 'roll',
            dice,
            moveMs,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { message?: string; voice?: 'yalla' | 'stake' };
          if (data?.message) {
            setMessage(data.message);
            if (data.voice) playVoice(data.voice);
            return;
          }
        }
      } catch {
        // fallback below
      }
    }

    const profile = loadProfile();
    profile.totalRolls += 1;
    if (dice[0] === dice[1]) profile.doubles += 1;
    if (profile.lastRollAt && now - profile.lastRollAt < FAST_MOVE_MS) {
      profile.fastMoves += 1;
    }
    profile.lastRollAt = now;

    const canSpeak = !profile.lastMessageAt || now - profile.lastMessageAt > MESSAGE_COOLDOWN_MS;
    if (canSpeak) {
      const msg = pickRollMessage(profile, dice);
      setMessage(msg.text);
      if (msg.voice) playVoice(msg.voice);
      profile.lastMessageAt = now;
    }

    saveProfile(profile);
  }, []);

  const triggerMove = useCallback(async (moveMs: number, userId?: string, gameId?: string, actionPayload?: unknown) => {
    const now = Date.now();
    const api = getApi();
    if (api && userId) {
      try {
        const res = await fetch(`${api}/api/ai/dealer/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            gameId,
            eventType: 'move',
            moveMs,
            actionPayload,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { message?: string; voice?: 'yalla' | 'stake' };
          if (data?.message) {
            setMessage(data.message);
            if (data.voice) playVoice(data.voice);
            return;
          }
        }
      } catch {
        // fallback below
      }
    }

    const profile = loadProfile();
    if (moveMs < FAST_MOVE_MS) profile.fastMoves += 1;
    const canSpeak = !profile.lastMessageAt || now - profile.lastMessageAt > MESSAGE_COOLDOWN_MS;
    if (canSpeak) {
      const msg = pickMoveMessage(profile);
      setMessage(msg.text);
      if (msg.voice) playVoice(msg.voice);
      profile.lastMessageAt = now;
    }
    saveProfile(profile);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ moveMs?: number; actionPayload?: unknown }>).detail;
      if (typeof detail?.moveMs === 'number') {
        triggerMove(detail.moveMs, options?.userId, options?.gameId, detail.actionPayload);
      }
    };
    window.addEventListener('ai-dealer:move', handler as EventListener);
    return () => window.removeEventListener('ai-dealer:move', handler as EventListener);
  }, [options?.userId, options?.gameId, triggerMove]);

  return { message, triggerRoll, triggerMove };
}
