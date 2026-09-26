import type { ChatRoomDocument, MessageDocument } from './chat.types.js';

export function toRoomDto(room: ChatRoomDocument, viewerId: string, unreadCount: number) {
  const otherParticipantId = room.participantIds.find((id) => id.toString() !== viewerId);
  return {
    id: room._id.toString(),
    otherParticipantId: otherParticipantId ? otherParticipantId.toString() : null,
    bookingId: room.bookingId ? room.bookingId.toString() : null,
    lastMessageAt: room.lastMessageAt,
    lastMessagePreview: room.lastMessagePreview,
    isUrgent: room.isUrgent,
    unreadCount,
  };
}

export function toMessageDto(message: MessageDocument) {
  return {
    id: message._id.toString(),
    roomId: message.roomId.toString(),
    senderId: message.senderId.toString(),
    text: message.text,
    imageUrl: message.imageUrl,
    isRead: message.isRead,
    createdAt: message.createdAt,
  };
}

/** Provider-app (snake_case) shape of a message — used by both the socket `new_message` event and
 * GET /message/:room_id/history so the two never drift apart. */
export function toProviderAppMessage(dto: ReturnType<typeof toMessageDto>, senderName = '') {
  return {
    id: dto.id,
    room_id: dto.roomId,
    sender_id: dto.senderId,
    sender_name: senderName,
    message: dto.text,
    type: dto.imageUrl ? 'IMAGE' : 'TEXT',
    media_url: dto.imageUrl,
    status: dto.isRead ? 'SEEN' : 'DELIVERED',
    created_at: dto.createdAt,
  };
}
