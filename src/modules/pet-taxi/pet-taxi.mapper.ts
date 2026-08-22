import type { IPetTaxiBooking } from './pet-taxi.types.js';

export function toPetTaxiBookingDto(booking: IPetTaxiBooking) {
  return {
    id: booking._id.toString(),
    userId: booking.userId.toString(),
    tripType: booking.tripType,
    petIds: booking.petIds.map((petId) => petId.toString()),
    pickupAddress: booking.pickupAddress,
    dropAddress: booking.dropAddress,
    pickupDate: booking.pickupDate,
    pickupTime: booking.pickupTime,
    price: booking.price,
    currency: booking.currency,
    status: booking.status,
    cancellationReason: booking.cancellationReason,
    createdAt: booking.createdAt,
  };
}
