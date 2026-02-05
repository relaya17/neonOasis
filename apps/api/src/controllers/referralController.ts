import type { FastifyRequest, FastifyReply } from 'fastify';
import { getReferralLink, claimReferral } from '../services/referralService';

type LinkQuerystring = { userId: string };
type ClaimBody = { inviterId: string; referredId: string };

const BASE_URL = process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5273';

export async function getLink(
  req: FastifyRequest<{ Querystring: LinkQuerystring }>,
  reply: FastifyReply
) {
  const userId = req.query?.userId;
  if (!userId) return reply.status(400).send({ error: 'userId required' });
  const link = getReferralLink(userId, BASE_URL);
  return reply.send({ link });
}

export async function claim(
  req: FastifyRequest<{ Body: ClaimBody }>,
  reply: FastifyReply
) {
  try {
    const { inviterId, referredId } = req.body || {};
    if (!inviterId || !referredId) {
      return reply.status(400).send({ error: 'inviterId and referredId required' });
    }
    const result = await claimReferral(inviterId, referredId);
    return reply.send(result);
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Claim failed' });
  }
}
