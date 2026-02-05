import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { SOCKET_EVENTS } from '@neon-oasis/shared';
import { roomHandlers } from '../modules/room/handlers';
import { setupGameHandlers } from '../sockets/gameHandler';
import { setIo } from '../sockets/ioRef';
import { registerUserSocket } from '../sockets/userSockets';

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { 
      origin: process.env.CORS_ORIGIN ?? /^http:\/\/localhost:\d+$/,
      credentials: true 
    },
    transports: ['websocket', 'polling'],
  });

  // Scale: Redis Adapter — Queue ו-broadcast בין instances (Production)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  setIo(io);

  io.on('connection', (socket) => {
    const userId = (socket.handshake.auth?.userId ?? socket.handshake.auth?.token) as string | undefined;
    console.log('✅ Socket.io client connected:', socket.id, 'userId:', userId || 'anonymous');
    
    if (userId) {
      socket.data.userId = userId;
      registerUserSocket(userId, socket.id);
    }
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io client disconnected:', socket.id, 'reason:', reason);
    });
    
    roomHandlers(io, socket);
    setupGameHandlers(io, socket);
  });

  return io;
}

export { SOCKET_EVENTS };
