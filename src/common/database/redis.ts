import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** Only the rate limiter uses this client. A bounded retry count (instead of `null` = queue
 * forever) makes commands fail fast while Redis is unreachable, so requests aren't held open;
 * the limiter then fails open (see passOnStoreError). ioredis keeps reconnecting in the background. */
export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  connectTimeout: 5_000,
});

redisClient.on('error', (err: Error) => logger.error({ err }, 'Redis client error'));
redisClient.on('connect', () => logger.info('Redis connected'));

export async function connectRedis(): Promise<void> {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
    return;
  }
  try {
    await redisClient.connect();
  } catch (err) {
    // Non-fatal: Mongo is the source of truth. Rate limiting fails open and queued jobs retry
    // once ioredis reconnects, so the API keeps serving instead of crash-looping.
    logger.error({ err, redisHost: new URL(env.REDIS_URL).host }, 'Redis unavailable at startup, continuing without it');
  }
}

export function disconnectRedis(): void {
  redisClient.disconnect();
}

/**
 * BullMQ bundles its own ioredis dependency, whose types are structurally incompatible with
 * a live instance from our top-level ioredis. Passing plain connection options (rather than an
 * instance) sidesteps the conflict and lets each Queue/Worker manage its own connection.
 */
export function getBullMQConnectionOptions(): RedisOptions {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : undefined,
    maxRetriesPerRequest: null,
  };
}
