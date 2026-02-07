/**
 * לוגיקת ששבש — מטבעות, שליחת מתנות, צלילים.
 * לשימוש ב-BoardContainer / BackgammonLiveGame.
 */

import { useCallback, useState } from 'react';
import { playSound } from '../shared/audio';
import { BACKGAMMON_GIFT_PRICES } from '../features/backgammon/BackgammonLiveUI';

const INITIAL_COINS = 1000;

export function useBackgammonLogic() {
  const [userCoins, setUserCoins] = useState(INITIAL_COINS);

  const sendGift = useCallback(
    (giftId: string): boolean => {
      const price = BACKGAMMON_GIFT_PRICES[giftId] ?? 0;
      if (price > 0 && userCoins < price) {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('אין מספיק מטבעות למתנה זו!');
        }
        playSound('neon_click');
        return false;
      }
      if (price > 0) setUserCoins((prev) => prev - price);
      playSound('gift_sent');
      return true;
    },
    [userCoins]
  );

  return { userCoins, setUserCoins, sendGift };
}
