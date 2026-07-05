import type { z } from 'zod';
import type {
  createLostAndFoundSchema,
  listLostAndFoundQuerySchema,
  listPendingQuerySchema,
  rejectLostAndFoundSchema,
} from './lost-and-found.validators.js';

export type CreateLostAndFoundInput = z.infer<typeof createLostAndFoundSchema>;
export type RejectLostAndFoundInput = z.infer<typeof rejectLostAndFoundSchema>;
export type ListLostAndFoundQuery = z.infer<typeof listLostAndFoundQuerySchema>;
export type ListPendingQuery = z.infer<typeof listPendingQuerySchema>;
