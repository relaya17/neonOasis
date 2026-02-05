import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@neon-oasis/shared';
import { processGameWin, placeBet, startP2PMatch, endP2PMatch } from '../services/gameService';
import { emitBalanceUpdate } from './ioRef';

/**
 * ה"דילר" – לוגיקת שולחן המשחק וההימורים.
 * השרת קובע אם המהלך חוקי ואם הכסף עבר.
 */
export function setupGameHandlers(io: Server, socket: Socket) {
  socket.on(
    SOCKET_EVENTS.PLACE_BET,
    async (data: { tableId: string; userId: string; amount: number }) => {
      const { tableId, userId, amount } = data;
      if (!tableId || !userId || amount == null) {
        socket.emit('error', { message: 'Missing tableId, userId or amount' });
        return;
      }

      const result = await placeBet(userId, String(amount), tableId);
      if (!result.ok) {
        socket.emit('error', { message: (result as { error: string }).error });
        return;
      }

      io.to(tableId).emit(SOCKET_EVENTS.BET_PLACED, { userId, amount });
    }
  );

  socket.on(
    SOCKET_EVENTS.GAME_FINISHED,
    async (data: { tableId: string; winnerId: string; loserId: string; pot: string }) => {
      const { tableId, winnerId, loserId, pot } = data;
      try {
        const result = await processGameWin(winnerId, loserId ?? '', pot, tableId);

        if (result.success) {
          io.to(tableId).emit(SOCKET_EVENTS.GAME_OVER, {
            winnerId,
            prize: result.prize,
            animation: 'NEON_JACKPOT',
          });
          if (result.newBalance) emitBalanceUpdate(winnerId, result.newBalance);
        } else {
          socket.emit('error', {
            message: (result as { error: string }).error,
          });
        }
      } catch (error) {
        console.error('Critical Error in payout:', error);
        socket.emit('error', { message: 'Payout failed. Admin has been notified.' });
      }
    }
  );

  socket.on(SOCKET_EVENTS.JOIN_TABLE, (payload: { tableId: string }) => {
    const tableId = payload?.tableId;
    if (tableId) socket.join(tableId);
  });

  // P2P: Escrow + Settlement (משחקים מתחברים לשירות הארנק)
  socket.on(
    SOCKET_EVENTS.P2P_MATCH_START,
    async (data: {
      gameId: string;
      gameKind?: string;
      player1Id: string;
      player2Id: string;
      stakeAmount: string;
    }) => {
      const ip = socket.handshake.address;
      const result = await startP2PMatch(
        data.gameId,
        data.gameKind ?? 'backgammon',
        data.player1Id,
        data.player2Id,
        data.stakeAmount,
        ip
      );
      if (!result.ok) {
        socket.emit('error', { message: (result as { error: string }).error });
        return;
      }
      socket.emit(SOCKET_EVENTS.P2P_MATCH_STARTED, { sessionId: result.sessionId });
    }
  );

  socket.on(
    SOCKET_EVENTS.P2P_MATCH_END,
    async (data: {
      gameId: string;
      winnerId: string;
      loserId: string;
      sessionId: string;
      stakeAmount: string;
    }) => {
      const result = await endP2PMatch(
        data.gameId,
        data.winnerId,
        data.loserId,
        data.sessionId,
        data.stakeAmount
      );
      if (!result.success) {
        socket.emit('error', { message: (result as { error: string }).error });
        return;
      }
      io.to(data.gameId).emit(SOCKET_EVENTS.P2P_MATCH_ENDED, {
        winnerId: data.winnerId,
        winnerNewBalance: result.winnerNewBalance,
        feeAmount: result.feeAmount,
      });
      if (result.winnerNewBalance) emitBalanceUpdate(data.winnerId, result.winnerNewBalance);
    }
  );
}
