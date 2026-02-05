import type { FastifyInstance } from 'fastify';
import { postIAPApple } from '../controllers/iapController';

export async function iapRoutes(fastify: FastifyInstance) {
  fastify.post('/api/iap/apple', postIAPApple);
}
