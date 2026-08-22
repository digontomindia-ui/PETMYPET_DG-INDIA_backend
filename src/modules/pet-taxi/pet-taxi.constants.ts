export const PET_TAXI_MODEL_NAME = 'PetTaxiBooking';

export const PET_TAXI_TRIP_TYPES = { ONE_WAY: 'ONE_WAY', ROUND_TRIP: 'ROUND_TRIP' } as const;

export type PetTaxiTripType = (typeof PET_TAXI_TRIP_TYPES)[keyof typeof PET_TAXI_TRIP_TYPES];

/** Fixed prices (INR) shown in the booking UI. Server-computed — never accepted from the client. */
export const PET_TAXI_RATES: Record<PetTaxiTripType, number> = {
  ONE_WAY: 499,
  ROUND_TRIP: 899,
};

export const PET_TAXI_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type PetTaxiStatus = (typeof PET_TAXI_STATUSES)[keyof typeof PET_TAXI_STATUSES];
