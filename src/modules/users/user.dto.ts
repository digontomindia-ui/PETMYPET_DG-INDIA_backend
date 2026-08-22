import type { z } from 'zod';
import type {
  addressSchema,
  listUsersQuerySchema,
  registerDeviceTokenSchema,
  updateAddressSchema,
  updateProfileSchema,
} from './user.validators.js';

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
