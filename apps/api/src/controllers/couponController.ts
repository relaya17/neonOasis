import type { FastifyRequest, FastifyReply } from 'fastify';
import { redeemCoupon } from '../services/couponService';

type Body = { code: string; userId: string };

export async function redeem(
  req: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply
) {
  try {
    const { code, userId } = req.body || {};
    if (!code || !userId) {
      return reply.status(400).send({ error: 'code and userId required' });
    }
    const result = await redeemCoupon(code, userId);
    if (!result.success) {
      return reply.status(400).send({ error: (result as { error: string }).error });
    }
    return reply.send({
      success: true,
      coins: result.coins,
      newBalance: result.newBalance,
    });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Redeem failed' });
  }
}
