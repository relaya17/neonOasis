import React, { useEffect, useRef } from 'react';
import { socketService } from '../../api/socketService';
import type { BackgammonState } from '@neon-oasis/shared';
import { useBackgammonStore } from './store';
import { useWalletStore } from '../store';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { BackgammonBoard3D } from './Board3D';
import { useAIDealer } from '../../shared/hooks';
import { playSound, playVoice } from '../../shared/audio';

interface BoardContainerProps {
  tableId: string;
  /** userId לשליחה ב-auth (אחרי כניסה); ברירת מחדל מ-store */
  token?: string;
}

/**
 * "דבק" השש-בש: מתחבר ל-Socket עם userId אמיתי, נכנס לשולחן, מקשיב לעדכונים.
 */
export function BoardContainer({ tableId, token: tokenProp }: BoardContainerProps) {
  const userId = useWalletStore((s) => s.userId);
  const token = tokenProp ?? userId ?? 'user-verified-token';
  const setState = useBackgammonStore((s) => s.setState);
  const apiOnline = useApiStatusStore((s) => s.online);
  const { triggerMove } = useAIDealer();
  const lastMoveAtRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const cleanup = () => {
      socketService.offTableUpdate();
      socketService.offGameOver();
      socketService.offBetPlaced();
      socketService.disconnect();
    };

    if (apiOnline === false) {
      cleanup();
      return () => {
        mounted = false;
      };
    }

    socketService
      .connect(token)
      .then(() => {
        if (!mounted) return;
        socketService.joinTable(tableId);

        socketService.onTableUpdate((payload) => {
          if (!mounted) return;
          if (payload && typeof payload === 'object' && 'state' in payload) {
            const nextState = (payload as { state: BackgammonState }).state;
            setState(nextState);
            if (typeof nextState.lastMoveAt === 'number') {
              if (lastMoveAtRef.current !== nextState.lastMoveAt) {
                lastMoveAtRef.current = nextState.lastMoveAt;
                const moveMs = Math.max(0, Date.now() - nextState.lastMoveAt);
                triggerMove(moveMs, userId, tableId);
              }
            }
          }
        });

        socketService.onGameOver((data) => {
          if (!mounted) return;
          console.log('Game over:', data);
          
          // Audio feedback for game over
          const isWinner = data?.winnerId === userId;
          if (isWinner) {
            playSound('win');
            playVoice('win'); // "You win!" narration
          } else {
            playSound('lose');
            playVoice('loss'); // Better luck next time
          }
        });

        socketService.onBetPlaced((data) => {
          if (!mounted) return;
          console.log('Bet placed:', data);
          
          // Audio feedback for bet placement
          playSound('coin');
          playVoice('stake'); // "Stakes are in" narration
        });

      })
      .catch((err) => {
        console.error('Socket connect failed:', err);
      });

    return () => {
      mounted = false;
      cleanup();
    };
  }, [apiOnline, tableId, token, setState]);

  return <BackgammonBoard3D />;
}
