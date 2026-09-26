import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../common/utils/jwt.js';
import { sessionRepository } from '../modules/auth/session.repository.js';

export interface AuthenticatedSocket extends Socket {
  data: { userId: string };
}

/** Same rule as the REST auth middleware: a logged-out session's token must not open a socket. */
export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    next(new Error('Missing authentication token'));
    return;
  }

  let payload: ReturnType<typeof verifyAccessToken>;
  try {
    payload = verifyAccessToken(token);
  } catch {
    next(new Error('Invalid or expired authentication token'));
    return;
  }

  sessionRepository.isActive(payload.sessionId).then(
    (active) => {
      if (!active) {
        next(new Error('Session is no longer valid, please log in again'));
        return;
      }
      (socket as AuthenticatedSocket).data.userId = payload.userId;
      next();
    },
    () => next(new Error('Could not verify session')),
  );
}
