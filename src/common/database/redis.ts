import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redisClient.on('error', (err) => logger.error({ err }, 'Redis client error'));
redisClient.on('connect', () => logger.info('Redis connected'));

export async function connectRedis(): Promise<void> {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
    return;
  }
  await redisClient.connect();
}

export async function disconnectRedis(): Promise<void> {
  redisClient.disconnect();
}

/** Separate connection for BullMQ, which requires maxRetriesPerRequest: null and its own instance per queue/worker. */
export function createBullMQConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
