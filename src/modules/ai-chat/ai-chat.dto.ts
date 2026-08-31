import type { z } from 'zod';
import type { listAiChatMessagesQuerySchema, sendAiChatMessageSchema } from './ai-chat.validators.js';

export type SendAiChatMessageInput = z.infer<typeof sendAiChatMessageSchema>;
export type ListAiChatMessagesQuery = z.infer<typeof listAiChatMessagesQuerySchema>;
