import { AppError } from '../../common/errors/app-error.js';
import { providerRepository } from '../providers/provider.repository.js';
import { KYC_STATUSES } from '../providers/provider.constants.js';
import { serviceRepository } from '../services/service.repository.js';
import { bookingRepository } from '../bookings/booking.repository.js';
import { SLOT_STEP_MINUTES, WEEKDAY_BY_JS_DAY_INDEX } from './availability.constants.js';
import type { AvailabilitySlot } from './availability.types.js';
import type { GetAvailabilityQuery } from './availability.dto.js';

function parseTimeOnDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00.000Z`);
}

export const availabilityService = {
  async getSlots(
    query: GetAvailabilityQuery,
  ): Promise<{ date: string; slots: AvailabilitySlot[] }> {
    const provider = await providerRepository.findById(query.providerId);
    if (!provider) throw AppError.notFound('Provider not found');
    if (!provider.isActive || provider.kycStatus !== KYC_STATUSES.APPROVED) {
      throw AppError.badRequest('This provider is not currently accepting bookings');
    }

    const service = await serviceRepository.findById(query.serviceId);
    if (!service) throw AppError.notFound('Service not found');
    if (service.providerId.toString() !== query.providerId) {
      throw AppError.badRequest('This service does not belong to the given provider');
    }

    const weekday = WEEKDAY_BY_JS_DAY_INDEX[new Date(`${query.date}T00:00:00.000Z`).getUTCDay()];
    const workingHours = provider.workingHours.find((entry) => entry.day === weekday);
    if (!workingHours || workingHours.isClosed) {
      return { date: query.date, slots: [] };
    }

    const dayStart = parseTimeOnDate(query.date, workingHours.openTime);
    const dayEnd = parseTimeOnDate(query.date, workingHours.closeTime);
    const durationMs = service.durationMinutes * 60_000;
    if (dayEnd.getTime() - dayStart.getTime() < durationMs) {
      return { date: query.date, slots: [] };
    }

    const busyIntervals = await bookingRepository.findActiveBetween(
      query.providerId,
      dayStart,
      dayEnd,
    );

    const now = Date.now();
    const stepMs = SLOT_STEP_MINUTES * 60_000;
    const slots: AvailabilitySlot[] = [];

    for (let start = dayStart.getTime(); start + durationMs <= dayEnd.getTime(); start += stepMs) {
      const end = start + durationMs;
      const isPast = start <= now;
      const isBusy = busyIntervals.some(
        (booking) =>
          start < booking.scheduledEnd.getTime() && end > booking.scheduledStart.getTime(),
      );
      slots.push({
        start: new Date(start),
        end: new Date(end),
        isAvailable: !isPast && !isBusy,
      });
    }

    return { date: query.date, slots };
  },
};
