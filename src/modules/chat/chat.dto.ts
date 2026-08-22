import type { z } from 'zod';
import type {
  createRoomSchema,
  listMessagesQuerySchema,
  listRoomsQuerySchema,
  sendMessageSchema,
  updateUrgentSchema,
} from './chat.validators.js';

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
export type UpdateUrgentInput = z.infer<typeof updateUrgentSchema>;
