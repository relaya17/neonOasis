/**
 * Redis Cache Layer
 * Reduces latency by caching game states, sessions, and frequently accessed data
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_ENABLED = Boolean(REDIS_URL);

// Create Redis client only if REDIS_URL is set
export const redis = REDIS_ENABLED
  ? new Redis(REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    })
  : null;

if (redis) {
  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
  });
} else {
  console.log('ℹ️  Redis disabled (REDIS_URL not set) - using in-memory fallback');
}

// Cache TTL (Time To Live) constants
export const TTL = {
  SESSION: 60 * 60 * 24, // 24 hours
  GAME_STATE: 60 * 60, // 1 hour
  USER_PROFILE: 60 * 5, // 5 minutes
  LEADERBOARD: 60, // 1 minute
  TOURNAMENT: 60 * 10, // 10 minutes
};

/**
 * Cache user session
 */
export async function cacheUserSession(userId: string, sessionData: any): Promise<void> {
  if (!redis) return;
  const key = `session:${userId}`;
  await redis.setex(key, TTL.SESSION, JSON.stringify(sessionData));
}

/**
 * Get cached user session
 */
export async function getCachedUserSession(userId: string): Promise<any | null> {
  if (!redis) return null;
  const key = `session:${userId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Cache game state
 */
export async function cacheGameState(gameId: string, state: any): Promise<void> {
  if (!redis) return;
  const key = `game:${gameId}`;
  await redis.setex(key, TTL.GAME_STATE, JSON.stringify(state));
}

/**
 * Get cached game state
 */
export async function getCachedGameState(gameId: string): Promise<any | null> {
  if (!redis) return null;
  const key = `game:${gameId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Cache user profile
 */
export async function cacheUserProfile(userId: string, profile: any): Promise<void> {
  if (!redis) return;
  const key = `profile:${userId}`;
  await redis.setex(key, TTL.USER_PROFILE, JSON.stringify(profile));
}

/**
 * Get cached user profile
 */
export async function getCachedUserProfile(userId: string): Promise<any | null> {
  if (!redis) return null;
  const key = `profile:${userId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Invalidate user cache (after updates)
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  if (!redis) return;
  await redis.del(`session:${userId}`, `profile:${userId}`);
}

/**
 * Cache leaderboard
 */
export async function cacheLeaderboard(data: any): Promise<void> {
  if (!redis) return;
  const key = 'leaderboard:global';
  await redis.setex(key, TTL.LEADERBOARD, JSON.stringify(data));
}

/**
 * Get cached leaderboard
 */
export async function getCachedLeaderboard(): Promise<any | null> {
  if (!redis) return null;
  const key = 'leaderboard:global';
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Cache tournament list
 */
export async function cacheTournamentList(data: any): Promise<void> {
  if (!redis) return;
  const key = 'tournaments:open';
  await redis.setex(key, TTL.TOURNAMENT, JSON.stringify(data));
}

/**
 * Get cached tournament list
 */
export async function getCachedTournamentList(): Promise<any | null> {
  if (!redis) return null;
  const key = 'tournaments:open';
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Invalidate tournament cache
 */
export async function invalidateTournamentCache(): Promise<void> {
  if (!redis) return;
  await redis.del('tournaments:open');
}

/**
 * Rate limiting helper (in-memory fallback when Redis is disabled)
 */
const inMemoryRateLimits = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) {
    // In-memory fallback
    const now = Date.now();
    const key = identifier;
    const entry = inMemoryRateLimits.get(key);
    
    if (!entry || entry.resetAt < now) {
      inMemoryRateLimits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: limit - 1 };
    }
    
    entry.count++;
    const remaining = Math.max(0, limit - entry.count);
    return {
      allowed: entry.count <= limit,
      remaining,
    };
  }
  
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  const remaining = Math.max(0, limit - current);
  return {
    allowed: current <= limit,
    remaining,
  };
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redis) await redis.quit();
}
