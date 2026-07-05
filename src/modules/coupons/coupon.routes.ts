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

couponRoutes.post(
  '/validate',
  authenticate,
  validate({ body: validateCouponSchema }),
  couponController.validate,
);

couponRoutes.get('/', ...adminOnly, couponController.list);
couponRoutes.get(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  couponController.getById,
);
couponRoutes.post(
  '/',
  ...adminOnly,
  validate({ body: createCouponSchema }),
  couponController.create,
);
couponRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateCouponSchema }),
  couponController.update,
);
couponRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  couponController.remove,
);
