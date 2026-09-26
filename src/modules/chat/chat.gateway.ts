import type { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../common/utils/logger.js';
import { authenticateSocket, type AuthenticatedSocket } from '../../sockets/authenticate-socket.js';
import { chatService } from './chat.service.js';
import { CHAT_SOCKET_EVENTS, PROVIDER_APP_SOCKET_EVENTS } from './chat.constants.js';

/** ponytail: in-process presence — correct for the single app container we run; move to a
 * Redis-backed set (plus the socket.io redis adapter) if the API is ever scaled horizontally. */
const onlineSockets = new Map<string, number>();
const lastSeen = new Map<string, Date>();

export function isUserOnline(userId: string): boolean {
  return (onlineSockets.get(userId) ?? 0) > 0;
}

export function userLastSeen(userId: string): Date | null {
  return lastSeen.get(userId) ?? null;
}

function presencePayload(userId: string) {
  return { user_id: userId, is_online: isUserOnline(userId), last_seen: userLastSeen(userId) };
}

/** Joins the socket to a chat room only if the caller is a participant — otherwise any logged-in
 * user could subscribe to any room id and read someone else's conversation live. Also subscribes
 * to the other participant's presence and replies with their current online status. */
async function joinRoom(socket: Socket, userId: string, roomId: string): Promise<void> {
  const room = await chatService.requireParticipant(roomId, userId);
  await socket.join(`room:${roomId}`);
  const otherId = room.participantIds.find((id) => id.toString() !== userId)?.toString();
  if (otherId) {
    await socket.join(`presence:${otherId}`);
    socket.emit(PROVIDER_APP_SOCKET_EVENTS.USER_STATUS, presencePayload(otherId));
  }
}

function logFailure(what: string) {
  return (err: unknown) => logger.warn({ err }, what);
}

export function registerChatGateway(io: SocketIOServer): void {
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const { userId } = (socket as AuthenticatedSocket).data;
    void socket.join(`user:${userId}`);

    onlineSockets.set(userId, (onlineSockets.get(userId) ?? 0) + 1);
    if (onlineSockets.get(userId) === 1) {
      io.to(`presence:${userId}`).emit(PROVIDER_APP_SOCKET_EVENTS.USER_STATUS, presencePayload(userId));
    }
    socket.on('disconnect', () => {
      const remaining = (onlineSockets.get(userId) ?? 1) - 1;
      if (remaining > 0) {
        onlineSockets.set(userId, remaining);
        return;
      }
      onlineSockets.delete(userId);
      lastSeen.set(userId, new Date());
      io.to(`presence:${userId}`).emit(PROVIDER_APP_SOCKET_EVENTS.USER_STATUS, presencePayload(userId));
    });

    socket.on(CHAT_SOCKET_EVENTS.JOIN, ({ roomId }: { roomId: string }) => {
      joinRoom(socket, userId, roomId).catch(logFailure('Rejected chat:join'));
    });

    socket.on(CHAT_SOCKET_EVENTS.TYPING, ({ roomId }: { roomId: string }) => {
      if (!socket.rooms.has(`room:${roomId}`)) return;
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
          .catch(logFailure('Failed to persist socket chat message'));
      },
    );

    socket.on(CHAT_SOCKET_EVENTS.READ, ({ roomId }: { roomId: string }) => {
      chatService.markRead(roomId, userId).catch(logFailure('Failed to mark chat room as read'));
    });

    registerProviderAppAliasEvents(socket, userId);
  });
}

/**
 * Alias event names for the provider mobile app's socket contract
 * (join_room/leave_room/send_message/typing_start/typing_stop/mark_read →
 * message_ack/new_message/user_typing/messages_read/user_status) — layered on top of the chat:*
 * events above via the same chatService, so the owner app's socket client is unaffected.
 * `new_message` itself is emitted by chatService.sendMessage, so it fires no matter which client
 * or transport (REST, chat:message, send_message) sent the message.
 */
function registerProviderAppAliasEvents(socket: Socket, userId: string): void {
  socket.on('join_room', ({ room_id }: { room_id: string }) => {
    joinRoom(socket, userId, room_id).catch(logFailure('Rejected join_room'));
  });

  socket.on('leave_room', ({ room_id }: { room_id: string }) => {
    void socket.leave(`room:${room_id}`);
  });

  for (const [event, isTyping] of [
    ['typing_start', true],
    ['typing_stop', false],
  ] as const) {
    socket.on(event, ({ room_id }: { room_id: string }) => {
      if (!socket.rooms.has(`room:${room_id}`)) return;
      socket
        .to(`room:${room_id}`)
        .emit(PROVIDER_APP_SOCKET_EVENTS.USER_TYPING, { room_id, user_id: userId, is_typing: isTyping });
    });
  }

  socket.on('mark_read', ({ room_id }: { room_id: string }) => {
    chatService.markRead(room_id, userId).catch(logFailure('Failed to mark chat room as read (alias)'));
  });

  socket.on(
    'send_message',
    (
      payload: { room_id: string; temp_id?: string; message?: string; type?: string; media_url?: string },
      ack?: (response: unknown) => void,
    ) => {
      chatService
        .sendMessage(payload.room_id, userId, {
          text: payload.message ?? '',
          imageUrl: payload.media_url,
        })
        .then((dto) => {
          const response = {
            temp_id: payload.temp_id,
            id: dto.id,
            room_id: dto.roomId,
            status: 'SENT',
            created_at: dto.createdAt,
          };
          socket.emit(PROVIDER_APP_SOCKET_EVENTS.MESSAGE_ACK, response);
          ack?.(response);
        })
        .catch((err: unknown) => {
          logger.warn({ err }, 'Failed to persist socket chat message (alias)');
          const response = { temp_id: payload.temp_id, status: 'FAILED' };
          socket.emit(PROVIDER_APP_SOCKET_EVENTS.MESSAGE_ACK, response);
          ack?.(response);
        });
    },
  );
}
