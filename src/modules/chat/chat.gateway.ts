import type { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../../common/utils/jwt.js';
import { logger } from '../../common/utils/logger.js';
import { chatService } from './chat.service.js';
import { CHAT_SOCKET_EVENTS } from './chat.constants.js';

interface AuthenticatedSocket extends Socket {
  data: { userId: string };
}

function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
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

export function registerChatGateway(io: SocketIOServer): void {
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const { userId } = (socket as AuthenticatedSocket).data;
    void socket.join(`user:${userId}`);

    socket.on(CHAT_SOCKET_EVENTS.JOIN, ({ roomId }: { roomId: string }) => {
      void socket.join(`room:${roomId}`);
    });

    socket.on(CHAT_SOCKET_EVENTS.TYPING, ({ roomId }: { roomId: string }) => {
      socket.to(`room:${roomId}`).emit(CHAT_SOCKET_EVENTS.TYPING, { roomId, userId });
    });

    socket.on(
      CHAT_SOCKET_EVENTS.MESSAGE,
      (payload: { roomId: string; text?: string; imageUrl?: string }) => {
        chatService
          .sendMessage(payload.roomId, userId, {
            text: payload.text ?? '',
            imageUrl: payload.imageUrl,
          })
          .catch((err: unknown) => logger.error({ err }, 'Failed to persist socket chat message'));
      },
    );

    socket.on(CHAT_SOCKET_EVENTS.READ, ({ roomId }: { roomId: string }) => {
      chatService
        .markRead(roomId, userId)
        .catch((err: unknown) => logger.error({ err }, 'Failed to mark chat room as read'));
    });
  });
}
