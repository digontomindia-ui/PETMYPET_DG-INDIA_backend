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

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get the aggregated platform dashboard overview (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard overview }
 */
adminRoutes.get('/dashboard', ...adminOnly, adminController.getDashboard);

/**
 * @openapi
 * /admin/feature-flags:
 *   get:
 *     tags: [Admin]
 *     summary: List all feature flags (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Feature flags listed }
 */
adminRoutes.get('/feature-flags', ...adminOnly, adminController.listFeatureFlags);
/**
 * @openapi
 * /admin/feature-flags/{key}:
 *   put:
 *     tags: [Admin]
 *     summary: Create or update a feature flag (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: key, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Feature flag upserted }
 */
adminRoutes.put(
  '/feature-flags/:key',
  ...adminOnly,
  validate({ params: keyParamSchema, body: upsertFeatureFlagSchema }),
  adminController.upsertFeatureFlag,
);

/**
 * @openapi
 * /admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: List all platform settings (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Settings listed }
 */
adminRoutes.get('/settings', ...adminOnly, adminController.listSettings);
/**
 * @openapi
 * /admin/settings/{key}:
 *   put:
 *     tags: [Admin]
 *     summary: Create or update a platform setting (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: key, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Setting upserted }
 */
adminRoutes.put(
  '/settings/:key',
  ...adminOnly,
  validate({ params: keyParamSchema, body: upsertSettingSchema }),
  adminController.upsertSetting,
);

/**
 * @openapi
 * /admin/banners:
 *   get:
 *     tags: [Admin]
 *     summary: List all banners, including inactive ones (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Banners listed }
 */
adminRoutes.get('/banners', ...adminOnly, adminController.listAllBanners);
/**
 * @openapi
 * /admin/banners:
 *   post:
 *     tags: [Admin]
 *     summary: Create a promotional banner (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Banner created }
 */
adminRoutes.post(
  '/banners',
  ...adminOnly,
  validate({ body: createBannerSchema }),
  adminController.createBanner,
);
/**
 * @openapi
 * /admin/banners/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a banner, e.g. to activate/deactivate it (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Banner updated }
 */
adminRoutes.put(
  '/banners/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateBannerSchema }),
  adminController.updateBanner,
);
/**
 * @openapi
 * /admin/banners/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a banner (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Banner deleted }
 */
adminRoutes.delete(
  '/banners/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  adminController.removeBanner,
);

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List the privileged-action audit trail (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: entityType, in: query, schema: { type: string } }
 *       - { name: actorId, in: query, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Audit logs listed }
 */
adminRoutes.get(
  '/audit-logs',
  ...adminOnly,
  validate({ query: listAuditLogsQuerySchema }),
  adminController.listAuditLogs,
);

// Public read-only routers, mounted separately at top level (see routes/index.ts)
export const publicFeatureFlagRoutes = Router();
/**
 * @openapi
 * /feature-flags:
 *   get:
 *     tags: [Admin]
 *     summary: Publicly list all feature flags (for client apps to gate rollouts)
 *     responses:
 *       200: { description: Feature flags listed }
 */
publicFeatureFlagRoutes.get('/', adminController.listFeatureFlags);

export const publicBannerRoutes = Router();
/**
 * @openapi
 * /banners:
 *   get:
 *     tags: [Admin]
 *     summary: Publicly list active, in-date-range promotional banners
 *     responses:
 *       200: { description: Active banners listed }
 */
publicBannerRoutes.get('/', adminController.listActiveBanners);
