import type { FastifyRequest, FastifyReply } from 'fastify';
import { generateProvablyFairRoll, commitSeed, revealSeed, getCommittedRoll } from '../services/rngService';

type Querystring = { nonce?: string; clientSeed?: string; gameId?: string };
type Body = { nonce?: string; clientSeed?: string; roomId?: string; gameId?: string };

export async function getProvablyFairRoll(
  req: FastifyRequest<{ Querystring: Querystring; Body?: Body }>,
  reply: FastifyReply
) {
  try {
    const gameId = (req.body as Body | undefined)?.gameId ?? (req.query as Querystring).gameId;
    const clientSeed = (req.body as Body | undefined)?.clientSeed ?? (req.query as Querystring).clientSeed;
    if (gameId) {
      const roll = await getCommittedRoll(gameId, clientSeed);
      if ('error' in roll) return reply.status(404).send({ error: roll.error });
      return reply.send(roll);
    }
    const nonce =
      (req.body as Body | undefined)?.nonce ??
      (req.query as Querystring).nonce ??
      `roll-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const roll = generateProvablyFairRoll(nonce, clientSeed);
    return reply.send(roll);
  } catch (_e) {
    return reply.status(500).send({ error: 'RNG error' });
  }
}

/** לפני משחק: קבלת Hashed Seed (commitment) — הלקוח שומר לאימות בסוף */
export async function postRngCommit(
  req: FastifyRequest<{ Body: { gameId: string; clientSeed?: string } }>,
  reply: FastifyReply
) {
  try {
    const { gameId, clientSeed } = req.body ?? {};
    if (!gameId) return reply.status(400).send({ error: 'gameId required' });
    const result = await commitSeed(gameId, clientSeed);
    if ('error' in result) return reply.status(503).send({ error: result.error });
    return reply.send(result);
  } catch (_e) {
    return reply.status(500).send({ error: 'RNG commit error' });
  }
}

/** אחרי משחק: גילוי seed + dice — הלקוח מאמת ש-commitment === hash(seed) */
export async function getRngReveal(
  req: FastifyRequest<{ Querystring: { gameId: string } }>,
  reply: FastifyReply
) {
  try {
    const gameId = req.query.gameId;
    if (!gameId) return reply.status(400).send({ error: 'gameId required' });
    const result = await revealSeed(gameId);
    if ('error' in result) return reply.status(404).send({ error: result.error });
    return reply.send(result);
  } catch (_e) {
    return reply.status(500).send({ error: 'RNG reveal error' });
  }
}
