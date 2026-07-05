import type { z } from 'zod';
import type {
  createBannerSchema,
  listAuditLogsQuerySchema,
  updateBannerSchema,
  upsertFeatureFlagSchema,
  upsertSettingSchema,
} from './admin.validators.js';

export type UpsertFeatureFlagInput = z.infer<typeof upsertFeatureFlagSchema>;
export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
