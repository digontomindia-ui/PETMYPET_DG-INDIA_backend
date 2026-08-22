import type { z } from 'zod';
import type {
  attendanceQuerySchema,
  createProviderProfileSchema,
  nearbyProvidersQuerySchema,
  providerAnalyticsQuerySchema,
  rejectKycSchema,
  setBankAccountSchema,
  updateProviderProfileSchema,
  uploadKycDocumentSchema,
} from './provider.validators.js';

export type CreateProviderProfileInput = z.infer<typeof createProviderProfileSchema>;
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;
export type UploadKycDocumentInput = z.infer<typeof uploadKycDocumentSchema>;
export type RejectKycInput = z.infer<typeof rejectKycSchema>;
export type NearbyProvidersQuery = z.infer<typeof nearbyProvidersQuerySchema>;
export type SetBankAccountInput = z.infer<typeof setBankAccountSchema>;
export type ProviderAnalyticsQuery = z.infer<typeof providerAnalyticsQuerySchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
