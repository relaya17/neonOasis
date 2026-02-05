import type { FastifyInstance } from 'fastify';
import { get } from '../controllers/leaderboardController';

export async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/leaderboard', get);
}
