import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js';
import { AppError } from '../errors/app-error.js';
import { sessionRepository } from '../../modules/auth/session.repository.js';

const BEARER_PREFIX = 'Bearer ';

/** Signature check alone would keep a token alive after logout; the session row is the source of truth. */
async function resolveUser(token: string): Promise<AccessTokenPayload> {
  const payload = verifyAccessToken(token);
  if (!(await sessionRepository.isActive(payload.sessionId))) {
    throw AppError.unauthorized('Session is no longer valid, please log in again');
  }
  return payload;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    next(AppError.unauthorized('Missing or malformed Authorization header'));
    return;
  }

  resolveUser(header.slice(BEARER_PREFIX.length)).then((payload) => {
    req.user = { userId: payload.userId, role: payload.role, sessionId: payload.sessionId };
    next();
  }, next);
}

/** Sets req.user if a valid token is present, but never rejects the request. */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    next();
    return;
  }
  resolveUser(header.slice(BEARER_PREFIX.length)).then(
    (payload) => {
      req.user = { userId: payload.userId, role: payload.role, sessionId: payload.sessionId };
      next();
    },
    // optional auth: ignore invalid tokens
    () => next(),
  );
}
