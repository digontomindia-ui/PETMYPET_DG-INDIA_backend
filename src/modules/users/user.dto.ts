import type { z } from 'zod';
import type {
  addressSchema,
  listUsersQuerySchema,
  registerDeviceTokenSchema,
  updateProfileSchema,
} from './user.validators.js';

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
