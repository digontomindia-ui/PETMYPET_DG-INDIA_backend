import type { z } from 'zod';
import type { cancelPetTaxiBookingSchema, createPetTaxiBookingSchema } from './pet-taxi.validators.js';

export type CreatePetTaxiBookingInput = z.infer<typeof createPetTaxiBookingSchema>;
export type CancelPetTaxiBookingInput = z.infer<typeof cancelPetTaxiBookingSchema>;
