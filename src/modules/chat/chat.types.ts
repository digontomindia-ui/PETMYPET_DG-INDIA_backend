import type { HydratedDocument, Types } from 'mongoose';

export interface IChatRoom {
  _id: Types.ObjectId;
  participantIds: Types.ObjectId[];
  bookingId: Types.ObjectId | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string;
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
