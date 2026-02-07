import type { FastifyInstance } from 'fastify';
import { guest, login } from '../controllers/authController';
import { rateLimiters } from '../middleware/rateLimit';

export async function authRoutes(fastify: FastifyInstance) {
  // Guest login: moderate rate limit (prevent bot spam)
  fastify.post('/api/auth/guest', { preHandler: rateLimiters.moderate }, guest);
  
  // User login: strict rate limit (prevent brute force)
  fastify.post('/api/auth/login', { preHandler: rateLimiters.strict }, login);
}
