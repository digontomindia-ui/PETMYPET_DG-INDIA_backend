import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { petRepository } from '../pets/pet.repository.js';
import { relocationRequestRepository } from './pet-relocation.repository.js';
import { toRelocationRequestAdminDto, toRelocationRequestDto } from './pet-relocation.mapper.js';
import { RELOCATION_STATUSES } from './pet-relocation.constants.js';
import type {
  CancelRelocationRequestInput,
  CreateRelocationRequestInput,
  ListRelocationRequestsQuery,
  UpdateRelocationStatusInput,
} from './pet-relocation.dto.js';

/** Once ops has CONFIRMED a transport slot, the owner backs out through support rather than a
 * self-serve cancel — mirrors why bookingService.cancel stops accepting cancellation at STARTED. */
const USER_CANCELLABLE_STATUSES: string[] = [RELOCATION_STATUSES.SUBMITTED, RELOCATION_STATUSES.CONTACTED];

export const petRelocationService = {
  async create(userId: string, input: CreateRelocationRequestInput) {
    const pet = await petRepository.findById(input.petId);
    if (!pet || pet.ownerId.toString() !== userId) {
      throw AppError.badRequest('Pet not found for this account');
    }

    const request = await relocationRequestRepository.create({
      userId: new Types.ObjectId(userId),
      ownerName: input.ownerName,
      ownerPhone: input.ownerPhone,
      ownerEmail: input.ownerEmail,
      petId: new Types.ObjectId(input.petId),
      originAddress: input.originAddress,
      destinationAddress: input.destinationAddress,
      relocationDate: input.relocationDate,
      transportType: input.transportType,
      preferredTimeSlot: input.preferredTimeSlot,
    });
    return toRelocationRequestDto(request);
  },

  async getById(id: string, userId: string, role: Role) {
    const request = await relocationRequestRepository.findById(id);
    if (!request) throw AppError.notFound('Relocation request not found');
    const isOwner = request.userId.toString() === userId;
    const isAdmin = role === ROLES.SUPER_ADMIN;
    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('You do not have access to this request');
    }
    return isAdmin ? toRelocationRequestAdminDto(request) : toRelocationRequestDto(request);
  },

  async list(query: ListRelocationRequestsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    const [items, total] = await Promise.all([
      relocationRequestRepository.findMany(filter, { skip, limit, sort: { createdAt: -1 } }),
      relocationRequestRepository.count(filter),
    ]);
    return { requests: items.map(toRelocationRequestAdminDto), total, page, limit };
  },

  async cancel(id: string, userId: string, input: CancelRelocationRequestInput) {
    const request = await relocationRequestRepository.findById(id);
    if (!request) throw AppError.notFound('Relocation request not found');
    if (request.userId.toString() !== userId) {
      throw AppError.forbidden('This request does not belong to you');
    }
    if (!USER_CANCELLABLE_STATUSES.includes(request.status)) {
      throw AppError.badRequest(`Cannot cancel a request that is already ${request.status}`);
    }
    request.status = RELOCATION_STATUSES.CANCELLED;
    request.cancellationReason = input.reason;
    await request.save();
    return toRelocationRequestDto(request);
  },

  async updateStatus(id: string, input: UpdateRelocationStatusInput) {
    const update: Record<string, unknown> = { status: input.status };
    if (input.adminNotes !== undefined) update.adminNotes = input.adminNotes;
    const request = await relocationRequestRepository.updateById(id, update);
    if (!request) throw AppError.notFound('Relocation request not found');
    return toRelocationRequestAdminDto(request);
  },
};
