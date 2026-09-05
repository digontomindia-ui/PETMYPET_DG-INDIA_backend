import type { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../common/utils/logger.js';
import { authenticateSocket, type AuthenticatedSocket } from '../../sockets/authenticate-socket.js';
import { chatService } from './chat.service.js';
import { CHAT_SOCKET_EVENTS } from './chat.constants.js';

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
