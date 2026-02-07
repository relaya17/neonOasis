import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { authRoutes } from './auth';
import { usersRoutes } from './users';
import { gamesRoutes } from './games';
import { adminRoutes } from './admin';
import { promoRoutes } from './promo';
import { leaderboardRoutes } from './leaderboard';
import { geoRoutes } from './geo';
import { iapRoutes } from './iap';
import { tournamentsRoutes } from './tournaments';
import { aiRoutes } from './ai';
import { socketRoutes } from './socket';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(gamesRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(promoRoutes);
  await fastify.register(leaderboardRoutes);
  await fastify.register(geoRoutes);
  await fastify.register(iapRoutes);
  await fastify.register(tournamentsRoutes);
  await fastify.register(aiRoutes);
  await fastify.register(socketRoutes);
}
