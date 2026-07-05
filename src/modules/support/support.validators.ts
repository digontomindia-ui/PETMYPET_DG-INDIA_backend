import { z } from 'zod';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './support.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
  priority: z
    .enum([TICKET_PRIORITIES.LOW, TICKET_PRIORITIES.MEDIUM, TICKET_PRIORITIES.HIGH])
    .default(TICKET_PRIORITIES.MEDIUM),
});

export const addMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum([
    TICKET_STATUSES.OPEN,
    TICKET_STATUSES.IN_PROGRESS,
    TICKET_STATUSES.RESOLVED,
    TICKET_STATUSES.CLOSED,
  ]),
});

export const listTicketsQuerySchema = z.object({
  status: z
    .enum([
      TICKET_STATUSES.OPEN,
      TICKET_STATUSES.IN_PROGRESS,
      TICKET_STATUSES.RESOLVED,
      TICKET_STATUSES.CLOSED,
    ])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
