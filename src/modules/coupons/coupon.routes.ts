import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { couponController } from './coupon.controller.js';
import {
  createCouponSchema,
  idParamSchema,
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
 *     responses:
 *       200: { description: Coupon validation result }
 */
couponRoutes.post(
  '/validate',
  authenticate,
  validate({ body: validateCouponSchema }),
  couponController.validate,
);

/**
 * @openapi
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: List all coupons (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of coupons }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Coupon details }
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
 *     responses:
 *       201: { description: Coupon created }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Coupon updated }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Coupon deleted }
 */
couponRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  couponController.remove,
);
