import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { cartController } from './cart.controller.js';
import { productIdParamSchema } from './cart.validators.js';

export const wishlistRoutes = Router();

wishlistRoutes.use(authenticate);

wishlistRoutes.get('/', cartController.getWishlist);
wishlistRoutes.post(
  '/:productId',
  validate({ params: productIdParamSchema }),
  cartController.addToWishlist,
);
wishlistRoutes.delete(
  '/:productId',
  validate({ params: productIdParamSchema }),
  cartController.removeFromWishlist,
);
