import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { categoryController } from './category.controller.js';
import {
  createCategorySchema,
  idParamSchema,
  updateCategorySchema,
} from './category.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const categoryRoutes = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     responses:
 *       200: { description: List of categories }
 */
categoryRoutes.get('/', categoryController.list);
/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category details }
 */
categoryRoutes.get('/:id', validate({ params: idParamSchema }), categoryController.getById);
/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Category created }
 */
categoryRoutes.post(
  '/',
  ...adminOnly,
  validate({ body: createCategorySchema }),
  categoryController.create,
);
/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category updated }
 */
categoryRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateCategorySchema }),
  categoryController.update,
);
/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category deleted }
 */
categoryRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  categoryController.remove,
);
