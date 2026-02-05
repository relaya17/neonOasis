import type { FastifyRequest, FastifyReply } from 'fastify';
import { logDealerEvent } from '../services/aiDealerService';

type DealerEventBody = {
  userId: string;
  gameId?: string;
  eventType: 'roll' | 'move';
  dice?: [number, number];
  moveMs?: number;
  actionPayload?: unknown;
};

export async function postDealerEvent(
  req: FastifyRequest<{ Body: DealerEventBody }>,
  reply: FastifyReply
) {
  try {
    const body = (req.body ?? {}) as DealerEventBody;
    const { userId, gameId, eventType, dice, moveMs, actionPayload } = body;
    if (!userId || !eventType) {
      return reply.status(400).send({ error: 'userId, eventType required' });
    }
    const result = await logDealerEvent({ userId, gameId, eventType, dice, moveMs, actionPayload });
    return reply.send(result);
  } catch (_e) {
    return reply.status(500).send({ error: 'AI dealer event failed' });
  }
}
