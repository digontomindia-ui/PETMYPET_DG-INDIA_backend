import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { BOOKING_MODEL_NAME } from '../bookings/booking.constants.js';
import { CHAT_ROOM_MODEL_NAME, MESSAGE_MODEL_NAME } from './chat.constants.js';
import type { IChatRoom, IMessage } from './chat.types.js';

const chatRoomSchema = new Schema<IChatRoom>({
  participantIds: {
    type: [{ type: Schema.Types.ObjectId, ref: USER_MODEL_NAME }],
    required: true,
    validate: {
      validator: (value: unknown[]) => value.length === 2,
      message: 'A chat room must have exactly two participants',
    },
  },
  bookingId: { type: Schema.Types.ObjectId, ref: BOOKING_MODEL_NAME, default: null },
  lastMessageAt: { type: Date, default: null },
  lastMessagePreview: { type: String, default: '' },
  isUrgent: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() },
});

chatRoomSchema.index({ participantIds: 1 });

export const ChatRoomModel = model<IChatRoom>(CHAT_ROOM_MODEL_NAME, chatRoomSchema);

const messageSchema = new Schema<IMessage>({
  roomId: { type: Schema.Types.ObjectId, ref: CHAT_ROOM_MODEL_NAME, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  text: { type: String, required: true, maxlength: 4000 },
  imageUrl: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() },
});

messageSchema.index({ roomId: 1, createdAt: -1 });

export const MessageModel = model<IMessage>(MESSAGE_MODEL_NAME, messageSchema);
