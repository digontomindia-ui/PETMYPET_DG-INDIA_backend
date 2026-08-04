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
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0a1"
 *                 products:
 *                   - id: "64f1a2b3c4d5e6f7a8b9c0b1"
 *                     name: Grain-Free Chicken Dry Dog Food 3kg
 *                     price: 1299
 *                     images: ["https://cdn.petmypet.in/products/chicken-dry-dog-food.jpg"]
 *                   - id: "64f1a2b3c4d5e6f7a8b9c0b2"
 *                     name: Catnip Infused Plush Mouse Toy
 *                     price: 249
 *                     images: ["https://cdn.petmypet.in/products/catnip-mouse-toy.jpg"]
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
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
 *       - { name: productId, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0b1" }
 *     responses:
 *       201:
 *         description: Product added to wishlist
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Added to wishlist
 *               data: null
 *       400:
 *         description: Invalid product id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Product not found
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
 *       - { name: productId, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0b1" }
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Removed from wishlist
 *               data: null
 *       400:
 *         description: Invalid product id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 */
wishlistRoutes.delete(
  '/:productId',
  validate({ params: productIdParamSchema }),
  cartController.removeFromWishlist,
);
