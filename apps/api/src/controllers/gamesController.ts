import type { FastifyRequest, FastifyReply } from 'fastify';
import { processGameWin } from '../services/gameService';
import { emitBalanceUpdate } from '../sockets/ioRef';

type Body = { winnerId: string; loserId?: string; potAmount: string; sourceGameId?: string };

export async function postGameWin(req: FastifyRequest<{ Body: Body }>, reply: FastifyReply) {
  try {
    const { winnerId, loserId, potAmount, sourceGameId } = req.body ?? {};
    if (!winnerId || !potAmount) {
      return reply.status(400).send({ error: 'winnerId and potAmount required' });
    }
    const result = await processGameWin(winnerId, loserId ?? '', potAmount, sourceGameId);
    if (!result.success) return reply.status(400).send({ error: (result as { error: string }).error });
    if (result.newBalance) emitBalanceUpdate(winnerId, result.newBalance);
    return reply.send(result);
  } catch (_e) {
    return reply.status(500).send({ error: 'Server error' });
  }
}
