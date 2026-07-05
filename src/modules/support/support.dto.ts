import type { z } from 'zod';
import type {
  addMessageSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketStatusSchema,
} from './support.validators.js';

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
