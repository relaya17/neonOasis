/**
 * Rate Limiting Middleware
 * Prevents API abuse and DDoS attacks
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { checkRateLimit } from '../cache/redis.js';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  identifier?: (req: FastifyRequest) => string;
}

/**
 * Create rate limit middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { limit, windowSeconds, identifier } = options;

  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get identifier (default: IP address)
      const id = identifier ? identifier(req) : req.ip;
      const key = `${req.routerPath}:${id}`;

      // Check rate limit
      const { allowed, remaining } = await checkRateLimit(key, limit, windowSeconds);

      // Set rate limit headers
      reply.header('X-RateLimit-Limit', limit);
      reply.header('X-RateLimit-Remaining', remaining);
      reply.header('X-RateLimit-Reset', Date.now() + windowSeconds * 1000);

      if (!allowed) {
        return reply.status(429).send({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${windowSeconds} seconds.`,
          retryAfter: windowSeconds,
        });
      }
    } catch (error) {
      // If Redis fails, allow the request (fail-open)
      console.error('Rate limit check failed:', error);
    }
  };
}

/**
 * Predefined rate limiters
 */
export const rateLimiters = {
  // Strict: 5 requests per 15 minutes (login, withdrawal)
  strict: createRateLimiter({
    limit: 5,
    windowSeconds: 15 * 60,
  }),

  // Moderate: 100 requests per minute (API calls)
  moderate: createRateLimiter({
    limit: 100,
    windowSeconds: 60,
  }),

  // Generous: 1000 requests per minute (game moves)
  generous: createRateLimiter({
    limit: 1000,
    windowSeconds: 60,
  }),

  // Per-user: 50 requests per minute per user
  perUser: (limit = 50, windowSeconds = 60) =>
    createRateLimiter({
      limit,
      windowSeconds,
      identifier: (req) => (req as any).userId || req.ip,
    }),
};
