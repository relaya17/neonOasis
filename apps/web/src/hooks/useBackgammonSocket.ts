import { useEffect } from 'react';
import type { BackgammonState } from '@neon-oasis/shared';
import { socketService } from '../api/socketService';
import { useBackgammonStore } from '../features/backgammon/store';
import { useWalletStore } from '../features/store';
import { playSound } from '../shared/audio';

export function useBackgammonSocket(tableId: string) {
  const userId = useWalletStore((s) => s.userId);
  const setState = useBackgammonStore((s) => s.setState);

  useEffect(() => {
    const bypassApi = (import.meta.env as { VITE_DEV_BYPASS_API?: string }).VITE_DEV_BYPASS_API === 'true';
    if (bypassApi) return;

    const token = userId ?? 'guest';

    socketService.connect(token).then(() => {
      socketService.joinTable(tableId);

      socketService.onTableUpdate((payload: { state?: BackgammonState }) => {
        if (payload?.state) setState(payload.state);
      });

      socketService.onGameOver((data: { winnerId?: string }) => {
        const isWinner = data?.winnerId === userId;
        playSound(isWinner ? 'win' : 'lose');
      });
    });

    return () => {
      socketService.offTableUpdate();
      socketService.offGameOver();
      socketService.offBetPlaced();
      socketService.disconnect();
    };
  }, [tableId, userId, setState]);
}
