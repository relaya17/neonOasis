import type { FastifyInstance } from 'fastify';
import { disconnectUserSockets } from '../sockets/ioRef';

export async function socketRoutes(fastify: FastifyInstance) {
  /** הלקוח שולח sendBeacon ברענון/סגירת דף — השרת מנתק את כל ה-sockets של המשתמש */
  fastify.post<{ Body: { userId?: string } }>('/api/socket/disconnect', async (req, reply) => {
    const userId = req.body?.userId;
    if (!userId || typeof userId !== 'string') {
      return reply.status(400).send({ ok: false, error: 'userId required' });
    }
    const count = disconnectUserSockets(userId);
    return reply.send({ ok: true, disconnected: count });
  });
}
