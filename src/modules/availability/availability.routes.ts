import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { availabilityController } from './availability.controller.js';
import { getAvailabilityQuerySchema } from './availability.validators.js';

export const availabilityRoutes = Router();

/**
 * @openapi
 * /availability:
 *   get:
 *     tags: [Availability]
 *     summary: Get a provider's free/busy time slots for a service on a given date
 *     parameters:
 *       - { name: providerId, in: query, required: true, schema: { type: string } }
 *       - { name: serviceId, in: query, required: true, schema: { type: string } }
 *       - { name: date, in: query, required: true, schema: { type: string, example: "2026-08-01" } }
 *     responses:
 *       200: { description: Slots for the given date }
 */
availabilityRoutes.get(
  '/',
  validate({ query: getAvailabilityQuerySchema }),
  availabilityController.getSlots,
);
