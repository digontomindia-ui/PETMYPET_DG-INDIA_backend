import type { ChatRoomDocument, MessageDocument } from './chat.types.js';

export function toRoomDto(room: ChatRoomDocument, viewerId: string, unreadCount: number) {
  const otherParticipantId = room.participantIds.find((id) => id.toString() !== viewerId);
  return {
    id: room._id.toString(),
    otherParticipantId: otherParticipantId ? otherParticipantId.toString() : null,
    bookingId: room.bookingId ? room.bookingId.toString() : null,
    lastMessageAt: room.lastMessageAt,
    lastMessagePreview: room.lastMessagePreview,
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
