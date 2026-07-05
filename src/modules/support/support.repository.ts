import { BaseRepository } from '../../common/repositories/base.repository.js';
import { SupportTicketModel, TicketMessageModel } from './support.schema.js';
import type { ISupportTicket } from './support.types.js';

export class SupportTicketRepository extends BaseRepository<ISupportTicket> {
  constructor() {
    super(SupportTicketModel);
  }

  async findForUser(userId: string, skip: number, limit: number) {
    const filter = { userId };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findAll(status: string | undefined, skip: number, limit: number) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}

export const supportTicketRepository = new SupportTicketRepository();

export const ticketMessageRepository = {
  async create(ticketId: string, senderId: string, content: string) {
    return TicketMessageModel.create({ ticketId, senderId, content });
  },

  async listForTicket(ticketId: string) {
    return TicketMessageModel.find({ ticketId }).sort({ createdAt: 1 }).exec();
  },
};
