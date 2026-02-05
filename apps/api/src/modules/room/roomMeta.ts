import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@neon-oasis/shared';
import { processGameWin } from '../../services/gameService';
import { resolveEscrowOnDisconnect } from '../../services/walletService';
import { getSocketIdsForUser } from '../../sockets/userSockets';

/** roomId -> (socketId -> userId); socketId -> { roomId, userId } */
const roomSockets = new Map<string, Map<string, string>>();
const socketToRoom = new Map<string, { roomId: string; userId: string }>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();

const RECONNECT_GRACE_MS = 30_000;
const DEFAULT_POT_DISCONNECT = '10';

function clearDisconnectTimer(socketId: string) {
  const t = disconnectTimers.get(socketId);
  if (t) {
    clearTimeout(t);
    disconnectTimers.delete(socketId);
  }
}

export function addPlayerToRoom(roomId: string, socketId: string, userId: string) {
  let map = roomSockets.get(roomId);
  if (!map) {
    map = new Map();
    roomSockets.set(roomId, map);
  }
  map.set(socketId, userId);
  socketToRoom.set(socketId, { roomId, userId });
  clearDisconnectTimer(socketId);
}

export function removePlayerFromRoom(socketId: string): { roomId: string; userId: string } | null {
  const meta = socketToRoom.get(socketId);
  if (!meta) return null;
  socketToRoom.delete(socketId);
  const map = roomSockets.get(meta.roomId);
  if (map) {
    map.delete(socketId);
    if (map.size === 0) roomSockets.delete(meta.roomId);
  }
  return meta;
}

/** Call when socket disconnects: remove from room and start 30s grace; after 30s remaining player wins. */
export function startDisconnectTimer(io: Server, socketId: string) {
  const meta = socketToRoom.get(socketId);
  if (!meta) return;
  const { roomId, userId: disconnectedUserId } = meta;
  removePlayerFromRoom(socketId);
  clearDisconnectTimer(socketId);

  const timer = setTimeout(async () => {
    disconnectTimers.delete(socketId);
    const map = roomSockets.get(roomId);
    if (!map || map.size !== 1) return;
    const [remainingSocketId] = Array.from(map.keys());
    const winnerUserId = map.get(remainingSocketId);
    if (!winnerUserId) return;
    // Escrow Oracle: אם יש כסף ב-Escrow — המתנתק מפסיד טכנית; אחרת זכייה רגילה (house)
    const escrowResult = await resolveEscrowOnDisconnect(roomId, disconnectedUserId);
    if (escrowResult.ok && escrowResult.winnerNewBalance) {
      for (const sid of getSocketIdsForUser(winnerUserId)) {
        io.to(sid).emit(SOCKET_EVENTS.BALANCE_UPDATED, { balance: escrowResult.winnerNewBalance });
      }
    } else {
      const result = await processGameWin(winnerUserId, disconnectedUserId, DEFAULT_POT_DISCONNECT, roomId);
      if (result.success && result.newBalance) {
        for (const sid of getSocketIdsForUser(winnerUserId)) {
          io.to(sid).emit(SOCKET_EVENTS.BALANCE_UPDATED, { balance: result.newBalance });
        }
      }
    }
    map.delete(remainingSocketId);
    socketToRoom.delete(remainingSocketId);
    if (map.size < 1) roomSockets.delete(roomId);
  }, RECONNECT_GRACE_MS);

  disconnectTimers.set(socketId, timer);
}

/** רשימת חדרים פעילים — לשימוש בדשבורד */
export function getActiveRooms(): { roomId: string; playerCount: number }[] {
  return Array.from(roomSockets.entries()).map(([roomId, map]) => ({
    roomId,
    playerCount: map.size,
  }));
}

/** Emergency Shutdown — ניתוק כל השחקנים מחדר */
export function shutdownRoom(io: Server, roomId: string): number {
  const map = roomSockets.get(roomId);
  if (!map) return 0;
  const socketIds = Array.from(map.keys());
  for (const socketId of socketIds) {
    removePlayerFromRoom(socketId);
    const socket = io.sockets.sockets.get(socketId);
    if (socket) socket.emit('admin:room_shutdown', { roomId });
  }
  return socketIds.length;
}
