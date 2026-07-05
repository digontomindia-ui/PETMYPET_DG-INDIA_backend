import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { availabilityController } from './availability.controller.js';
import { getAvailabilityQuerySchema } from './availability.validators.js';

export const availabilityRoutes = Router();

availabilityRoutes.get(
  '/',
  validate({ query: getAvailabilityQuerySchema }),
  availabilityController.getSlots,
);
