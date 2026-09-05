import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../common/utils/jwt.js';

export interface AuthenticatedSocket extends Socket {
  data: { userId: string };
}

export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    next(new Error('Missing authentication token'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    (socket as AuthenticatedSocket).data.userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid or expired authentication token'));
  }
}
