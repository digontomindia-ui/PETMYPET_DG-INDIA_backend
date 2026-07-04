import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env, isTest } from '../config/env.js';
import { redisClient } from '../database/redis.js';
import { HTTP_STATUS } from '../constants/http-status.js';

function buildStore(prefix: string) {
  if (isTest) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => redisClient.call(...args) as Promise<never>,
  });
}

export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' },
  store: buildStore('rl:general:'),
});

export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many attempts, please try again later',
  },
  store: buildStore('rl:auth:'),
});
