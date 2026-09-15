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

    registerProviderAppAliasEvents(socket, userId);
  });
}

/**
 * Additive alias event names for a separately-specified vendor mobile app's socket contract
 * (join_room/leave_room/send_message/typing_start/typing_stop/mark_read →
 * message_ack/new_message/user_typing/messages_read) — layered on top of the chat:* events
 * above via the same chatService, never replacing them, so the already-shipped owner app's
 * socket client is unaffected.
 */
function registerProviderAppAliasEvents(socket: Socket, userId: string): void {
  socket.on('join_room', ({ room_id }: { room_id: string }) => {
    void socket.join(`room:${room_id}`);
  });

  socket.on('leave_room', ({ room_id }: { room_id: string }) => {
    void socket.leave(`room:${room_id}`);
  });

  socket.on('typing_start', ({ room_id }: { room_id: string }) => {
    socket.to(`room:${room_id}`).emit('user_typing', { room_id, user_id: userId, is_typing: true });
  });

  socket.on('typing_stop', ({ room_id }: { room_id: string }) => {
    socket.to(`room:${room_id}`).emit('user_typing', { room_id, user_id: userId, is_typing: false });
  });

  socket.on(
    'mark_read',
    ({ room_id, last_read_message_id }: { room_id: string; last_read_message_id?: string }) => {
      chatService
        .markRead(room_id, userId)
        .then(() => {
          socket.to(`room:${room_id}`).emit('messages_read', {
            room_id,
            last_read_message_id: last_read_message_id ?? null,
            read_by: userId,
            read_at: new Date(),
          });
        })
        .catch((err: unknown) => logger.error({ err }, 'Failed to mark chat room as read (alias)'));
    },
  );

  socket.on(
    'send_message',
    (payload: { room_id: string; temp_id?: string; message?: string; type?: string }) => {
      chatService
        .sendMessage(payload.room_id, userId, { text: payload.message ?? '' })
        .then((dto) => {
          socket.emit('message_ack', {
            temp_id: payload.temp_id,
            id: dto.id,
            room_id: dto.roomId,
            status: 'SENT',
            created_at: dto.createdAt,
          });
          socket.to(`room:${dto.roomId}`).emit('new_message', {
            id: dto.id,
            room_id: dto.roomId,
            sender_id: dto.senderId,
            sender_name: '',
            message: dto.text,
            type: 'TEXT',
            status: 'SENT',
            created_at: dto.createdAt,
          });
        })
        .catch((err: unknown) => logger.error({ err }, 'Failed to persist socket chat message (alias)'));
    },
  );
}
