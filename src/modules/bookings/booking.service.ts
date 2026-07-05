import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { generateOtpCode } from '../../common/utils/otp.js';
import { env } from '../../common/config/env.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { petRepository } from '../pets/pet.repository.js';
import { serviceRepository } from '../services/service.repository.js';
import { providerRepository } from '../providers/provider.repository.js';
import { couponService } from '../coupons/coupon.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.constants.js';
import { bookingRepository } from './booking.repository.js';
import { toOwnerBookingView, toProviderBookingView } from './booking.mapper.js';
import {
  BOOKING_STATUSES,
  BOOKING_TRANSITIONS,
  CANCELLED_BY,
  PAYMENT_STATUSES,
} from './booking.constants.js';
import type { CancelBookingInput, CreateBookingInput, ListBookingsQuery } from './booking.dto.js';
import type { BookingDocument } from './booking.types.js';
import type { BookingStatus } from './booking.constants.js';

function assertTransition(current: BookingStatus, next: BookingStatus): void {
  if (!BOOKING_TRANSITIONS[current].includes(next)) {
    throw AppError.badRequest(`Cannot move booking from ${current} to ${next}`);
  }
}

async function requireProviderProfile(providerUserId: string) {
  const provider = await providerRepository.findByUserId(providerUserId);
  if (!provider) throw AppError.notFound('Provider profile not found');
  return provider;
}

async function requireBookingForProvider(
  bookingId: string,
  providerUserId: string,
): Promise<BookingDocument> {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');

  const provider = await requireProviderProfile(providerUserId);
  if (booking.providerId.toString() !== provider._id.toString()) {
    throw AppError.forbidden('This booking does not belong to your provider account');
  }
  return booking;
}

function computeAmounts(price: number, discountAmount: number, commissionPercent: number) {
  const netPrice = Math.max(0, price - discountAmount);
  const commissionAmount = Math.round(netPrice * (commissionPercent / 100) * 100) / 100;
  const providerPayoutAmount = Math.round((netPrice - commissionAmount) * 100) / 100;
  return { commissionAmount, providerPayoutAmount };
}

export const bookingService = {
  async create(userId: string, input: CreateBookingInput) {
    const service = await serviceRepository.findById(input.serviceId);
    if (!service || !service.isActive) throw AppError.notFound('Service not found or unavailable');
    if (service.providerId.toString() !== input.providerId) {
      throw AppError.badRequest('This service does not belong to the specified provider');
    }

    const provider = await providerRepository.findById(input.providerId);
    if (!provider || !provider.isActive || provider.kycStatus !== 'APPROVED') {
      throw AppError.badRequest('This provider is not currently accepting bookings');
    }

    if (input.petId) {
      const pet = await petRepository.findById(input.petId);
      if (!pet || pet.ownerId.toString() !== userId) {
        throw AppError.badRequest('Pet not found for this account');
      }
    }

    const scheduledStart = input.scheduledStart;
    const scheduledEnd = new Date(scheduledStart.getTime() + service.durationMinutes * 60_000);

    const overlap = await bookingRepository.hasOverlap(
      input.providerId,
      scheduledStart,
      scheduledEnd,
    );
    if (overlap)
      throw AppError.conflict('This provider is already booked during the selected time');

    let discountAmount = 0;
    let appliedCoupon: { couponId: string; code: string } | null = null;
    if (input.couponCode) {
      const validation = await couponService.validate(
        input.couponCode,
        userId,
        service.price,
        provider.providerType,
      );
      discountAmount = validation.discountAmount;
      appliedCoupon = { couponId: validation.couponId, code: validation.code };
    }

    const commissionPercent = provider.commissionPercent ?? env.DEFAULT_PLATFORM_COMMISSION_PERCENT;
    const { commissionAmount, providerPayoutAmount } = computeAmounts(
      service.price,
      discountAmount,
      commissionPercent,
    );

    const booking = await bookingRepository.create({
      userId: new Types.ObjectId(userId),
      petId: input.petId ? new Types.ObjectId(input.petId) : null,
      providerId: provider._id,
      serviceId: service._id,
      zoneId: provider.zoneIds[0] ?? null,
      scheduledStart,
      scheduledEnd,
      status: BOOKING_STATUSES.PENDING,
      otpStart: generateOtpCode(),
      otpEnd: generateOtpCode(),
      price: service.price,
      currency: env.CURRENCY,
      couponCode: appliedCoupon?.code ?? null,
      discountAmount,
      commissionPercent,
      commissionAmount,
      providerPayoutAmount,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      notes: input.notes,
    });

    if (appliedCoupon) {
      try {
        await couponService.redeem(
          appliedCoupon.couponId,
          userId,
          booking._id.toString(),
          discountAmount,
        );
      } catch (err) {
        // Coupon usage limit was hit in the moment between validation and redemption; the
        // booking is rolled back rather than left honoring a discount that was never secured.
        await bookingRepository.deleteById(booking._id.toString());
        throw err;
      }
    }

    await notificationService.notify({
      userId: provider.userId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_CREATED,
      title: 'New booking request',
      body: `You have a new booking request for ${scheduledStart.toLocaleString()}`,
      data: { bookingId: booking._id.toString() },
    });

    return toOwnerBookingView(booking);
  },

  async getById(bookingId: string, userId: string, role: Role) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');

    if (role === ROLES.SUPER_ADMIN) return toOwnerBookingView(booking);
    if (booking.userId.toString() === userId) return toOwnerBookingView(booking);

    if (role === ROLES.SERVICE_PROVIDER) {
      const provider = await requireProviderProfile(userId);
      if (booking.providerId.toString() === provider._id.toString()) {
        return toProviderBookingView(booking);
      }
    }

    throw AppError.forbidden('You do not have access to this booking');
  },

  async listMine(userId: string, query: ListBookingsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await bookingRepository.findForUser(userId, query.status, skip, limit);
    return { bookings: items.map(toOwnerBookingView), total, page, limit };
  },

  async listForProvider(providerUserId: string, query: ListBookingsQuery) {
    const provider = await requireProviderProfile(providerUserId);
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await bookingRepository.findForProvider(
      provider._id.toString(),
      query.status,
      skip,
      limit,
    );
    return { bookings: items.map(toProviderBookingView), total, page, limit };
  },

  async accept(bookingId: string, providerUserId: string) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertTransition(booking.status, BOOKING_STATUSES.ACCEPTED);
    booking.status = BOOKING_STATUSES.ACCEPTED;
    await booking.save();

    await notificationService.notify({
      userId: booking.userId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
      title: 'Booking accepted',
      body: 'Your booking has been accepted by the provider',
      data: { bookingId: booking._id.toString() },
    });

    return toProviderBookingView(booking);
  },

  async startJourney(bookingId: string, providerUserId: string) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertTransition(booking.status, BOOKING_STATUSES.ON_THE_WAY);
    booking.status = BOOKING_STATUSES.ON_THE_WAY;
    await booking.save();

    await notificationService.notify({
      userId: booking.userId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_ON_THE_WAY,
      title: 'Provider is on the way',
      body: 'Your service provider is on the way',
      data: { bookingId: booking._id.toString() },
    });

    return toProviderBookingView(booking);
  },

  async verifyStartOtp(bookingId: string, providerUserId: string, code: string) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertTransition(booking.status, BOOKING_STATUSES.STARTED);
    if (booking.otpStart !== code) throw AppError.badRequest('Invalid start OTP');

    booking.status = BOOKING_STATUSES.STARTED;
    booking.otpStartVerifiedAt = new Date();
    await booking.save();
    return toProviderBookingView(booking);
  },

  async verifyEndOtp(bookingId: string, providerUserId: string, code: string) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertTransition(booking.status, BOOKING_STATUSES.COMPLETED);
    if (booking.otpEnd !== code) throw AppError.badRequest('Invalid end OTP');

    const { commissionAmount, providerPayoutAmount } = computeAmounts(
      booking.price,
      booking.discountAmount,
      booking.commissionPercent,
    );

    booking.status = BOOKING_STATUSES.COMPLETED;
    booking.otpEndVerifiedAt = new Date();
    booking.commissionAmount = commissionAmount;
    booking.providerPayoutAmount = providerPayoutAmount;
    await booking.save();

    await notificationService.notify({
      userId: booking.userId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
      title: 'Service completed',
      body: 'Your service is complete. Please rate your experience.',
      data: { bookingId: booking._id.toString() },
    });

    return toProviderBookingView(booking);
  },

  async cancel(bookingId: string, actorUserId: string, actorRole: Role, input: CancelBookingInput) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');

    let cancelledBy: (typeof CANCELLED_BY)[keyof typeof CANCELLED_BY];
    let provider = await providerRepository.findById(booking.providerId.toString());

    if (actorRole === ROLES.SUPER_ADMIN) {
      cancelledBy = CANCELLED_BY.ADMIN;
    } else if (actorRole === ROLES.SERVICE_PROVIDER) {
      provider = await requireProviderProfile(actorUserId);
      if (booking.providerId.toString() !== provider._id.toString()) {
        throw AppError.forbidden('This booking does not belong to your provider account');
      }
      cancelledBy = CANCELLED_BY.PROVIDER;
    } else {
      if (booking.userId.toString() !== actorUserId) {
        throw AppError.forbidden('This booking does not belong to you');
      }
      cancelledBy = CANCELLED_BY.USER;
    }

    assertTransition(booking.status, BOOKING_STATUSES.CANCELLED);
    booking.status = BOOKING_STATUSES.CANCELLED;
    booking.cancelledBy = cancelledBy;
    booking.cancellationReason = input.reason;
    await booking.save();

    const notifyUserIds = new Set([booking.userId.toString()]);
    if (provider) notifyUserIds.add(provider.userId.toString());
    notifyUserIds.delete(actorUserId);

    await Promise.all(
      [...notifyUserIds].map((userId) =>
        notificationService.notify({
          userId,
          type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
          title: 'Booking cancelled',
          body: `The booking was cancelled: ${input.reason}`,
          data: { bookingId: booking._id.toString() },
        }),
      ),
    );

    return toOwnerBookingView(booking);
  },

  /** Called by the Payments module once a gateway refund succeeds; not exposed as its own route. */
  async markRefunded(bookingId: string): Promise<BookingDocument> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');

    assertTransition(booking.status, BOOKING_STATUSES.REFUNDED);
    booking.status = BOOKING_STATUSES.REFUNDED;
    booking.paymentStatus = PAYMENT_STATUSES.REFUNDED;
    await booking.save();
    return booking;
  },
};
