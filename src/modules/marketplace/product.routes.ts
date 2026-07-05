import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { productController } from './product.controller.js';
import {
  createProductSchema,
  idParamSchema,
  searchProductsQuerySchema,
  updateProductSchema,
} from './product.validators.js';

const canManage = [authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.SERVICE_PROVIDER)] as const;

export const productRoutes = Router();

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Search and list products
 *     parameters:
 *       - { name: category, in: query, schema: { type: string } }
 *       - { name: providerId, in: query, schema: { type: string } }
 *       - { name: q, in: query, schema: { type: string } }
 *       - { name: minPrice, in: query, schema: { type: string } }
 *       - { name: maxPrice, in: query, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: List of products }
 */
productRoutes.get('/', validate({ query: searchProductsQuerySchema }), productController.search);
/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by id
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product details }
 */
productRoutes.get('/:id', validate({ params: idParamSchema }), productController.getById);

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (SUPER_ADMIN or SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Product created }
 */
productRoutes.post(
  '/',
  ...canManage,
  validate({ body: createProductSchema }),
  productController.create,
);
/**
 * @openapi
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (SUPER_ADMIN or SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product updated }
 */
productRoutes.put(
  '/:id',
  ...canManage,
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update,
);
/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (SUPER_ADMIN or SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product deleted }
 */
productRoutes.delete(
  '/:id',
  ...canManage,
  validate({ params: idParamSchema }),
  productController.remove,
);
