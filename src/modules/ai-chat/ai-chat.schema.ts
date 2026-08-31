import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { AI_CHAT_MESSAGE_MODEL_NAME, AI_CHAT_ROLES } from './ai-chat.constants.js';
import type { IAiChatMessage } from './ai-chat.types.js';

const aiChatMessageSchema = new Schema<IAiChatMessage>({
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  role: { type: String, enum: Object.values(AI_CHAT_ROLES), required: true },
  text: { type: String, required: true, maxlength: 4000 },
  createdAt: { type: Date, default: () => new Date() },
});

aiChatMessageSchema.index({ userId: 1, createdAt: 1 });

export const AiChatMessageModel = model<IAiChatMessage>(
  AI_CHAT_MESSAGE_MODEL_NAME,
  aiChatMessageSchema,
);
