import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, getWinner } from '@neon-oasis/shared';
import type { BackgammonState } from '@neon-oasis/shared';
import { processGameWin, placeBet, startP2PMatch, endP2PMatch } from '../services/gameService';
import { emitBalanceUpdate } from './ioRef';
import { roomService } from '../modules/room/roomService';

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
    if (!tableId) return;
    const userId = (socket.handshake.auth?.userId ?? socket.handshake.auth?.token) as string | undefined;
    if (userId) roomService.ensureTablePlayer(tableId, userId);
    roomService.getOrCreate(tableId, 'backgammon');
    socket.join(tableId);
  });

  socket.on(
    SOCKET_EVENTS.PLAYER_MOVE,
    (payload: { tableId: string; from?: number | 'bar'; to?: number | 'off' }) => {
      const { tableId, from, to } = payload ?? {};
      if (tableId == null || from === undefined || to === undefined) {
        socket.emit('error', { message: 'Missing tableId, from or to' });
        return;
      }
      const userId = (socket.data.userId ?? socket.handshake.auth?.userId ?? socket.handshake.auth?.token) as string | undefined;
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      const state = roomService.getState(tableId) ?? roomService.getOrCreate(tableId, 'backgammon');
      if (state.kind !== 'backgammon') {
        socket.emit('error', { message: 'Not a backgammon table' });
        return;
      }
      const bgState = state as BackgammonState;
      const playerIndex = roomService.getTablePlayerIndex(tableId, userId);
      if (playerIndex === null || bgState.turn !== playerIndex) {
        socket.emit('error', { message: 'Not your turn or not a player' });
        return;
      }
      const result = roomService.applyBackgammonMove(tableId, { from, to });
      if (!result.ok) {
        socket.emit('error', { message: 'Invalid move' });
        return;
      }
      io.to(tableId).emit(SOCKET_EVENTS.TABLE_UPDATE, {
        state: result.newState,
        lastAction: result.lastAction,
      });
      const winner = getWinner(result.newState);
      if (winner !== -1) {
        const winnerId = roomService.getTableWinnerId(tableId, winner as 0 | 1);
        io.to(tableId).emit(SOCKET_EVENTS.GAME_OVER, {
          winnerId: winnerId ?? `player${winner}`,
          prize: 0,
          animation: 'NEON_JACKPOT',
        });
      }
    }
  );

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
