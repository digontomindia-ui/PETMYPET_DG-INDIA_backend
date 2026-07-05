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

userRoutes.delete('/me', authenticate, userController.deleteMe);

userRoutes.post(
  '/me/addresses',
  authenticate,
  validate({ body: addressSchema }),
  userController.addAddress,
);
userRoutes.delete('/me/addresses/:addressId', authenticate, userController.removeAddress);

userRoutes.post(
  '/me/device-tokens',
  authenticate,
  validate({ body: registerDeviceTokenSchema }),
  userController.registerDeviceToken,
);
userRoutes.delete(
  '/me/device-tokens',
  authenticate,
  validate({ body: registerDeviceTokenSchema }),
  userController.removeDeviceToken,
);

userRoutes.get(
  '/',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ query: listUsersQuerySchema }),
  userController.list,
);

userRoutes.get(
  '/:id',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.getById,
);

userRoutes.patch(
  '/:id/block',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.block,
);

userRoutes.patch(
  '/:id/unblock',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.unblock,
);

userRoutes.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.deleteById,
);
