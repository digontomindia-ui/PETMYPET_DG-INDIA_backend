import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { petTaxiController } from './pet-taxi.controller.js';
import {
  cancelPetTaxiBookingSchema,
  createPetTaxiBookingSchema,
  idParamSchema,
  listMyPetTaxiBookingsQuerySchema,
} from './pet-taxi.validators.js';

export const petTaxiRoutes = Router();

/**
 * @openapi
 * /pet-taxi/bookings:
 *   post:
 *     tags: [PetTaxi]
 *     summary: Submit a pet taxi booking request
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tripType: { type: string, enum: [ONE_WAY, ROUND_TRIP] }
 *               petIds:
 *                 type: array
 *                 items: { type: string }
 *                 minItems: 1
 *               pickupAddress: { type: string, minLength: 1, maxLength: 500 }
 *               dropAddress: { type: string, minLength: 1, maxLength: 500 }
 *               pickupDate: { type: string, format: date, example: "2026-08-25" }
 *               pickupTime: { type: string, pattern: "^\\d{2}:\\d{2}$", example: "14:30" }
 *           example:
 *             tripType: ONE_WAY
 *             petIds: ["64f1a2b3c4d5e6f7a8b9c0d3"]
 *             pickupAddress: "12, Lavelle Road, Bengaluru"
 *             dropAddress: "Pet Care Clinic, Indiranagar, Bengaluru"
 *             pickupDate: "2026-08-25"
 *             pickupTime: "14:30"
 *     responses:
 *       201:
 *         description: Pet taxi booking created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Pet taxi booking created
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 tripType: ONE_WAY
 *                 petIds: ["64f1a2b3c4d5e6f7a8b9c0d3"]
 *                 pickupAddress: "12, Lavelle Road, Bengaluru"
 *                 dropAddress: "Pet Care Clinic, Indiranagar, Bengaluru"
 *                 pickupDate: "2026-08-25T00:00:00.000Z"
 *                 pickupTime: "14:30"
 *                 price: 499
 *                 currency: INR
 *                 status: PENDING
 *                 cancellationReason: null
 *                 createdAt: "2026-08-22T08:00:00.000Z"
 *       400:
 *         description: Invalid request body, or one or more pets do not belong to this account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "One or more pets were not found for this account" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petTaxiRoutes.post(
  '/bookings',
  authenticate,
  validate({ body: createPetTaxiBookingSchema }),
  petTaxiController.create,
);

/**
 * @openapi
 * /pet-taxi/bookings/me:
 *   get:
 *     tags: [PetTaxi]
 *     summary: List the caller's own pet taxi bookings
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED] }
 *         example: PENDING
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: List of the caller's pet taxi bookings
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   tripType: ROUND_TRIP
 *                   petIds: ["64f1a2b3c4d5e6f7a8b9c0d3"]
 *                   pickupAddress: "12, Lavelle Road, Bengaluru"
 *                   dropAddress: "Pet Care Clinic, Indiranagar, Bengaluru"
 *                   pickupDate: "2026-08-25T00:00:00.000Z"
 *                   pickupTime: "14:30"
 *                   price: 899
 *                   currency: INR
 *                   status: PENDING
 *                   cancellationReason: null
 *                   createdAt: "2026-08-22T08:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "limit must be a valid number" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petTaxiRoutes.get(
  '/bookings/me',
  authenticate,
  validate({ query: listMyPetTaxiBookingsQuerySchema }),
  petTaxiController.listMine,
);

/**
 * @openapi
 * /pet-taxi/bookings/{id}:
 *   get:
 *     tags: [PetTaxi]
 *     summary: Get a pet taxi booking by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Pet taxi booking found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 tripType: ONE_WAY
 *                 petIds: ["64f1a2b3c4d5e6f7a8b9c0d3"]
 *                 pickupAddress: "12, Lavelle Road, Bengaluru"
 *                 dropAddress: "Pet Care Clinic, Indiranagar, Bengaluru"
 *                 pickupDate: "2026-08-25T00:00:00.000Z"
 *                 pickupTime: "14:30"
 *                 price: 499
 *                 currency: INR
 *                 status: PENDING
 *                 cancellationReason: null
 *                 createdAt: "2026-08-22T08:00:00.000Z"
 *       400:
 *         description: Invalid id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Invalid id" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       404:
 *         description: Pet taxi booking not found, or not accessible to the caller
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Pet taxi booking not found" }
 */
petTaxiRoutes.get(
  '/bookings/:id',
  authenticate,
  validate({ params: idParamSchema }),
  petTaxiController.getById,
);

/**
 * @openapi
 * /pet-taxi/bookings/{id}/cancel:
 *   patch:
 *     tags: [PetTaxi]
 *     summary: Cancel a pet taxi booking
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, minLength: 1, maxLength: 500 }
 *           example:
 *             reason: Change of plans, no longer need the ride.
 *     responses:
 *       200:
 *         description: Pet taxi booking cancelled
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Booking cancelled
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 tripType: ONE_WAY
 *                 petIds: ["64f1a2b3c4d5e6f7a8b9c0d3"]
 *                 pickupAddress: "12, Lavelle Road, Bengaluru"
 *                 dropAddress: "Pet Care Clinic, Indiranagar, Bengaluru"
 *                 pickupDate: "2026-08-25T00:00:00.000Z"
 *                 pickupTime: "14:30"
 *                 price: 499
 *                 currency: INR
 *                 status: CANCELLED
 *                 cancellationReason: Change of plans, no longer need the ride.
 *                 createdAt: "2026-08-22T08:00:00.000Z"
 *       400:
 *         description: Invalid request, invalid id, or booking already COMPLETED/CANCELLED
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Cannot cancel a booking that is already COMPLETED" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       404:
 *         description: Pet taxi booking not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Pet taxi booking not found" }
 */
petTaxiRoutes.patch(
  '/bookings/:id/cancel',
  authenticate,
  validate({ params: idParamSchema, body: cancelPetTaxiBookingSchema }),
  petTaxiController.cancel,
);
