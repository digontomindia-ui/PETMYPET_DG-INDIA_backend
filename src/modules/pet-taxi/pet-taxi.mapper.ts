import { petRepository } from '../pets/pet.repository.js';
import type { IPetTaxiBooking } from './pet-taxi.types.js';

/** petIds alone forces the client to fetch each pet separately to render a name/photo; this
 * mirrors how service bookings resolve serviceName/serviceDescription in booking.mapper.ts. */
export async function toPetTaxiBookingDto(booking: IPetTaxiBooking) {
  const petIds = booking.petIds.map((petId) => petId.toString());
  const pets = await petRepository.findMany({ _id: { $in: petIds } });
  const petById = new Map(pets.map((pet) => [pet._id.toString(), pet]));

  return {
    id: booking._id.toString(),
    userId: booking.userId.toString(),
    tripType: booking.tripType,
    petIds,
    pets: petIds.map((petId) => {
      const pet = petById.get(petId);
      return {
        id: petId,
        name: pet?.name ?? '',
        breed: pet?.breed ?? '',
        avatarUrl: pet?.avatarUrl ?? null,
      };
    }),
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
