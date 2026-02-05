import type { FastifyRequest, FastifyReply } from 'fastify';

export async function getHealth(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ ok: true, service: 'neon-oasis-api' });
}
