import type { FastifyInstance } from 'fastify';
import { postDealerEvent } from '../controllers/aiDealerController';

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post('/api/ai/dealer/event', postDealerEvent);
}
