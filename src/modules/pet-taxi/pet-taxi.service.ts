import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { petRepository } from '../pets/pet.repository.js';
import { petTaxiRepository } from './pet-taxi.repository.js';
import { toPetTaxiBookingDto } from './pet-taxi.mapper.js';
import { PET_TAXI_RATES, PET_TAXI_STATUSES } from './pet-taxi.constants.js';
import type {
  CancelPetTaxiBookingInput,
  CreatePetTaxiBookingInput,
  ListMyPetTaxiBookingsQuery,
} from './pet-taxi.dto.js';

const CANCELLABLE_STATUSES: string[] = [PET_TAXI_STATUSES.PENDING, PET_TAXI_STATUSES.CONFIRMED];

/** Mirrors the ownership check bookingService.create does for a single petId, extended to a list. */
async function assertPetsOwnedByUser(petIds: string[], userId: string): Promise<void> {
  const pets = await petRepository.findMany({ _id: { $in: petIds }, ownerId: userId });
  if (pets.length !== new Set(petIds).size) {
    throw AppError.badRequest('One or more pets were not found for this account');
  }
}

export const petTaxiService = {
  async create(userId: string, input: CreatePetTaxiBookingInput) {
    await assertPetsOwnedByUser(input.petIds, userId);

    const booking = await petTaxiRepository.create({
      userId: new Types.ObjectId(userId),
      tripType: input.tripType,
      petIds: input.petIds.map((petId) => new Types.ObjectId(petId)),
      pickupAddress: input.pickupAddress,
      dropAddress: input.dropAddress,
      pickupDate: new Date(input.pickupDate),
      pickupTime: input.pickupTime,
      price: PET_TAXI_RATES[input.tripType],
    });
    return toPetTaxiBookingDto(booking);
  },

  async listMine(userId: string, query: ListMyPetTaxiBookingsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { userId };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      petTaxiRepository.findMany(filter, { skip, limit, sort: { createdAt: -1 } }),
      petTaxiRepository.count(filter),
    ]);
    return { bookings: items.map(toPetTaxiBookingDto), total, page, limit };
  },

  async getById(id: string, userId: string, role: Role) {
    const booking = await petTaxiRepository.findById(id);
    if (!booking) throw AppError.notFound('Pet taxi booking not found');
    if (booking.userId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
      throw AppError.forbidden('You do not have access to this booking');
    }
    return toPetTaxiBookingDto(booking);
  },

  async cancel(id: string, userId: string, input: CancelPetTaxiBookingInput) {
    const booking = await petTaxiRepository.findById(id);
    if (!booking) throw AppError.notFound('Pet taxi booking not found');
    if (booking.userId.toString() !== userId) {
      throw AppError.forbidden('This booking does not belong to you');
    }
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      throw AppError.badRequest(`Cannot cancel a booking that is already ${booking.status}`);
    }
    booking.status = PET_TAXI_STATUSES.CANCELLED;
    booking.cancellationReason = input.reason;
    await booking.save();
    return toPetTaxiBookingDto(booking);
  },
};
