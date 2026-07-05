import type { SupportTicketDocument, TicketMessageDocument } from './support.types.js';

export function toTicketDto(ticket: SupportTicketDocument) {
  return {
    id: ticket._id.toString(),
    userId: ticket.userId.toString(),
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export function toTicketMessageDto(message: TicketMessageDocument) {
  return {
    id: message._id.toString(),
    ticketId: message.ticketId.toString(),
    senderId: message.senderId.toString(),
    content: message.content,
    createdAt: message.createdAt,
  };
}
