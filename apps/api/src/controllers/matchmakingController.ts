import type { FastifyRequest, FastifyReply } from 'fastify';
import { getUsersInEloRange } from '../services/eloService';

type Querystring = { elo?: string; range?: string };

/** ELO Matchmaking — שידוך שחקנים ברמה דומה (Fair Play). */
export async function getMatchmaking(
  req: FastifyRequest<{ Querystring: Querystring }>,
  reply: FastifyReply
) {
  try {
    const elo = Math.max(0, Math.min(3000, parseInt(req.query.elo ?? '1500', 10) || 1500));
    const range = Math.max(50, Math.min(500, parseInt(req.query.range ?? '200', 10) || 200));
    const users = await getUsersInEloRange(elo, range);
    return reply.send({ elo, range, candidates: users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return reply.status(500).send({ error: msg });
  }
}
