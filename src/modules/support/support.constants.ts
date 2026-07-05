export const SUPPORT_TICKET_MODEL_NAME = 'SupportTicket';
export const TICKET_MESSAGE_MODEL_NAME = 'TicketMessage';

export const TICKET_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const TICKET_PRIORITIES = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' } as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES];
