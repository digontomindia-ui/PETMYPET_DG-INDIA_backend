import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { analyticsController } from './analytics.controller.js';
import { dateRangeQuerySchema, topServicesQuerySchema } from './analytics.validators.js';

export const analyticsRoutes = Router();

analyticsRoutes.use(authenticate, requireRole(ROLES.SUPER_ADMIN));

analyticsRoutes.get('/overview', analyticsController.overview);
analyticsRoutes.get(
  '/bookings-by-day',
  validate({ query: dateRangeQuerySchema }),
  analyticsController.bookingsByDay,
);
analyticsRoutes.get(
  '/revenue-by-day',
  validate({ query: dateRangeQuerySchema }),
  analyticsController.revenueByDay,
);
analyticsRoutes.get(
  '/user-growth',
  validate({ query: dateRangeQuerySchema }),
  analyticsController.userGrowth,
);
analyticsRoutes.get(
  '/top-services',
  validate({ query: topServicesQuerySchema }),
  analyticsController.topServices,
);
analyticsRoutes.get('/zone-performance', analyticsController.zonePerformance);
