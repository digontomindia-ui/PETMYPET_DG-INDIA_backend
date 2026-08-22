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

  /** Active bookings for a provider overlapping the given window, for computing free/busy slots. */
  async findActiveBetween(providerId: string, rangeStart: Date, rangeEnd: Date) {
    return this.model
      .find({
        providerId,
        status: { $in: ACTIVE_STATUSES },
        scheduledStart: { $lt: rangeEnd },
        scheduledEnd: { $gt: rangeStart },
      })
      .select('scheduledStart scheduledEnd')
      .sort({ scheduledStart: 1 })
      .exec();
  }

  async findForUser(
    userId: string,
    statuses: string[] | undefined,
    dateRange: { from?: Date; to?: Date },
    skip: number,
    limit: number,
  ) {
    const filter = buildStatusDateFilter({ userId }, statuses, dateRange);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ scheduledStart: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findForProvider(
    providerId: string,
    statuses: string[] | undefined,
    dateRange: { from?: Date; to?: Date },
    skip: number,
    limit: number,
  ) {
    const filter = buildStatusDateFilter({ providerId }, statuses, dateRange);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ scheduledStart: 1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}

function buildStatusDateFilter(
  base: Record<string, unknown>,
  statuses: string[] | undefined,
  dateRange: { from?: Date; to?: Date },
): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...base };
  if (statuses && statuses.length > 0) {
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (dateRange.from || dateRange.to) {
    const scheduledStart: Record<string, Date> = {};
    if (dateRange.from) scheduledStart.$gte = dateRange.from;
    if (dateRange.to) scheduledStart.$lte = dateRange.to;
    filter.scheduledStart = scheduledStart;
  }
  return filter;
}

export const bookingRepository = new BookingRepository();
