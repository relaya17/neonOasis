import type { FastifyInstance } from 'fastify';
import { getHealth } from '../controllers/healthController';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', getHealth);
  fastify.get('/api/health', getHealth);
}
