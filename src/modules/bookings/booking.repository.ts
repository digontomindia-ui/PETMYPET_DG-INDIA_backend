import { BaseRepository } from '../../common/repositories/base.repository.js';
import { BookingModel } from './booking.schema.js';
import { BOOKING_STATUSES } from './booking.constants.js';
import type { IBooking } from './booking.types.js';

const ACTIVE_STATUSES = [
  BOOKING_STATUSES.PENDING,
  BOOKING_STATUSES.ACCEPTED,
  BOOKING_STATUSES.ON_THE_WAY,
  BOOKING_STATUSES.STARTED,
];

export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(BookingModel);
  }

  /** True if the provider already has an active booking overlapping the given time window. */
  async hasOverlap(providerId: string, scheduledStart: Date, scheduledEnd: Date): Promise<boolean> {
    const overlapping = await this.model
      .findOne({
        providerId,
        status: { $in: ACTIVE_STATUSES },
        scheduledStart: { $lt: scheduledEnd },
        scheduledEnd: { $gt: scheduledStart },
      })
      .exec();
    return overlapping !== null;
  }

  async findForUser(userId: string, status: string | undefined, skip: number, limit: number) {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ scheduledStart: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findForProvider(
    providerId: string,
    status: string | undefined,
    skip: number,
    limit: number,
  ) {
    const filter: Record<string, unknown> = { providerId };
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ scheduledStart: 1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}

export const bookingRepository = new BookingRepository();
