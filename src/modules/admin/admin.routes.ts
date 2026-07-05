import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { adminController } from './admin.controller.js';
import {
  createBannerSchema,
  idParamSchema,
  keyParamSchema,
  listAuditLogsQuerySchema,
  updateBannerSchema,
  upsertFeatureFlagSchema,
  upsertSettingSchema,
} from './admin.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const adminRoutes = Router();

adminRoutes.get('/dashboard', ...adminOnly, adminController.getDashboard);

adminRoutes.get('/feature-flags', ...adminOnly, adminController.listFeatureFlags);
adminRoutes.put(
  '/feature-flags/:key',
  ...adminOnly,
  validate({ params: keyParamSchema, body: upsertFeatureFlagSchema }),
  adminController.upsertFeatureFlag,
);

adminRoutes.get('/settings', ...adminOnly, adminController.listSettings);
adminRoutes.put(
  '/settings/:key',
  ...adminOnly,
  validate({ params: keyParamSchema, body: upsertSettingSchema }),
  adminController.upsertSetting,
);

adminRoutes.get('/banners', ...adminOnly, adminController.listAllBanners);
adminRoutes.post(
  '/banners',
  ...adminOnly,
  validate({ body: createBannerSchema }),
  adminController.createBanner,
);
adminRoutes.put(
  '/banners/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateBannerSchema }),
  adminController.updateBanner,
);
adminRoutes.delete(
  '/banners/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  adminController.removeBanner,
);

adminRoutes.get(
  '/audit-logs',
  ...adminOnly,
  validate({ query: listAuditLogsQuerySchema }),
  adminController.listAuditLogs,
);

// Public read-only routers, mounted separately at top level (see routes/index.ts)
export const publicFeatureFlagRoutes = Router();
publicFeatureFlagRoutes.get('/', adminController.listFeatureFlags);

export const publicBannerRoutes = Router();
publicBannerRoutes.get('/', adminController.listActiveBanners);
