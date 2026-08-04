import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { lostAndFoundController } from './lost-and-found.controller.js';
import {
  createLostAndFoundSchema,
  idParamSchema,
  listLostAndFoundQuerySchema,
  listPendingQuerySchema,
  rejectLostAndFoundSchema,
} from './lost-and-found.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const lostAndFoundRoutes = Router();

/**
 * @openapi
 * /lost-and-found:
 *   get:
 *     tags: [LostAndFound]
 *     summary: List lost and found posts
 *     parameters:
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [LOST, FOUND] }
 *         example: LOST
 *       - name: lat
 *         in: query
 *         schema: { type: string }
 *         example: "12.9716"
 *       - name: lng
 *         in: query
 *         schema: { type: string }
 *         example: "77.5946"
 *       - name: radiusMeters
 *         in: query
 *         schema: { type: string }
 *         example: "5000"
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
 *         description: List of lost and found posts
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   reporterId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   type: LOST
 *                   petName: Bruno
 *                   species: Dog
 *                   breed: Labrador Retriever
 *                   description: Last seen near Cubbon Park wearing a red collar.
 *                   photoUrls: ["https://cdn.petmypet.in/lost-and-found/bruno-1.jpg"]
 *                   lastSeenLocation: { type: Point, coordinates: [77.5946, 12.9716] }
 *                   contactPhone: "+919876543210"
 *                   status: ACTIVE
 *                   approvalStatus: APPROVED
 *                   rejectionReason: null
 *                   createdAt: "2026-08-01T10:30:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "radiusMeters must be a valid number" }
 */
lostAndFoundRoutes.get(
  '/',
  validate({ query: listLostAndFoundQuerySchema }),
  lostAndFoundController.list,
);

/**
 * @openapi
 * /lost-and-found/pending:
 *   get:
 *     tags: [LostAndFound]
 *     summary: List lost and found posts pending approval (SUPER_ADMIN only)
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
 *         description: List of pending lost and found posts
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   reporterId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   type: FOUND
 *                   petName: ""
 *                   species: Cat
 *                   breed: Indie
 *                   description: Found a friendly cat wandering near Indiranagar metro station.
 *                   photoUrls: ["https://cdn.petmypet.in/lost-and-found/cat-1.jpg"]
 *                   lastSeenLocation: { type: Point, coordinates: [77.6408, 12.9784] }
 *                   contactPhone: "+919876500000"
 *                   status: ACTIVE
 *                   approvalStatus: PENDING
 *                   rejectionReason: null
 *                   createdAt: "2026-08-02T09:15:00.000Z"
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
lostAndFoundRoutes.get(
  '/pending',
  ...adminOnly,
  validate({ query: listPendingQuerySchema }),
  lostAndFoundController.listPending,
);

/**
 * @openapi
 * /lost-and-found/{id}:
 *   get:
 *     tags: [LostAndFound]
 *     summary: Get a lost and found post by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Lost and found post found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 reporterId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 type: LOST
 *                 petName: Bruno
 *                 species: Dog
 *                 breed: Labrador Retriever
 *                 description: Last seen near Cubbon Park wearing a red collar.
 *                 photoUrls: ["https://cdn.petmypet.in/lost-and-found/bruno-1.jpg"]
 *                 lastSeenLocation: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 contactPhone: "+919876543210"
 *                 status: ACTIVE
 *                 approvalStatus: APPROVED
 *                 rejectionReason: null
 *                 createdAt: "2026-08-01T10:30:00.000Z"
 *       400:
 *         description: Invalid id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Invalid id" }
 */
lostAndFoundRoutes.get('/:id', validate({ params: idParamSchema }), lostAndFoundController.getById);
/**
 * @openapi
 * /lost-and-found:
 *   post:
 *     tags: [LostAndFound]
 *     summary: Create a lost and found post
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, enum: [LOST, FOUND] }
 *               petName: { type: string, maxLength: 100 }
 *               species: { type: string, maxLength: 50 }
 *               breed: { type: string, maxLength: 100 }
 *               description: { type: string, maxLength: 2000 }
 *               photoUrls: { type: array, items: { type: string, format: uri }, maxItems: 10 }
 *               coordinates:
 *                 type: array
 *                 items: { type: number }
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: "[longitude, latitude]"
 *               contactPhone: { type: string, minLength: 7, maxLength: 20 }
 *           example:
 *             type: LOST
 *             petName: Bruno
 *             species: Dog
 *             breed: Labrador Retriever
 *             description: Last seen near Cubbon Park wearing a red collar.
 *             photoUrls: ["https://cdn.petmypet.in/lost-and-found/bruno-1.jpg"]
 *             coordinates: [77.5946, 12.9716]
 *             contactPhone: "+919876543210"
 *     responses:
 *       201:
 *         description: Lost and found post created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Post submitted for approval
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 reporterId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 type: LOST
 *                 petName: Bruno
 *                 species: Dog
 *                 breed: Labrador Retriever
 *                 description: Last seen near Cubbon Park wearing a red collar.
 *                 photoUrls: ["https://cdn.petmypet.in/lost-and-found/bruno-1.jpg"]
 *                 lastSeenLocation: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 contactPhone: "+919876543210"
 *                 status: ACTIVE
 *                 approvalStatus: PENDING
 *                 rejectionReason: null
 *                 createdAt: "2026-08-04T08:00:00.000Z"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "description is required" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
lostAndFoundRoutes.post(
  '/',
  authenticate,
  validate({ body: createLostAndFoundSchema }),
  lostAndFoundController.create,
);
/**
 * @openapi
 * /lost-and-found/{id}/resolve:
 *   patch:
 *     tags: [LostAndFound]
 *     summary: Mark a lost and found post as resolved
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Lost and found post resolved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Marked as resolved
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 reporterId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 type: LOST
 *                 petName: Bruno
 *                 species: Dog
 *                 breed: Labrador Retriever
 *                 description: Last seen near Cubbon Park wearing a red collar.
 *                 photoUrls: ["https://cdn.petmypet.in/lost-and-found/bruno-1.jpg"]
 *                 lastSeenLocation: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 contactPhone: "+919876543210"
 *                 status: RESOLVED
 *                 approvalStatus: APPROVED
 *                 rejectionReason: null
 *                 createdAt: "2026-08-01T10:30:00.000Z"
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
 */
lostAndFoundRoutes.patch(
  '/:id/resolve',
  authenticate,
  validate({ params: idParamSchema }),
  lostAndFoundController.resolve,
);
/**
 * @openapi
 * /lost-and-found/{id}:
 *   delete:
 *     tags: [LostAndFound]
 *     summary: Delete a lost and found post
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Lost and found post deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Post deleted
 *               data: null
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
 */
lostAndFoundRoutes.delete(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  lostAndFoundController.remove,
);

/**
 * @openapi
 * /lost-and-found/{id}/approve:
 *   patch:
 *     tags: [LostAndFound]
 *     summary: Approve a lost and found post (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Lost and found post approved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Post approved
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 reporterId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 type: FOUND
 *                 petName: ""
 *                 species: Cat
 *                 breed: Indie
 *                 description: Found a friendly cat wandering near Indiranagar metro station.
 *                 photoUrls: ["https://cdn.petmypet.in/lost-and-found/cat-1.jpg"]
 *                 lastSeenLocation: { type: Point, coordinates: [77.6408, 12.9784] }
 *                 contactPhone: "+919876500000"
 *                 status: ACTIVE
 *                 approvalStatus: APPROVED
 *                 rejectionReason: null
 *                 createdAt: "2026-08-02T09:15:00.000Z"
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
 */
lostAndFoundRoutes.patch(
  '/:id/approve',
  ...adminOnly,
  validate({ params: idParamSchema }),
  lostAndFoundController.approve,
);
/**
 * @openapi
 * /lost-and-found/{id}/reject:
 *   patch:
 *     tags: [LostAndFound]
 *     summary: Reject a lost and found post (SUPER_ADMIN only)
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
 *             reason: Photos do not clearly show an animal; please resubmit with a valid photo.
 *     responses:
 *       200:
 *         description: Lost and found post rejected
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Post rejected
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 reporterId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 type: FOUND
 *                 petName: ""
 *                 species: Cat
 *                 breed: Indie
 *                 description: Found a friendly cat wandering near Indiranagar metro station.
 *                 photoUrls: ["https://cdn.petmypet.in/lost-and-found/cat-1.jpg"]
 *                 lastSeenLocation: { type: Point, coordinates: [77.6408, 12.9784] }
 *                 contactPhone: "+919876500000"
 *                 status: ACTIVE
 *                 approvalStatus: REJECTED
 *                 rejectionReason: Photos do not clearly show an animal; please resubmit with a valid photo.
 *                 createdAt: "2026-08-02T09:15:00.000Z"
 *       400:
 *         description: Invalid request body or id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "reason is required" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
lostAndFoundRoutes.patch(
  '/:id/reject',
  ...adminOnly,
  validate({ params: idParamSchema, body: rejectLostAndFoundSchema }),
  lostAndFoundController.reject,
);
