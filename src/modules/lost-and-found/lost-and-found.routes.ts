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
 *       - { name: type, in: query, schema: { type: string, enum: [LOST, FOUND] } }
 *       - { name: lat, in: query, schema: { type: string } }
 *       - { name: lng, in: query, schema: { type: string } }
 *       - { name: radiusMeters, in: query, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: List of lost and found posts }
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
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: List of pending lost and found posts }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Lost and found post found }
 */
lostAndFoundRoutes.get('/:id', validate({ params: idParamSchema }), lostAndFoundController.getById);
/**
 * @openapi
 * /lost-and-found:
 *   post:
 *     tags: [LostAndFound]
 *     summary: Create a lost and found post
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Lost and found post created }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Lost and found post resolved }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Lost and found post deleted }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Lost and found post approved }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Lost and found post rejected }
 */
lostAndFoundRoutes.patch(
  '/:id/reject',
  ...adminOnly,
  validate({ params: idParamSchema, body: rejectLostAndFoundSchema }),
  lostAndFoundController.reject,
);
