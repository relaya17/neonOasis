import type { FastifyRequest, FastifyReply } from 'fastify';
import { createGuest, loginWithUsername } from '../services/authService';

type LoginBody = { username?: string };

export async function guest(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await createGuest();
    if (!result.success) {
      return reply.status(400).send({ error: (result as { error: string }).error });
    }
    return reply.send({ userId: result.userId, username: result.username, is_admin: result.isAdmin });
  } catch (e) {
    _req.log.error(e);
    const fallbackUserId = `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return reply.send({ userId: fallbackUserId, username: `Guest_${fallbackUserId.slice(5, 11)}`, is_admin: false });
  }
}

export async function login(
  req: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  try {
    const username = req.body?.username;
    if (!username || typeof username !== 'string') {
      return reply.status(400).send({ error: 'username required' });
    }
    const result = await loginWithUsername(username);
    if (!result.success) {
      return reply.status(400).send({ error: (result as { error: string }).error });
    }
    return reply.send({ userId: result.userId, username: result.username, is_admin: result.isAdmin });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Login failed' });
  }
}
