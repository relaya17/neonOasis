import type { FastifyRequest, FastifyReply } from 'fastify';
import { hasDb } from '../db';
import { getLeaderboard } from '../services/leaderboardService';

type Querystring = { limit?: string };

export async function get(
  req: FastifyRequest<{ Querystring: Querystring }>,
  reply: FastifyReply
) {
  if (!hasDb()) return reply.send({ leaderboard: [] });
  try {
    const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 20;
    const entries = await getLeaderboard(Number.isFinite(limit) ? limit : 20);
    return reply.send({ leaderboard: entries });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Leaderboard failed' });
  }
}
