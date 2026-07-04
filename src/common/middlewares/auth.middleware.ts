import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../errors/app-error.js';

const BEARER_PREFIX = 'Bearer ';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    next(AppError.unauthorized('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);
  const payload = verifyAccessToken(token);
  req.user = { userId: payload.userId, role: payload.role, sessionId: payload.sessionId };
  next();
}

/** Sets req.user if a valid token is present, but never rejects the request. */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(BEARER_PREFIX.length));
    req.user = { userId: payload.userId, role: payload.role, sessionId: payload.sessionId };
  } catch {
    // optional auth: ignore invalid tokens
  }
  next();
}
