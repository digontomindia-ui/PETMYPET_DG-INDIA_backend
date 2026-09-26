import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const upsertFeatureFlagSchema = z.object({
  isEnabled: z.boolean(),
  description: z.string().max(500).optional(),
});

export const upsertSettingSchema = z.object({
  value: z.unknown(),
  description: z.string().max(500).optional(),
});

export const createBannerSchema = z.object({
  type: z.enum(['image', 'stat']).default('image'),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).default(''),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  number: z.string().max(20).optional(),
  icon: z.string().url().optional(),
  order: z.number().int().default(0),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});

export const updateBannerSchema = createBannerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const listAuditLogsQuerySchema = z.object({
  entityType: z.string().optional(),
  actorId: objectIdSchema.optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const adminListPayoutsQuerySchema = z.object({
  status: z.enum(['REQUESTED', 'PAID', 'REJECTED']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const markPayoutPaidSchema = z.object({
  referenceNumber: z.string().trim().min(3).max(100),
  note: z.string().max(500).optional(),
});

export const rejectPayoutSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const keyParamSchema = z.object({ key: z.string().min(1).max(100) });
export const idParamSchema = z.object({ id: objectIdSchema });

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const adminListProvidersQuerySchema = z.object({
  providerType: z
    .enum(['VET', 'CLINIC', 'GROOMER', 'BOARDING', 'PET_WALKER', 'PET_SITTER', 'TRAINER', 'CLEANER', 'PHARMACY', 'RELOCATION', 'OTHER'])
    .optional(),
  kycStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const setProviderStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().max(500).optional(),
});

export const adminListBookingsQuerySchema = z.object({
  /** Comma-separated list, e.g. PENDING,ACCEPTED */
  status: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  providerId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const adminListReviewsQuerySchema = z.object({
  providerId: objectIdSchema.optional(),
  rating: z.enum(['1', '2', '3', '4', '5']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
