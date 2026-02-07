import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@neon-oasis/shared';
import { getSocketIdsForUser } from './userSockets';

let ioInstance: Server | null = null;

export function setIo(io: Server) {
  ioInstance = io;
}

export function getIo(): Server | null {
  return ioInstance;
}

export function emitBalanceUpdate(userId: string, balance: string) {
  if (!ioInstance) return;
  const socketIds = getSocketIdsForUser(userId);
  for (const id of socketIds) {
    ioInstance.to(id).emit(SOCKET_EVENTS.BALANCE_UPDATED, { balance });
  }
}

/** ניתוק כל ה-sockets של משתמש (למשל ברענון/סגירת דף — כשהלקוח שולח sendBeacon) */
export function disconnectUserSockets(userId: string): number {
  if (!ioInstance) return 0;
  const socketIds = getSocketIdsForUser(userId);
  let count = 0;
  for (const id of socketIds) {
    const socket = ioInstance.sockets.sockets.get(id);
    if (socket) {
      socket.disconnect(true);
      count++;
    }
  }
  return count;
}
