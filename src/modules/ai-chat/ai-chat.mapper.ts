import type { AiChatMessageDocument } from './ai-chat.types.js';

export function toAiChatMessageDto(message: AiChatMessageDocument) {
  return {
    id: message._id.toString(),
    role: message.role,
    text: message.text,
    createdAt: message.createdAt,
  };
}
