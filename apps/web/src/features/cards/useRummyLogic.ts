import { useCallback } from 'react';
import { playSound } from '../../shared/audio';
import type { useLiveGame } from '../../shared/hooks/useLiveGame';

const RUN_BOOM_THRESHOLD = 4;
const RUMMY_WIN_REWARD = 80;

export function useRummyLogic(live: ReturnType<typeof useLiveGame>) {
  const handlePlaceGroup = useCallback(
    (tilesCount: number, isRun: boolean) => {
      if (isRun && tilesCount >= RUN_BOOM_THRESHOLD) {
        live.setBoomMessage('סדרה מטורפת! 🔥');
        playSound('boom_effect');
      } else if (tilesCount >= 4) {
        live.setBoomMessage('קבוצה חזקה! 💪');
      }
    },
    [live],
  );

  const handleWin = useCallback(() => {
    live.setBoomMessage('ניצחון ברומי! 🎉');
    live.setUserCoins((c) => c + RUMMY_WIN_REWARD);
    playSound('win');
  }, [live]);

  return { handlePlaceGroup, handleWin };
}
