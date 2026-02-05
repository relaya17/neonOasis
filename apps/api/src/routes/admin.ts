import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getAdminStats,
  getAdminAlerts,
  getAdminUsers,
  getAdminUserTransactions,
  getAdminRake,
  putAdminRake,
  getAdminRooms,
  postAdminRoomShutdown,
  postAdminBlockUser,
  postAdminUnblockUser,
  getAdminMintBudget,
  putAdminMintBudget,
  getAdminAmlFlagged,
} from '../controllers/adminController';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

/** אם ADMIN_SECRET מוגדר ב-.env — דורש header X-Admin-Secret בכל קריאה ל-admin */
async function adminAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!ADMIN_SECRET) return;
  const secret = req.headers['x-admin-secret'];
  if (secret !== ADMIN_SECRET) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', adminAuth);
  fastify.get('/api/admin/stats', getAdminStats);
  fastify.get('/api/admin/alerts', getAdminAlerts);
  fastify.get('/api/admin/users', getAdminUsers);
  fastify.get<{ Params: { userId: string } }>('/api/admin/users/:userId/transactions', getAdminUserTransactions);
  fastify.post<{ Params: { userId: string } }>('/api/admin/users/:userId/block', postAdminBlockUser);
  fastify.post<{ Params: { userId: string } }>('/api/admin/users/:userId/unblock', postAdminUnblockUser);
  fastify.get('/api/admin/rake', getAdminRake);
  fastify.put('/api/admin/rake', putAdminRake);
  fastify.get('/api/admin/rooms', getAdminRooms);
  fastify.post<{ Params: { roomId: string } }>('/api/admin/rooms/:roomId/shutdown', postAdminRoomShutdown);
  fastify.get('/api/admin/mint-budget', getAdminMintBudget);
  fastify.put('/api/admin/mint-budget', putAdminMintBudget);
  fastify.get('/api/admin/aml-flagged', getAdminAmlFlagged);
}
