import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { userController } from './user.controller.js';
import {
  addressSchema,
  listUsersQuerySchema,
  registerDeviceTokenSchema,
  updateProfileSchema,
  userIdParamSchema,
} from './user.validators.js';

export const userRoutes = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
userRoutes.get('/me', authenticate, userController.getMe);

/**
 * @openapi
 * /users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated }
 */
userRoutes.put(
  '/me',
  authenticate,
  validate({ body: updateProfileSchema }),
  userController.updateMe,
);

/**
 * @openapi
 * /users/me:
 *   delete:
 *     tags: [Users]
 *     summary: Delete the authenticated user's account
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Deleted }
 */
userRoutes.delete('/me', authenticate, userController.deleteMe);

/**
 * @openapi
 * /users/me/addresses:
 *   post:
 *     tags: [Users]
 *     summary: Add an address to the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Address added }
 */
userRoutes.post(
  '/me/addresses',
  authenticate,
  validate({ body: addressSchema }),
  userController.addAddress,
);

/**
 * @openapi
 * /users/me/addresses/{addressId}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove an address from the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: addressId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Address removed }
 */
userRoutes.delete('/me/addresses/:addressId', authenticate, userController.removeAddress);

/**
 * @openapi
 * /users/me/device-tokens:
 *   post:
 *     tags: [Users]
 *     summary: Register a device token for push notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Device token registered }
 */
userRoutes.post(
  '/me/device-tokens',
  authenticate,
  validate({ body: registerDeviceTokenSchema }),
  userController.registerDeviceToken,
);

/**
 * @openapi
 * /users/me/device-tokens:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a registered device token
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Device token removed }
 */
userRoutes.delete(
  '/me/device-tokens',
  authenticate,
  validate({ body: registerDeviceTokenSchema }),
  userController.removeDeviceToken,
);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, required: false, schema: { type: string } }
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *       - { name: role, in: query, required: false, schema: { type: string } }
 *       - { name: search, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: OK }
 */
userRoutes.get(
  '/',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ query: listUsersQuerySchema }),
  userController.list,
);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: OK }
 */
userRoutes.get(
  '/:id',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.getById,
);

/**
 * @openapi
 * /users/{id}/block:
 *   patch:
 *     tags: [Users]
 *     summary: Block a user (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User blocked }
 */
userRoutes.patch(
  '/:id/block',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.block,
);

/**
 * @openapi
 * /users/{id}/unblock:
 *   patch:
 *     tags: [Users]
 *     summary: Unblock a user (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User unblocked }
 */
userRoutes.patch(
  '/:id/unblock',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.unblock,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user by ID (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
userRoutes.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.deleteById,
);
