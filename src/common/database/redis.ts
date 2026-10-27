import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** Shared Redis client used by the rate limiter and other non-BullMQ consumers.
 *
 * Key resilience settings:
 * - `lazyConnect: true`        — don't block module loading; we call .connect() explicitly.
 * - `enableOfflineQueue: false` — commands issued while disconnected reject immediately
 *                                  instead of piling up and crashing Node.
 * - `maxRetriesPerRequest: 3`  — allow a few retries per command before rejecting.
 * - `retryStrategy`            — reconnect with capped exponential back-off; ioredis will
 *                                  keep trying in the background so the app recovers
 *                                  automatically once Redis becomes reachable. */
export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10_000,
  enableOfflineQueue: false,
  retryStrategy(times: number) {
    // Exponential back-off: 500ms → 1s → 2s … capped at 30s
    const delay = Math.min(times * 500, 30_000);
    logger.warn({ attempt: times, nextRetryMs: delay }, 'Redis reconnecting…');
    return delay;
  },
});

redisClient.on('error', (err: Error) => logger.error({ err }, 'Redis client error'));
redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('close', () => logger.warn('Redis connection closed'));

/** Guard against MaxRetriesPerRequestError bubbling up as an uncaught exception/rejection
 * and killing the process. The rate limiter already has `passOnStoreError: true`, but ioredis
 * can still throw these through internal code paths that bypass the command promise chain. */
process.on('unhandledRejection', (reason: unknown) => {
  if (reason instanceof Error && reason.name === 'MaxRetriesPerRequestError') {
    logger.warn({ err: reason }, 'Suppressed Redis MaxRetriesPerRequestError (Redis unreachable)');
    return;
  }
  // Re-throw anything that isn't Redis-related so it still crashes on real bugs.
  throw reason;
});

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
    enableOfflineQueue: true,
    retryStrategy(times: number) {
      return Math.min(times * 500, 30_000);
    },
  };
}
