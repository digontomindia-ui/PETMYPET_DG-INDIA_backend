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
 *       - name: providerId
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "64f8b9c0d1e2f3a4b5c6d7e8"
 *       - name: serviceId
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "64f6f7a8b9c0d1e2f3a4b5c6"
 *       - name: date
 *         in: query
 *         required: true
 *         schema: { type: string, example: "2026-08-01" }
 *     responses:
 *       200:
 *         description: Slots for the given date
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
 *                 date: "2026-08-01"
 *                 slots:
 *                   - start: "2026-08-01T09:00:00.000Z"
 *                     end: "2026-08-01T09:45:00.000Z"
 *                     isAvailable: true
 *                   - start: "2026-08-01T09:30:00.000Z"
 *                     end: "2026-08-01T10:15:00.000Z"
 *                     isAvailable: false
 *       400:
 *         description: Invalid query parameters, or provider/service not eligible for booking
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "date: date must be in YYYY-MM-DD format"
 */
availabilityRoutes.get(
  '/',
  validate({ query: getAvailabilityQuerySchema }),
  availabilityController.getSlots,
);
