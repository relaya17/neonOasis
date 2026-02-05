import type { FastifyInstance } from 'fastify';
import { guest, login } from '../controllers/authController.js';
import { rateLimiters } from '../middleware/rateLimit.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Guest login: moderate rate limit (prevent bot spam)
  fastify.post('/api/auth/guest', { preHandler: rateLimiters.moderate }, guest);
  
  // User login: strict rate limit (prevent brute force)
  fastify.post('/api/auth/login', { preHandler: rateLimiters.strict }, login);
}
