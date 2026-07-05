import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { cartController } from './cart.controller.js';
import { productIdParamSchema } from './cart.validators.js';

export const wishlistRoutes = Router();

wishlistRoutes.use(authenticate);

/**
 * @openapi
 * /wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get the current user's wishlist
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Wishlist retrieved successfully }
 */
wishlistRoutes.get('/', cartController.getWishlist);
/**
 * @openapi
 * /wishlist/{productId}:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add a product to the wishlist
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: productId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Product added to wishlist }
 */
wishlistRoutes.post(
  '/:productId',
  validate({ params: productIdParamSchema }),
  cartController.addToWishlist,
);
/**
 * @openapi
 * /wishlist/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove a product from the wishlist
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: productId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product removed from wishlist }
 */
wishlistRoutes.delete(
  '/:productId',
  validate({ params: productIdParamSchema }),
  cartController.removeFromWishlist,
);
