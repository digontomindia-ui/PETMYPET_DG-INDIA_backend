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

export const keyParamSchema = z.object({ key: z.string().min(1).max(100) });
export const idParamSchema = z.object({ id: objectIdSchema });
