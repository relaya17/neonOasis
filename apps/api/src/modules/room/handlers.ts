import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@neon-oasis/shared';
import { roomService } from './roomService';
import { isUserVerified } from '../../services/verificationService';
import { registerUserSocket, unregisterUserSocket } from '../../sockets/userSockets';
import { addPlayerToRoom, removePlayerFromRoom, startDisconnectTimer } from './roomMeta';

export function roomHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.ROOM_JOIN, async (payload: { roomId: string; userId: string; kind?: string }) => {
    const { roomId, userId, kind = 'backgammon' } = payload;

    const verified = await isUserVerified(userId);
    if (!verified) {
      socket.emit(SOCKET_EVENTS.ROOM_JOIN_ERROR, { error: 'not_verified', message: 'AI Guardian verification required' });
      return;
    }

    socket.data.userId = userId;
    registerUserSocket(userId, socket.id);
    addPlayerToRoom(roomId, socket.id, userId);

    socket.join(roomId);
    const state = roomService.getOrCreate(roomId, kind as 'backgammon' | 'snooker' | 'cards');
    socket.emit(SOCKET_EVENTS.ROOM_STATE, { state });
  });

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, (payload: { roomId: string }) => {
    const userId = socket.data.userId as string | undefined;
    if (userId) unregisterUserSocket(userId, socket.id);
    removePlayerFromRoom(socket.id);
    socket.leave(payload.roomId);
  });

  socket.on(
    SOCKET_EVENTS.ROOM_ACTION,
    (payload: { roomId: string; payload: unknown; clientTimestamp: number; actionId: string }) => {
      const { roomId, payload: actionPayload, actionId } = payload;
      const result = roomService.applyAction(roomId, actionPayload);
      const snapshot = result ? roomService.getState(roomId) : null;
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_CONFIRM, {
        actionId,
        accepted: !!result,
        snapshot: snapshot ? { state: snapshot, version: 1, serverTimestamp: Date.now() } : undefined,
        serverTimestamp: Date.now(),
      });
    }
  );

  socket.on('disconnect', () => {
    const userId = socket.data.userId as string | undefined;
    if (userId) unregisterUserSocket(userId, socket.id);
    startDisconnectTimer(io, socket.id);
  });
}
