import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { adminController } from './admin.controller.js';
import {
  adminListBookingsQuerySchema,
  adminListPayoutsQuerySchema,
  adminListProvidersQuerySchema,
  adminListReviewsQuerySchema,
  markPayoutPaidSchema,
  rejectPayoutSchema,
  setProviderStatusSchema,
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
 *       200:
 *         description: Dashboard overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 totalUsers: 15234
 *                 totalProviders: 842
 *                 totalBookings: 30456
 *                 activeBookings: 128
 *                 completedBookings: 28901
 *                 totalRevenue: 4523890
 *                 totalOrders: 6120
 *                 pendingModeration:
 *                   providerKyc: 14
 *                   communityReports: 6
 *                   lostAndFoundPosts: 3
 *                   openSupportTickets: 21
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       200:
 *         description: Feature flags listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   key: enable_wallet
 *                   isEnabled: true
 *                   description: Enables the in-app wallet for pet owners
 *                   updatedAt: "2026-07-20T10:15:00.000Z"
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   key: new_booking_flow
 *                   isEnabled: false
 *                   description: Rollout of the redesigned booking flow
 *                   updatedAt: "2026-07-18T09:02:00.000Z"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       - { name: key, in: path, required: true, schema: { type: string }, example: new_booking_flow }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isEnabled]
 *             properties:
 *               isEnabled: { type: boolean }
 *               description: { type: string, maxLength: 500 }
 *           example:
 *             isEnabled: true
 *             description: Rollout of the redesigned booking flow to all cities
 *     responses:
 *       200:
 *         description: Feature flag upserted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Feature flag updated
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 key: new_booking_flow
 *                 isEnabled: true
 *                 description: Rollout of the redesigned booking flow to all cities
 *                 updatedAt: "2026-08-04T09:30:00.000Z"
 *       400:
 *         description: Request body failed validation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: VALIDATION_ERROR, message: Validation failed }
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       200:
 *         description: Settings listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   key: max_booking_radius_km
 *                   value: 25
 *                   description: Maximum distance a provider can be matched from a booking
 *                   updatedAt: "2026-07-15T08:00:00.000Z"
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0e2
 *                   key: support_email
 *                   value: support@petmypet.in
 *                   description: Public support contact email
 *                   updatedAt: "2026-06-30T11:45:00.000Z"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       - { name: key, in: path, required: true, schema: { type: string }, example: max_booking_radius_km }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value: {}
 *               description: { type: string, maxLength: 500 }
 *           example:
 *             value: 30
 *             description: Maximum distance a provider can be matched from a booking
 *     responses:
 *       200:
 *         description: Setting upserted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Setting updated
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                 key: max_booking_radius_km
 *                 value: 30
 *                 description: Maximum distance a provider can be matched from a booking
 *                 updatedAt: "2026-08-04T09:31:00.000Z"
 *       400:
 *         description: Request body failed validation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: VALIDATION_ERROR, message: Validation failed }
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       200:
 *         description: Banners listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0f1
 *                   title: Monsoon Grooming Offer
 *                   imageUrl: https://res.cloudinary.com/petmypet/image/upload/v1/banners/monsoon-grooming.jpg
 *                   linkUrl: https://petmypet.in/offers/monsoon-grooming
 *                   order: 1
 *                   isActive: true
 *                   startAt: "2026-07-01T00:00:00.000Z"
 *                   endAt: "2026-08-31T23:59:59.000Z"
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0f2
 *                   title: New Year Vet Checkup
 *                   imageUrl: https://res.cloudinary.com/petmypet/image/upload/v1/banners/vet-checkup.jpg
 *                   linkUrl: null
 *                   order: 2
 *                   isActive: false
 *                   startAt: "2026-01-01T00:00:00.000Z"
 *                   endAt: "2026-01-15T23:59:59.000Z"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
 */
adminRoutes.get('/banners', ...adminOnly, adminController.listAllBanners);
/**
 * @openapi
 * /admin/banners:
 *   post:
 *     tags: [Admin]
 *     summary: Create a promotional banner (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, imageUrl]
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 200 }
 *               imageUrl: { type: string, format: uri }
 *               linkUrl: { type: string, format: uri }
 *               order: { type: integer, default: 0 }
 *               startAt: { type: string, format: date-time }
 *               endAt: { type: string, format: date-time }
 *           example:
 *             title: Monsoon Grooming Offer
 *             imageUrl: https://res.cloudinary.com/petmypet/image/upload/v1/banners/monsoon-grooming.jpg
 *             linkUrl: https://petmypet.in/offers/monsoon-grooming
 *             order: 1
 *             startAt: "2026-07-01T00:00:00.000Z"
 *             endAt: "2026-08-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Banner created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Banner created
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0f1
 *                 title: Monsoon Grooming Offer
 *                 imageUrl: https://res.cloudinary.com/petmypet/image/upload/v1/banners/monsoon-grooming.jpg
 *                 linkUrl: https://petmypet.in/offers/monsoon-grooming
 *                 order: 1
 *                 isActive: true
 *                 startAt: "2026-07-01T00:00:00.000Z"
 *                 endAt: "2026-08-31T23:59:59.000Z"
 *       400:
 *         description: Request body failed validation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: VALIDATION_ERROR, message: Validation failed }
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0f1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 1, maxLength: 200 }
 *               imageUrl: { type: string, format: uri }
 *               linkUrl: { type: string, format: uri }
 *               order: { type: integer }
 *               startAt: { type: string, format: date-time }
 *               endAt: { type: string, format: date-time }
 *               isActive: { type: boolean }
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: Banner updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Banner updated
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0f1
 *                 title: Monsoon Grooming Offer
 *                 imageUrl: https://res.cloudinary.com/petmypet/image/upload/v1/banners/monsoon-grooming.jpg
 *                 linkUrl: https://petmypet.in/offers/monsoon-grooming
 *                 order: 1
 *                 isActive: false
 *                 startAt: "2026-07-01T00:00:00.000Z"
 *                 endAt: "2026-08-31T23:59:59.000Z"
 *       400:
 *         description: Request body or id failed validation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: VALIDATION_ERROR, message: Validation failed }
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0f1 }
 *     responses:
 *       200:
 *         description: Banner deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Banner deleted
 *               data: null
 *       400:
 *         description: Id failed validation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: VALIDATION_ERROR, message: Validation failed }
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
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
 *       - { name: entityType, in: query, schema: { type: string }, example: Banner }
 *       - { name: actorId, in: query, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0a1 }
 *       - { name: page, in: query, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, schema: { type: string }, example: "20" }
 *     responses:
 *       200:
 *         description: Audit logs listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0a9
 *                   actorId: 64f1a2b3c4d5e6f7a8b9c0a1
 *                   action: SETTING_UPDATED
 *                   entityType: Setting
 *                   entityId: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   metadata: { key: max_booking_radius_km, previousValue: 25, newValue: 30 }
 *                   createdAt: "2026-08-04T09:31:00.000Z"
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0aa
 *                   actorId: 64f1a2b3c4d5e6f7a8b9c0a1
 *                   action: FEATURE_FLAG_UPDATED
 *                   entityType: FeatureFlag
 *                   entityId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   metadata: { key: new_booking_flow, isEnabled: true }
 *                   createdAt: "2026-08-04T09:30:00.000Z"
 *               meta: { page: 1, limit: 20, total: 2, totalPages: 1 }
 *       400:
 *         description: Query params failed validation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: VALIDATION_ERROR, message: Validation failed }
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Authentication required }
 *       403:
 *         description: Authenticated user is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: You do not have permission to perform this action }
 */
adminRoutes.get(
  '/audit-logs',
  ...adminOnly,
  validate({ query: listAuditLogsQuerySchema }),
  adminController.listAuditLogs,
);

/**
 * @openapi
 * /admin/providers:
 *   get:
 *     tags: [Admin]
 *     summary: Provider directory (all providers, any KYC state) with owner contact
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: providerType, in: query, schema: { type: string } }
 *       - { name: kycStatus, in: query, schema: { type: string, enum: [PENDING, APPROVED, REJECTED] } }
 *       - { name: isActive, in: query, schema: { type: string, enum: ["true", "false"] } }
 *       - { name: search, in: query, schema: { type: string }, description: Business name contains }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated providers }
 */
adminRoutes.get(
  '/providers',
  ...adminOnly,
  validate({ query: adminListProvidersQuerySchema }),
  adminController.listProviders,
);

/**
 * @openapi
 * /admin/providers/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Full provider view — KYC documents, masked bank, owner, booking/earnings stats
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Provider }
 *       404: { description: Not found }
 */
adminRoutes.get('/providers/:id', ...adminOnly, validate({ params: idParamSchema }), adminController.getProvider);

/**
 * @openapi
 * /admin/providers/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Suspend (isActive false) or reactivate a provider — a suspended provider can't switch themselves back on
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [isActive], properties: { isActive: { type: boolean }, reason: { type: string } } }
 *     responses:
 *       200: { description: Updated provider }
 */
adminRoutes.patch(
  '/providers/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: setProviderStatusSchema }),
  adminController.setProviderStatus,
);

/**
 * @openapi
 * /admin/bookings:
 *   get:
 *     tags: [Admin]
 *     summary: All service bookings with customer/provider/service/pet names. Detail = GET /bookings/{id}, cancel = PATCH /bookings/{id}/cancel, refund = POST /payments/bookings/{id}/refund
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: status, in: query, schema: { type: string }, description: "Comma-separated, e.g. PENDING,ACCEPTED" }
 *       - { name: paymentStatus, in: query, schema: { type: string, enum: [PENDING, PAID, FAILED, REFUNDED] } }
 *       - { name: providerId, in: query, schema: { type: string } }
 *       - { name: userId, in: query, schema: { type: string } }
 *       - { name: from, in: query, schema: { type: string, example: "2026-09-01" } }
 *       - { name: to, in: query, schema: { type: string, example: "2026-09-30" } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated bookings }
 */
adminRoutes.get(
  '/bookings',
  ...adminOnly,
  validate({ query: adminListBookingsQuerySchema }),
  adminController.listBookings,
);

/**
 * @openapi
 * /admin/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: Provider reviews for moderation (with provider reply)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: providerId, in: query, schema: { type: string } }
 *       - { name: rating, in: query, schema: { type: string, enum: ["1","2","3","4","5"] } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated reviews }
 */
adminRoutes.get('/reviews', ...adminOnly, validate({ query: adminListReviewsQuerySchema }), adminController.listReviews);

/**
 * @openapi
 * /admin/reviews/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete an abusive/fake review; the provider's rating is recomputed
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
adminRoutes.delete('/reviews/:id', ...adminOnly, validate({ params: idParamSchema }), adminController.deleteReview);

/**
 * @openapi
 * /admin/payouts:
 *   get:
 *     tags: [Admin]
 *     summary: Provider withdrawal requests (oldest first) — includes the full bank account number for the transfer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: status, in: query, schema: { type: string, enum: [REQUESTED, PAID, REJECTED] } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated payouts }
 */
adminRoutes.get('/payouts', ...adminOnly, validate({ query: adminListPayoutsQuerySchema }), adminController.listPayouts);

/**
 * @openapi
 * /admin/payouts/{id}/mark-paid:
 *   patch:
 *     tags: [Admin]
 *     summary: Record that the bank transfer was made (UTR/reference number); notifies the provider
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [referenceNumber], properties: { referenceNumber: { type: string }, note: { type: string } } }
 *     responses:
 *       200: { description: Payout PAID }
 *       400: { description: Already settled }
 */
adminRoutes.patch(
  '/payouts/:id/mark-paid',
  ...adminOnly,
  validate({ params: idParamSchema, body: markPayoutPaidSchema }),
  adminController.markPayoutPaid,
);

/**
 * @openapi
 * /admin/payouts/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject a withdrawal — amount is credited back to the provider's wallet
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [reason], properties: { reason: { type: string } } }
 *     responses:
 *       200: { description: Payout REJECTED }
 */
adminRoutes.patch(
  '/payouts/:id/reject',
  ...adminOnly,
  validate({ params: idParamSchema, body: rejectPayoutSchema }),
  adminController.rejectPayout,
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
 *       200:
 *         description: Feature flags listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   key: enable_wallet
 *                   isEnabled: true
 *                   description: Enables the in-app wallet for pet owners
 *                   updatedAt: "2026-07-20T10:15:00.000Z"
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   key: new_booking_flow
 *                   isEnabled: true
 *                   description: Rollout of the redesigned booking flow to all cities
 *                   updatedAt: "2026-08-04T09:30:00.000Z"
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
 *       200:
 *         description: Active banners listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0f1
 *                   title: Monsoon Grooming Offer
 *                   imageUrl: https://res.cloudinary.com/petmypet/image/upload/v1/banners/monsoon-grooming.jpg
 *                   linkUrl: https://petmypet.in/offers/monsoon-grooming
 *                   order: 1
 *                   isActive: true
 *                   startAt: "2026-07-01T00:00:00.000Z"
 *                   endAt: "2026-08-31T23:59:59.000Z"
 */
publicBannerRoutes.get('/', adminController.listActiveBanners);
