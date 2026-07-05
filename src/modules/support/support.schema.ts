import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import {
  SUPPORT_TICKET_MODEL_NAME,
  TICKET_MESSAGE_MODEL_NAME,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from './support.constants.js';
import type { ISupportTicket, ITicketMessage } from './support.types.js';

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    subject: { type: String, required: true, maxlength: 200 },
    status: { type: String, enum: Object.values(TICKET_STATUSES), default: TICKET_STATUSES.OPEN },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITIES),
      default: TICKET_PRIORITIES.MEDIUM,
    },
  },
  { timestamps: true },
);

supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: 1 });

export const SupportTicketModel = model<ISupportTicket>(
  SUPPORT_TICKET_MODEL_NAME,
  supportTicketSchema,
);

const ticketMessageSchema = new Schema<ITicketMessage>({
  ticketId: { type: Schema.Types.ObjectId, ref: SUPPORT_TICKET_MODEL_NAME, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  content: { type: String, required: true, maxlength: 4000 },
  createdAt: { type: Date, default: () => new Date() },
});

ticketMessageSchema.index({ ticketId: 1, createdAt: 1 });

export const TicketMessageModel = model<ITicketMessage>(
  TICKET_MESSAGE_MODEL_NAME,
  ticketMessageSchema,
);
