import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { couponController } from './coupon.controller.js';
import {
  createCouponSchema,
  idParamSchema,
  listRedemptionsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupon.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const couponRoutes = Router();

/**
 * @openapi
 * /coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Validate a coupon code for a booking amount
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, bookingAmount]
 *             properties:
 *               code: { type: string, example: "WELCOME50" }
 *               bookingAmount: { type: number, example: 999 }
 *               providerType: { type: string, example: "GROOMER" }
 *           example:
 *             code: "WELCOME50"
 *             bookingAmount: 999
 *             providerType: "GROOMER"
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 couponId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 code: "WELCOME50"
 *                 discountAmount: 300
 *       400:
 *         description: Validation error or coupon not applicable
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Coupon requires a minimum booking amount of 200"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
couponRoutes.post(
  '/validate',
  authenticate,
  validate({ body: validateCouponSchema }),
  couponController.validate,
);

/**
 * @openapi
 * /coupons/me/redemptions:
 *   get:
 *     tags: [Coupons]
 *     summary: Get the authenticated user's own coupon redemption history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, required: false, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, required: false, schema: { type: string }, example: "20" }
 *     responses:
 *       200:
 *         description: List of the caller's coupon redemptions
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                   couponId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   code: "WELCOME50"
 *                   bookingId: "64f1a2b3c4d5e6f7a8b9c0e5"
 *                   discountAmount: 300
 *                   redeemedAt: "2026-08-10T12:00:00.000Z"
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 1
 *                 totalPages: 1
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "limit must be a valid number"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
couponRoutes.get(
  '/me/redemptions',
  authenticate,
  validate({ query: listRedemptionsQuerySchema }),
  couponController.listMyRedemptions,
);

/**
 * @openapi
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: List all coupons (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, required: false, schema: { type: integer, default: 1 }, example: 1 }
 *       - { name: limit, in: query, required: false, schema: { type: integer, default: 20 }, example: 20 }
 *     responses:
 *       200:
 *         description: List of coupons
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   code: "WELCOME50"
 *                   description: "50% off your first grooming booking"
 *                   discountType: "PERCENTAGE"
 *                   discountValue: 50
 *                   maxDiscountAmount: 300
 *                   minBookingAmount: 200
 *                   usageLimit: 1000
 *                   usageCount: 42
 *                   perUserLimit: 1
 *                   applicableProviderTypes: ["GROOMER"]
 *                   validFrom: "2026-08-01T00:00:00.000Z"
 *                   validUntil: "2026-12-31T23:59:59.000Z"
 *                   isActive: true
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 1
 *                 totalPages: 1
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
couponRoutes.get('/', ...adminOnly, couponController.list);
/**
 * @openapi
 * /coupons/{id}:
 *   get:
 *     tags: [Coupons]
 *     summary: Get a coupon by id (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d2" }
 *     responses:
 *       200:
 *         description: Coupon details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 code: "WELCOME50"
 *                 description: "50% off your first grooming booking"
 *                 discountType: "PERCENTAGE"
 *                 discountValue: 50
 *                 maxDiscountAmount: 300
 *                 minBookingAmount: 200
 *                 usageLimit: 1000
 *                 usageCount: 42
 *                 perUserLimit: 1
 *                 applicableProviderTypes: ["GROOMER"]
 *                 validFrom: "2026-08-01T00:00:00.000Z"
 *                 validUntil: "2026-12-31T23:59:59.000Z"
 *                 isActive: true
 *       400:
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
couponRoutes.get(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  couponController.getById,
);
/**
 * @openapi
 * /coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create a new coupon (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue, validFrom, validUntil]
 *             properties:
 *               code: { type: string, example: "WELCOME50" }
 *               description: { type: string, example: "50% off your first grooming booking" }
 *               discountType: { type: string, enum: [PERCENTAGE, FLAT], example: "PERCENTAGE" }
 *               discountValue: { type: number, example: 50 }
 *               maxDiscountAmount: { type: number, example: 300 }
 *               minBookingAmount: { type: number, example: 200 }
 *               usageLimit: { type: integer, example: 1000 }
 *               perUserLimit: { type: integer, example: 1 }
 *               applicableProviderTypes:
 *                 type: array
 *                 items: { type: string, enum: [VET, GROOMER, BOARDING, PET_WALKER, TRAINER, CLEANER, PHARMACY, RELOCATION, OTHER] }
 *                 example: ["GROOMER"]
 *               validFrom: { type: string, format: date-time, example: "2026-08-01T00:00:00.000Z" }
 *               validUntil: { type: string, format: date-time, example: "2026-12-31T23:59:59.000Z" }
 *           example:
 *             code: "WELCOME50"
 *             description: "50% off your first grooming booking"
 *             discountType: "PERCENTAGE"
 *             discountValue: 50
 *             maxDiscountAmount: 300
 *             minBookingAmount: 200
 *             usageLimit: 1000
 *             perUserLimit: 1
 *             applicableProviderTypes: ["GROOMER"]
 *             validFrom: "2026-08-01T00:00:00.000Z"
 *             validUntil: "2026-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Coupon created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Coupon created"
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 code: "WELCOME50"
 *                 description: "50% off your first grooming booking"
 *                 discountType: "PERCENTAGE"
 *                 discountValue: 50
 *                 maxDiscountAmount: 300
 *                 minBookingAmount: 200
 *                 usageLimit: 1000
 *                 usageCount: 0
 *                 perUserLimit: 1
 *                 applicableProviderTypes: ["GROOMER"]
 *                 validFrom: "2026-08-01T00:00:00.000Z"
 *                 validUntil: "2026-12-31T23:59:59.000Z"
 *                 isActive: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "validUntil must be after validFrom"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
couponRoutes.post(
  '/',
  ...adminOnly,
  validate({ body: createCouponSchema }),
  couponController.create,
);
/**
 * @openapi
 * /coupons/{id}:
 *   put:
 *     tags: [Coupons]
 *     summary: Update a coupon (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d2" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string, example: "60% off your first grooming booking" }
 *               maxDiscountAmount: { type: number, example: 350 }
 *               minBookingAmount: { type: number, example: 250 }
 *               usageLimit: { type: integer, example: 2000 }
 *               perUserLimit: { type: integer, example: 2 }
 *               validUntil: { type: string, format: date-time, example: "2027-01-31T23:59:59.000Z" }
 *               isActive: { type: boolean, example: true }
 *           example:
 *             description: "60% off your first grooming booking"
 *             maxDiscountAmount: 350
 *             minBookingAmount: 250
 *             usageLimit: 2000
 *             perUserLimit: 2
 *             validUntil: "2027-01-31T23:59:59.000Z"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Coupon updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Coupon updated"
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 code: "WELCOME50"
 *                 description: "60% off your first grooming booking"
 *                 discountType: "PERCENTAGE"
 *                 discountValue: 50
 *                 maxDiscountAmount: 350
 *                 minBookingAmount: 250
 *                 usageLimit: 2000
 *                 usageCount: 42
 *                 perUserLimit: 2
 *                 applicableProviderTypes: ["GROOMER"]
 *                 validFrom: "2026-08-01T00:00:00.000Z"
 *                 validUntil: "2027-01-31T23:59:59.000Z"
 *                 isActive: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
couponRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateCouponSchema }),
  couponController.update,
);
/**
 * @openapi
 * /coupons/{id}:
 *   delete:
 *     tags: [Coupons]
 *     summary: Delete a coupon (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d2" }
 *     responses:
 *       200:
 *         description: Coupon deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Coupon deleted"
 *               data: null
 *       400:
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
couponRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  couponController.remove,
);
