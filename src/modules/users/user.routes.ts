import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { userController } from './user.controller.js';
import {
  addressIdParamSchema,
  addressSchema,
  listUsersQuerySchema,
  registerDeviceTokenSchema,
  updateAddressSchema,
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
 *       200:
 *         description: OK
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
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: "https://res.cloudinary.com/patmypets/image/upload/v1699999999/avatars/ananya.jpg"
 *                 isVerified: true
 *                 isBlocked: false
 *                 addresses:
 *                   - _id: "64f1a2b3c4d5e6f7a8b9c0e2"
 *                     label: Home
 *                     addressLine1: 221B Baker Street
 *                     addressLine2: Near Cyber Hub
 *                     city: Gurugram
 *                     state: Haryana
 *                     postalCode: "122002"
 *                     country: India
 *                     location: { type: Point, coordinates: [77.0894, 28.4595] }
 *                     isDefault: true
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: true
 *                   pushNotifications: true
 *                 serviceInterests: [Grooming, Veterinary]
 *                 emergencyContact:
 *                   name: Rohit Sharma
 *                   phone: "+919876500000"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-20T08:15:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
userRoutes.get('/me', authenticate, userController.getMe);

/**
 * @openapi
 * /users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 120 }
 *               email: { type: string, format: email }
 *               avatarUrl: { type: string, format: uri }
 *               preferences:
 *                 type: object
 *                 properties:
 *                   language: { type: string }
 *                   smsNotifications: { type: boolean }
 *                   emailNotifications: { type: boolean }
 *                   pushNotifications: { type: boolean }
 *               serviceInterests:
 *                 type: array
 *                 items: { type: string }
 *                 description: "Grooming, Veterinary, Vaccination, Boarding, Pet Sitting, Training, Dog Walking, Pet Taxi, Other"
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   name: { type: string, maxLength: 120 }
 *                   phone: { type: string }
 *           example:
 *             name: Ananya Sharma
 *             email: ananya.sharma@example.com
 *             avatarUrl: "https://res.cloudinary.com/patmypets/image/upload/v1699999999/avatars/ananya.jpg"
 *             preferences:
 *               language: en
 *               smsNotifications: true
 *               emailNotifications: false
 *               pushNotifications: true
 *             serviceInterests: [Grooming, Veterinary]
 *             emergencyContact:
 *               name: Rohit Sharma
 *               phone: "+919876500000"
 *     responses:
 *       200:
 *         description: Updated
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
 *               message: Profile updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: "https://res.cloudinary.com/patmypets/image/upload/v1699999999/avatars/ananya.jpg"
 *                 isVerified: true
 *                 isBlocked: false
 *                 addresses: []
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: false
 *                   pushNotifications: true
 *                 serviceInterests: [Grooming, Veterinary]
 *                 emergencyContact:
 *                   name: Rohit Sharma
 *                   phone: "+919876500000"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-21T09:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "avatarUrl: Invalid url"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: CONFLICT
 *               message: An account with this email already exists
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
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Account deleted
 *               data: null
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
userRoutes.delete('/me', authenticate, userController.deleteMe);

/**
 * @openapi
 * /users/me/addresses:
 *   post:
 *     tags: [Users]
 *     summary: Add an address to the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, addressLine1, city, state, postalCode, coordinates]
 *             properties:
 *               label: { type: string, maxLength: 40 }
 *               addressLine1: { type: string, maxLength: 200 }
 *               addressLine2: { type: string, maxLength: 200 }
 *               city: { type: string, maxLength: 100 }
 *               state: { type: string, maxLength: 100 }
 *               postalCode: { type: string, maxLength: 20 }
 *               country: { type: string, maxLength: 100, default: India }
 *               coordinates:
 *                 type: array
 *                 items: { type: number }
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: "[longitude, latitude]"
 *               isDefault: { type: boolean, default: false }
 *           example:
 *             label: Home
 *             addressLine1: 221B Baker Street
 *             addressLine2: Near Cyber Hub
 *             city: Gurugram
 *             state: Haryana
 *             postalCode: "122002"
 *             country: India
 *             coordinates: [77.0894, 28.4595]
 *             isDefault: true
 *     responses:
 *       201:
 *         description: Address added
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
 *               message: Address added
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: null
 *                 isVerified: true
 *                 isBlocked: false
 *                 addresses:
 *                   - _id: "64f1a2b3c4d5e6f7a8b9c0e2"
 *                     label: Home
 *                     addressLine1: 221B Baker Street
 *                     addressLine2: Near Cyber Hub
 *                     city: Gurugram
 *                     state: Haryana
 *                     postalCode: "122002"
 *                     country: India
 *                     location: { type: Point, coordinates: [77.0894, 28.4595] }
 *                     isDefault: true
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: true
 *                   pushNotifications: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-21T09:05:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "addressLine1: Required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *   put:
 *     tags: [Users]
 *     summary: Edit an existing address on the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: addressId, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0e2" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label: { type: string, maxLength: 40 }
 *               addressLine1: { type: string, maxLength: 200 }
 *               addressLine2: { type: string, maxLength: 200 }
 *               city: { type: string, maxLength: 100 }
 *               state: { type: string, maxLength: 100 }
 *               postalCode: { type: string, maxLength: 20 }
 *               country: { type: string, maxLength: 100 }
 *               coordinates:
 *                 type: array
 *                 items: { type: number }
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: "[longitude, latitude]"
 *               isDefault: { type: boolean }
 *           example:
 *             addressLine1: 221B Baker Street, Flat 4
 *             isDefault: true
 *     responses:
 *       200:
 *         description: Address updated
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
 *               message: Address updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: null
 *                 isVerified: true
 *                 isBlocked: false
 *                 addresses:
 *                   - _id: "64f1a2b3c4d5e6f7a8b9c0e2"
 *                     label: Home
 *                     addressLine1: 221B Baker Street, Flat 4
 *                     addressLine2: Near Cyber Hub
 *                     city: Gurugram
 *                     state: Haryana
 *                     postalCode: "122002"
 *                     country: India
 *                     location: { type: Point, coordinates: [77.0894, 28.4595] }
 *                     isDefault: true
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: true
 *                   pushNotifications: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-21T09:07:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Address not found
 */
userRoutes.put(
  '/me/addresses/:addressId',
  authenticate,
  validate({ params: addressIdParamSchema, body: updateAddressSchema }),
  userController.updateAddress,
);

/**
 * @openapi
 * /users/me/addresses/{addressId}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove an address from the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: addressId, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0e2" }
 *     responses:
 *       200:
 *         description: Address removed
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
 *               message: Address removed
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: null
 *                 isVerified: true
 *                 isBlocked: false
 *                 addresses: []
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: true
 *                   pushNotifications: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-21T09:10:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
userRoutes.delete('/me/addresses/:addressId', authenticate, userController.removeAddress);

/**
 * @openapi
 * /users/me/device-tokens:
 *   post:
 *     tags: [Users]
 *     summary: Register a device token for push notifications
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceToken]
 *             properties:
 *               deviceToken: { type: string }
 *           example:
 *             deviceToken: "fcm-token-d3f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       201:
 *         description: Device token registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Device registered
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "deviceToken: String must contain at least 1 character(s)"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceToken]
 *             properties:
 *               deviceToken: { type: string }
 *           example:
 *             deviceToken: "fcm-token-d3f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Device token removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Device removed
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "deviceToken: String must contain at least 1 character(s)"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: page, in: query, required: false, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, required: false, schema: { type: string }, example: "20" }
 *       - { name: role, in: query, required: false, schema: { type: string }, example: USER }
 *       - { name: search, in: query, required: false, schema: { type: string }, example: ananya }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   role: USER
 *                   name: Ananya Sharma
 *                   email: ananya.sharma@example.com
 *                   phone: "+919876543210"
 *                   avatarUrl: null
 *                   isVerified: true
 *                   isBlocked: false
 *                   addresses: []
 *                   preferences:
 *                     language: en
 *                     smsNotifications: true
 *                     emailNotifications: true
 *                     pushNotifications: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-06-20T08:15:00.000Z"
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 1
 *                 totalPages: 1
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "page: Invalid input"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     responses:
 *       200:
 *         description: OK
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
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: null
 *                 isVerified: true
 *                 isBlocked: false
 *                 addresses: []
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: true
 *                   pushNotifications: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-20T08:15:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid user id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     responses:
 *       200:
 *         description: User blocked
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
 *               message: User blocked
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: null
 *                 isVerified: true
 *                 isBlocked: true
 *                 addresses: []
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: true
 *                   pushNotifications: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-21T09:20:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid user id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     responses:
 *       200:
 *         description: User unblocked
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
 *               message: User unblocked
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 role: USER
 *                 name: Ananya Sharma
 *                 email: ananya.sharma@example.com
 *                 phone: "+919876543210"
 *                 avatarUrl: null
 *                 isVerified: true
 *                 isBlocked: false
 *                 addresses: []
 *                 preferences:
 *                   language: en
 *                   smsNotifications: true
 *                   emailNotifications: true
 *                   pushNotifications: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-06-21T09:25:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid user id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: User deleted
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid user id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
userRoutes.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema }),
  userController.deleteById,
);
