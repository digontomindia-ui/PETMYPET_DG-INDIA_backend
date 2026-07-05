import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createRoomSchema = z.object({
  participantId: objectIdSchema,
  bookingId: objectIdSchema.optional(),
});

export const sendMessageSchema = z
  .object({
    text: z.string().max(4000).default(''),
    imageUrl: z.string().url().optional(),
  })
  .refine((data) => data.text.trim().length > 0 || data.imageUrl, {
    message: 'Message must have text or an image',
  });

export const listMessagesQuerySchema = z.object({
  limit: z.string().optional(),
  before: objectIdSchema.optional(),
});

export const listRoomsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const roomIdParamSchema = z.object({ roomId: objectIdSchema });
