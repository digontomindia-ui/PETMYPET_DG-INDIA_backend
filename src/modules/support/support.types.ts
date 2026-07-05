import type { HydratedDocument, Types } from 'mongoose';
import type { TicketPriority, TicketStatus } from './support.constants.js';

export interface ISupportTicket {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
}

export type SupportTicketDocument = HydratedDocument<ISupportTicket>;

export interface ITicketMessage {
  _id: Types.ObjectId;
  ticketId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  createdAt: Date;
}

export type TicketMessageDocument = HydratedDocument<ITicketMessage>;
