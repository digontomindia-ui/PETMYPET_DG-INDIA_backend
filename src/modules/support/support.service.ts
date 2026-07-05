import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { supportTicketRepository, ticketMessageRepository } from './support.repository.js';
import { toTicketDto, toTicketMessageDto } from './support.mapper.js';
import type {
  AddMessageInput,
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketStatusInput,
} from './support.dto.js';

async function requireAccess(ticketId: string, userId: string, role: Role) {
  const ticket = await supportTicketRepository.findById(ticketId);
  if (!ticket) throw AppError.notFound('Support ticket not found');
  if (role !== ROLES.SUPER_ADMIN && ticket.userId.toString() !== userId) {
    throw AppError.forbidden('This ticket does not belong to you');
  }
  return ticket;
}

export const supportService = {
  async create(userId: string, input: CreateTicketInput) {
    const ticket = await supportTicketRepository.create({
      userId: new Types.ObjectId(userId),
      subject: input.subject,
      priority: input.priority,
    });
    await ticketMessageRepository.create(ticket._id.toString(), userId, input.message);
    return toTicketDto(ticket);
  },

  async listMine(userId: string, query: ListTicketsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await supportTicketRepository.findForUser(userId, skip, limit);
    return { tickets: items.map(toTicketDto), total, page, limit };
  },

  async listAll(query: ListTicketsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await supportTicketRepository.findAll(query.status, skip, limit);
    return { tickets: items.map(toTicketDto), total, page, limit };
  },

  async getWithMessages(ticketId: string, userId: string, role: Role) {
    const ticket = await requireAccess(ticketId, userId, role);
    const messages = await ticketMessageRepository.listForTicket(ticketId);
    return { ticket: toTicketDto(ticket), messages: messages.map(toTicketMessageDto) };
  },

  async addMessage(ticketId: string, userId: string, role: Role, input: AddMessageInput) {
    await requireAccess(ticketId, userId, role);
    const message = await ticketMessageRepository.create(ticketId, userId, input.content);
    return toTicketMessageDto(message);
  },

  async updateStatus(ticketId: string, input: UpdateTicketStatusInput) {
    const ticket = await supportTicketRepository.updateById(ticketId, { status: input.status });
    if (!ticket) throw AppError.notFound('Support ticket not found');
    return toTicketDto(ticket);
  },
};
