import type { FastifyInstance } from 'fastify';
import { getBalance, getProfile, getTransactionHistory, getWalletTransactions, postBurnOasis } from '../controllers/usersController';

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { userId: string } }>('/api/users/:userId/balance', getBalance);
  fastify.get<{ Params: { userId: string } }>('/api/users/:userId/profile', getProfile);
  fastify.get<{ Params: { userId: string }; Querystring: { days?: string } }>('/api/users/:userId/transactions', getTransactionHistory);
  fastify.get<{ Params: { userId: string }; Querystring: { limit?: string } }>('/api/users/:userId/wallet/transactions', getWalletTransactions);
  fastify.post<{ Params: { userId: string }; Body: { amount: string; reason: 'store' | 'tournament_fee' | 'table_fee'; referenceId?: string } }>('/api/users/:userId/oasis/burn', postBurnOasis);
}
