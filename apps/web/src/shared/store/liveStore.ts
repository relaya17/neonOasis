import { create } from 'zustand';

/**
 * Live Sidebar store — מונה צופים, זרם מתנות, רישום handler מהמשחק הפעיל.
 * 70% מהמתנה לשחקן (לפדיון), 30% עמלת פלטפורמה (כמו TikTok).
 */

export interface IncomingGift {
  id: string;
  user: string;
  icon: string;
  giftId: string;
}

export type GiftHandler = (gift: { id: string; label: string; icon: string; price: number }) => void;

interface LiveState {
  viewersCount: number;
  /** תאימות ל-API: אותו ערך כמו viewersCount */
  viewerCount: number;
  isLive: boolean;
  gifts: IncomingGift[];
  maxGifts: number;
  giftHandler: GiftHandler | null;
  setViewersCount: (n: number) => void;
  /** תאימות: עדכון מונה צופים (אותו דבר כמו setViewersCount) */
  updateViewers: (count: number) => void;
  addGift: (g: Omit<IncomingGift, 'id'>) => void;
  registerGiftHandler: (handler: GiftHandler | null) => void;
  sendGift: (gift: { id: string; label: string; icon: string; price: number }, senderName: string) => void;
}

const MAX_FEED = 50;
const INITIAL_VIEWERS = 150;

export const useLiveStore = create<LiveState>((set, get) => ({
  viewersCount: INITIAL_VIEWERS,
  viewerCount: INITIAL_VIEWERS,
  isLive: true,
  gifts: [],
  maxGifts: MAX_FEED,
  giftHandler: null,

  setViewersCount: (viewersCount) => set({ viewersCount, viewerCount: viewersCount }),

  updateViewers: (count) => set({ viewersCount: count, viewerCount: count }),

  addGift: (g) =>
    set((s) => ({
      gifts: [{ ...g, id: `g-${Date.now()}-${Math.random().toString(36).slice(2)}` }, ...s.gifts].slice(0, s.maxGifts),
    })),

  registerGiftHandler: (giftHandler) => set({ giftHandler }),

  sendGift: (gift, senderName) => {
    const { giftHandler, addGift } = get();
    giftHandler?.(gift);
    addGift({ user: senderName, icon: gift.icon, giftId: gift.id });
  },
}));
