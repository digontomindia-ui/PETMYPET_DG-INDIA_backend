import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { serviceController } from './service.controller.js';
import {
  createServiceSchema,
  idParamSchema,
  searchServicesQuerySchema,
  updateServiceSchema,
} from './service.validators.js';

const requireProvider = [authenticate, requireRole(ROLES.SERVICE_PROVIDER)] as const;

export const serviceRoutes = Router();

/**
 * @openapi
 * /services:
 *   get:
 *     tags: [Services]
 *     summary: Search services
 *     parameters:
 *       - name: categoryId
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0c1"
 *       - name: providerId
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0d3"
 *       - name: q
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "grooming"
 *       - name: minPrice
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "200"
 *       - name: maxPrice
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         example: "1500"
 *       - name: page
 *         in: query
 *         required: false
 *         schema: { type: string, default: "1" }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         required: false
 *         schema: { type: string, default: "20" }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Services retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0a5"
 *                   providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                   categoryId: "64f1a2b3c4d5e6f7a8b9c0c1"
 *                   name: "Full Grooming Package"
 *                   description: "Bath, haircut, nail trim, and ear cleaning."
 *                   price: 899
 *                   durationMinutes: 60
 *                   images: ["https://cdn.petmypet.in/services/grooming-package.jpg"]
 *                   isActive: true
 *                   createdAt: "2026-05-10T08:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "categoryId: Invalid id" }
 */
serviceRoutes.get('/', validate({ query: searchServicesQuerySchema }), serviceController.search);
/**
 * @openapi
 * /services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get a service by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0a5"
 *     responses:
 *       200:
 *         description: Service retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0a5"
 *                 providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 categoryId: "64f1a2b3c4d5e6f7a8b9c0c1"
 *                 name: "Full Grooming Package"
 *                 description: "Bath, haircut, nail trim, and ear cleaning."
 *                 price: 899
 *                 durationMinutes: 60
 *                 images: ["https://cdn.petmypet.in/services/grooming-package.jpg"]
 *                 isActive: true
 *                 createdAt: "2026-05-10T08:00:00.000Z"
 *       400:
 *         description: Invalid id parameter or service not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Service not found" }
 */
serviceRoutes.get('/:id', validate({ params: idParamSchema }), serviceController.getById);

/**
 * @openapi
 * /services:
 *   post:
 *     tags: [Services]
 *     summary: Create a new service (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name, price, durationMinutes]
 *             properties:
 *               categoryId: { type: string, description: "24-hex-char ObjectId of the service category" }
 *               name: { type: string, maxLength: 150 }
 *               description: { type: string, maxLength: 2000, default: "" }
 *               price: { type: number, minimum: 0 }
 *               durationMinutes: { type: integer, minimum: 5 }
 *               images: { type: array, items: { type: string, format: uri }, default: [] }
 *               addOnCatalog:
 *                 type: array
 *                 default: []
 *                 items:
 *                   type: object
 *                   required: [name, price]
 *                   properties:
 *                     name: { type: string, minLength: 1, maxLength: 100 }
 *                     price: { type: number, minimum: 0 }
 *           example:
 *             categoryId: "64f1a2b3c4d5e6f7a8b9c0c1"
 *             name: "Full Grooming Package"
 *             description: "Bath, haircut, nail trim, and ear cleaning."
 *             price: 899
 *             durationMinutes: 60
 *             images: ["https://cdn.petmypet.in/services/grooming-package.jpg"]
 *             addOnCatalog:
 *               - { name: "Extra 15 Min", price: 79 }
 *               - { name: "Poo Pickup", price: 49 }
 *     responses:
 *       201:
 *         description: Service created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Service created
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0a5"
 *                 providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 categoryId: "64f1a2b3c4d5e6f7a8b9c0c1"
 *                 name: "Full Grooming Package"
 *                 description: "Bath, haircut, nail trim, and ear cleaning."
 *                 price: 899
 *                 durationMinutes: 60
 *                 images: ["https://cdn.petmypet.in/services/grooming-package.jpg"]
 *                 addOnCatalog:
 *                   - { name: "Extra 15 Min", price: 79 }
 *                   - { name: "Poo Pickup", price: 49 }
 *                 isActive: true
 *                 createdAt: "2026-08-04T12:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "price must be a positive number" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
serviceRoutes.post(
  '/',
  ...requireProvider,
  validate({ body: createServiceSchema }),
  serviceController.create,
);
/**
 * @openapi
 * /services/{id}:
 *   put:
 *     tags: [Services]
 *     summary: Update a service (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0a5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId: { type: string }
 *               name: { type: string, maxLength: 150 }
 *               description: { type: string, maxLength: 2000 }
 *               price: { type: number, minimum: 0 }
 *               durationMinutes: { type: integer, minimum: 5 }
 *               images: { type: array, items: { type: string, format: uri } }
 *               addOnCatalog:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, price]
 *                   properties:
 *                     name: { type: string, minLength: 1, maxLength: 100 }
 *                     price: { type: number, minimum: 0 }
 *               isActive: { type: boolean }
 *           example:
 *             price: 949
 *             durationMinutes: 75
 *             addOnCatalog:
 *               - { name: "Extra 15 Min", price: 79 }
 *               - { name: "Poo Pickup", price: 49 }
 *     responses:
 *       200:
 *         description: Service updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Service updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0a5"
 *                 providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 categoryId: "64f1a2b3c4d5e6f7a8b9c0c1"
 *                 name: "Full Grooming Package"
 *                 description: "Bath, haircut, nail trim, and ear cleaning."
 *                 price: 949
 *                 durationMinutes: 75
 *                 images: ["https://cdn.petmypet.in/services/grooming-package.jpg"]
 *                 addOnCatalog:
 *                   - { name: "Extra 15 Min", price: 79 }
 *                   - { name: "Poo Pickup", price: 49 }
 *                 isActive: true
 *                 createdAt: "2026-05-10T08:00:00.000Z"
 *       400:
 *         description: Validation error or service not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Service not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
serviceRoutes.put(
  '/:id',
  ...requireProvider,
  validate({ params: idParamSchema, body: updateServiceSchema }),
  serviceController.update,
);
/**
 * @openapi
 * /services/{id}:
 *   delete:
 *     tags: [Services]
 *     summary: Delete a service (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0a5"
 *     responses:
 *       200:
 *         description: Service deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Service deleted, data: null }
 *       400:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Service not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
serviceRoutes.delete(
  '/:id',
  ...requireProvider,
  validate({ params: idParamSchema }),
  serviceController.remove,
);
