import type { HydratedDocument, Types } from 'mongoose';

export interface IChatRoom {
  _id: Types.ObjectId;
  participantIds: Types.ObjectId[];
  bookingId: Types.ObjectId | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string;
  isUrgent: boolean;
  /** Per-user "clear chat": that user no longer sees messages sent before `at`; the other side is unaffected. */
  clearedAt: { userId: Types.ObjectId; at: Date }[];
  /** Users who blocked this chat; while non-empty nobody can send. */
  blockedBy: Types.ObjectId[];
  createdAt: Date;
}

export type ChatRoomDocument = HydratedDocument<IChatRoom>;

export interface IMessage {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}

export type MessageDocument = HydratedDocument<IMessage>;
