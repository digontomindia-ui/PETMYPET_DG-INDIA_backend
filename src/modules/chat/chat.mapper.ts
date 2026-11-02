import { ROLES } from '../../common/constants/roles.js';
import { CHAT_SENDER_ROLES, type ChatSenderRole } from './chat.constants.js';
import type { ChatRoomDocument, MessageDocument } from './chat.types.js';

/** Maps an account's platform role to the chat's sender-role vocabulary (USER | VENDOR | ADMIN). */
export function chatSenderRole(role?: string): ChatSenderRole {
  if (role === ROLES.SERVICE_PROVIDER) return CHAT_SENDER_ROLES.VENDOR;
  if (role === ROLES.SUPER_ADMIN) return CHAT_SENDER_ROLES.ADMIN;
  return CHAT_SENDER_ROLES.USER;
}

/** When the viewer last cleared this chat, if ever. */
export function clearedAtFor(room: ChatRoomDocument, viewerId: string): Date | undefined {
  return room.clearedAt?.find((c) => c.userId.toString() === viewerId)?.at;
}

export function toRoomDto(room: ChatRoomDocument, viewerId: string, unreadCount: number) {
  const clearedAt = clearedAtFor(room, viewerId);
  const cleared = clearedAt && (!room.lastMessageAt || room.lastMessageAt <= clearedAt);
  const otherParticipantId = room.participantIds.find((id) => id.toString() !== viewerId);
  return {
    id: room._id.toString(),
    otherParticipantId: otherParticipantId ? otherParticipantId.toString() : null,
    bookingId: room.bookingId ? room.bookingId.toString() : null,
    lastMessageAt: cleared ? null : room.lastMessageAt,
    lastMessagePreview: cleared ? '' : room.lastMessagePreview,
    isUrgent: room.isUrgent,
    isBlocked: (room.blockedBy?.length ?? 0) > 0,
    blockedByMe: room.blockedBy?.some((id) => id.toString() === viewerId) ?? false,
    unreadCount,
  };
}

export function toMessageDto(message: MessageDocument) {
  return {
    id: message._id.toString(),
    roomId: message.roomId.toString(),
    senderId: message.senderId.toString(),
    senderRole: message.senderRole,
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
    sender_role: dto.senderRole,
    sender_name: senderName,
    message: dto.text,
    type: dto.imageUrl ? 'IMAGE' : 'TEXT',
    media_url: dto.imageUrl,
    status: dto.isRead ? 'SEEN' : 'DELIVERED',
    created_at: dto.createdAt,
  };
}
