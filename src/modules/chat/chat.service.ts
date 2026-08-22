import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { userRepository } from '../users/user.repository.js';
import { notificationService } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.constants.js';
import { tryGetSocketServer } from '../../sockets/index.js';
import { chatRepository } from './chat.repository.js';
import { toMessageDto, toRoomDto } from './chat.mapper.js';
import { CHAT_SOCKET_EVENTS } from './chat.constants.js';
import type {
  CreateRoomInput,
  ListMessagesQuery,
  ListRoomsQuery,
  SendMessageInput,
  UpdateUrgentInput,
} from './chat.dto.js';
import type { ChatRoomDocument } from './chat.types.js';

async function requireParticipant(roomId: string, userId: string): Promise<ChatRoomDocument> {
  const room = await chatRepository.findRoomById(roomId);
  if (!room) throw AppError.notFound('Chat room not found');
  if (!room.participantIds.some((id) => id.toString() === userId)) {
    throw AppError.forbidden('You are not a participant in this chat room');
  }
  return room;
}

export const chatService = {
  async createOrGetRoom(userId: string, input: CreateRoomInput) {
    if (input.participantId === userId) {
      throw AppError.badRequest('Cannot create a chat room with yourself');
    }
    const otherUser = await userRepository.findById(input.participantId);
    if (!otherUser) throw AppError.notFound('The other participant was not found');

    const room = await chatRepository.findOrCreateRoom(
      userId,
      input.participantId,
      input.bookingId,
    );
    const unreadCount = await chatRepository.countUnreadInRoom(room._id.toString(), userId);
    return toRoomDto(room, userId, unreadCount);
  },

  async listRooms(userId: string, query: ListRoomsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const isUrgent = query.isUrgent === undefined ? undefined : query.isUrgent === 'true';
    const { items, total } = await chatRepository.listRoomsForUser(userId, skip, limit, isUrgent);

    const rooms = await Promise.all(
      items.map(async (room) => {
        const unreadCount = await chatRepository.countUnreadInRoom(room._id.toString(), userId);
        return toRoomDto(room, userId, unreadCount);
      }),
    );

    return { rooms, total, page, limit };
  },

  async listMessages(roomId: string, userId: string, query: ListMessagesQuery) {
    await requireParticipant(roomId, userId);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '', 10) || 50));
    const messages = await chatRepository.listMessages(roomId, limit, query.before);
    return messages.map(toMessageDto).reverse();
  },

  async sendMessage(roomId: string, senderId: string, input: SendMessageInput) {
    const room = await requireParticipant(roomId, senderId);
    const message = await chatRepository.appendMessage(
      roomId,
      senderId,
      input.text.trim(),
      input.imageUrl ?? null,
    );
    const dto = toMessageDto(message);

    const io = tryGetSocketServer();
    io?.to(`room:${roomId}`).emit(CHAT_SOCKET_EVENTS.MESSAGE, dto);

    const recipientId = room.participantIds.find((id) => id.toString() !== senderId);
    if (recipientId) {
      io?.to(`user:${recipientId.toString()}`).emit(CHAT_SOCKET_EVENTS.MESSAGE, dto);
      await notificationService.notify({
        userId: recipientId.toString(),
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        title: 'New message',
        body: input.imageUrl ? 'Sent you an image' : input.text.slice(0, 100),
        data: { roomId },
      });
    }

    return dto;
  },

  async markRead(roomId: string, userId: string): Promise<void> {
    await requireParticipant(roomId, userId);
    await chatRepository.markRoomRead(roomId, userId);
    tryGetSocketServer()
      ?.to(`room:${roomId}`)
      .emit(CHAT_SOCKET_EVENTS.READ, { roomId, readerId: userId });
  },

  async setUrgent(roomId: string, userId: string, input: UpdateUrgentInput) {
    await requireParticipant(roomId, userId);
    const room = await chatRepository.setUrgent(roomId, input.isUrgent);
    if (!room) throw AppError.notFound('Chat room not found');
    const unreadCount = await chatRepository.countUnreadInRoom(roomId, userId);
    return toRoomDto(room, userId, unreadCount);
  },
};
