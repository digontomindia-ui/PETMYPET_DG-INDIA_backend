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
 *       - name: category
 *         in: query
 *         schema: { type: string, enum: [FOOD, PHARMACY, ACCESSORIES, GROOMING_SUPPLIES, TOYS, OTHER] }
 *         example: "FOOD"
 *       - name: providerId
 *         in: query
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0d3"
 *       - name: q
 *         in: query
 *         schema: { type: string }
 *         example: "dog food"
 *       - name: minPrice
 *         in: query
 *         schema: { type: string }
 *         example: "500"
 *       - name: maxPrice
 *         in: query
 *         schema: { type: string }
 *         example: "2000"
 *       - name: page
 *         in: query
 *         schema: { type: string, default: "1" }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string, default: "20" }
 *         example: "20"
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                   name: "Royal Canin Adult Dog Food 3kg"
 *                   description: "Balanced nutrition for adult dogs."
 *                   category: "FOOD"
 *                   price: 1499
 *                   images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"]
 *                   stock: 42
 *                   sku: "RC-ADT-3KG"
 *                   isActive: true
 *                   createdAt: "2026-04-01T08:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "providerId: Invalid id" }
 */
productRoutes.get('/', validate({ query: searchProductsQuerySchema }), productController.search);
/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Royal Canin Adult Dog Food 3kg"
 *                 description: "Balanced nutrition for adult dogs."
 *                 category: "FOOD"
 *                 price: 1499
 *                 images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"]
 *                 stock: 42
 *                 sku: "RC-ADT-3KG"
 *                 isActive: true
 *                 createdAt: "2026-04-01T08:00:00.000Z"
 *       400:
 *         description: Invalid id parameter or product not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Product not found" }
 */
productRoutes.get('/:id', validate({ params: idParamSchema }), productController.getById);

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (SUPER_ADMIN or SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, price, sku]
 *             properties:
 *               name: { type: string, maxLength: 200 }
 *               description: { type: string, maxLength: 3000, default: "" }
 *               category: { type: string, enum: [FOOD, PHARMACY, ACCESSORIES, GROOMING_SUPPLIES, TOYS, OTHER] }
 *               price: { type: number, minimum: 0 }
 *               images: { type: array, items: { type: string, format: uri }, default: [] }
 *               stock: { type: integer, minimum: 0, default: 0 }
 *               sku: { type: string, maxLength: 50 }
 *               providerId: { type: string, description: "Optional, defaults to the authenticated provider" }
 *           example:
 *             name: "Royal Canin Adult Dog Food 3kg"
 *             description: "Balanced nutrition for adult dogs."
 *             category: "FOOD"
 *             price: 1499
 *             images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"]
 *             stock: 50
 *             sku: "RC-ADT-3KG"
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Product created
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Royal Canin Adult Dog Food 3kg"
 *                 description: "Balanced nutrition for adult dogs."
 *                 category: "FOOD"
 *                 price: 1499
 *                 images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"]
 *                 stock: 50
 *                 sku: "RC-ADT-3KG"
 *                 isActive: true
 *                 createdAt: "2026-08-04T12:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "sku is required" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 200 }
 *               description: { type: string, maxLength: 3000 }
 *               category: { type: string, enum: [FOOD, PHARMACY, ACCESSORIES, GROOMING_SUPPLIES, TOYS, OTHER] }
 *               price: { type: number, minimum: 0 }
 *               images: { type: array, items: { type: string, format: uri } }
 *               stock: { type: integer, minimum: 0 }
 *               sku: { type: string, maxLength: 50 }
 *               isActive: { type: boolean }
 *           example:
 *             price: 1399
 *             stock: 30
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Product updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 providerId: "64f1a2b3c4d5e6f7a8b9c0d3"
 *                 name: "Royal Canin Adult Dog Food 3kg"
 *                 description: "Balanced nutrition for adult dogs."
 *                 category: "FOOD"
 *                 price: 1399
 *                 images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"]
 *                 stock: 30
 *                 sku: "RC-ADT-3KG"
 *                 isActive: true
 *                 createdAt: "2026-04-01T08:00:00.000Z"
 *       400:
 *         description: Validation error or product not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Product not found" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Product deleted, data: null }
 *       400:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Product not found" }
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
productRoutes.delete(
  '/:id',
  ...canManage,
  validate({ params: idParamSchema }),
  productController.remove,
);
