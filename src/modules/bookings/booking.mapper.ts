import { serviceRepository } from '../services/service.repository.js';
import { BOOKING_STATUSES } from './booking.constants.js';
import type { BookingDocument, OwnerBookingView, PublicBookingBase } from './booking.types.js';

async function toBaseBooking(booking: BookingDocument): Promise<PublicBookingBase> {
  const service = await serviceRepository.findById(booking.serviceId.toString());

  return {
    id: booking._id.toString(),
    userId: booking.userId.toString(),
    petId: booking.petId ? booking.petId.toString() : null,
    providerId: booking.providerId.toString(),
    serviceId: booking.serviceId.toString(),
    serviceName: service?.name ?? '',
    serviceDescription: service?.description ?? '',
    zoneId: booking.zoneId ? booking.zoneId.toString() : null,
    scheduledStart: booking.scheduledStart,
    scheduledEnd: booking.scheduledEnd,
    status: booking.status,
    price: booking.price,
    currency: booking.currency,
    couponCode: booking.couponCode,
    discountAmount: booking.discountAmount,
    paymentStatus: booking.paymentStatus,
    cancelledBy: booking.cancelledBy,
    cancellationReason: booking.cancellationReason,
    notes: booking.notes,
    addOns: booking.addOns,
    durationDays: booking.durationDays,
    dropOffTime: booking.dropOffTime,
    pickupTime: booking.pickupTime,
    consultationMode: booking.consultationMode,
    providerNotes: booking.providerNotes,
    photos: booking.photos,
    walkStats: booking.walkStats,
    createdAt: booking.createdAt,
  };
}

/** The booking's own user needs to see the OTP codes to relay them to the provider in person. */
export async function toOwnerBookingView(booking: BookingDocument): Promise<OwnerBookingView> {
  const revealableStartStatuses: string[] = [
    BOOKING_STATUSES.ACCEPTED,
    BOOKING_STATUSES.ON_THE_WAY,
  ];
  const showStartOtp =
    !booking.otpStartVerifiedAt && revealableStartStatuses.includes(booking.status);
  const showEndOtp = !booking.otpEndVerifiedAt && booking.status === BOOKING_STATUSES.STARTED;

  return {
    ...(await toBaseBooking(booking)),
    otpStart: showStartOtp ? booking.otpStart : null,
    otpEnd: showEndOtp ? booking.otpEnd : null,
  };
}

/** The provider's view never exposes the raw OTP codes; they must ask the customer for them. */
export async function toProviderBookingView(booking: BookingDocument): Promise<PublicBookingBase> {
  return toBaseBooking(booking);
}
