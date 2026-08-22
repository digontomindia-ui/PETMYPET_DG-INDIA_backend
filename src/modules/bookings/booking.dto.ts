import type { z } from 'zod';
import type {
  addBookingPhotoSchema,
  cancelBookingSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  updateProviderNotesSchema,
  verifyOtpSchema,
} from './booking.validators.js';

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
export type UpdateProviderNotesInput = z.infer<typeof updateProviderNotesSchema>;
export type AddBookingPhotoInput = z.infer<typeof addBookingPhotoSchema>;
