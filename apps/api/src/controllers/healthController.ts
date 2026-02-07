import type { FastifyRequest, FastifyReply } from 'fastify';

const HEALTH_BODY = { ok: true, service: 'neon-oasis-api' } as const;

export async function getHealth(_req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send(HEALTH_BODY);
  } catch (err) {
    reply.log?.warn?.(err, 'health endpoint error');
    return reply.code(200).send(HEALTH_BODY);
  }
}
