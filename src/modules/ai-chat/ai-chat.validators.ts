import { z } from 'zod';

export const sendAiChatMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const listAiChatMessagesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
