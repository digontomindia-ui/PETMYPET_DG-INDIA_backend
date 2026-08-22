import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { petRelocationController } from './pet-relocation.controller.js';
import {
  createRelocationRequestSchema,
  idParamSchema,
  listMyRelocationRequestsQuerySchema,
  listRelocationRequestsQuerySchema,
  updateRelocationStatusSchema,
} from './pet-relocation.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const petRelocationRoutes = Router();

/**
 * @openapi
 * /pet-relocation/requests:
 *   post:
 *     tags: [PetRelocation]
 *     summary: Submit a pet relocation request
 *     description: Creates a relocation lead for manual ops follow-up. This is not an instant booking - no payment is taken here; the ops team contacts the owner after submission.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerName: { type: string, minLength: 1, maxLength: 120 }
 *               ownerPhone: { type: string, description: "E.164-ish phone, 7-15 digits" }
 *               ownerEmail: { type: string, format: email }
 *               petId: { type: string }
 *               originAddress: { type: string, minLength: 1, maxLength: 500 }
 *               destinationAddress: { type: string, minLength: 1, maxLength: 500 }
 *               relocationDate: { type: string, format: date-time, description: "Must be today or in the future" }
 *               transportType: { type: string, enum: [ROAD, AIR, RAIL] }
 *               preferredTimeSlot: { type: string, enum: [MORNING, AFTERNOON, EVENING] }
 *           example:
 *             ownerName: Rahul Sharma
 *             ownerPhone: "+919876543210"
 *             ownerEmail: rahul.sharma@example.com
 *             petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *             originAddress: 12th Main, Indiranagar, Bangalore, Karnataka
 *             destinationAddress: Park Street, Kolkata, West Bengal
 *             relocationDate: "2026-09-10T00:00:00.000Z"
 *             transportType: ROAD
 *             preferredTimeSlot: MORNING
 *     responses:
 *       201:
 *         description: Relocation request submitted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Relocation request submitted
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 ownerName: Rahul Sharma
 *                 ownerPhone: "+919876543210"
 *                 ownerEmail: rahul.sharma@example.com
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 originAddress: 12th Main, Indiranagar, Bangalore, Karnataka
 *                 destinationAddress: Park Street, Kolkata, West Bengal
 *                 relocationDate: "2026-09-10T00:00:00.000Z"
 *                 transportType: ROAD
 *                 preferredTimeSlot: MORNING
 *                 status: SUBMITTED
 *                 createdAt: "2026-08-22T08:00:00.000Z"
 *       400:
 *         description: Invalid request body, or pet does not belong to the caller
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Pet not found for this account" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petRelocationRoutes.post(
  '/requests',
  authenticate,
  validate({ body: createRelocationRequestSchema }),
  petRelocationController.create,
);

/**
 * @openapi
 * /pet-relocation/requests/me:
 *   get:
 *     tags: [PetRelocation]
 *     summary: List the authenticated user's own relocation requests
 *     security: [{ bearerAuth: [] }]
 *     parameters:
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
 *         description: List of the caller's relocation requests
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   ownerName: Rahul Sharma
 *                   ownerPhone: "+919876543210"
 *                   ownerEmail: rahul.sharma@example.com
 *                   petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                   originAddress: 12th Main, Indiranagar, Bangalore, Karnataka
 *                   destinationAddress: Park Street, Kolkata, West Bengal
 *                   relocationDate: "2026-09-10T00:00:00.000Z"
 *                   transportType: ROAD
 *                   preferredTimeSlot: MORNING
 *                   status: SUBMITTED
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
petRelocationRoutes.get(
  '/requests/me',
  authenticate,
  validate({ query: listMyRelocationRequestsQuerySchema }),
  petRelocationController.listMine,
);

/**
 * @openapi
 * /pet-relocation/requests/{id}:
 *   get:
 *     tags: [PetRelocation]
 *     summary: Get a relocation request by id
 *     description: The requesting owner sees the request without adminNotes. A SUPER_ADMIN sees adminNotes included.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Relocation request found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 ownerName: Rahul Sharma
 *                 ownerPhone: "+919876543210"
 *                 ownerEmail: rahul.sharma@example.com
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 originAddress: 12th Main, Indiranagar, Bangalore, Karnataka
 *                 destinationAddress: Park Street, Kolkata, West Bengal
 *                 relocationDate: "2026-09-10T00:00:00.000Z"
 *                 transportType: ROAD
 *                 preferredTimeSlot: MORNING
 *                 status: SUBMITTED
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
 *       403:
 *         description: Caller does not own this request and is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this request" }
 *       404:
 *         description: Relocation request not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Relocation request not found" }
 */
petRelocationRoutes.get(
  '/requests/:id',
  authenticate,
  validate({ params: idParamSchema }),
  petRelocationController.getById,
);

/**
 * @openapi
 * /pet-relocation/requests:
 *   get:
 *     tags: [PetRelocation]
 *     summary: List all relocation requests (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [SUBMITTED, CONTACTED, CONFIRMED, CANCELLED] }
 *         example: SUBMITTED
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
 *         description: List of all relocation requests, including internal adminNotes
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   ownerName: Rahul Sharma
 *                   ownerPhone: "+919876543210"
 *                   ownerEmail: rahul.sharma@example.com
 *                   petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                   originAddress: 12th Main, Indiranagar, Bangalore, Karnataka
 *                   destinationAddress: Park Street, Kolkata, West Bengal
 *                   relocationDate: "2026-09-10T00:00:00.000Z"
 *                   transportType: ROAD
 *                   preferredTimeSlot: MORNING
 *                   status: SUBMITTED
 *                   createdAt: "2026-08-22T08:00:00.000Z"
 *                   adminNotes: "Called once, no answer. Will retry tomorrow morning."
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
 *       403:
 *         description: Caller is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have permission to perform this action" }
 */
petRelocationRoutes.get(
  '/requests',
  ...adminOnly,
  validate({ query: listRelocationRequestsQuerySchema }),
  petRelocationController.list,
);

/**
 * @openapi
 * /pet-relocation/requests/{id}/status:
 *   patch:
 *     tags: [PetRelocation]
 *     summary: Update a relocation request's status and admin notes (SUPER_ADMIN only)
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
 *               status: { type: string, enum: [CONTACTED, CONFIRMED, CANCELLED] }
 *               adminNotes: { type: string, minLength: 0, maxLength: 2000 }
 *           example:
 *             status: CONTACTED
 *             adminNotes: "Called owner, confirmed pickup window for the morning slot."
 *     responses:
 *       200:
 *         description: Relocation request updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Relocation request updated
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 ownerName: Rahul Sharma
 *                 ownerPhone: "+919876543210"
 *                 ownerEmail: rahul.sharma@example.com
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 originAddress: 12th Main, Indiranagar, Bangalore, Karnataka
 *                 destinationAddress: Park Street, Kolkata, West Bengal
 *                 relocationDate: "2026-09-10T00:00:00.000Z"
 *                 transportType: ROAD
 *                 preferredTimeSlot: MORNING
 *                 status: CONTACTED
 *                 createdAt: "2026-08-22T08:00:00.000Z"
 *                 adminNotes: "Called owner, confirmed pickup window for the morning slot."
 *       400:
 *         description: Invalid request body or id parameter
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
 *       403:
 *         description: Caller is not a SUPER_ADMIN
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have permission to perform this action" }
 *       404:
 *         description: Relocation request not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Relocation request not found" }
 */
petRelocationRoutes.patch(
  '/requests/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateRelocationStatusSchema }),
  petRelocationController.updateStatus,
);
