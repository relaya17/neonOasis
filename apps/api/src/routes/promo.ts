import type { FastifyInstance } from 'fastify';
import { redeem } from '../controllers/couponController';
import { getLink, claim } from '../controllers/referralController';

export async function promoRoutes(fastify: FastifyInstance) {
  fastify.post('/api/redeem', redeem);
  fastify.get('/api/referral/link', getLink);
  fastify.post('/api/referral/claim', claim);
}
