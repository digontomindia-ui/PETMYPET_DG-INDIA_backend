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
 *       200:
 *         description: Overview stats retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 totalUsers: 5420
 *                 totalProviders: 312
 *                 totalBookings: 8930
 *                 activeBookings: 47
 *                 completedBookings: 8210
 *                 totalRevenue: 2145600
 *                 totalOrders: 1560
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: from
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "2026-07-01"
 *       - name: to
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "2026-08-01"
 *     responses:
 *       200:
 *         description: Bookings by day retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - { date: "2026-07-30", count: 42 }
 *                 - { date: "2026-07-31", count: 51 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: from
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "2026-07-01"
 *       - name: to
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "2026-08-01"
 *     responses:
 *       200:
 *         description: Revenue by day retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - { date: "2026-07-30", revenue: 48500 }
 *                 - { date: "2026-07-31", revenue: 61200 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: from
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "2026-07-01"
 *       - name: to
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "2026-08-01"
 *     responses:
 *       200:
 *         description: User growth stats retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - { date: "2026-07-30", newUsers: 18 }
 *                 - { date: "2026-07-31", newUsers: 24 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: limit
 *         in: query
 *         required: false
 *         schema: { type: string, default: "10" }
 *         example: "5"
 *     responses:
 *       200:
 *         description: Top services retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - { serviceId: "64f1a2b3c4d5e6f7a8b9c0a5", name: Full Grooming Package, price: 899, bookingCount: 214 }
 *                 - { serviceId: "64f1a2b3c4d5e6f7a8b9c0a6", name: At-Home Vet Checkup, price: 599, bookingCount: 178 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       200:
 *         description: Zone performance stats retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - { zoneId: "64f1a2b3c4d5e6f7a8b9c0f2", zoneName: Indiranagar, totalBookings: 412, totalRevenue: 318500 }
 *                 - { zoneId: "64f1a2b3c4d5e6f7a8b9c0f3", zoneName: Koramangala, totalBookings: 356, totalRevenue: 271900 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
analyticsRoutes.get('/zone-performance', analyticsController.zonePerformance);
