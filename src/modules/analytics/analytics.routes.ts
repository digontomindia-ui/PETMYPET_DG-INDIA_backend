import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { analyticsController } from './analytics.controller.js';
import { dateRangeQuerySchema, topServicesQuerySchema } from './analytics.validators.js';

export const analyticsRoutes = Router();

analyticsRoutes.use(authenticate, requireRole(ROLES.SUPER_ADMIN));

/**
 * @openapi
 * /analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Get platform overview stats (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Overview stats retrieved }
 */
analyticsRoutes.get('/overview', analyticsController.overview);
/**
 * @openapi
 * /analytics/bookings-by-day:
 *   get:
 *     tags: [Analytics]
 *     summary: Get booking counts by day (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: from, in: query, required: false, schema: { type: string } }
 *       - { name: to, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: Bookings by day retrieved }
 */
analyticsRoutes.get(
  '/bookings-by-day',
  validate({ query: dateRangeQuerySchema }),
  analyticsController.bookingsByDay,
);
/**
 * @openapi
 * /analytics/revenue-by-day:
 *   get:
 *     tags: [Analytics]
 *     summary: Get revenue by day (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: from, in: query, required: false, schema: { type: string } }
 *       - { name: to, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: Revenue by day retrieved }
 */
analyticsRoutes.get(
  '/revenue-by-day',
  validate({ query: dateRangeQuerySchema }),
  analyticsController.revenueByDay,
);
/**
 * @openapi
 * /analytics/user-growth:
 *   get:
 *     tags: [Analytics]
 *     summary: Get user growth stats (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: from, in: query, required: false, schema: { type: string } }
 *       - { name: to, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: User growth stats retrieved }
 */
analyticsRoutes.get(
  '/user-growth',
  validate({ query: dateRangeQuerySchema }),
  analyticsController.userGrowth,
);
/**
 * @openapi
 * /analytics/top-services:
 *   get:
 *     tags: [Analytics]
 *     summary: Get top-performing services (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: Top services retrieved }
 */
analyticsRoutes.get(
  '/top-services',
  validate({ query: topServicesQuerySchema }),
  analyticsController.topServices,
);
/**
 * @openapi
 * /analytics/zone-performance:
 *   get:
 *     tags: [Analytics]
 *     summary: Get zone performance stats (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Zone performance stats retrieved }
 */
analyticsRoutes.get('/zone-performance', analyticsController.zonePerformance);
