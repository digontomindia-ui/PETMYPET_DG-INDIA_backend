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
 *       200: { description: Cart retrieved successfully }
 */
cartRoutes.get('/', cartController.getCart);
/**
 * @openapi
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Item added to cart }
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
 *       - { name: productId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cart item updated successfully }
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
 *       - { name: productId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cart item removed successfully }
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
 *       200: { description: Cart cleared successfully }
 */
cartRoutes.delete('/', cartController.clearCart);
