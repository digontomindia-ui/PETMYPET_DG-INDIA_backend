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
import { referralService } from '../referrals/referral.service.js';
import { tryGetSocketServer } from '../../sockets/index.js';
import { haversineMeters } from '../../common/utils/geo.js';
import { UserModel } from '../users/user.schema.js';
import { bookingRepository } from './booking.repository.js';
import { toOwnerBookingView, toProviderBookingView } from './booking.mapper.js';
import { petTaxiRepository } from '../pet-taxi/pet-taxi.repository.js';
import { petTaxiService } from '../pet-taxi/pet-taxi.service.js';
import { toPetTaxiBookingDto } from '../pet-taxi/pet-taxi.mapper.js';
import { petInsuranceRepository } from '../pet-insurance/pet-insurance.repository.js';
import { petInsuranceService } from '../pet-insurance/pet-insurance.service.js';
import { toInsuranceApplicationDto } from '../pet-insurance/pet-insurance.mapper.js';
import { relocationRequestRepository } from '../pet-relocation/pet-relocation.repository.js';
import { petRelocationService } from '../pet-relocation/pet-relocation.service.js';
import { toRelocationRequestDto } from '../pet-relocation/pet-relocation.mapper.js';
import {
  BOOKING_STATUSES,
  BOOKING_TRANSITIONS,
  CANCELLED_BY,
  OTP_END_LOCATION_RADIUS_METERS,
  PAYMENT_STATUSES,
  WALK_SOCKET_EVENTS,
} from './booking.constants.js';
import type {
  AddBookingPhotoInput,
  CancelBookingInput,
  CreateBookingInput,
  ListBookingsQuery,
  UpdateProviderNotesInput,
} from './booking.dto.js';
import type { BookingDocument, IBookingAddOn } from './booking.types.js';
import type { BookingStatus } from './booking.constants.js';

const DAY_MS = 24 * 60 * 60_000;

/** The provider can only write session notes / photos while actively working the booking. */
const PROVIDER_EDITABLE_STATUSES: BookingStatus[] = [
  BOOKING_STATUSES.ACCEPTED,
  BOOKING_STATUSES.ON_THE_WAY,
  BOOKING_STATUSES.STARTED,
];

function assertTransition(current: BookingStatus, next: BookingStatus): void {
  if (!BOOKING_TRANSITIONS[current].includes(next)) {
    throw AppError.badRequest(`Cannot move booking from ${current} to ${next}`);
  }
}

/** Rejects any requested add-on whose name+price doesn't match an entry in the service's catalog,
 * so a client can't inject arbitrary add-on pricing at booking time. */
function assertAddOnsInCatalog(addOns: IBookingAddOn[], catalog: IBookingAddOn[]): void {
  for (const addOn of addOns) {
    const isValid = catalog.some((c) => c.name === addOn.name && c.price === addOn.price);
    if (!isValid) {
      throw AppError.badRequest(
        `Add-on "${addOn.name}" at price ${addOn.price} is not offered by this service`,
      );
    }
  }
}

const ALL_STATUSES: string[] = Object.values(BOOKING_STATUSES);

/** Parses the "status" query param (single value or comma-separated list, e.g. an "Upcoming"
 * filter sent as "PENDING,ACCEPTED,ON_THE_WAY,STARTED") and the from/to date-range params shared
 * by both `GET /bookings/me` and `GET /bookings/provider/me`. */
function parseBookingListQuery(query: ListBookingsQuery): {
  statuses: string[] | undefined;
  dateRange: { from?: Date; to?: Date };
} {
  let statuses: string[] | undefined;
  if (query.status) {
    statuses = query.status.split(',').map((value) => value.trim());
    for (const value of statuses) {
      if (!ALL_STATUSES.includes(value)) {
        throw AppError.badRequest(`Invalid status "${value}"`);
      }
    }
  }

  const dateRange: { from?: Date; to?: Date } = {};
  if (query.from) dateRange.from = new Date(`${query.from}T00:00:00.000Z`);
  if (query.to) dateRange.to = new Date(`${query.to}T23:59:59.999Z`);

  return { statuses, dateRange };
}

/** Same status/date filter as buildStatusDateFilter in booking.repository.ts, but for the
 * pet-taxi/pet-insurance/pet-relocation collections the "my bookings" aggregator merges in —
 * they key off `createdAt` (they have no scheduledStart) and are plain BaseRepository.findMany
 * filters rather than a bookingRepository-specific query. */
function buildOtherModuleFilter(
  userId: string,
  statuses: string[] | undefined,
  dateRange: { from?: Date; to?: Date },
): Record<string, unknown> {
  const filter: Record<string, unknown> = { userId };
  if (statuses && statuses.length > 0) {
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (dateRange.from || dateRange.to) {
    const createdAt: Record<string, Date> = {};
    if (dateRange.from) createdAt.$gte = dateRange.from;
    if (dateRange.to) createdAt.$lte = dateRange.to;
    filter.createdAt = createdAt;
  }
  return filter;
}

function assertBookingEditableByProvider(status: BookingStatus): void {
  if (!PROVIDER_EDITABLE_STATUSES.includes(status)) {
    throw AppError.badRequest(`Cannot update booking while it is ${status}`);
  }
}

/** Tries each cancellable non-SERVICE module in turn, matching what listMine merges. Only a
 * NOT_FOUND from a module means "wrong module, try the next one" — any other error (FORBIDDEN,
 * BAD_REQUEST) means the id *was* found there and must propagate, not be swallowed. */
async function cancelNonServiceBooking(
  bookingId: string,
  actorUserId: string,
  input: CancelBookingInput,
) {
  try {
    const booking = await petTaxiService.cancel(bookingId, actorUserId, input);
    return { ...booking, bookingType: 'PET_TAXI' as const };
  } catch (err) {
    if (!(err instanceof AppError) || err.code !== 'NOT_FOUND') throw err;
  }

  try {
    const request = await petRelocationService.cancel(bookingId, actorUserId, input);
    return { ...request, bookingType: 'PET_RELOCATION' as const };
  } catch (err) {
    if (!(err instanceof AppError) || err.code !== 'NOT_FOUND') throw err;
  }

  try {
    const application = await petInsuranceService.cancel(bookingId, actorUserId, input);
    return { ...application, bookingType: 'PET_INSURANCE' as const };
  } catch (err) {
    if (!(err instanceof AppError) || err.code !== 'NOT_FOUND') throw err;
  }

  throw AppError.notFound('Booking not found');
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

    assertAddOnsInCatalog(input.addOns, service.addOnCatalog);
    const addOnsTotal = input.addOns.reduce((sum, addOn) => sum + addOn.price, 0);

    const scheduledStart = input.scheduledStart;
    const scheduledEnd = input.durationDays
      ? new Date(scheduledStart.getTime() + input.durationDays * DAY_MS)
      : new Date(scheduledStart.getTime() + service.durationMinutes * 60_000);

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

    const totalPrice = service.price + addOnsTotal;
    const commissionPercent = provider.commissionPercent ?? env.DEFAULT_PLATFORM_COMMISSION_PERCENT;
    const { commissionAmount, providerPayoutAmount } = computeAmounts(
      totalPrice,
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
      price: totalPrice,
      currency: env.CURRENCY,
      couponCode: appliedCoupon?.code ?? null,
      discountAmount,
      commissionPercent,
      commissionAmount,
      providerPayoutAmount,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      notes: input.notes,
      addOns: input.addOns,
      durationDays: input.durationDays ?? null,
      dropOffTime: input.dropOffTime ?? null,
      pickupTime: input.pickupTime ?? null,
      consultationMode: input.consultationMode ?? null,
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

    return await toOwnerBookingView(booking);
  },

  async getById(bookingId: string, userId: string, role: Role) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound('Booking not found');

    if (role === ROLES.SUPER_ADMIN) return toOwnerBookingView(booking);
    if (booking.userId.toString() === userId) return toOwnerBookingView(booking);

    if (role === ROLES.SERVICE_PROVIDER) {
      const provider = await requireProviderProfile(userId);
      if (booking.providerId.toString() === provider._id.toString()) {
        return await toProviderBookingView(booking);
      }
    }

    throw AppError.forbidden('You do not have access to this booking');
  },

  /** "My bookings" for a user spans four separate collections (service bookings, pet-taxi,
   * pet-insurance, pet-relocation) that each used to have their own /me endpoint. This merges
   * all four into one list so the app doesn't have to call four endpoints to render one screen.
   * status/from/to filter every collection by its own `status`/`createdAt` field — a status
   * token that doesn't exist in a given collection's vocabulary (e.g. "PENDING" against
   * pet-insurance, which only ever has SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED) simply excludes
   * that collection's items rather than matching them, so an "Upcoming" filter never leaks a
   * CANCELLED or SUBMITTED item into the list. */
  async listMine(userId: string, query: ListBookingsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { statuses, dateRange } = parseBookingListQuery(query);
    const otherModuleFilter = buildOtherModuleFilter(userId, statuses, dateRange);

    const [serviceBookings, petTaxiBookings, insuranceApplications, relocationRequests] =
      await Promise.all([
        bookingRepository.findAllForUser(userId, statuses, dateRange),
        petTaxiRepository.findMany(otherModuleFilter, { sort: { createdAt: -1 } }),
        petInsuranceRepository.findMany(otherModuleFilter, { sort: { createdAt: -1 } }),
        relocationRequestRepository.findMany(otherModuleFilter, { sort: { createdAt: -1 } }),
      ]);

    const merged = [
      ...(await Promise.all(serviceBookings.map(toOwnerBookingView))).map((booking) => ({
        ...booking,
        bookingType: 'SERVICE' as const,
      })),
      ...(await Promise.all(petTaxiBookings.map(toPetTaxiBookingDto))).map((booking) => ({
        ...booking,
        bookingType: 'PET_TAXI' as const,
      })),
      ...insuranceApplications.map((application) => ({
        ...toInsuranceApplicationDto(application),
        bookingType: 'PET_INSURANCE' as const,
      })),
      ...relocationRequests.map((request) => ({
        ...toRelocationRequestDto(request),
        bookingType: 'PET_RELOCATION' as const,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // ponytail: fetches every matching row per module and paginates the merged list in memory —
    // fine at personal "my bookings" volume; move to a real cross-collection query/view if this
    // ever needs to page through thousands of rows per user.
    const total = merged.length;
    const bookings = merged.slice(skip, skip + limit);
    return { bookings, total, page, limit };
  },

  async listForProvider(providerUserId: string, query: ListBookingsQuery) {
    const provider = await requireProviderProfile(providerUserId);
    const { page, limit, skip } = parsePagination(query);
    const { statuses, dateRange } = parseBookingListQuery(query);
    const { items, total } = await bookingRepository.findForProvider(
      provider._id.toString(),
      statuses,
      dateRange,
      skip,
      limit,
    );
    return { bookings: await Promise.all(items.map(toProviderBookingView)), total, page, limit };
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

    return await toProviderBookingView(booking);
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

    return await toProviderBookingView(booking);
  },

  async verifyStartOtp(bookingId: string, providerUserId: string, code: string) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertTransition(booking.status, BOOKING_STATUSES.STARTED);
    if (booking.otpStart !== code) throw AppError.badRequest('Invalid start OTP');

    booking.status = BOOKING_STATUSES.STARTED;
    booking.otpStartVerifiedAt = new Date();
    booking.walkStats = null;
    await booking.save();

    tryGetSocketServer()
      ?.to(`booking:${bookingId}`)
      .emit(WALK_SOCKET_EVENTS.STARTED, { bookingId });

    return await toProviderBookingView(booking);
  },

  /** Provider's app pushes a live tick (distance/steps/calories) while the walk is in progress;
   * persisted so the owner's app has a snapshot on load, and broadcast to whoever is watching. */
  async updateWalkStats(
    bookingId: string,
    providerUserId: string,
    stats: { distanceMeters: number; durationSeconds: number; steps: number; calories: number },
  ) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    if (booking.status !== BOOKING_STATUSES.STARTED) {
      throw AppError.badRequest('Walk tracking is only available while the booking is in progress');
    }

    booking.walkStats = { ...stats, updatedAt: new Date() };
    await booking.save();

    tryGetSocketServer()
      ?.to(`booking:${bookingId}`)
      .emit(WALK_SOCKET_EVENTS.UPDATE, { bookingId, ...booking.walkStats });
  },

  async verifyEndOtp(
    bookingId: string,
    providerUserId: string,
    code: string,
    location: { lat: number; lng: number },
  ) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertTransition(booking.status, BOOKING_STATUSES.COMPLETED);
    if (booking.otpEnd !== code) throw AppError.badRequest('Invalid end OTP');

    const owner = await UserModel.findById(booking.userId).select('addresses').lean();
    const serviceAddress = owner?.addresses.find((address) => address.isDefault) ?? null;
    if (!serviceAddress) throw AppError.badRequest('No service address found for this booking');

    const distanceMeters = haversineMeters(
      [location.lng, location.lat],
      serviceAddress.location.coordinates,
    );
    if (distanceMeters > OTP_END_LOCATION_RADIUS_METERS) {
      throw AppError.badRequest('You must be at the service location to verify the end OTP');
    }

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

    tryGetSocketServer()
      ?.to(`booking:${bookingId}`)
      .emit(WALK_SOCKET_EVENTS.ENDED, { bookingId, walkStats: booking.walkStats });

    await notificationService.notify({
      userId: booking.userId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
      title: 'Service completed',
      body: 'Your service is complete. Please rate your experience.',
      data: { bookingId: booking._id.toString() },
    });

    await referralService.onFirstBookingCompleted(booking.userId.toString());

    return await toProviderBookingView(booking);
  },

  async updateProviderNotes(
    bookingId: string,
    providerUserId: string,
    input: UpdateProviderNotesInput,
  ) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertBookingEditableByProvider(booking.status);
    booking.providerNotes = input.notes;
    await booking.save();
    return await toProviderBookingView(booking);
  },

  async addPhoto(bookingId: string, providerUserId: string, input: AddBookingPhotoInput) {
    const booking = await requireBookingForProvider(bookingId, providerUserId);
    assertBookingEditableByProvider(booking.status);
    booking.photos.push({ url: input.url, phase: input.phase, uploadedAt: new Date() });
    await booking.save();
    return await toProviderBookingView(booking);
  },

  /** Single cancel entry point for the merged "my bookings" list (see listMine): the id can belong
   * to any of the cancellable booking types, so this tries the SERVICE collection first and falls
   * back to pet-taxi rather than making the client know which module owns the id. Pet-insurance has
   * no CANCELLED state and pet-relocation cancellation is admin-only, so neither applies here. */
  async cancel(bookingId: string, actorUserId: string, actorRole: Role, input: CancelBookingInput) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      return await cancelNonServiceBooking(bookingId, actorUserId, input);
    }

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

    return { ...(await toOwnerBookingView(booking)), bookingType: 'SERVICE' as const };
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
