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
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                   name: "Grooming"
 *                   slug: "grooming"
 *                   description: "Professional pet grooming services"
 *                   iconUrl: "https://cdn.petmypet.in/icons/grooming.svg"
 *                   providerTypes: ["GROOMER"]
 *                   isActive: true
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0d4"
 *                   name: "Veterinary Care"
 *                   slug: "veterinary-care"
 *                   description: "Vet consultations and health checkups"
 *                   iconUrl: "https://cdn.petmypet.in/icons/vet.svg"
 *                   providerTypes: ["VET"]
 *                   isActive: true
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
 *         example: "64f1a2b3c4d5e6f7a8b9c0d3"
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Grooming"
 *                 slug: "grooming"
 *                 description: "Professional pet grooming services"
 *                 iconUrl: "https://cdn.petmypet.in/icons/grooming.svg"
 *                 providerTypes: ["GROOMER"]
 *                 isActive: true
 *       400:
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid id"
 */
categoryRoutes.get('/:id', validate({ params: idParamSchema }), categoryController.getById);
/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name: { type: string, example: "Grooming" }
 *               slug: { type: string, example: "grooming" }
 *               description: { type: string, example: "Professional pet grooming services" }
 *               iconUrl: { type: string, format: uri, example: "https://cdn.petmypet.in/icons/grooming.svg" }
 *               providerTypes:
 *                 type: array
 *                 items: { type: string, enum: [VET, GROOMER, BOARDING, PET_WALKER, TRAINER, CLEANER, PHARMACY, RELOCATION, OTHER] }
 *                 example: ["GROOMER"]
 *           example:
 *             name: "Grooming"
 *             slug: "grooming"
 *             description: "Professional pet grooming services"
 *             iconUrl: "https://cdn.petmypet.in/icons/grooming.svg"
 *             providerTypes: ["GROOMER"]
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Category created"
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Grooming"
 *                 slug: "grooming"
 *                 description: "Professional pet grooming services"
 *                 iconUrl: "https://cdn.petmypet.in/icons/grooming.svg"
 *                 providerTypes: ["GROOMER"]
 *                 isActive: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Slug must be lowercase letters, numbers, and hyphens"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
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
 *         example: "64f1a2b3c4d5e6f7a8b9c0d3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Pet Grooming" }
 *               slug: { type: string, example: "pet-grooming" }
 *               description: { type: string, example: "At-home and salon grooming services" }
 *               iconUrl: { type: string, format: uri, example: "https://cdn.petmypet.in/icons/grooming.svg" }
 *               providerTypes:
 *                 type: array
 *                 items: { type: string, enum: [VET, GROOMER, BOARDING, PET_WALKER, TRAINER, CLEANER, PHARMACY, RELOCATION, OTHER] }
 *                 example: ["GROOMER"]
 *               isActive: { type: boolean, example: true }
 *           example:
 *             name: "Pet Grooming"
 *             slug: "pet-grooming"
 *             description: "At-home and salon grooming services"
 *             iconUrl: "https://cdn.petmypet.in/icons/grooming.svg"
 *             providerTypes: ["GROOMER"]
 *             isActive: true
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Category updated"
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Pet Grooming"
 *                 slug: "pet-grooming"
 *                 description: "At-home and salon grooming services"
 *                 iconUrl: "https://cdn.petmypet.in/icons/grooming.svg"
 *                 providerTypes: ["GROOMER"]
 *                 isActive: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
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
 *         example: "64f1a2b3c4d5e6f7a8b9c0d3"
 *     responses:
 *       200:
 *         description: Category deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Category deleted"
 *               data: null
 *       400:
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid id"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
categoryRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  categoryController.remove,
);
