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
 *       - { name: categoryId, in: query, required: false, schema: { type: string } }
 *       - { name: providerId, in: query, required: false, schema: { type: string } }
 *       - { name: q, in: query, required: false, schema: { type: string } }
 *       - { name: minPrice, in: query, required: false, schema: { type: string } }
 *       - { name: maxPrice, in: query, required: false, schema: { type: string } }
 *       - { name: page, in: query, required: false, schema: { type: string } }
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: Services retrieved }
 */
serviceRoutes.get('/', validate({ query: searchServicesQuerySchema }), serviceController.search);
/**
 * @openapi
 * /services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get a service by ID
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Service retrieved }
 */
serviceRoutes.get('/:id', validate({ params: idParamSchema }), serviceController.getById);

/**
 * @openapi
 * /services:
 *   post:
 *     tags: [Services]
 *     summary: Create a new service (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Service created }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Service updated }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Service deleted }
 */
serviceRoutes.delete(
  '/:id',
  ...requireProvider,
  validate({ params: idParamSchema }),
  serviceController.remove,
);
