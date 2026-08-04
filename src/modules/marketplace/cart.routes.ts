import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { cartController } from './cart.controller.js';
import { addToCartSchema, productIdParamSchema, updateCartItemSchema } from './cart.validators.js';

export const cartRoutes = Router();

cartRoutes.use(authenticate);

/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current user's cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Success, data: { id: "64f1a2b3c4d5e6f7a8b9c0e1", items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"], quantity: 2, subtotal: 2998 }], totalAmount: 2998 } }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
cartRoutes.get('/', cartController.getCart);
/**
 * @openapi
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string, description: "24-hex-char ObjectId of the product" }
 *               quantity: { type: integer, minimum: 1, default: 1 }
 *           example:
 *             productId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *             quantity: 2
 *     responses:
 *       201:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Item added to cart, data: { id: "64f1a2b3c4d5e6f7a8b9c0e1", items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"], quantity: 2, subtotal: 2998 }], totalAmount: 2998 } }
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
 */
cartRoutes.post('/items', validate({ body: addToCartSchema }), cartController.addItem);
/**
 * @openapi
 * /cart/items/{productId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update a cart item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: productId
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
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *           example:
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Cart updated, data: { id: "64f1a2b3c4d5e6f7a8b9c0e1", items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, images: ["https://cdn.petmypet.in/products/royal-canin-3kg.jpg"], quantity: 3, subtotal: 4497 }], totalAmount: 4497 } }
 *       400:
 *         description: Validation error or item not found in cart
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Item not found in cart" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
cartRoutes.put(
  '/items/:productId',
  validate({ params: productIdParamSchema, body: updateCartItemSchema }),
  cartController.updateItem,
);
/**
 * @openapi
 * /cart/items/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove an item from the cart
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Item removed from cart, data: { id: "64f1a2b3c4d5e6f7a8b9c0e1", items: [], totalAmount: 0 } }
 *       400:
 *         description: Item not found in cart
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Item not found in cart" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
cartRoutes.delete(
  '/items/:productId',
  validate({ params: productIdParamSchema }),
  cartController.removeItem,
);
/**
 * @openapi
 * /cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the current user's cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Cart cleared, data: null }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
cartRoutes.delete('/', cartController.clearCart);
