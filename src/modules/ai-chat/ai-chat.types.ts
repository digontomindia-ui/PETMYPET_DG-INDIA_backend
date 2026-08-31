import type { HydratedDocument, Types } from 'mongoose';
import type { AiChatRole } from './ai-chat.constants.js';

export interface IAiChatMessage {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  role: AiChatRole;
  text: string;
  createdAt: Date;
}

export type AiChatMessageDocument = HydratedDocument<IAiChatMessage>;
