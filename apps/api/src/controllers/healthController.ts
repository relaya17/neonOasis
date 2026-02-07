import type { FastifyRequest, FastifyReply } from 'fastify';

const HEALTH_BODY = { ok: true, service: 'neon-oasis-api' } as const;

/** לא בודק DB — רק מחזיר 200. אם מתקבל 500, הסיבה כנראה: API לא רץ (proxy) או middleware לפני ה-route. */
export async function getHealth(_req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send(HEALTH_BODY);
  } catch (err) {
    reply.log?.warn?.(err, 'health endpoint error');
    return reply.code(200).send(HEALTH_BODY);
  }
}
